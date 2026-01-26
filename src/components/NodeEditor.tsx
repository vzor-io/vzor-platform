import { useCallback, useEffect } from 'react';
import { ReactFlow, Background, Controls, MiniMap, addEdge, useEdgesState, useNodesState, Handle, Position } from '@xyflow/react';
import type { Connection, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEngine } from '../context/EngineContext';

// --- SOCKET COMPONENTS ---
const SOCKET_COLORS = {
    GEOMETRY: '#63c763',
    VALUE: '#a1a1a1',
    BOOLEAN: '#cc6699',
    STRING: '#66ccff'
};

const Socket = ({ type, id, isSource, label }: { type: keyof typeof SOCKET_COLORS, id: string, isSource: boolean, label?: string }) => {
    const color = SOCKET_COLORS[type];
    const position = isSource ? Position.Right : Position.Left;
    return (
        <div className={`flex items-center gap-2 ${isSource ? 'justify-end' : 'justify-start'} my-1 relative h-5`}>
            {!isSource && <span className="text-[10px] text-gray-300 font-sans">{label}</span>}
            <Handle
                type={isSource ? "source" : "target"}
                position={position}
                id={id}
                style={{ background: color, width: 9, height: 9, borderRadius: '50%', border: '1px solid #222' }}
            />
            {isSource && <span className="text-[10px] text-gray-300 font-sans">{label}</span>}
        </div>
    );
};

// --- CUSTOM NODE TYPES ---

// 1. SITE NODE (Starts "Empty" visually, fills on Load)
const SiteNode = ({ data }: { data: { label: string } }) => {
    const { simulationData } = useEngine();
    const hasData = simulationData.area > 0;

    return (
        <div className="bg-[#1f1f1f] border border-gray-700 rounded-md shadow-2xl w-[220px] overflow-hidden">
            <div className="bg-[#2d2d2d] px-3 py-1 border-b border-gray-700 flex justify-between">
                <span className="text-[10px] font-bold text-gray-200 uppercase tracking-wider">{data.label}</span>
                {hasData && <span className="text-[10px] text-green-500">● LIVE</span>}
            </div>
            <div className="p-3 flex flex-col gap-2">
                {/* Inputs (Mocked as disabled fields that fill up) */}
                <div className="flex justify-between items-center bg-black/20 p-1 rounded">
                    <span className="text-[10px] text-gray-500">CAD NO.</span>
                    <span className="text-[10px] font-mono text-blue-300">{hasData ? "77:01:0004042:12" : "---"}</span>
                </div>
                <div className="flex justify-between items-center bg-black/20 p-1 rounded">
                    <span className="text-[10px] text-gray-500">AREA (m²)</span>
                    <span className="text-[10px] font-mono text-yellow-300">{hasData ? simulationData.area.toLocaleString() : "---"}</span>
                </div>

                <div className="h-px bg-gray-700 my-1" />

                <Socket type="GEOMETRY" id="geo" isSource={true} label="Geometry" />
                <Socket type="VALUE" id="area" isSource={true} label="Area" />
            </div>
        </div>
    );
};

// 2. GENERATOR NODE
const GeneratorNode = ({ data }: { data: { label: string } }) => {
    const { simulationData } = useEngine();
    return (
        <div className="bg-[#1f1f1f] border border-blue-900 rounded-md shadow-2xl w-[200px] overflow-hidden">
            <div className="bg-[#1e293b] px-3 py-1 border-b border-blue-900">
                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">{data.label}</span>
            </div>
            <div className="p-2">
                <Socket type="GEOMETRY" id="in_geo" isSource={false} label="Site Geo" />
                <Socket type="VALUE" id="in_params" isSource={false} label="Params" />

                <div className="my-2 bg-black/40 p-2 text-center rounded">
                    <div className="text-[9px] text-gray-500 uppercase">Generated Volume</div>
                    <div className="text-sm font-bold text-white">{simulationData.volume > 0 ? (simulationData.volume / 1000).toFixed(1) + 'k' : '0'} m³</div>
                </div>

                <Socket type="GEOMETRY" id="out_vol" isSource={true} label="Massing" />
            </div>
        </div>
    );
};

const nodeTypes = {
    site: SiteNode,
    gen: GeneratorNode
};

export default function NodeEditor() {
    const { projectState } = useEngine();

    // START EMPTY
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    // DYNAMIC INJECTION
    useEffect(() => {
        if (projectState === 'loaded') {
            const newNodes: Node[] = [
                { id: 'site-01', type: 'site', position: { x: 100, y: 100 }, data: { label: 'Site_01' } },
                { id: 'gen-01', type: 'gen', position: { x: 450, y: 100 }, data: { label: 'Massing Gen' } },
            ];
            const newEdges: Edge[] = [
                { id: 'e1', source: 'site-01', sourceHandle: 'geo', target: 'gen-01', targetHandle: 'in_geo', animated: true, style: { stroke: '#63c763' } }
            ];
            setNodes(newNodes);
            setEdges(newEdges);
        }
    }, [projectState, setNodes, setEdges]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    return (
        <div className="w-full h-full bg-[#0a0a0a]">
            {projectState === 'empty' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <span className="text-gray-700 text-xs font-mono uppercase tracking-widest">Awaiting Data...</span>
                </div>
            )}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
            >
                <Background color="#151515" gap={20} size={1} />
                <Controls className="bg-white/5 border-white/10 text-white" />
                <MiniMap style={{ background: '#0a0a0a' }} nodeColor="#333" />
            </ReactFlow>
        </div>
    );
}
