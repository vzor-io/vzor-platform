import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import PointCloudViewer from "../components/PointCloudViewer";
import NodeEditor from "../components/NodeEditor";
import { FileCode, Settings } from "lucide-react";

const LayoutManager = () => {
    return (
        <div className="w-screen h-screen bg-black text-white overflow-hidden font-sans">
            {/* Main Vertical Group: Top (3D+Inspector) vs Bottom (Nodes) */}
            <PanelGroup orientation="vertical">

                {/* Top Area */}
                <Panel defaultSize={65} minSize={30}>
                    <PanelGroup orientation="horizontal">

                        {/* 3D Viewport */}
                        <Panel defaultSize={75} minSize={30} className="relative border-r border-white/10">
                            <div className="absolute top-4 left-4 z-10 text-xs font-bold tracking-widest opacity-50 uppercase pointer-events-none">
                                3D Viewport
                            </div>
                            <PointCloudViewer />
                        </Panel>

                        <PanelResizeHandle className="w-1 bg-[#1a1a1a] hover:bg-blue-500 transition-colors" />

                        {/* Inspector / Parameters */}
                        <Panel defaultSize={25} minSize={15} className="bg-[#0f0f0f]">
                            <div className="h-8 border-b border-white/10 flex items-center px-4 bg-[#141414]">
                                <Settings className="w-3 h-3 mr-2 opacity-50" />
                                <span className="text-xs uppercase tracking-wider font-medium opacity-70">Properties</span>
                            </div>
                            <div className="p-4">
                                <div className="text-xs text-white/30 italic text-center mt-10">
                                    Select a node to view properties
                                </div>
                            </div>
                        </Panel>

                    </PanelGroup>
                </Panel>

                <PanelResizeHandle className="h-1 bg-[#1a1a1a] hover:bg-blue-500 transition-colors" />

                {/* Bottom Area: Node Editor */}
                <Panel defaultSize={35} minSize={10} className="bg-[#0a0a0a] relative">
                    <div className="absolute top-0 left-0 w-full h-8 z-10 border-b border-white/5 flex items-center px-4 bg-[#0a0a0a]/80 backdrop-blur-sm pointer-events-none">
                        <FileCode className="w-3 h-3 mr-2 opacity-50" />
                        <span className="text-xs uppercase tracking-wider font-medium opacity-70">Node Editor</span>
                    </div>
                    {/* Retrieve NodeEditor - Passing simplistic props if needed or context provider wrapper */}
                    <div className="w-full h-full pt-8">
                        <NodeEditor />
                    </div>
                </Panel>

            </PanelGroup>
        </div>
    );
};

export default LayoutManager;
