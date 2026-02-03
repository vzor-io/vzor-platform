import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useVzorStore } from '../store/store';

// Agent visuals matching the user's example:
// Left: Agent icon with particle sphere
// Right: "ВНУТРИ АГЕНТА" panel with editable properties

// Available options
const KNOWLEDGE_BASES = ['ПЗЗ, ГПЗУ', 'СП, СНиП', 'МГСН', 'Custom...'];
const METHODOLOGIES = ['Правовой анализ', 'Технический анализ', 'Финансовый анализ'];
const MODELS = ['Gemini 1.5 Pro', 'Gemini 2.0 Flash', 'GPT-4o', 'Claude 3.5'];

// Agent types with their icons
const AGENT_ICONS: Record<string, string> = {
    'Юрист': '⚖️',
    'Архитектор': '🏛️',
    'Геодезист': '📐',
    'Проектировщик': '📋',
    'Analyst': '📊',
    'default': '🤖',
};

interface AgentViewerProps {
    agentName?: string;
    agentRole?: string;
}

const AgentViewer = ({ agentName, agentRole }: AgentViewerProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [knowledgeBase, setKnowledgeBase] = useState(KNOWLEDGE_BASES[0]);
    const [methodology, setMethodology] = useState(METHODOLOGIES[0]);
    const [model, setModel] = useState(MODELS[0]);

    // Get selected agent from store
    const selectedAgentId = useVzorStore(state => state.selectedAgentId);
    const subAgents = useVzorStore(state => state.subAgents);
    const selectedAgent = subAgents.find(a => a.id === selectedAgentId);

    const displayName = agentName || selectedAgent?.role || 'ЮРИСТ';
    const agentIcon = AGENT_ICONS[displayName] || AGENT_ICONS.default;

    // Particle sphere animation
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Create particle sphere
        const particleCount = 3000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            // Spherical distribution
            const radius = 1.5 + Math.random() * 0.8;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            // Cyan/blue colors
            colors[i * 3] = 0.0 + Math.random() * 0.3;     // R
            colors[i * 3 + 1] = 0.8 + Math.random() * 0.2; // G (cyan)
            colors[i * 3 + 2] = 1.0;                        // B

            sizes[i] = Math.random() * 3 + 1;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Shader material for glowing particles
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
            },
            vertexShader: `
                attribute float size;
                varying vec3 vColor;
                uniform float uTime;
                
                void main() {
                    vColor = color;
                    vec3 pos = position;
                    
                    // Breathing effect
                    float breath = sin(uTime * 0.5 + length(position) * 2.0) * 0.1;
                    pos *= 1.0 + breath;
                    
                    // Rotation
                    float angle = uTime * 0.1;
                    float cosA = cos(angle);
                    float sinA = sin(angle);
                    vec3 rotated = vec3(
                        pos.x * cosA - pos.z * sinA,
                        pos.y,
                        pos.x * sinA + pos.z * cosA
                    );
                    
                    vec4 mvPosition = modelViewMatrix * vec4(rotated, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    
                    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
                    gl_FragColor = vec4(vColor, alpha * 0.8);
                }
            `,
            transparent: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        const particles = new THREE.Points(geometry, material);
        scene.add(particles);

        // Core glow sphere
        const coreGeometry = new THREE.SphereGeometry(0.6, 32, 32);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0x00f2ff,
            transparent: true,
            opacity: 0.3,
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        scene.add(core);

        // Animation
        let animationId: number;
        const clock = new THREE.Clock();

        const animate = () => {
            const elapsed = clock.getElapsedTime();
            material.uniforms.uTime.value = elapsed;

            // Pulse the core
            core.scale.setScalar(1 + Math.sin(elapsed * 2) * 0.1);

            renderer.render(scene, camera);
            animationId = requestAnimationFrame(animate);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            if (!canvas.parentElement) return;
            const width = canvas.parentElement.clientWidth;
            const height = canvas.parentElement.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            geometry.dispose();
            material.dispose();
        };
    }, []);

    return (
        <div className="w-full h-full flex bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e] overflow-hidden">
            {/* LEFT: Agent Visualization */}
            <div className="flex-1 relative flex flex-col items-center justify-center p-4">
                {/* Canvas for particle sphere */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                />

                {/* Agent icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative">
                        {/* Glow effect */}
                        <div className="absolute inset-0 blur-2xl bg-cyan-500/30 rounded-full scale-150" />

                        {/* Icon */}
                        <div className="relative text-6xl filter drop-shadow-[0_0_20px_rgba(0,242,255,0.8)]">
                            {agentIcon}
                        </div>
                    </div>
                </div>

                {/* Agent name */}
                <div className="absolute bottom-8 text-center">
                    <div className="text-2xl font-bold text-cyan-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(0,242,255,0.6)]">
                        {displayName}
                    </div>
                </div>

                {/* Corner decorations */}
                <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-cyan-500/50" />
                <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-cyan-500/50" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-cyan-500/50" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-cyan-500/50" />
            </div>

            {/* RIGHT: Properties Panel */}
            <div className="w-72 bg-gradient-to-b from-[#1a1a3e]/90 to-[#0a0a1e]/90 border-l border-purple-500/30 p-4 flex flex-col">
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-lg font-bold text-purple-300 uppercase tracking-wider">
                        ВНУТРИ АГЕНТА
                    </h2>
                    <div className="h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent mt-2" />
                </div>

                {/* Property Cards */}
                <div className="space-y-4 flex-1">
                    {/* База знаний */}
                    <div className="bg-[#1e1e3e]/80 rounded-lg p-3 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">📚</span>
                            <span className="text-xs text-gray-400 uppercase tracking-wider">База знаний:</span>
                        </div>
                        <select
                            value={knowledgeBase}
                            onChange={(e) => setKnowledgeBase(e.target.value)}
                            className="w-full bg-[#0a0a1e] border border-purple-500/30 rounded px-3 py-2 text-sm text-cyan-400 outline-none focus:border-cyan-500"
                        >
                            {KNOWLEDGE_BASES.map(kb => (
                                <option key={kb} value={kb}>{kb}</option>
                            ))}
                        </select>
                        <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500" style={{ width: '75%' }} />
                        </div>
                    </div>

                    {/* Методика */}
                    <div className="bg-[#1e1e3e]/80 rounded-lg p-3 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">🔍</span>
                            <span className="text-xs text-gray-400 uppercase tracking-wider">Методика:</span>
                        </div>
                        <select
                            value={methodology}
                            onChange={(e) => setMethodology(e.target.value)}
                            className="w-full bg-[#0a0a1e] border border-purple-500/30 rounded px-3 py-2 text-sm text-purple-400 outline-none focus:border-purple-500"
                        >
                            {METHODOLOGIES.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                        <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: '60%' }} />
                        </div>
                    </div>

                    {/* Модель */}
                    <div className="bg-[#1e1e3e]/80 rounded-lg p-3 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">🧠</span>
                            <span className="text-xs text-gray-400 uppercase tracking-wider">Модель:</span>
                        </div>
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full bg-[#0a0a1e] border border-purple-500/30 rounded px-3 py-2 text-sm text-green-400 outline-none focus:border-green-500"
                        >
                            {MODELS.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                        <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-500 to-cyan-500" style={{ width: '90%' }} />
                        </div>
                    </div>
                </div>

                {/* Time */}
                <div className="text-right text-gray-500 text-xs mt-4">
                    {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    );
};

export default AgentViewer;
