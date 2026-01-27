import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useWorkflowStore } from '../store/WorkflowStore';
import { useVzorStore } from '../store/store';

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
        
        // SCALING
        float scaleFactor = mix(0.65, 0.75, t2); 
        vec3 finalPos = vFinal * scaleFactor;

        // ZOOM ONLY GRAPH NODES
        if (aStatic > 0.5) {
             finalPos *= uGraphZoom;
        }

        // NOISE MOVEMENT (Breath)
        // If aStatic=1 (Node), movement is damped significantly in Graph State
        float moveFactor = 1.0 - (aStatic * t2 * 0.8); // Damping

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
                // Push nodes slightly less
                if (aStatic > 0.5) finalPos += normalize(finalPos - vec3(uMouse.xy, finalPos.z)) * f * 20.0;
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
    const raycaster = useRef(new THREE.Raycaster());

    // STATE
    const [appState, setAppState] = useState<'IDLE' | 'INCUBATOR' | 'WORK'>('IDLE');
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    const workflow = useWorkflowStore(state => state.workflow);

    // --- INIT THREE.JS ---
    useEffect(() => {
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

        // Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);
            if (materialRef.current) {
                materialRef.current.uniforms.uTime.value += 0.01;
                // Soft mouse decay
                if (materialRef.current.uniforms.uMouseActive.value > 0)
                    materialRef.current.uniforms.uMouseActive.value *= 0.96;
            }
            renderer.render(scene, camera);
        };
        animate();

        // Mouse Move
        const onMove = (e: MouseEvent) => {
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
        };
    }, []);

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
            animateUniform('uProgress1', 1);
            animateUniform('uProgress2', 1);
        }

    }, [appState]);


    // --- DEPLETION LOGIC (V3.2 CORE) ---
    useEffect(() => {
        if (appState !== 'WORK' || !pointsRef.current) return;

        const agents = workflow?.blocks.flatMap(b => b.agents) || [];

        // 1. Calculate Nodes Layout (Spherical)
        const nodes = [
            { id: 'site_input', label: 'Inputs' },
            ...agents.map(a => ({ id: a.id, label: a.role })),
            ...(workflow?.blocks && workflow.blocks.length > 0 ? [{ id: 'decision', label: 'Decision' }] : [])
        ];

        const count = nodes.length;
        const R = 200;

        // 2. Update Attributes directly
        const geo = pointsRef.current.geometry;
        const aTarget = geo.getAttribute('aTarget');
        const aStatic = geo.getAttribute('aStatic');
        const aColor = geo.getAttribute('aColor');
        const aSize = geo.getAttribute('aSize');

        // Reset
        // But wait! We want depletion.
        // We will assign index ranges to nodes.

        let particleCursor = 0;

        nodes.forEach((node, idx) => {
            // Spherical Position
            const phi = Math.acos(-1 + (2 * idx) / Math.max(1, count));
            const theta = Math.sqrt(count * Math.PI) * phi;
            const pos = new THREE.Vector3().setFromSphericalCoords(R, phi, theta);

            // Assign a block of particles to this node
            const limit = particleCursor + PARTICLES_PER_NODE;

            for (let i = particleCursor; i < limit && i < CLOUD_PARTICLES; i++) {
                if (i === particleCursor) {
                    // MAIN NODE DOT
                    aTarget.setXYZ(i, pos.x, pos.y, pos.z);
                    aStatic.setX(i, 1.0); // Static Node
                    aSize.setX(i, 12.0 * 1.5);
                    aColor.setXYZ(i, 0.2, 0.9, 0.8); // Cyan Glow
                } else {
                    // CLUSTER DOTS (The "fuzz")
                    const rcl = 60 * Math.random();
                    const tcl = Math.random() * Math.PI * 2;
                    const pcl = Math.acos(2 * Math.random() - 1);
                    const tx = pos.x + rcl * Math.sin(pcl) * Math.cos(tcl);
                    const ty = pos.y + rcl * Math.sin(pcl) * Math.sin(tcl);
                    const tz = pos.z + rcl * Math.cos(pcl);

                    aTarget.setXYZ(i, tx, ty, tz);
                    aStatic.setX(i, 0.0); // Drift around node
                    aSize.setX(i, 1.2 + Math.random() * 2.5);
                    aColor.setXYZ(i, 0.5, 0.6, 0.8);
                }
            }
            particleCursor = limit;
        });

        // REMAINING PARTICLES (The Depleted Cloud)
        // They stay in their original "Incubator" or "Sphere" positions?
        // In the shader, mix(vBase, aTarget, t2).
        // If we want them to disappear or stay as dust, we set their aTarget to be scattered or original.
        // Current logic: We leave their aTarget untouched from initialization? 
        // No, we must iterate all.

        // If we don't update the rest, they might stick to old node positions if we reduced count.
        // So we reset the REST to random cloud positions.
        // But accessing their original random pos is hard unless we stored it.
        // Quick fix: Re-calculate random pos or just leave them?
        // Better: We stored "aIncubator" and "posArray". 
        // If we set aTarget = aIncubator for the rest, they will just stay where they were in State 2.

        const incub = geo.getAttribute('aIncubator');
        for (let i = particleCursor; i < CLOUD_PARTICLES; i++) {
            aTarget.setXYZ(i, incub.getX(i), incub.getY(i), incub.getZ(i));
            aStatic.setX(i, 0.0);
            aSize.setX(i, 1.0); // Small dust
            aColor.setXYZ(i, 0.3, 0.3, 0.4); // Dimmer
        }

        aTarget.needsUpdate = true;
        aStatic.needsUpdate = true;
        aSize.needsUpdate = true;
        aColor.needsUpdate = true;

    }, [workflow, appState]);


    // --- UI OVERLAYS (STRICT CSS PORT) ---
    // Using inline styles or exact Tailwind equivalents to match the CSS from lines 54-192

    // FONT: 'Outfit', sans-serif (Ensure index.html loads this!)

    const [taskInput, setTaskInput] = useState('');

    const handleCreateTask = () => {
        if (!taskInput.trim()) return;
        // Simulate adding a task -> This updates store -> triggers particle realignment
        useVzorStore.getState().selectAgent('new_test_agent'); // Placeholder action
        // In real app, this would call addBlock/addAgent
        setTaskInput('');
    };

    return (
        <div ref={containerRef} className="w-full h-full relative bg-black overflow-hidden font-['Outfit'] text-white">

            {/* 1. TITLE SCREEN (Center Text Exact Match) */}
            <div
                className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10 pointer-events-none transition-opacity duration-1000 ${appState !== 'IDLE' ? 'opacity-0' : 'opacity-100'}`}
            >
                <h1 className="text-[5.5em] font-light tracking-[0.6em] mb-6 uppercase text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.15)] mr-[-0.6em]">
                    VZOR
                </h1>
                <p className="text-[1.1em] font-thin text-white/50 tracking-[0.4em] uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    capital data system
                </p>
                <div className="mt-12 pointer-events-auto cursor-pointer" onClick={() => setAppState('INCUBATOR')}>
                    {/* Invisible click area to enter, or duplicate the button style if user wants button */}
                </div>
            </div>

            {/* SCROLL HINT */}
            {appState === 'IDLE' && (
                <div className="fixed bottom-[50px] left-1/2 -translate-x-1/2 text-[0.75em] text-white/25 tracking-[0.15em] uppercase z-10 animate-pulse pointer-events-none">
                    Scroll Down / Tap to Enter
                </div>
            )}

            {/* 2. INCUBATOR (Selection) */}
            {appState === 'INCUBATOR' && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                    {/* 3 CORES LABELS - Exact positioning matching the logic */}
                    {/* Left Core (-130,0,0) -> Development */}
                    <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-pointer group" onClick={() => setAppState('WORK')}>
                        <div className="text-[2em] font-light tracking-[0.12em] text-white group-hover:text-cyan-400 transition-colors drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            Development
                        </div>
                        <div className="text-[10px] text-white/50 tracking-widest mt-2 uppercase">
                            Initialize Protocol
                        </div>
                    </div>

                    {/* Center Core (0,0,90) -> Finance */}
                    <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center opacity-50">
                        <div className="text-[2em] font-light tracking-[0.12em] text-white">Finance</div>
                    </div>

                    {/* Right Core (130,0,0) -> State */}
                    <div className="absolute top-1/2 right-1/4 -translate-y-1/2 translate-x-1/2 flex flex-col items-center opacity-50">
                        <div className="text-[2em] font-light tracking-[0.12em] text-white">State</div>
                    </div>
                </div>
            )}

            {/* 3. WORK MODE UI (Dynamic Input) */}
            {appState === 'WORK' && (
                <>
                    {/* Header */}
                    <div className="fixed top-[70px] left-1/2 -translate-x-1/2 text-center z-10 max-w-[700px] pointer-events-none">
                        <h2 className="text-[2em] font-light tracking-[0.12em] mb-3">CONSTRUCTION PHASE</h2>
                        <p className="text-[1.05em] font-light text-white/65 tracking-[0.08em]">
                            Active Neural Graph
                        </p>
                    </div>

                    {/* TASK INPUT (The Missing Piece!) */}
                    <div className="fixed bottom-[100px] left-1/2 -translate-x-1/2 w-[400px] pointer-events-auto z-20 flex gap-4">
                        <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-full flex items-center px-6 py-3 w-full shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                            <input
                                type="text"
                                value={taskInput}
                                onChange={(e) => setTaskInput(e.target.value)}
                                placeholder="Voice Command or Type Task..."
                                className="bg-transparent border-none outline-none text-white font-light tracking-wider w-full placeholder-white/30"
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                            />
                            <button className="text-cyan-400/80 hover:text-cyan-400 ml-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                            </button>
                        </div>
                    </div>

                    {/* Back Button */}
                    <div
                        className="fixed top-[40px] left-[40px] text-[0.75em] tracking-[0.2em] uppercase cursor-pointer hover:text-white/60 pointer-events-auto z-50 flex items-center gap-4"
                        onClick={() => setAppState('INCUBATOR')}
                    >
                        <span>←</span> Back to System
                    </div>
                </>
            )}

        </div>
    );
};

export default Viewport3D_V3;
