import React, { useCallback, useState } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    type Connection,
    type Edge,
    type Node,
    Handle,
    Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play } from 'lucide-react';
import { ExportNode } from './ExportNode';
import { SocketType } from '../types/graph';

// --- CONSTANTS ---
const COLORS = {
    [SocketType.GEOMETRY]: '#ef4444',   // RED
    [SocketType.DATA]: '#3b82f6',       // BLUE
    [SocketType.FLOW]: '#ffffff'        // WHITE
};

// --- Custom Agent Node Component (Dynamic) ---
const AgentNode = ({ data }: { data: { label: string, role: string, instruction?: string, inputs?: { name: string, type: SocketType }[], outputs?: { name: string, type: SocketType }[] } }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleRun = async () => {
        setIsRunning(true);
        setResult(null);
        // Mock execution
        setTimeout(() => {
            setIsRunning(false);
            setResult("Success");
        }, 1000);
    };

    return (
        <div className="bg-[#2c2c2c] border border-gray-600 rounded-lg shadow-xl min-w-[280px] text-xs flex flex-col">
            {/* Header */}
            <div className="bg-[#303030] px-3 py-2 rounded-t-lg border-b border-gray-600 flex justify-between items-center handle">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🤖</span>
                    <span className="font-bold text-gray-200">{data.label}</span>
                </div>
                <button
                    onClick={handleRun}
                    className={`p-1 rounded hover:bg-white/20 transition-colors ${isRunning ? 'animate-pulse text-yellow-500' : 'text-green-500'}`}
                >
                    <Play size={14} fill="currentColor" />
                </button>
            </div>

            {/* Body */}
            <div className="p-3 space-y-4">
                {/* Inputs */}
                <div className="flex flex-col gap-2">
                    {data.inputs?.map((input, i) => (
                        <div key={i} className="relative flex items-center h-5">
                            <Handle
                                type="target"
                                position={Position.Left}
                                id={`in-${input.name}`}
                                style={{ background: COLORS[input.type] || '#888', width: 8, height: 8 }}
                            />
                            <span className="ml-3 text-gray-400 capitalize">{input.name}</span>
                        </div>
                    ))}
                </div>

                {/* Outputs */}
                <div className="flex flex-col gap-2 items-end">
                    {data.outputs?.map((output, i) => (
                        <div key={i} className="relative flex items-center h-5">
                            <span className="mr-3 text-gray-400 capitalize">{output.name}</span>
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={`out-${output.name}`}
                                style={{ background: COLORS[output.type] || '#888', width: 8, height: 8 }}
                            />
                        </div>
                    ))}
                </div>

                {/* Role Badge */}
                <div className="border-t border-gray-700 pt-2 flex justify-between items-center text-[10px] text-gray-500">
                    <span>{data.role}</span>
                    <span className="bg-[#444] px-1 rounded text-gray-300 font-mono">ID: {Math.random().toString(36).substr(2, 4)}</span>
                </div>
            </div>
        </div>
    );
};

const nodeTypes = {
    agent: AgentNode,
    export_geometry: ExportNode,
    export_data: ExportNode
};

// --- Initial Data (Mocking JSON from Backend) ---
// In real app, this comes from AgentOrchestrator.generate_graph_from_prompt()
const initialNodes: Node[] = [
    {
        id: '1',
        type: 'agent',
        position: { x: 100, y: 100 },
        data: {
            label: 'Investor Input',
            role: 'User',
            inputs: [],
            outputs: [
                { name: 'Data', type: SocketType.DATA },
                { name: 'Next', type: SocketType.FLOW }
            ]
        }
    },
    {
        id: '2',
        type: 'agent',
        position: { x: 450, y: 100 },
        data: {
            label: 'ROI Analysis',
            role: 'Analyst',
            inputs: [
                { name: 'In', type: SocketType.DATA },
                { name: 'Trigger', type: SocketType.FLOW }
            ],
            outputs: [
                { name: 'Report', type: SocketType.DATA },
                { name: 'Next', type: SocketType.FLOW }
            ]
        }
    },
    {
        id: '3',
        type: 'export_data', // Mapped to ExportNode
        position: { x: 800, y: 100 },
        data: {
            label: 'Save Report',
            exportType: 'DATA',
            format: 'PDF'
        }
    }
];

const initialEdges: Edge[] = [
    { id: 'e1-2-flow', source: '1', sourceHandle: 'out-Next', target: '2', targetHandle: 'in-Trigger', animated: true, style: { stroke: COLORS.WHITE } },
    { id: 'e1-2-data', source: '1', sourceHandle: 'out-Data', target: '2', targetHandle: 'in-In', animated: false, style: { stroke: COLORS.DATA } },
];

export default function NodeEditor() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Connection) => {
            // STRICT CONNECTION LOGIC
            // We need to know the socket type of source and target.
            // Since Handle ID contains info or we check node data?
            // Actually, ReactFlow handle styles are purely visual unless we extract data.
            // A simple way is to check if the handle ID or visual style matches, strictly speaking we should query the node data.
            // BUT: For now we can assume the user sees the colors.
            // Let's implement a basic check if possible, or just allow all connections for prototype but color them.

            // For now, simple standard connection
            // Ideally we'd look up nodes and check inputs/outputs types.

            setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#444' } }, eds));
        },
        [setEdges],
    );

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                colorMode="dark"
                className="bg-[#181818]"
                snapToGrid={true}
                snapGrid={[20, 20]}
            >
                <Controls className="bg-[#1a1a1a] border border-gray-700 text-white" />
                <MiniMap
                    nodeStrokeColor={(n) => {
                        if (n.type === 'agent') return '#00f2ff';
                        if (n.type === 'export_geometry') return COLORS.RED;
                        return '#eee';
                    }}
                    nodeColor="#2c2c2c"
                    maskColor="#181818d0"
                />
                <Background gap={20} color="#333" />
            </ReactFlow>
        </div>
    );
}
