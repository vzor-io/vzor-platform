import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useTaskStore } from '../store/taskStore';
import type { Task } from '../types/task';
import { NodeEditor } from './NodeEditor/NodeEditor';
import { GeminiLayout } from './Layout/GeminiLayout';
import { useShallow } from 'zustand/react/shallow';

// --- CONFIG ---
const CLOUD_PARTICLES = 20000;
const PARTICLES_PER_NODE = 200; // How many particles form a node

// --- EXACT SHADERS FROM vzor_three_v3.1.html ---
const VERTEX_SHADER = `
    uniform float uTime;
    uniform float uProgress1; // 0->1 Sphere to Incubator
    uniform float uProgress2; // 0->1 Incubator to Graph
    uniform float uProgress3; // 0->1 Graph to Detail
    uniform float uPixelRatio;
    uniform vec2 uMouse;
    uniform float uMouseActive;
    uniform float uGraphZoom;
    uniform float uMobile;
    
    // ATTRIBUTES
    attribute vec3 aIncubator; // Position in "Three Core" state
    attribute vec3 aTarget;    // Position in "Graph" state
    attribute vec3 aDetail;    // Position in "Detail" state (not fully used in V3.2 yet)
    attribute float aSize;
    attribute vec3 aColor;
    attribute float aRandom;
    attribute float aStatic;   // 1.0 = Particle is part of a Node, 0.0 = Cloud dust
    
    varying vec3 vColor;
    varying float vAlpha;
    varying float vPulse;
    varying float vIsNode;

    // STABLE 2D SIMPLEX NOISE
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ; m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5); vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g; g.x = a0.x * x0.x + h.x * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    void main() {
        vColor = aColor;
        
        float t1 = smoothstep(0.0, 1.0, uProgress1);
        float t2 = smoothstep(0.0, 1.0, uProgress2);
        
        // MIX POSITIONS
        vec3 vBase = mix(position, aIncubator, t1);
        vec3 vFinal = mix(vBase, aTarget, t2); // This acts as the final position for V3.2 logic
        
        // SCALING (Match Viewport3D Logic)
        float scaleFactor = mix(0.65, 0.75, t2); 
        float finalScale = mix(1.0, scaleFactor, uMobile); // Desktop = 1.0
        vec3 finalPos = vFinal * finalScale;

        // ZOOM ONLY GRAPH NODES
        if (aStatic > 0.5) {
             finalPos *= uGraphZoom;
        }

        // NOISE MOVEMENT (Breath)
        // NOISE MOVEMENT (Breath)
        // If node (aStatic > 0.5), force NO MOVEMENT so it aligns with hit target
        float moveFactor = (aStatic > 0.5) ? 0.0 : 1.0;

        float ns = 0.015; float ts = uTime * 0.15;
        float nx = snoise(vec2(position.x * ns, position.y * ns + ts + aRandom));
        float ny = snoise(vec2(position.y * ns, position.z * ns + ts + aRandom + 10.0));
        float nz = snoise(vec2(position.z * ns, position.x * ns + ts + aRandom + 20.0));
        
        finalPos += vec3(nx, ny, nz) * mix(3.5, 1.2, t2) * moveFactor;
        
        // MOUSE WAVE PHYSICS (Quadratic)
        if (uMouseActive > 0.05 && moveFactor > 0.1) {
            float rRadius = 300.0 * scaleFactor;
            float dist = distance(finalPos.xy, uMouse.xy);
            if (dist < rRadius) {
                float f = pow((rRadius - dist) / rRadius, 2.0); // THE WAVE
                finalPos += normalize(finalPos - vec3(uMouse.xy, finalPos.z)) * f * 55.0 * scaleFactor;
                // DO NOT push static nodes
            }
        }

        vec4 mvPos = modelViewMatrix * vec4(finalPos, 1.0);
        gl_Position = projectionMatrix * mvPos;
        
        // POINT SIZE
        float baseSize = aSize * (500.0 / -mvPos.z) * uPixelRatio;
        
        // NODE PULSE
        vPulse = 0.0;
        vIsNode = aStatic;
        if (aStatic > 0.5) {
             // If node, base size is bigger
             baseSize *= uGraphZoom;
             float p = sin(uTime * 2.5 + aRandom * 10.0) * 0.5 + 0.5;
             vPulse = p;
             baseSize *= (1.0 + p * 0.2); 
        }
        
        gl_PointSize = baseSize;

        // ALPHA LOGIC
        // If Node -> 1.0
        // If Cloud in Graph Mode -> Fades out if depleted (handled via color in JS, but alpha here too)
        float targetAlpha = (aSize < 5.0 ? 0.6 : 1.0);
        vAlpha = targetAlpha;
    }
`;

