import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AddNodeMenu from './AddNodeMenu';
import {
    ReactFlow,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    addEdge,
    type Connection,
    type Edge,
    type Node,
    Handle,
    Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useVzorStore } from '../store/store';

// --- SOCKET TYPES & COLORS (Blender-style) ---
const SOCKET_COLORS: Record<string, string> = {
    geometry: '#63c763',   // Green
    value: '#a1a1a1',      // Grey
    vector: '#6363c7',     // Purple
    color: '#c7c763',      // Yellow
    boolean: '#c763c7',    // Pink
    string: '#63c7c7',     // Cyan
    shader: '#63ff63',     // Bright green
};

type SocketType = keyof typeof SOCKET_COLORS;

interface SocketProps {
    id: string;
    label: string;
    type: SocketType;
    side: 'left' | 'right';
}

// --- SOCKET COMPONENT ---
const Socket = ({ id, label, type, side }: SocketProps) => {
    const color = SOCKET_COLORS[type] || '#888';
    const position = side === 'left' ? Position.Left : Position.Right;

    return (
        <div className={`flex items-center ${side === 'left' ? '' : 'flex-row-reverse'} my-0.5 relative`}>
            <Handle
                type={side === 'left' ? 'target' : 'source'}
                position={position}
                id={id}
                style={{
                    background: color,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    border: '2px solid #222',
                }}
            />
            <span className={`text-[9px] text-gray-400 ${side === 'left' ? 'ml-3' : 'mr-3'}`}>
                {label}
            </span>
        </div>
    );
};

// --- BLENDER-STYLE NODE ---
interface BlenderNodeData {
    [key: string]: unknown;  // Index signature for ReactFlow compatibility
    label: string;
    status?: string;
    agentId?: string;
    icon?: string;
    headerColor?: string;
    inputs?: Array<{ id: string; label: string; type: SocketType }>;
    outputs?: Array<{ id: string; label: string; type: SocketType }>;
    // Editable properties
    knowledgeBase?: string;
    methodology?: string;
    model?: string;
}

// Available options for dropdowns
const KNOWLEDGE_BASES = ['ПЗЗ', 'ГПЗУ', 'СП', 'СНиП', 'МГСН', 'Custom...'];
const METHODOLOGIES = ['Правовой анализ', 'Технический анализ', 'Финансовый анализ', 'Комплексный анализ'];
const MODELS = ['Gemini 1.5 Pro', 'Gemini 2.0 Flash', 'GPT-4o', 'Claude 3.5'];

