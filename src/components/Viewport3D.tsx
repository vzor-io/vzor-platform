import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useWorkflowStore } from '../store/WorkflowStore';
import { useVzorStore } from '../store/store';

// --- EXACT SHADERS FROM vzor_three_v3.1.html ---

const VERTEX_SHADER = `
    uniform float uTime;
    uniform float uProgress1;
    uniform float uProgress2;
    uniform float uProgress3;
    uniform float uPixelRatio;
    uniform vec2 uMouse;
    uniform float uMouseActive;
    uniform float uGraphZoom;
    uniform float uMobile;
    
    attribute vec3 aIncubator;
    attribute vec3 aTarget;
    attribute vec3 aDetail;
    attribute float aSize;
    attribute vec3 aColor;
    attribute float aRandom;
    attribute float aStatic;
    
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
        float t3 = smoothstep(0.0, 1.0, uProgress3);

        vec3 vBase = mix(position, aIncubator, t1);
        vec3 vFinal = mix(vBase, aTarget, t2);
        vec3 finalPos = mix(vFinal, aDetail, t3);

        // BALANCED MOBILE SCALE
        float scaleFactor = mix(0.65, 0.75, t2);
        float finalScale = mix(1.0, scaleFactor, uMobile);

        if (aStatic > 0.5) {
             finalPos *= uGraphZoom;
        }
        finalPos *= finalScale;

        // SMOOTH MOVEMENT
        float moveFactor = 1.0 - (aStatic * t3);

        float ns = 0.015; float ts = uTime * 0.15;
        float nx = snoise(vec2(position.x * ns, position.y * ns + ts + aRandom));
        float ny = snoise(vec2(position.y * ns, position.z * ns + ts + aRandom + 10.0));
        float nz = snoise(vec2(position.z * ns, position.x * ns + ts + aRandom + 20.0));
        
        finalPos += vec3(nx, ny, nz) * mix(3.5, 1.2, t2) * moveFactor;
        
        vec3 bDir = normalize(position);
        finalPos += bDir * sin(uTime * 0.8 + aRandom * 5.0) * (2.0 + 2.0 * (1.0-t2)) * moveFactor;

        // Repulsion
        if (uMouseActive > 0.05 && moveFactor > 0.1) {
            float rRadius = 300.0 * finalScale;
            float dist = distance(finalPos.xy, uMouse.xy);
            if (dist < rRadius) {
                float f = pow((rRadius - dist) / rRadius, 2.0);
                finalPos += normalize(finalPos - vec3(uMouse.xy, finalPos.z)) * f * 55.0 * finalScale;
            }
        }

        vec4 mvPos = modelViewMatrix * vec4(finalPos, 1.0);
        gl_Position = projectionMatrix * mvPos;
        
        float baseSize = aSize * (500.0 / -mvPos.z) * uPixelRatio;
        
        vPulse = 0.0;
        vIsNode = aStatic;
        if (aStatic > 0.5) {
             baseSize *= uGraphZoom;
             float p = sin(uTime * 2.5 + aRandom * 10.0) * 0.5 + 0.5;
             vPulse = p;
             baseSize *= (1.0 + p * 0.3 * t3);
        }
        
        gl_PointSize = baseSize * mix(1.0, 0.65, uMobile); 

        float targetAlpha = (aSize < 5.0 ? 0.6 : 1.0);
        float drillAlpha = (aStatic < 0.5 ? 0.45 : 1.0);
        
        // Fix Cloud Visibility: Keep opacity high on Slide 2 (0.6 instead of 0.15)
        float s2Alpha = mix(1.0, targetAlpha, t2);
        vAlpha = mix(s2Alpha, drillAlpha, t3);
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
        
        if (vIsNode > 0.5) {
            float glow = 1.0 + vPulse * 0.5;
            finalColor.rgb *= glow;
        }
        
        gl_FragColor = finalColor;
    }
`;

// LINE SHADER (Standard)
const LINE_VERTEX_SHADER = `
    attribute float lineProcess;
    varying float vV;
    uniform float uProgress; 
    void main() {
        vV = (lineProcess < smoothstep(0.2, 0.9, (uProgress-0.3)*1.5)) ? 1.0 : 0.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const LINE_FRAGMENT_SHADER = `
    varying float vV;
    uniform float uOpacity;
    void main() {
        if (vV < 0.5) discard;
        gl_FragColor = vec4(0.8, 0.9, 1.0, uOpacity * 0.3); // Light Blue-ish
    }