const FRAGMENT_SHADER = `
    uniform sampler2D uTexture;
    varying vec3 vColor;
    varying float vAlpha;
    varying float vPulse;
    varying float vIsNode;
    void main() {
        vec4 tex = texture2D(uTexture, gl_PointCoord);
        vec4 finalColor = vec4(vColor, vAlpha * tex.a);
        
        // Node Glow
        if (vIsNode > 0.5) {
            float glow = 1.0 + vPulse * 0.5;
            finalColor.rgb *= glow;
        }
        
        gl_FragColor = finalColor;
    }
`;


const Viewport3D_V3: React.FC = () => {
    // REFS
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);
    const pointsRef = useRef<THREE.Points | null>(null);
    const hitTargetsRef = useRef<THREE.Group>(new THREE.Group());
    const raycaster = useRef(new THREE.Raycaster());

    // STATE
    const [appState, setAppState] = useState<'IDLE' | 'INCUBATOR' | 'WORK'>('IDLE');
    const [showNodeEditor, setShowNodeEditor] = useState(false);
    const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    // Optimized selector to avoid infinite reference loops
    const tasks = useTaskStore(useShallow(state => Array.from(state.tasks.values())));
    const selectedTask = useTaskStore(state => state.selectedTaskId ? state.tasks.get(state.selectedTaskId) : null);
    const addTask = useTaskStore(state => state.addTask);
    const selectTask = useTaskStore(state => state.selectTask);

    // --- INIT THREE.JS ---
    useEffect(() => {
        console.log("VZOR_DEPLOY_CHECK_SIDE_PANEL_AND_LABELS_FIX_V2");
        if (!containerRef.current) return;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.add(hitTargetsRef.current);

        // Camera
        const camera = new THREE.PerspectiveCamera(60, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 2000);
        camera.position.z = 450;
        cameraRef.current = camera;

        // Particles
        const geo = new THREE.BufferGeometry();
        const posArray = new Float32Array(CLOUD_PARTICLES * 3);
        const incubatorArray = new Float32Array(CLOUD_PARTICLES * 3);
        const targetArray = new Float32Array(CLOUD_PARTICLES * 3); // Will be dynamic!
        const sizeArray = new Float32Array(CLOUD_PARTICLES);
        const colorArray = new Float32Array(CLOUD_PARTICLES * 3);
        const randomArray = new Float32Array(CLOUD_PARTICLES);
        const staticArray = new Float32Array(CLOUD_PARTICLES);

        const cores = [
            { pos: new THREE.Vector3(-130, 0, 0) }, // Development
            { pos: new THREE.Vector3(0, 0, 90) },   // Finance
            { pos: new THREE.Vector3(130, 0, 0) }   // Real Estate
        ];

        for (let i = 0; i < CLOUD_PARTICLES; i++) {
            // STATE 1: CLOUD
            const r1 = 220 * (0.85 + Math.random() * 0.15);
            const th1 = Math.random() * Math.PI * 2;
            const ph1 = Math.acos(2 * Math.random() - 1);
            const x = r1 * Math.sin(ph1) * Math.cos(th1);
            const y = r1 * Math.sin(ph1) * Math.sin(th1);
            const z = r1 * Math.cos(ph1);

            posArray[i * 3] = x; posArray[i * 3 + 1] = y; posArray[i * 3 + 2] = z;

            // STATE 2: INCUBATOR
            const rand = Math.random();
            if (rand < 0.4) {
                incubatorArray[i * 3] = x; incubatorArray[i * 3 + 1] = y; incubatorArray[i * 3 + 2] = z;
            } else {
                const c = cores[i % 3];
                const rc = 40 + Math.random() * 40;
                const tc = Math.random() * Math.PI * 2;
                const pc = Math.acos(2 * Math.random() - 1);
                incubatorArray[i * 3] = c.pos.x + rc * Math.sin(pc) * Math.cos(tc);
                incubatorArray[i * 3 + 1] = c.pos.y + rc * Math.sin(pc) * Math.sin(tc);
                incubatorArray[i * 3 + 2] = c.pos.z + rc * Math.cos(pc);
            }

            // INIT ARRAYS
            targetArray[i * 3] = x; targetArray[i * 3 + 1] = y; targetArray[i * 3 + 2] = z;
            sizeArray[i] = 1.2 + Math.random() * 2.5;
            colorArray[i * 3] = 0.5; colorArray[i * 3 + 1] = 0.6; colorArray[i * 3 + 2] = 0.8;
            randomArray[i] = Math.random();
            staticArray[i] = 0.0;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        geo.setAttribute('aIncubator', new THREE.BufferAttribute(incubatorArray, 3));
        geo.setAttribute('aTarget', new THREE.BufferAttribute(targetArray, 3));
        geo.setAttribute('aSize', new THREE.BufferAttribute(sizeArray, 1));
        geo.setAttribute('aColor', new THREE.BufferAttribute(colorArray, 3));
        geo.setAttribute('aRandom', new THREE.BufferAttribute(randomArray, 1));
        geo.setAttribute('aStatic', new THREE.BufferAttribute(staticArray, 1));

        // Texture
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            g.addColorStop(0, 'rgba(255,255,255,1)');
            g.addColorStop(0.2, 'rgba(255,255,255,0.6)');
            g.addColorStop(0.5, 'rgba(255,255,255,0.1)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 64, 64);
        }
        const texture = new THREE.CanvasTexture(canvas);

        const mat = new THREE.ShaderMaterial({
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
            uniforms: {
                uTime: { value: 0 },
                uProgress1: { value: 0 },
                uProgress2: { value: 0 },
                uProgress3: { value: 0 },
                uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
                uMouse: { value: new THREE.Vector2(0, 0) },
                uMouseActive: { value: 0 },
                uGraphZoom: { value: 1.0 },
                uMobile: { value: 0.0 },
                uTexture: { value: texture }
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        materialRef.current = mat;

        const points = new THREE.Points(geo, mat);
        pointsRef.current = points;
        scene.add(points);
        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = false;
        controls.autoRotate = false; // DISABLED - User Request
        controls.rotateSpeed = 0.5;
        controls.target.set(0, 0, 0);

        // Remove simple mouse move listener if it conflicts, OR keep it for shader waves.
        // We'll keep both: Orbit for camera, Raycaster for waves.

        // Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update(); // Update controls
            if (materialRef.current) {
                materialRef.current.uniforms.uTime.value += 0.01;
                // Soft mouse decay
                if (materialRef.current.uniforms.uMouseActive.value > 0)
                    materialRef.current.uniforms.uMouseActive.value *= 0.96;
            }
            renderer.render(scene, camera);
        };
        animate();

        // Mouse Move (Raycaster for shader waves)
        const onMove = (e: MouseEvent) => {
            // ... existing logic ...
            const rect = containerRef.current!.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.current.setFromCamera(new THREE.Vector2(x, y), camera);
            const pt = new THREE.Vector3();
            raycaster.current.ray.intersectPlane(mousePlane, pt);

            if (pt && materialRef.current) {
                materialRef.current.uniforms.uMouse.value.set(pt.x, pt.y);
                materialRef.current.uniforms.uMouseActive.value = 1.0;
            }
        };
        containerRef.current.addEventListener('mousemove', onMove);

        // Click Logic
        const handleClick = (e: MouseEvent) => {
            if (!containerRef.current || !cameraRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const m = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
            raycaster.current.setFromCamera(m, cameraRef.current);
            const childCount = hitTargetsRef.current.children.length;
            console.log('[VZOR] Click at', m.x.toFixed(2), m.y.toFixed(2), '| Hit targets:', childCount);
            // Use RECURSIVE to find all children
            const hits = raycaster.current.intersectObjects(hitTargetsRef.current.children, true);
            console.log('[VZOR] Raycaster hits:', hits.length);
            if (hits.length > 0) {
                const id = hits[0].object.userData.id;
                console.log('[VZOR] CLICKED NODE ID:', id);
                selectTask(id);
            } else {
                // Clicked background -> Close panel
                console.log('[VZOR] Background clicked, closing panel');
                selectTask(null);
            }
        };
        containerRef.current.addEventListener('click', handleClick);

        // Resize
        const obs = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
                if (materialRef.current) materialRef.current.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
            }
        });
        obs.observe(containerRef.current);

        return () => {
            obs.disconnect();
            renderer.dispose();
            containerRef.current?.removeEventListener('mousemove', onMove);
            containerRef.current?.removeEventListener('click', handleClick);
        };
    }, []);

    // --- SCROLL INTERACTION ---
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (appState === 'IDLE' && e.deltaY > 0) {
                setAppState('INCUBATOR');
            }
        };
        window.addEventListener('wheel', handleWheel);
        return () => window.removeEventListener('wheel', handleWheel);
    }, [appState]);

    // --- STATE MACHINE (Visual Transitions) ---
    useEffect(() => {
        if (!materialRef.current) return;
        const u = materialRef.current.uniforms;

        // Simple GSAP-like transition (can be optimized later)
        const animateUniform = (key: string, target: number) => {
            const start = u[key].value;
            const duration = 1000;
            const startTime = performance.now();
            const step = (t: number) => {
                const prog = Math.min((t - startTime) / duration, 1);
                // Ease InOutQuad
                const ease = prog < .5 ? 2 * prog * prog : -1 + (4 - 2 * prog) * prog;
                u[key].value = start + (target - start) * ease;
                if (prog < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        };

        if (appState === 'IDLE') {
            animateUniform('uProgress1', 0);
            animateUniform('uProgress2', 0);
        } else if (appState === 'INCUBATOR') {
            animateUniform('uProgress1', 1);
            animateUniform('uProgress2', 0);
        } else if (appState === 'WORK') {
            animateUniform('uProgress1', 0);
            animateUniform('uProgress2', 0); // Reset to 0 for uniform cloud in WORK mode
        }

    }, [appState]);


    // --- DEPLETION LOGIC (SYNC WITH TASK STORE) ---
    useEffect(() => {
        if (appState !== 'WORK' || !pointsRef.current) return;

        // Use tasks from store
        const currentTasks = tasks;

        // ALWAYS have at least one default node so the panel can be tested if empty
        const effectiveNodes = currentTasks.length > 0 ? currentTasks : [
            { id: 'start_node', name: 'Start Node' } // Dummy for visualization if empty
        ];

        console.log('[VZOR] Syncing 3D with TaskStore. Tasks:', effectiveNodes.length);
        const count = effectiveNodes.length;
        const R = 200;

        // 2. Update Attributes directly
        const geo = pointsRef.current.geometry;
        const aTarget = geo.getAttribute('aTarget');
        const aStatic = geo.getAttribute('aStatic');
        const aColor = geo.getAttribute('aColor');
        const aSize = geo.getAttribute('aSize');

        // Reset Hit Targets
        hitTargetsRef.current.clear();

        let particleCursor = 0;

        effectiveNodes.forEach((node: any, idx) => {
            // Spherical Position
            const phi = Math.acos(-1 + (2 * idx) / Math.max(1, count));
            const theta = Math.sqrt(count * Math.PI) * phi;
            const pos = new THREE.Vector3().setFromSphericalCoords(R, phi, theta);

            // If the task implies a specific 3D position, use it (future feature)
            // if (node.position3D) pos.set(...node.position3D);

            // Assign a block of particles to this node
            const limit = particleCursor + PARTICLES_PER_NODE;

            // Generate Hit Target (Invisible Sphere)
            const hitGeo = new THREE.SphereGeometry(35, 8, 8);
            const hitMat = new THREE.MeshBasicMaterial({ visible: false });
            const hitMesh = new THREE.Mesh(hitGeo, hitMat);
            hitMesh.position.copy(pos);
            hitMesh.userData = { id: node.id };
            hitTargetsRef.current.add(hitMesh);

            for (let i = particleCursor; i < limit && i < CLOUD_PARTICLES; i++) {
                if (i === particleCursor) {
                    // MAIN NODE DOT
                    aTarget.setXYZ(i, pos.x, pos.y, pos.z);
                    aStatic.setX(i, 1.0); // Static Node
                    aSize.setX(i, 12.0 * 1.5);

                    // Color based on status?
                    if (node.status === 'done') aColor.setXYZ(i, 0.2, 0.8, 0.2); // Green
                    else if (node.status === 'error') aColor.setXYZ(i, 1.0, 0.3, 0.3); // Red
                    else if (node.status === 'running') aColor.setXYZ(i, 0.2, 0.5, 1.0); // Blue
                    else aColor.setXYZ(i, 0.2, 0.9, 0.8); // Cyan (Default/Pending)

                } else {
                    // CLUSTER DOTS
                    const rcl = 60 * Math.random();
                    const tcl = Math.random() * Math.PI * 2;
                    const pcl = Math.acos(2 * Math.random() - 1);
                    const tx = pos.x + rcl * Math.sin(pcl) * Math.cos(tcl);
                    const ty = pos.y + rcl * Math.sin(pcl) * Math.sin(tcl);
                    const tz = pos.z + rcl * Math.cos(pcl);

                    aTarget.setXYZ(i, tx, ty, tz);
                    aStatic.setX(i, 0.0);
                    aSize.setX(i, 1.2 + Math.random() * 2.5);
                    aColor.setXYZ(i, 0.5, 0.6, 0.8);
                }
            }
            particleCursor = limit;
        });

        // REMAINING PARTICLES (The Depleted Cloud)
        const incub = geo.getAttribute('aIncubator');
        for (let i = particleCursor; i < CLOUD_PARTICLES; i++) {
            aTarget.setXYZ(i, incub.getX(i), incub.getY(i), incub.getZ(i));
            aStatic.setX(i, 0.0);
            aSize.setX(i, 1.2 + Math.random() * 2.5);
            aColor.setXYZ(i, 0.5, 0.6, 0.8);
        }

        aTarget.needsUpdate = true;
        aStatic.needsUpdate = true;
        aSize.needsUpdate = true;
        aColor.needsUpdate = true;

    }, [tasks, appState]);


    // --- FIX: RE-ATTACH CANVAS AND HANDLE RESIZE ON STATE CHANGE ---
    useEffect(() => {
        if (!rendererRef.current || !containerRef.current || !cameraRef.current) return;

        const container = containerRef.current;
        const canvas = rendererRef.current.domElement;
        const camera = cameraRef.current;
        const renderer = rendererRef.current;

        // 1. Re-attach if needed
        if (canvas.parentNode !== container) {
            console.log('[VZOR] Viewport: Re-attaching canvas to new container');
            container.appendChild(canvas);
        }

        // 2. Click Handler
        const handleClick = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            const m = new THREE.Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            );
            raycaster.current.setFromCamera(m, camera);
            const hits = raycaster.current.intersectObjects(hitTargetsRef.current.children, true);

            if (hits.length > 0) {
                const id = hits[0].object.userData.id;
                console.log('[VZOR] CLICKED NODE ID:', id);
                selectTask(id);
            } else {
                console.log('[VZOR] Background clicked, closing panel');
                selectTask(null);
            }
        };

        // 3. Mouse Move Handler
        const handleMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            // Update Uniforms
            if (materialRef.current) {
                // Simplified mouse raycast for shader
                raycaster.current.setFromCamera(new THREE.Vector2(x, y), camera);
                const pt = new THREE.Vector3();
                const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
                raycaster.current.ray.intersectPlane(mousePlane, pt);
                if (pt) {
                    materialRef.current.uniforms.uMouse.value.set(pt.x, pt.y);
                    materialRef.current.uniforms.uMouseActive.value = 1.0;
                }
            }
        };

        container.addEventListener('click', handleClick);
        container.addEventListener('mousemove', handleMouseMove);

        // 4. Resize Observer (CRITICAL: Handles Flexbox Layout changes)
        const resizeObserver = new ResizeObserver(() => {
            const width = container.clientWidth;
            const height = container.clientHeight;

            if (width > 0 && height > 0) {
                renderer.setSize(width, height);
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
            }
        });

        resizeObserver.observe(container);

        // Initial size check
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w > 0 && h > 0) {
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }

        return () => {
            container.removeEventListener('click', handleClick);
            container.removeEventListener('mousemove', handleMouseMove);
            resizeObserver.disconnect();
        };
    }, [appState, selectTask]);


    // --- UI OVERLAYS (STRICT CSS PORT) ---
    // Using inline styles or exact Tailwind equivalents to match the CSS from lines 54-192

    // FONT: 'Outfit', sans-serif (Ensure index.html loads this!)

    const [taskInput, setTaskInput] = useState('');

    const handleCreateTask = () => {
        if (!taskInput.trim()) return;

        const newId = `task_${Date.now()}`;

        // Use default values for required fields
        const newTask: Task = {
            id: newId,
            name: taskInput,
            block: 'invest', // Default
            context: {
                knowledgeSources: [],
                methodology: { id: 'default', name: 'Default', steps: [], promptTemplate: '' },
                parameters: {}
            },
            agent: {
                type: 'analyst',
                model: 'deepseek-r1'
            },
            outputs: {
                formats: []
            },
            status: 'pending',
            progress: 0,
            position2D: { x: Math.random() * 500, y: Math.random() * 500 },
            position3D: [0, 0, 0], // Will be set by layout engine later
            dependencies: [],
            dependents: []
        };

        console.log('[VZOR] Creating new task:', newTask);
        addTask(newTask);

        // Auto-select the new node
        selectTask(newId);
        setTaskInput('');
    };

    // Node Details for Panel
    const nodeDetails = selectedTask ? {
        type: selectedTask.block,
        role: selectedTask.agent.type,
        status: selectedTask.status,
        label: selectedTask.name
    } : null;

    // --- RENDER ---

    // 1. WORK MODE (New Gemini UI)
    if (appState === 'WORK') {
        // In Work mode, we wrap the 3D canvas in the Gemini Layout
        return (
            <div className="w-full h-full relative bg-black text-white font-['Outfit']">
                <GeminiLayout
                    NodeEditorComponent={<NodeEditor />}
                    inputText={taskInput}
                    setInputText={setTaskInput}
                    onTaskCreate={handleCreateTask}
                    isListening={false} // Connect actual state if needed
                    onMicToggle={() => { }} // Connect actual handler if needed
                >
                    {/* The 3D Canvas lives here in the Center Panel */}
                    <div ref={containerRef} className="w-full h-full relative overflow-hidden" />
                </GeminiLayout>
            </div>
        );
    }

    // 2. INTRO / INCUBATOR MODE (Preserve original simple UI)
    // IMPORTANT: Labels are OUTSIDE containerRef to ensure they don't move with camera rotation
    return (
        <div className="w-full h-full relative bg-black overflow-hidden font-['Outfit'] text-white">
            {/* 3D Canvas Container - ONLY canvas goes here */}
            <div ref={containerRef} className="absolute inset-0 pointer-events-auto" />

            {/* TITLE SCREEN - OUTSIDE containerRef, uses fixed positioning */}
            <div
                className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-20 pointer-events-none transition-opacity duration-1000 ${appState !== 'IDLE' ? 'opacity-0' : 'opacity-100'}`}
            >
                <h1 className="text-[5.5em] font-light tracking-[0.6em] mb-6 uppercase text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.15)] mr-[-0.6em]">
                    VZOR
                </h1>
                <p className="text-[1.1em] font-thin text-white/50 tracking-[0.4em] uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    capital data system
                </p>
                <div
                    className="mt-12 pointer-events-auto cursor-pointer border border-white/30 px-8 py-3 rounded-full hover:bg-white/10 transition-colors uppercase tracking-[0.2em] text-[0.8em]"
                    onClick={() => setAppState('INCUBATOR')}
                >
                    Enter System
                </div>
            </div>

            {/* INCUBATOR SELECTION - OUTSIDE containerRef, uses fixed positioning */}
            {appState === 'INCUBATOR' && (
                <div className="fixed inset-0 z-20 pointer-events-none flex items-center justify-center gap-16">
                    <div className="flex flex-col items-center pointer-events-auto cursor-pointer group opacity-60 hover:opacity-100 transition-opacity" onClick={() => setAppState('WORK')}>
                        <div className="text-[2em] font-light tracking-[0.12em] text-white transition-colors drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            Development
                        </div>
                    </div>
                    <div className="flex flex-col items-center opacity-60">
                        <div className="text-[2em] font-light tracking-[0.12em] text-white">Finance</div>
                    </div>
                    <div className="flex flex-col items-center opacity-60">
                        <div className="text-[2em] font-light tracking-[0.12em] text-white">Real Estate</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Viewport3D_V3;