const BlenderNode = ({ data, id }: { data: BlenderNodeData; id: string }) => {
    const selectAgent = useVzorStore(state => state.selectAgent);
    const [knowledgeBase, setKnowledgeBase] = useState(data.knowledgeBase || KNOWLEDGE_BASES[0]);
    const [methodology, setMethodology] = useState(data.methodology || METHODOLOGIES[0]);
    const [model, setModel] = useState(data.model || MODELS[0]);

    const handleClick = () => {
        if (data.agentId) {
            selectAgent(data.agentId);
        }
    };

    const headerColor = data.headerColor || '#2d2d2d';
    const isActive = data.status === 'ACTIVE' || data.status === 'RUNNING';
    const isComplete = data.status === 'COMPLETED';
    const isAgent = data.agentId || data.label?.includes('Юрист') || data.label?.includes('Архитектор') || data.label?.includes('Геодезист') || data.label?.includes('Agent');

    return (
        <div
            onClick={handleClick}
            className={`
                rounded overflow-hidden cursor-pointer min-w-[180px] max-w-[240px]
                border shadow-lg
                ${isActive ? 'border-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.3)]' :
                    isComplete ? 'border-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.2)]' :
                        'border-[#444]'}
            `}
            style={{ background: '#1a1a1a' }}
        >
            {/* HEADER */}
            <div
                className="px-2 py-1.5 flex items-center gap-1.5"
                style={{ background: headerColor }}
            >
                {data.icon && <span className="text-sm">{data.icon}</span>}
                {data.agentId && <span className="text-[10px]">🤖</span>}
                <span className="text-[11px] font-bold text-white/90 uppercase tracking-wide truncate">
                    {data.label}
                </span>
                {data.status && (
                    <span className={`ml-auto text-[8px] px-1.5 py-0.5 rounded ${isActive ? 'bg-cyan-500/30 text-cyan-300' :
                        isComplete ? 'bg-green-500/30 text-green-300' :
                            'bg-gray-700 text-gray-400'
                        }`}>
                        {data.status}
                    </span>
                )}
            </div>

            {/* EDITABLE PROPERTIES (for agents) */}
            {isAgent && (
                <div className="px-2 py-1.5 border-b border-[#333] space-y-1" onClick={e => e.stopPropagation()}>
                    {/* База знаний */}
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] text-gray-500 w-14">База:</span>
                        <select
                            value={knowledgeBase}
                            onChange={(e) => setKnowledgeBase(e.target.value)}
                            className="flex-1 bg-[#2a2a2a] border border-[#444] rounded px-1 py-0.5 text-[9px] text-cyan-400 outline-none"
                        >
                            {KNOWLEDGE_BASES.map(kb => (
                                <option key={kb} value={kb}>{kb}</option>
                            ))}
                        </select>
                    </div>

                    {/* Методика */}
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] text-gray-500 w-14">Методика:</span>
                        <select
                            value={methodology}
                            onChange={(e) => setMethodology(e.target.value)}
                            className="flex-1 bg-[#2a2a2a] border border-[#444] rounded px-1 py-0.5 text-[9px] text-purple-400 outline-none"
                        >
                            {METHODOLOGIES.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    {/* Модель */}
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] text-gray-500 w-14">Модель:</span>
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="flex-1 bg-[#2a2a2a] border border-[#444] rounded px-1 py-0.5 text-[9px] text-green-400 outline-none"
                        >
                            {MODELS.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* RESULTS (Dynamic) */}
            {data.outputs && data.outputs.length > 0 && isComplete && (
                <div className="px-2 py-1.5 border-b border-[#333] bg-[#222]">
                    <div className="text-[9px] text-gray-500 mb-1 uppercase tracking-wider">Результаты:</div>
                    <div className="space-y-1">
                        {data.outputs.map(out => {
                            // Try to find value in data (if injected by store)
                            // In a real app, we'd pass 'values' prop separately, but here we check data[out.id]
                            const val = data[out.id];
                            if (val === undefined) return null;

                            let displayVal = String(val);
                            if (typeof val === 'number') {
                                if (out.id === 'price') displayVal = val.toLocaleString() + ' ₽';
                                else if (out.id === 'irr') displayVal = val + '%';
                                else if (out.id === 'construction') displayVal = (val / 1000000000).toFixed(1) + ' млрд ₽';
                                else displayVal = val.toLocaleString();
                            }

                            return (
                                <div key={out.id} className="flex justify-between text-[10px]">
                                    <span className="text-gray-400">{out.label}:</span>
                                    <span className="text-cyan-300 font-mono">{displayVal}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* SOCKETS */}
            <div className="px-1 py-1.5 flex justify-between">
                {/* INPUTS (Left) */}
                <div className="flex flex-col">
                    {data.inputs?.map(input => (
                        <Socket key={input.id} {...input} side="left" />
                    ))}
                </div>

                {/* OUTPUTS (Right) */}
                <div className="flex flex-col">
                    {data.outputs?.map(output => (
                        <Socket key={output.id} {...output} side="right" />
                    ))}
                </div>
            </div>
        </div>
    );
};

const nodeTypes = { blender: BlenderNode };

// --- INVESTMENT ANALYSIS WORKFLOW NODES ---
const defaultNodes: Node<BlenderNodeData>[] = [
    // INPUT
    {
        id: 'site-input',
        type: 'blender',
        position: { x: 50, y: 200 },
        data: {
            label: 'Участок',
            icon: '📍',
            headerColor: '#2d4a2d',
            status: 'COMPLETED',
            inputs: [],
            outputs: [
                { id: 'address', label: 'Адрес', type: 'string' },
                { id: 'cadastr', label: 'Кадастр', type: 'string' },
                { id: 'area', label: 'Площадь', type: 'value' },
            ]
        }
    },
    // PARALLEL ANALYSIS AGENTS
    {
        id: 'market-analyst',
        type: 'blender',
        position: { x: 280, y: 30 },
        data: {
            label: 'Аналитик рынка',
            icon: '📊',
            headerColor: '#4a2d4a',
            status: 'PENDING',
            knowledgeBase: 'ЦИАН',
            methodology: 'Анализ продаж',
            model: 'Gemini 1.5 Pro',
            inputs: [
                { id: 'address', label: 'Адрес', type: 'string' },
            ],
            outputs: [
                { id: 'price', label: 'Цена м²', type: 'value' },
                { id: 'demand', label: 'Спрос', type: 'value' },
            ]
        }
    },
    {
        id: 'tech-analyst',
        type: 'blender',
        position: { x: 280, y: 150 },
        data: {
            label: 'Аналитик ТУ',
            icon: '⚡',
            headerColor: '#2d4a4a',
            status: 'PENDING',
            knowledgeBase: 'МОЭСК',
            methodology: 'Технический анализ',
            model: 'Gemini 1.5 Pro',
            inputs: [
                { id: 'cadastr', label: 'Кадастр', type: 'string' },
            ],
            outputs: [
                { id: 'power', label: 'Мощность', type: 'value' },
                { id: 'cost', label: 'Стоимость ТУ', type: 'value' },
            ]
        }
    },
    {
        id: 'legal-analyst',
        type: 'blender',
        position: { x: 280, y: 270 },
        data: {
            label: 'Юрист ГПЗУ',
            icon: '⚖️',
            headerColor: '#4a4a2d',
            status: 'PENDING',
            knowledgeBase: 'ПЗЗ, ГПЗУ',
            methodology: 'Правовой анализ',
            model: 'Gemini 1.5 Pro',
            inputs: [
                { id: 'cadastr', label: 'Кадастр', type: 'string' },
            ],
            outputs: [
                { id: 'height', label: 'Высотность', type: 'value' },
                { id: 'density', label: 'Плотность', type: 'value' },
                { id: 'restrictions', label: 'Ограничения', type: 'string' },
            ]
        }
    },
    {
        id: 'cost-analyst',
        type: 'blender',
        position: { x: 280, y: 410 },
        data: {
            label: 'Сметчик СМР',
            icon: '👷',
            headerColor: '#4a3d2d',
            status: 'PENDING',
            knowledgeBase: 'База подрядчиков',
            methodology: 'Расчет себестоимости',
            model: 'Gemini 1.5 Pro',
            inputs: [
                { id: 'area', label: 'Площадь', type: 'value' },
            ],
            outputs: [
                { id: 'construction', label: 'Себестоимость', type: 'value' },
                { id: 'timeline', label: 'Сроки', type: 'value' },
            ]
        }
    },
    // AGGREGATOR
    {
        id: 'fin-model',
        type: 'blender',
        position: { x: 550, y: 200 },
        data: {
            label: 'Финансовая модель',
            icon: '💰',
            headerColor: '#2d2d4a',
            status: 'PENDING',
            knowledgeBase: 'Excel шаблоны',
            methodology: 'Финансовый анализ',
            model: 'Gemini 1.5 Pro',
            inputs: [
                { id: 'price', label: 'Цена м²', type: 'value' },
                { id: 'power', label: 'ТУ', type: 'value' },
                { id: 'height', label: 'Высотность', type: 'value' },
                { id: 'construction', label: 'Себестоимость', type: 'value' },
            ],
            outputs: [
                { id: 'irr', label: 'IRR %', type: 'value' },
                { id: 'npv', label: 'NPV', type: 'value' },
                { id: 'decision', label: 'Решение', type: 'boolean' },
            ]
        }
    },
    // DECISION
    {
        id: 'decision',
        type: 'blender',
        position: { x: 800, y: 200 },
        data: {
            label: 'GO / NO-GO',
            icon: '✅',
            headerColor: '#2d4a2d',
            status: 'PENDING',
            inputs: [
                { id: 'irr', label: 'IRR', type: 'value' },
                { id: 'decision', label: 'Решение', type: 'boolean' },
            ],
            outputs: [
                { id: 'tz', label: 'ТЗ', type: 'string' },
            ]
        }
    },
];

const defaultEdges: Edge[] = [
    // Site → Analysts
    { id: 'e1', source: 'site-input', sourceHandle: 'address', target: 'market-analyst', targetHandle: 'address', animated: true, style: { stroke: '#63c7c7' } },
    { id: 'e2', source: 'site-input', sourceHandle: 'cadastr', target: 'tech-analyst', targetHandle: 'cadastr', animated: true, style: { stroke: '#63c7c7' } },
    { id: 'e3', source: 'site-input', sourceHandle: 'cadastr', target: 'legal-analyst', targetHandle: 'cadastr', animated: true, style: { stroke: '#63c7c7' } },
    { id: 'e4', source: 'site-input', sourceHandle: 'area', target: 'cost-analyst', targetHandle: 'area', animated: true, style: { stroke: '#a1a1a1' } },
    // Analysts → FinModel
    { id: 'e5', source: 'market-analyst', sourceHandle: 'price', target: 'fin-model', targetHandle: 'price', style: { stroke: '#a1a1a1' } },
    { id: 'e6', source: 'tech-analyst', sourceHandle: 'power', target: 'fin-model', targetHandle: 'power', style: { stroke: '#a1a1a1' } },
    { id: 'e7', source: 'legal-analyst', sourceHandle: 'height', target: 'fin-model', targetHandle: 'height', style: { stroke: '#a1a1a1' } },
    { id: 'e8', source: 'cost-analyst', sourceHandle: 'construction', target: 'fin-model', targetHandle: 'construction', style: { stroke: '#a1a1a1' } },
    // FinModel → Decision
    { id: 'e9', source: 'fin-model', sourceHandle: 'irr', target: 'decision', targetHandle: 'irr', style: { stroke: '#a1a1a1' } },
    { id: 'e10', source: 'fin-model', sourceHandle: 'decision', target: 'decision', targetHandle: 'decision', style: { stroke: '#c763c7' } },
];

export default function NodeGraph() {
    // Get nodes from store (created by AgentZero)
    const storeNodes = useVzorStore(state => state.nodes);
    const storeEdges = useVzorStore(state => state.edges);
    const storeSetNodes = useVzorStore(state => state.setNodes);

    // Convert store nodes to Blender format
    const convertedStoreNodes = useMemo(() => {
        return storeNodes.map(node => ({
            ...node,
            type: 'blender',
            data: {
                ...node.data,
                headerColor: '#4a3d2d',
                inputs: [
                    { id: 'task', label: 'Task', type: 'string' as SocketType },
                    { id: 'context', label: 'Context', type: 'geometry' as SocketType },
                ],
                outputs: [
                    { id: 'result', label: 'Result', type: 'string' as SocketType },
                    { id: 'status', label: 'Status', type: 'boolean' as SocketType },
                ]
            }
        }));
    }, [storeNodes]);

    // Combine default + store nodes
    const combinedNodes = useMemo(() => {
        return [...defaultNodes, ...convertedStoreNodes];
    }, [convertedStoreNodes]);

    const combinedEdges = useMemo(() => {
        return [...defaultEdges, ...storeEdges];
    }, [storeEdges]);

    // Local state for drag handling
    const [nodes, setNodes, onNodesChange] = useNodesState(combinedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(combinedEdges);

    // Sync when store changes
    useEffect(() => {
        setNodes(combinedNodes);
    }, [combinedNodes, setNodes]);

    useEffect(() => {
        setEdges(combinedEdges);
    }, [combinedEdges, setEdges]);

    // Context menu state for adding nodes
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

    // Handle Shift+A keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.shiftKey && e.key === 'A') {
                e.preventDefault();
                // Open menu at center of viewport
                setContextMenu({ x: window.innerWidth / 2 - 140, y: window.innerHeight / 3 });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Handle right-click to open context menu
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
    }, []);

    // Handle adding node from menu
    const handleAddNode = useCallback((node: any) => {
        setNodes((nds) => [...nds, node]);
        // Also add to store
        storeSetNodes([...storeNodes, node]);
    }, [setNodes, storeNodes, storeSetNodes]);

    const onConnect = useCallback(
        (params: Connection) => {
            // Get source socket type for edge color
            const sourceNode = nodes.find(n => n.id === params.source);
            const nodeData = sourceNode?.data as BlenderNodeData | undefined;
            const sourceSocket = nodeData?.outputs?.find((o) => o.id === params.sourceHandle);
            const color = SOCKET_COLORS[sourceSocket?.type || 'value'] || '#888';

            setEdges((eds) => addEdge({
                ...params,
                animated: true,
                style: { stroke: color }
            }, eds));
        },
        [setEdges, nodes],
    );

    return (
        <div className="w-full h-full bg-[#0a0a0a]" onContextMenu={handleContextMenu}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                colorMode="dark"
                deleteKeyCode={['Backspace', 'Delete']}
                defaultEdgeOptions={{
                    style: { strokeWidth: 2 },
                }}
            >
                <Background color="#222" gap={20} size={1} />
                <Controls className="bg-[#1a1a1a] border border-gray-700 text-white" />
            </ReactFlow>

            {/* Add Node Context Menu */}
            {contextMenu && (
                <AddNodeMenu
                    position={contextMenu}
                    onClose={() => setContextMenu(null)}
                    onAddNode={handleAddNode}
                />
            )}
        </div>
    );
}
