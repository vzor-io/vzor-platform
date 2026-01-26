
import React, { useCallback } from 'react';
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

// --- CUSTOM NODE: VZOR BLOCK ---
const VzorNode = ({ data }: { data: { label: string, status?: string } }) => {
    return (
        <div className={`
            px-4 py-2 rounded-md border backdrop-blur-md min-w-[150px]
            ${data.status === 'ACTIVE'
                ? 'bg-[#00f2ff]/10 border-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.3)]'
                : 'bg-[#1a1a1a]/80 border-gray-700 hover:border-gray-500'
            }
        `}>
            {/* INPUT HANDLE */}
            <Handle type="target" position={Position.Left} className="!bg-gray-400 !w-2 !h-2" />

            <div className="text-[10px] text-gray-500 font-mono mb-1 uppercase tracking-widest">
                {data.status || 'PENDING'}
            </div>
            <div className={`font-bold text-sm ${data.status === 'ACTIVE' ? 'text-white' : 'text-gray-300'}`}>
                {data.label}
            </div>

            {/* OUTPUT HANDLE */}
            <Handle type="source" position={Position.Right} className="!bg-[#00f2ff] !w-2 !h-2" />
        </div>
    );
};

const nodeTypes = { vzor: VzorNode };

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'vzor',
        position: { x: 100, y: 100 },
        data: { label: 'INVESTOR INPUT', status: 'DONE' }
    },
    {
        id: '2',
        type: 'vzor',
        position: { x: 400, y: 100 },
        data: { label: 'INVEST ANALYSIS', status: 'ACTIVE' }
    },
    {
        id: '3',
        type: 'vzor',
        position: { x: 700, y: 50 },
        data: { label: 'DESIGN (Project)', status: 'PENDING' }
    },
    {
        id: '4',
        type: 'vzor',
        position: { x: 700, y: 150 },
        data: { label: 'CONSTRUCTION', status: 'PENDING' }
    },
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#00f2ff' } },
    { id: 'e2-3', source: '2', target: '3', animated: false, style: { stroke: '#333' } },
    { id: 'e2-4', source: '2', target: '4', animated: false, style: { stroke: '#333' } },
];

export default function NodeGraph() {
    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#00f2ff' } }, eds)),
        [setEdges],
    );

    return (
        <div className="w-full h-full bg-[#050505]">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                colorMode="dark"
            >
                <Background color="#222" gap={20} size={1} />
                <Controls className="bg-[#1a1a1a] border border-gray-700 text-white" />
            </ReactFlow>
        </div>
    );
}
