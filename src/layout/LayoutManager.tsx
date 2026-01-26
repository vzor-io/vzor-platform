import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import Viewport3D from "../components/Viewport3D";
import NodeEditor from "../components/NodeEditor";
import { Copy, Layers, Settings, MessageSquare, Paperclip, Send, Upload } from "lucide-react";
import { useState } from "react";
import { useEngine } from "../context/EngineContext";

const LayoutManager = () => {
    const { loadProject, projectState } = useEngine();
    const [command, setCommand] = useState("");

    const handleUploadClick = () => {
        if (projectState === 'empty') {
            loadProject();
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
                        <NodeEditor />
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
                                placeholder={projectState === 'empty' ? "Upload data packet to initialize..." : "System Active. Waiting for command..."}
                                value={command}
                                onChange={(e) => setCommand(e.target.value)}
                            />
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
                                {projectState === 'loaded' ? (
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
        </div>
    );
};

export default LayoutManager;
