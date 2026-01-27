import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import Viewport3D from "../components/Viewport3D";
import NodeGraph from "../components/NodeGraph";
import { Settings, Upload, Send } from "lucide-react";
import { useState } from "react";
import { useEngine } from "../context/EngineContext";
import { AgentInspector } from "../components/AgentInspector";
import { useVzorStore } from "../store/store";
import { agentZero } from "../services/AgentZero";
import type { Node } from "@xyflow/react";
import type { VzorNodeData, ViewportPoint } from "../store/store";

const generateId = () => Math.random().toString(36).substr(2, 9);

const LayoutManager = () => {
    const { loadProject, projectState } = useEngine();
    const [command, setCommand] = useState("");

    // Get selected agent for inspector
    const selectedAgentId = useVzorStore(state => state.selectedAgentId);
    const subAgents = useVzorStore(state => state.subAgents);
    const selectAgent = useVzorStore(state => state.selectAgent);
    const addSubAgent = useVzorStore(state => state.addSubAgent);
    const addPoint = useVzorStore(state => state.addPoint);
    const setNodes = useVzorStore(state => state.setNodes);
    const nodes = useVzorStore(state => state.nodes);

    const selectedAgent = subAgents.find(a => a.id === selectedAgentId) || null;

    const handleUploadClick = () => {
        if (projectState === 'empty') {
            loadProject();
        }
    };

    // Handle chat input - create task and agents
    const handleSubmit = async () => {
        if (!command.trim()) return;

        // 1. Parse prompt via Agent Zero
        const { rootTask, requiredAgents } = await agentZero.parsePrompt(command);

        // 2. Create subagents and corresponding points/nodes
        const newNodes: Node<VzorNodeData>[] = [...nodes];

        requiredAgents.forEach((roleKey, index) => {
            const subAgent = agentZero.createSubAgent(roleKey, command);

            // Add to store
            addSubAgent(subAgent);

            // Create synchronized point
            const point: ViewportPoint = {
                id: subAgent.id,
                position: [
                    (Math.random() - 0.5) * 200,
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 200
                ],
                color: '#00f2ff',
                size: 2.0,
                agentId: subAgent.id
            };
            addPoint(point);

            // Create synchronized node
            const node: Node<VzorNodeData> = {
                id: subAgent.id,
                type: 'vzor',
                position: { x: 100 + index * 300, y: 100 },
                data: {
                    label: subAgent.role,
                    status: 'PENDING',
                    agentId: subAgent.id
                }
            };
            newNodes.push(node);

            // Simulate execution after a delay
            setTimeout(() => {
                agentZero.simulateExecution(subAgent.id);
            }, 1000 + index * 500);
        });

        setNodes(newNodes);
        setCommand("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="w-screen h-screen bg-[#050505] text-white overflow-hidden font-sans flex relative">

            {/* MAIN HORIZONTAL SPLIT: NODES (Left) vs 3D/PROPS (Right) */}
            <PanelGroup orientation="horizontal">

                {/* LEFT: NODE EDITOR */}
                <Panel defaultSize={55} minSize={30} className="relative bg-[#0a0a0a] border-r border-white/5">
                    <div className="h-8 flex items-center px-4 bg-[#0a0a0a] border-b border-white/5 select-none text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        Node Graph Engine
                    </div>
                    <div className="relative w-full h-[calc(100%-2rem)]">
                        <NodeGraph />
                    </div>

                    {/* CHAT OVERLAY (Bottom of Nodes) */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[500px] max-w-[90%] z-50">
                        <div className="bg-[#151515]/90 border border-white/10 rounded-xl shadow-2xl flex items-center p-2 gap-2 backdrop-blur-md">
                            <button
                                onClick={handleUploadClick}
                                disabled={projectState !== 'empty'}
                                className={`p-2 rounded-lg transition-all ${projectState === 'empty' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-transparent text-green-500 cursor-default'}`}
                                title="Upload Document"
                            >
                                {projectState === 'loading' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                            </button>

                            <input
                                type="text"
                                className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-gray-600 font-mono"
                                placeholder={projectState === 'empty' ? "Введите задачу... (например: Проанализируй участок)" : "System Active. Введите команду..."}
                                value={command}
                                onChange={(e) => setCommand(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />

                            <button
                                onClick={handleSubmit}
                                disabled={!command.trim()}
                                className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 transition-all disabled:opacity-30"
                                title="Send"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </Panel>

                <PanelResizeHandle className="w-1 bg-[#1a1a1a] hover:bg-blue-500 cursor-col-resize transition-colors" />

                {/* RIGHT: RENDER VIEW (Top) + PROPERTIES (Bottom) */}
                <Panel defaultSize={45} minSize={30}>
                    <PanelGroup orientation="vertical">

                        {/* TOP: 3D VIEWPORT (RENDER VIEW) */}
                        <Panel defaultSize={70} minSize={30} className="relative bg-black">
                            <div className="absolute top-0 left-0 w-full h-8 flex items-center px-4 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none text-[10px] font-bold text-white/50 uppercase tracking-widest">
                                Render Preview
                            </div>
                            <Viewport3D />
                        </Panel>

                        <PanelResizeHandle className="h-1 bg-[#1a1a1a] hover:bg-blue-500 cursor-row-resize transition-colors" />

                        {/* BOTTOM: PROPERTIES */}
                        <Panel defaultSize={30} minSize={20} className="bg-[#0f0f0f] border-t border-white/10 flex flex-col">
                            <div className="h-8 border-b border-white/10 flex items-center px-4 bg-[#141414]">
                                <Settings className="w-3 h-3 mr-2 opacity-50" />
                                <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">Properties</span>
                            </div>
                            <div className="flex-1 p-4 overflow-auto">
                                {selectedAgent ? (
                                    <div className="space-y-4 font-mono">
                                        <div className="text-[10px] text-cyan-400 font-bold uppercase mb-2">🤖 {selectedAgent.role}</div>
                                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10px] text-gray-400">
                                            <div>Model:</div><div className="text-right text-white">{selectedAgent.model}</div>
                                            <div>Status:</div><div className="text-right text-cyan-400">{selectedAgent.status}</div>
                                            <div>Progress:</div><div className="text-right text-white">{selectedAgent.progress}%</div>
                                        </div>
                                    </div>
                                ) : projectState === 'loaded' ? (
                                    <div className="space-y-4 font-mono">
                                        <div className="text-[10px] text-blue-400 font-bold uppercase mb-2">Active Object: SITE_01</div>
                                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10px] text-gray-400">
                                            <div>ID:</div><div className="text-right text-white">#8821-X</div>
                                            <div>Area:</div><div className="text-right text-white">2.35 ha</div>
                                            <div>Density:</div><div className="text-right text-white">1.5</div>
                                            <div>Limit:</div><div className="text-right text-red-400">75m</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-[10px] text-gray-700 uppercase tracking-widest">
                                        No Selection
                                    </div>
                                )}
                            </div>
                        </Panel>

                    </PanelGroup>
                </Panel>

            </PanelGroup>

            {/* AGENT INSPECTOR (Right overlay when agent selected) */}
            <AgentInspector
                agent={selectedAgent}
                onClose={() => selectAgent(null)}
            />
        </div>
    );
};

export default LayoutManager;