`;

const Viewport3D: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const raycaster = useRef(new THREE.Raycaster());
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);
    const lineMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
    const hitTargetsRef = useRef<THREE.Group>(new THREE.Group());
    const frameIdRef = useRef<number>(0);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    const workflow = useWorkflowStore(state => state.workflow);
    const selectAgent = useVzorStore(state => state.selectAgent);

    useEffect(() => {
        if (!containerRef.current) return;

        // 1. RENDERER
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(60, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 2000);
        camera.position.z = 450;
        cameraRef.current = camera;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = false;
        controlsRef.current = controls;

        scene.add(hitTargetsRef.current);

        // 2. TEXTURE
        const getGlowTexture = () => {
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
            return new THREE.CanvasTexture(canvas);
        };

        // 3. PARTICLES
        const COUNT = 20000;
        const posArray = new Float32Array(COUNT * 3);
        const incubatorArray = new Float32Array(COUNT * 3);
        const targetArray = new Float32Array(COUNT * 3);
        const detailArray = new Float32Array(COUNT * 3);
        const sizeArray = new Float32Array(COUNT);
        const colorArray = new Float32Array(COUNT * 3);
        const randomArray = new Float32Array(COUNT);
        const staticArray = new Float32Array(COUNT);

        const cores = [
            { pos: new THREE.Vector3(-130, 0, 0) },
            { pos: new THREE.Vector3(0, 0, 90) },
            { pos: new THREE.Vector3(130, 0, 0) }
        ];

        for (let i = 0; i < COUNT; i++) {
            // STATE 1
            const r1 = 220 * (0.85 + Math.random() * 0.15);
            const th1 = Math.random() * Math.PI * 2;
            const ph1 = Math.acos(2 * Math.random() - 1);

            const x = r1 * Math.sin(ph1) * Math.cos(th1);
            const y = r1 * Math.sin(ph1) * Math.sin(th1);
            const z = r1 * Math.cos(ph1);

            posArray[i * 3] = x; posArray[i * 3 + 1] = y; posArray[i * 3 + 2] = z;

            // STATE 2 (INCUBATOR)
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

            // Defaults for 3 & 4
            targetArray[i * 3] = x; targetArray[i * 3 + 1] = y; targetArray[i * 3 + 2] = z;
            detailArray[i * 3] = x; detailArray[i * 3 + 1] = y; detailArray[i * 3 + 2] = z;

            sizeArray[i] = 1.2 + Math.random() * 2.5;
            colorArray[i * 3] = 0.5; colorArray[i * 3 + 1] = 0.6; colorArray[i * 3 + 2] = 0.8;
            randomArray[i] = Math.random();
            staticArray[i] = 0.0;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        geo.setAttribute('aIncubator', new THREE.BufferAttribute(incubatorArray, 3));
        geo.setAttribute('aTarget', new THREE.BufferAttribute(targetArray, 3));
        geo.setAttribute('aDetail', new THREE.BufferAttribute(detailArray, 3));
        geo.setAttribute('aSize', new THREE.BufferAttribute(sizeArray, 1));
        geo.setAttribute('aColor', new THREE.BufferAttribute(colorArray, 3));
        geo.setAttribute('aRandom', new THREE.BufferAttribute(randomArray, 1));
        geo.setAttribute('aStatic', new THREE.BufferAttribute(staticArray, 1));

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
                uGraphZoom: { value: 1.0 }, // FIXED
                uMobile: { value: 0.0 }, // Desktop forced
                uTexture: { value: getGlowTexture() }
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        materialRef.current = mat;

        const points = new THREE.Points(geo, mat);
        points.name = 'cloud-system';
        scene.add(points);

        resizeObserverRef.current = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (camera && renderer) {
                    camera.aspect = width / height;
                    camera.updateProjectionMatrix();
                    renderer.setSize(width, height);
                    if (materialRef.current) materialRef.current.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
                }
            }
        });
        resizeObserverRef.current.observe(containerRef.current);

        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);
            controls.update();
            if (materialRef.current) {
                const u = materialRef.current.uniforms;
                u.uTime.value += 0.01;
                if (u.uMouseActive.value > 0) u.uMouseActive.value *= 0.95;
                if (lineMaterialRef.current) lineMaterialRef.current.uniforms.uProgress.value = u.uProgress2.value;
            }
            renderer.render(scene, camera);
        };
        animate();

        const onMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
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

        const handleClick = (e: MouseEvent) => {
            if (!containerRef.current || !cameraRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const m = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
            raycaster.current.setFromCamera(m, cameraRef.current);
            const hits = raycaster.current.intersectObjects(hitTargetsRef.current.children);
            if (hits.length > 0) selectAgent(hits[0].object.userData.id);
        };
        containerRef.current.addEventListener('click', handleClick);

        return () => {
            cancelAnimationFrame(frameIdRef.current);
            resizeObserverRef.current?.disconnect();
            if (containerRef.current) {
                containerRef.current.removeChild(renderer.domElement);
                containerRef.current.removeEventListener('mousemove', onMove);
                containerRef.current.removeEventListener('click', handleClick);
            }
            renderer.dispose();
        };

    }, []);

    // --- CLUSTERING LOGIC ---
    // User says: Cloud becomes sparser, part of cloud goes to graph.
    // Code says: ALL particles go to graph (nodes or clusters).
    // Conflict resolution: I will implement the code as written in the file.
    // If user says it's wrong, then the file itself might be "wrong" or I am looking at later version logic.
    // But user Explicitly said: v3.1 file.

    useEffect(() => {
        if (!sceneRef.current || !materialRef.current) return;

        const agents = workflow?.blocks.flatMap(b => b.agents) || [];

        if (agents.length === 0) {
            materialRef.current.uniforms.uProgress2.value = 0;
        } else {
            materialRef.current.uniforms.uProgress2.value = 1;
        }

        type VisualNode = { id: string, role: string, status: string, inputs: string[] };
        const visualNodes: VisualNode[] = [
            { id: 'site-input', role: 'site_input', status: 'completed', inputs: [] },
            ...agents.map(a => ({ id: a.id, role: a.role, status: a.status, inputs: a.inputs })),
            ...(workflow?.blocks.some(b => b.phase === 'investment_analysis') ?
                [{ id: 'decision', role: 'decision', status: (agents.length > 0 && agents.every(a => a.status === 'completed')) ? 'completed' : 'pending', inputs: ['fin-model'] }] : [])
        ];

        // SPHERICAL LAYOUT
        const posMap = new Map<string, THREE.Vector3>();
        const r = 200;
        const count = visualNodes.length;

        visualNodes.forEach((node, i) => {
            const phi = Math.acos(-1 + (2 * i) / Math.max(1, count));
            const theta = Math.sqrt(count * Math.PI) * phi;
            const pos = new THREE.Vector3().setFromSphericalCoords(r, phi, theta);
            posMap.set(node.id, pos);
        });

        // UPDATE PARTICLES
        const points = sceneRef.current.getObjectByName('cloud-system') as THREE.Points;
        if (points) {
            const aTarget = points.geometry.getAttribute('aTarget');
            const aStatic = points.geometry.getAttribute('aStatic');
            const aColor = points.geometry.getAttribute('aColor');
            const aSize = points.geometry.getAttribute('aSize');

            const total = aTarget.count;
            hitTargetsRef.current.clear();

            for (let i = 0; i < total; i++) {
                if (visualNodes.length > 0) {
                    if (i < visualNodes.length) {
                        const node = visualNodes[i];
                        const pos = posMap.get(node.id) || new THREE.Vector3();
                        aTarget.setXYZ(i, pos.x, pos.y, pos.z);
                        aStatic.setX(i, 1.0);
                        aSize.setX(i, 12.0 * 1.5);

                        let c = new THREE.Color(0x888888);
                        if (node.role === 'market_analyst') c.setHex(0x4a2d4a);
                        if (node.role === 'tech_analyst') c.setHex(0x2d4a4a);
                        if (node.role === 'legal_analyst') c.setHex(0x4a4a2d);
                        if (node.role === 'cost_analyst') c.setHex(0x4a3d2d);
                        if (node.role === 'fin_analyst') c.setHex(0x2d2d4a);
                        if (node.role === 'site_input' || node.role === 'decision') c.setHex(0x2d4a2d);
                        if (node.status === 'running') c.setHex(0x00f2ff);

                        aColor.setXYZ(i, c.r, c.g, c.b);

                        const hitGeo = new THREE.SphereGeometry(12, 8, 8);
                        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
                        const hitMesh = new THREE.Mesh(hitGeo, hitMat);
                        hitMesh.position.copy(pos);
                        hitMesh.userData = { id: node.id };
                        hitTargetsRef.current.add(hitMesh);
                    } else {
                        // CLUSTERING AROUND NODES - AS PER FILE
                        const nIdx = i % visualNodes.length;
                        const mainNodePos = posMap.get(visualNodes[nIdx].id) || new THREE.Vector3();

                        const rcl = 60 * Math.random();
                        const tcl = Math.random() * Math.PI * 2;
                        const pcl = Math.acos(2 * Math.random() - 1);

                        const tx = mainNodePos.x + rcl * Math.sin(pcl) * Math.cos(tcl);
                        const ty = mainNodePos.y + rcl * Math.sin(pcl) * Math.sin(tcl);
                        const tz = mainNodePos.z + rcl * Math.cos(pcl);

                        aTarget.setXYZ(i, tx, ty, tz);
                        aStatic.setX(i, 0.0);
                        aSize.setX(i, 1.2 + Math.random() * 2.5);
                        aColor.setXYZ(i, 0.5, 0.6, 0.8);
                    }
                }
            }

            aTarget.needsUpdate = true;
            aStatic.needsUpdate = true;
            aSize.needsUpdate = true;
            aColor.needsUpdate = true;
        }

        const oldLines = sceneRef.current.children.filter(c => c.name === 'workflow-lines');
        oldLines.forEach(l => sceneRef.current?.remove(l));

        if (visualNodes.length > 0) {
            const pts: number[] = [];
            const processes: number[] = [];

            const tempLines: { p1: THREE.Vector3, p2: THREE.Vector3 }[] = [];
            visualNodes.forEach(node => {
                const targetPos = posMap.get(node.id);
                if (!targetPos) return;

                const sources: THREE.Vector3[] = [];
                node.inputs.forEach(inp => { const s = posMap.get(inp); if (s) sources.push(s); });

                if (['market_analyst', 'tech_analyst', 'legal_analyst', 'cost_analyst'].includes(node.role)) {
                    if (node.inputs.length === 0 && posMap.has('site-input')) sources.push(posMap.get('site-input')!);
                }
                if (node.role === 'fin_analyst') {
                    ['market_analyst', 'tech_analyst', 'legal_analyst', 'cost_analyst'].forEach(r => {
                        const found = visualNodes.find(n => n.role === r);
                        if (found) { const s = posMap.get(found.id); if (s) sources.push(s); }
                    });
                }
                if (node.role === 'decision' && posMap.has('fin-model')) sources.push(posMap.get('fin-model')!);

                sources.forEach(s => tempLines.push({ p1: s, p2: targetPos }));
            });

            tempLines.forEach((l, i) => {
                pts.push(l.p1.x, l.p1.y, l.p1.z, l.p2.x, l.p2.y, l.p2.z);
                const prog = i / Math.max(1, tempLines.length);
                processes.push(prog, prog);
            });

            if (pts.length > 0) {
                const lineGeo = new THREE.BufferGeometry();
                lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
                lineGeo.setAttribute('lineProcess', new THREE.Float32BufferAttribute(processes, 1));

                const lineMat = new THREE.ShaderMaterial({
                    uniforms: {
                        uProgress: { value: 0 },
                        uOpacity: { value: 1.0 }
                    },
                    vertexShader: LINE_VERTEX_SHADER,
                    fragmentShader: LINE_FRAGMENT_SHADER,
                    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
                });
                lineMaterialRef.current = lineMat;

                const lines = new THREE.LineSegments(lineGeo, lineMat);
                lines.name = 'workflow-lines';
                sceneRef.current.add(lines);
            }
        }

    }, [workflow]);

    return <div ref={containerRef} className="w-full h-full relative overflow-hidden" />;
};

export default Viewport3D;
