import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useEngine } from '../context/EngineContext';

// --- SHADER CODE (DIRECT PORT FROM PRESENTATION REPO) ---

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
    // float t3 = smoothstep(0.0, 1.0, uProgress3); 
    
    vec3 vBase = mix(position, aIncubator, t1);
    // vec3 vFinal = mix(vBase, aTarget, t2); // Simplify for VZOR Platform (Just Incubator State)
    vec3 finalPos = vBase; 

    // SCALE (Desktop)
    float scaleFactor = 0.8; 
    finalPos *= scaleFactor;

    // NOISE MOVEMENT
    float ns = 0.015; float ts = uTime * 0.15;
    float nx = snoise(vec2(position.x * ns, position.y * ns + ts + aRandom));
    float ny = snoise(vec2(position.y * ns, position.z * ns + ts + aRandom + 10.0));
    float nz = snoise(vec2(position.z * ns, position.x * ns + ts + aRandom + 20.0));
    
    finalPos += vec3(nx, ny, nz) * 3.5;
    
    // Breathing
    vec3 bDir = normalize(position);
    finalPos += bDir * sin(uTime * 0.8 + aRandom * 5.0) * 2.0;

    vec4 mvPos = modelViewMatrix * vec4(finalPos, 1.0);
    gl_Position = projectionMatrix * mvPos;
    
    // Point Size
    float baseSize = aSize * (500.0 / -mvPos.z) * uPixelRatio;
    gl_PointSize = baseSize;

    // Alpha Logic
    vAlpha = 0.8; 
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
    
    // Simple bloom boost
    finalColor.rgb *= 1.2;
    
    gl_FragColor = finalColor;
}
`;

const Viewport3D = () => {
    const { projectState } = useEngine();
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);
    const frameIdRef = useRef<number>(0);

    const createGlowTexture = () => {
        const h = document.createElement('canvas');
        h.width = 64; h.height = 64;
        const ctx = h.getContext('2d');
        if (!ctx) return new THREE.Texture();
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.2, 'rgba(255,255,255,0.6)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.1)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(h);
    };

    useEffect(() => {
        if (!containerRef.current) return;

        // INIT
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        const camera = new THREE.PerspectiveCamera(60, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 2000);
        camera.position.z = 400;
        cameraRef.current = camera;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;

        // --- CONTENT ---
        const isEmpty = projectState === 'empty';

        if (isEmpty) {
            // EMPTY: Grid Only
            const grid = new THREE.GridHelper(500, 20, 0x333333, 0x111111);
            scene.add(grid);
            controls.autoRotate = false;
        } else {
            // LOADED: PARTICLES (Exact Generation)
            const particlesCount = 20000;
            const geo = new THREE.BufferGeometry();

            const posArray = new Float32Array(particlesCount * 3);
            const incubatorArray = new Float32Array(particlesCount * 3); // We use this for the "Structure" look
            const colorArray = new Float32Array(particlesCount * 3);
            const sizeArray = new Float32Array(particlesCount);
            const randomArray = new Float32Array(particlesCount);

            const cores = [
                { pos: new THREE.Vector3(-100, 0, 0) },
                { pos: new THREE.Vector3(0, 0, 80) },
                { pos: new THREE.Vector3(100, 0, 0) }
            ];

            for (let i = 0; i < particlesCount; i++) {
                // Sphere (Base)
                const r1 = 200 * (0.8 + Math.random() * 0.2);
                const th = Math.random() * Math.PI * 2;
                const ph = Math.acos(2 * Math.random() - 1);
                posArray[i * 3] = r1 * Math.sin(ph) * Math.cos(th);
                posArray[i * 3 + 1] = r1 * Math.sin(ph) * Math.sin(th);
                posArray[i * 3 + 2] = r1 * Math.cos(ph);

                // Incubator (Target) - 3 Cores
                const rand = Math.random();
                if (rand < 0.3) {
                    // Shell
                    incubatorArray[i * 3] = posArray[i * 3];
                    incubatorArray[i * 3 + 1] = posArray[i * 3 + 1];
                    incubatorArray[i * 3 + 2] = posArray[i * 3 + 2];
                } else {
                    // Cores
                    const cIdx = i % cores.length;
                    const c = cores[cIdx];
                    const rc = 40 + Math.random() * 40;
                    incubatorArray[i * 3] = c.pos.x + rc * Math.sin(ph) * Math.cos(th);
                    incubatorArray[i * 3 + 1] = c.pos.y + rc * Math.sin(ph) * Math.sin(th);
                    incubatorArray[i * 3 + 2] = c.pos.z + rc * Math.cos(ph);
                }

                sizeArray[i] = 1.0 + Math.random() * 3.0;
                colorArray[i * 3] = 0.0; colorArray[i * 3 + 1] = 0.6; colorArray[i * 3 + 2] = 1.0; // Cyan
                randomArray[i] = Math.random();
            }

            // Fill dummy attributes to satisfy shader
            const dummy = new Float32Array(particlesCount * 3);
            geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
            geo.setAttribute('aIncubator', new THREE.BufferAttribute(incubatorArray, 3));
            geo.setAttribute('aTarget', new THREE.BufferAttribute(dummy, 3)); // Unused
            geo.setAttribute('aDetail', new THREE.BufferAttribute(dummy, 3)); // Unused
            geo.setAttribute('aSize', new THREE.BufferAttribute(sizeArray, 1));
            geo.setAttribute('aColor', new THREE.BufferAttribute(colorArray, 3));
            geo.setAttribute('aRandom', new THREE.BufferAttribute(randomArray, 1));
            geo.setAttribute('aStatic', new THREE.BufferAttribute(new Float32Array(particlesCount), 1)); // Unused

            const mat = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uProgress1: { value: 0 }, // Will animate to 1
                    uProgress2: { value: 0 },
                    uProgress3: { value: 0 },
                    uPixelRatio: { value: renderer.getPixelRatio() },
                    uMouse: { value: new THREE.Vector2(0, 0) },
                    uMouseActive: { value: 0 },
                    uGraphZoom: { value: 1.0 },
                    uMobile: { value: 0 },
                    uTexture: { value: createGlowTexture() }
                },
                vertexShader: VERTEX_SHADER,
                fragmentShader: FRAGMENT_SHADER,
                transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
            });
            materialRef.current = mat;

            const points = new THREE.Points(geo, mat);
            scene.add(points);
        }

        // RESIZE
        const ro = new ResizeObserver(() => {
            if (containerRef.current && renderer && camera) {
                const w = containerRef.current.clientWidth;
                const h = containerRef.current.clientHeight;
                if (w && h) {
                    camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
                    if (materialRef.current) materialRef.current.uniforms.uPixelRatio.value = renderer.getPixelRatio();
                }
            }
        });
        ro.observe(containerRef.current);

        // LOOP
        const clock = new THREE.Clock();
        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();
            if (materialRef.current) {
                materialRef.current.uniforms.uTime.value = t;
                // Easing animation for Progress
                if (projectState === 'loaded') {
                    // Lerp towards 1
                    materialRef.current.uniforms.uProgress1.value += (1.0 - materialRef.current.uniforms.uProgress1.value) * 0.02;
                }
            }
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            ro.disconnect();
            cancelAnimationFrame(frameIdRef.current);
            renderer.dispose();
            // geometry.dispose() (if ref kept)
        };
    }, [projectState]);

    return <div ref={containerRef} className="w-full h-full bg-black overflow-hidden" />;
};

export default Viewport3D;
