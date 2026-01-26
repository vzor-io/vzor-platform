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
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    Handle,
    Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play } from 'lucide-react';

// --- API Service ---
const executeAgent = async (role: string, instruction: string, input: string) => {
    try {
        const response = await fetch('http://localhost:8000/execute_agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role, instruction, input_text: input })
        });
        return await response.json();
    } catch (e) {
        console.error(e);
        return { status: "error", output: "Failed to connect to Agent Brain" };
    }
};

// --- Custom Agent Node Component ---
const AgentNode = ({ data }: { data: { label: string, role: string, instruction?: string } }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleRun = async () => {
        setIsRunning(true);
        setResult(null);
        // Mock input for now (later reads from connected nodes)
        const res = await executeAgent(data.role, data.instruction || "Do analysis", "Sample Data");
        setIsRunning(false);
        setResult(res.output);
    };

    return (
        <div className="bg-[#2c2c2c] border border-gray-600 rounded-lg shadow-xl w-72 text-xs flex flex-col">
            {/* Header */}
            <div className="bg-[#303030] px-3 py-2 rounded-t-lg border-b border-gray-600 flex justify-between items-center handle">
                <span className="font-bold text-blender-text">🤖 {data.label}</span>
                <button
                    onClick={handleRun}
                    className={`p-1 rounded hover:bg-white/20 transition-colors ${isRunning ? 'animate-pulse text-yellow-500' : 'text-green-500'}`}
                >
                    <Play size={14} fill="currentColor" />
                </button>
            </div>

            {/* Body */}
            <div className="p-3 space-y-3">
                {/* Sockets */}
                <div className="flex justify-between items-center">
                    <div className="relative flex items-center">
                        <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-blue-500" />
                        <span className="ml-3 text-gray-400">In</span>
                    </div>
                    <div className="relative flex items-center">
                        <span className="mr-3 text-gray-400">Out</span>
                        <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-orange-500" />
                    </div>
                </div>

                {/* Status / Output Preview */}
                <div className="bg-[#151515] rounded p-2 min-h-[40px] max-h-[100px] overflow-y-auto font-mono text-gray-400 border border-[#444]">
                    {isRunning ? "Checking Neural Networks..." : result || "Waiting for signal..."}
                </div>

                {/* Role Badge */}
                <div className="flex justify-end">
                    <span className="text-[10px] bg-[#444] px-1 rounded text-blender-accent">{data.role}</span>
                </div>
            </div>
        </div>
    );
};

const nodeTypes = {
    agent: AgentNode,
};

// --- Initial Data ---
const initialNodes = [
    {
        id: '1',
        type: 'agent',
        position: { x: 100, y: 100 },
        data: { label: 'Invest Agent', role: 'Analyst', instruction: 'Analyze ROI for 2ha plot' }
    },
    {
        id: '2',
        type: 'agent',
        position: { x: 500, y: 200 },
        data: { label: 'Architect Agent', role: 'Designer', instruction: 'Generate massing models' }
    },
];
const initialEdges = [{ id: 'e1-2', source: '1', target: '2', animated: true }];

// --- Main Editor Component ---
export default function NodeEditor() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
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
            >
                <Controls />
                <MiniMap nodeStrokeColor="#e77e22" nodeColor="#2c2c2c" maskColor="#181818d0" />
                <Background gap={20} color="#333" />
            </ReactFlow>
        </div>
    );
}
