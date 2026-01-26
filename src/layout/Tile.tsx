
import React from 'react';
import { LayoutNode, LayoutContextType, WindowType } from './types';
import NodeEditor from '../components/NodeEditor';
import { Viewport3D, Properties, Outliner } from '../components/MockEditors';

// Registry of Window Components
const WindowRegistry: Record<string, React.FC> = {
    'VIEWPORT': Viewport3D,
    'NODES': NodeEditor,
    'PROPERTIES': Properties,
    'OUTLINER': Outliner,
    'TEXT': () => <div className="p-4 text-gray-400 font-mono">Text Editor (Not Implemented)</div>,
    'TERMINAL': () => <div className="p-4 text-gray-400 font-mono">Terminal (Not Implemented)</div>,
};

const Tile = ({ node, context }: { node: LayoutNode, context: LayoutContextType }) => {
    const Component = node.windowType ? WindowRegistry[node.windowType] : () => <div>Unknown</div>;

    return (
        <div className="h-full w-full flex flex-col bg-blender-panel border border-blender-border rounded-sm overflow-hidden">
            {/* Header */}
            <div className="h-6 bg-blender-header flex items-center px-2 justify-between border-b border-blender-border text-xs select-none">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-blender-text opacity-70 cursor-pointer hover:opacity-100">
                        {node.windowType || 'EMPTY'} ⏷
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {/* Mock Actions */}
                    <button
                        className="hover:text-white text-gray-400"
                        onClick={() => context.splitWindow(node.id, 'vertical')}
                        title="Split Vertical"
                    >
                        [|]
                    </button>
                    <button
                        className="hover:text-white text-gray-400"
                        onClick={() => context.splitWindow(node.id, 'horizontal')}
                        title="Split Horizontal"
                    >
                        [-]
                    </button>
                    <button
                        className="hover:text-red-500 text-gray-400"
                        onClick={() => context.closeWindow(node.id)}
                        title="Close"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 relative">
                <Component />
            </div>
        </div>
    );
};

export default Tile;
