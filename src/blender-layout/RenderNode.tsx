
import React from 'react';
import { LayoutNode } from './types';
import { useLayout } from './index';
import { EDITOR_REGISTRY, EDITOR_ICONS } from './registry';

const WindowLeaf = ({ node }: { node: LayoutNode }) => {
    const { splitWindow, closeWindow, setWindowType } = useLayout();
    const Editor = node.windowType ? EDITOR_REGISTRY[node.windowType] : () => <div>ERR</div>;
    const Icon = node.windowType ? EDITOR_ICONS[node.windowType] : '?';

    return (
        <div className="flex flex-col h-full w-full bg-[#1d1d1d] border border-black relative group">
            {/* Header */}
            <div className="h-6 flex items-center bg-[#2d2d2d] px-2 select-none justify-between border-b border-[#111]">

                {/* Editor Type Selector */}
                <div className="flex items-center gap-2 cursor-pointer hover:text-white text-gray-400">
                    <span>{Icon}</span>
                    <select
                        className="bg-transparent border-none outline-none text-xs font-bold appearance-none cursor-pointer"
                        value={node.windowType}
                        onChange={(e) => setWindowType(node.id, e.target.value as any)}
                    >
                        {Object.keys(EDITOR_REGISTRY).map(k => (
                            <option key={k} value={k}>{k}</option>
                        ))}
                    </select>
                </div>

                {/* Action Buttons (Mocking Blender's corner interactions via explicit buttons for now) */}
                <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button
                        className="hover:bg-blue-600 rounded px-1 text-[10px] text-white"
                        onClick={() => splitWindow(node.id, 'horizontal')}
                        title="Split Horizontally"
                    >
                        │ Split
                    </button>
                    <button
                        className="hover:bg-blue-600 rounded px-1 text-[10px] text-white"
                        onClick={() => splitWindow(node.id, 'vertical')}
                        title="Split Vertically"
                    >
                        ─ Split
                    </button>
                    <button
                        className="hover:bg-red-600 rounded px-1 text-[10px] text-white"
                        onClick={() => closeWindow(node.id)}
                        title="Close Area"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
                <Editor />
            </div>

            {/* Decorative Corner for "Drag" hint */}
            <div className="absolute top-0 left-0 w-2 h-2 rounded-br bg-white/10 cursor-crosshair"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 rounded-tl bg-white/10 cursor-crosshair"></div>
        </div>
    );
};

export const RenderNode = ({ node }: { node: LayoutNode }) => {
    if (node.type === 'leaf') {
        return <WindowLeaf node={node} />;
    }

    // Row or Column
    const isRow = node.type === 'row';

    return (
        <div className={`flex w-full h-full ${isRow ? 'flex-row' : 'flex-col'}`}>
            {node.children?.map((child, i) => (
                <React.Fragment key={child.id}>
                    {/* Child Container */}
                    <div style={{ flex: `${child.size} 1 0%`, overflow: 'hidden', position: 'relative' }}>
                        <RenderNode node={child} />
                    </div>

                    {/* Resizer Gutter (Not interactive yet, clearly visual) */}
                    {i < (node.children?.length || 0) - 1 && (
                        <div className={`bg-[#111] hover:bg-[#e77e22] transition-colors z-10 flex-shrink-0
                        ${isRow ? 'w-[2px] cursor-col-resize' : 'h-[2px] cursor-row-resize'}
                    `} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
