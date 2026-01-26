import { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Viewport3DProps {
    className?: string;
    onViewChange?: (view: string) => void;
}

const Viewport3D = ({ className, onViewChange }: Viewport3DProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const frameIdRef = useRef<number>(0);
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);
    const timeRef = useRef<number>(0);

    // Initial Data Constants
    const FINAL_NODES = useMemo(() => [
        { label: "Концепция", size: 12 }, { label: "Земля", size: 12 }, { label: "Проектирование", size: 12 },
        { label: "Финансирование", size: 12 }, { label: "Строительство", size: 12 }, { label: "Реализация", size: 12 },
        { label: "Маркетинг", size: 8 }, { label: "Бизнес-план", size: 8 }, { label: "Анализ участка", size: 8 },
        { label: "ГПЗУ", size: 8 }, { label: "Мастер-план", size: 8 }, { label: "Архитектура", size: 8 },
        { label: "Инженерия", size: 8 }, { label: "Экспертиза", size: 8 }, { label: "Бюджет", size: 8 },
        { label: "Кредит", size: 8 }, { label: "Модель", size: 8 }, { label: "Подрядчик", size: 8 },
        { label: "Контроль", size: 8 }, { label: "Снабжение", size: 8 }, { label: "Продажи", size: 8 },
        { label: "Сервис", size: 8 }, { label: "Исследование", size: 4 }, { label: "Конкуренты", size: 4 },
        { label: "АР", size: 4 }, { label: "КР", size: 4 }, { label: "ИОС", size: 4 }, { label: "Сети", size: 4 },
        { label: "Смета", size: 4 }, { label: "NPV / IRR", size: 4 }, { label: "Технадзор", size: 4 },
        { label: "Отчёты", size: 4 }, { label: "ДДУ", size: 4 }, { label: "CRM", size: 4 }
    ], []);

    // Helper: Create Glow Texture
    const createGlowTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) return new THREE.Texture();

        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.2, 'rgba(255,255,255,0.6)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
    };

    useEffect(() => {
        if (!containerRef.current) return;

        // --- Init Scene ---
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(60, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 2000);
        camera.position.z = 450;
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Prevent duplicate canvases
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        controlsRef.current = controls;

        // --- Particle System Generation ---
        const particlesCount = 20000;
        const geometry = new THREE.BufferGeometry();

        // Arrays
        const posArray = new Float32Array(particlesCount * 3);        // STATE 1: Sphere
        const incubatorArray = new Float32Array(particlesCount * 3);  // STATE 2: Incubator
        const targetArray = new Float32Array(particlesCount * 3);     // STATE 3: Final Graph
        const sizeArray = new Float32Array(particlesCount);
        const colorArray = new Float32Array(particlesCount * 3);
        const randomArray = new Float32Array(particlesCount);
        const staticArray = new Float32Array(particlesCount);

        const cores = [
            { pos: new THREE.Vector3(-130, 0, 0) }, // Development
            { pos: new THREE.Vector3(0, 0, 90) },    // Finance
            { pos: new THREE.Vector3(130, 0, 0) }   // Real Estate
        ];

        // Precompute Node Positions (Spherical Layout)
        const nodePositions: THREE.Vector3[] = [];
        for (let i = 0; i < FINAL_NODES.length; i++) {
            const phi = Math.acos(-1 + (2 * i) / FINAL_NODES.length);
            const theta = Math.sqrt(FINAL_NODES.length * Math.PI) * phi;
            const r = 200;
            nodePositions.push(new THREE.Vector3().setFromSphericalCoords(r, phi, theta));
        }

        for (let i = 0; i < particlesCount; i++) {
            // -- STATE 1: Uniform Sphere (Tight Chaos) --
            const r1 = 220 * (0.85 + Math.random() * 0.15);
            const th1 = Math.random() * Math.PI * 2;
            const ph1 = Math.acos(2 * Math.random() - 1);
            posArray[i * 3] = r1 * Math.sin(ph1) * Math.cos(th1);
            posArray[i * 3 + 1] = r1 * Math.sin(ph1) * Math.sin(th1);
            posArray[i * 3 + 2] = r1 * Math.cos(ph1);

            // -- STATE 2: Incubator (3 Cores) --
            const rand = Math.random();
            if (rand < 0.4) {
                // SHELL
                incubatorArray[i * 3] = posArray[i * 3];
                incubatorArray[i * 3 + 1] = posArray[i * 3 + 1];
                incubatorArray[i * 3 + 2] = posArray[i * 3 + 2];
            } else {
                // CORES
                const cIdx = i % cores.length;
                const c = cores[cIdx];
                const rc = 40 + Math.random() * 40;
                const tc = Math.random() * Math.PI * 2;
                const pc = Math.acos(2 * Math.random() - 1);
                incubatorArray[i * 3] = c.pos.x + rc * Math.sin(pc) * Math.cos(tc);
                incubatorArray[i * 3 + 1] = c.pos.y + rc * Math.sin(pc) * Math.sin(tc);
                incubatorArray[i * 3 + 2] = c.pos.z + rc * Math.cos(pc);
            }

            // -- STATE 3: Graph Target --
            if (i < FINAL_NODES.length) {
                targetArray[i * 3] = nodePositions[i].x;
                targetArray[i * 3 + 1] = nodePositions[i].y;
                targetArray[i * 3 + 2] = nodePositions[i].z;
                sizeArray[i] = FINAL_NODES[i].size * 1.5;
                colorArray[i * 3] = 1; colorArray[i * 3 + 1] = 1; colorArray[i * 3 + 2] = 1;
                staticArray[i] = 1.0;
            } else {
                const nIdx = i % FINAL_NODES.length;
                const rcl = 60 * Math.random();
                const tcl = Math.random() * Math.PI * 2;
                const pcl = Math.acos(2 * Math.random() - 1);
                targetArray[i * 3] = nodePositions[nIdx].x + rcl * Math.sin(pcl) * Math.cos(tcl);
                targetArray[i * 3 + 1] = nodePositions[nIdx].y + rcl * Math.sin(pcl) * Math.sin(tcl);
                targetArray[i * 3 + 2] = nodePositions[nIdx].z + rcl * Math.cos(pcl);
                sizeArray[i] = 1.2 + Math.random() * 2.5;
                colorArray[i * 3] = 0.5; colorArray[i * 3 + 1] = 0.6; colorArray[i * 3 + 2] = 0.8;
                staticArray[i] = 0.0;
            }
            randomArray[i] = Math.random();
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        geometry.setAttribute('aIncubator', new THREE.BufferAttribute(incubatorArray, 3));
        geometry.setAttribute('aTarget', new THREE.BufferAttribute(targetArray, 3));
        geometry.setAttribute('aSize', new THREE.BufferAttribute(sizeArray, 1));
        geometry.setAttribute('aColor', new THREE.BufferAttribute(colorArray, 3));
        geometry.setAttribute('aRandom', new THREE.BufferAttribute(randomArray, 1));
        geometry.setAttribute('aStatic', new THREE.BufferAttribute(staticArray, 1));

        // Shader Material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uProgress1: { value: 0 }, // Sphere -> Incubator
                uProgress2: { value: 0 }, // Incubator -> Graph
                uPixelRatio: { value: renderer.getPixelRatio() },
                uTexture: { value: createGlowTexture() }
            },
            vertexShader: `
                uniform float uTime;
                uniform float uProgress1;
                uniform float uProgress2;
                uniform float uPixelRatio;

                attribute vec3 aIncubator;
                attribute vec3 aTarget;
                attribute float aSize;
                attribute vec3 aColor;
                attribute float aRandom;
                attribute float aStatic;

                varying vec3 vColor;
                varying float vAlpha;

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

                    // Morphing: Sphere -> Incubator -> Target
                    vec3 vBase = mix(position, aIncubator, t1);
                    vec3 finalPos = mix(vBase, aTarget, t2);

                    // Noise / Movement
                    float ns = 0.015; 
                    float ts = uTime * 0.15;
                    float nx = snoise(vec2(position.x * ns, position.y * ns + ts + aRandom));
                    float ny = snoise(vec2(position.y * ns, position.z * ns + ts + aRandom + 10.0));
                    float nz = snoise(vec2(position.z * ns, position.x * ns + ts + aRandom + 20.0));
                    
                    finalPos += vec3(nx, ny, nz) * mix(3.5, 1.2, t2);

                    // Breathing
                    vec3 bDir = normalize(position);
                    finalPos += bDir * sin(uTime * 0.8 + aRandom * 5.0) * (2.0 + 2.0 * (1.0-t2));

                    vec4 mvPos = modelViewMatrix * vec4(finalPos, 1.0);
                    gl_Position = projectionMatrix * mvPos;

                    // Size
                    float baseSize = aSize * (500.0 / -mvPos.z) * uPixelRatio;
                    gl_PointSize = baseSize;

                    // Alpha
                    vAlpha = 0.8 + 0.2 * sin(uTime + aRandom * 5.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D uTexture;
                varying vec3 vColor;
                varying float vAlpha;

                void main() {
                    vec4 tex = texture2D(uTexture, gl_PointCoord);
                    gl_FragColor = vec4(vColor, vAlpha * tex.a);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        materialRef.current = material;

        const points = new THREE.Points(geometry, material);
        scene.add(points);

        // --- Animation Loop ---
        const clock = new THREE.Clock();
        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);

            const time = clock.getElapsedTime();
            timeRef.current = time;

            if (materialRef.current) {
                materialRef.current.uniforms.uTime.value = time;
                // VZOR: KEEP STATIC SPHERE (No auto-progress)
                // materialRef.current.uniforms.uProgress1.value = 0;
            }

            if (controlsRef.current) controlsRef.current.update();
            if (rendererRef.current && sceneRef.current && cameraRef.current) {
                rendererRef.current.render(sceneRef.current, cameraRef.current);
            }
        };
        animate();

        // --- RESIZE HANDLING (Use ResizeObserver for Panels) ---
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                if (entry.target === containerRef.current && cameraRef.current && rendererRef.current) {
                    const { width, height } = entry.contentRect;
                    if (width === 0 || height === 0) return;

                    cameraRef.current.aspect = width / height;
                    cameraRef.current.updateProjectionMatrix();
                    rendererRef.current.setSize(width, height);
                    if (materialRef.current) {
                        materialRef.current.uniforms.uPixelRatio.value = rendererRef.current.getPixelRatio();
                    }
                }
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        // Cleanup
        return () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(frameIdRef.current);
            if (rendererRef.current && containerRef.current) {
                containerRef.current.removeChild(rendererRef.current.domElement);
            }
            geometry.dispose();
            material.dispose();
        };

    }, [FINAL_NODES]);

    return <div ref={containerRef} className={`w-full h-full bg-black ${className}`} style={{ overflow: 'hidden' }} />;
};

export default Viewport3D;
