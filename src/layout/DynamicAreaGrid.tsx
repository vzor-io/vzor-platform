import React, { Suspense, useCallback, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAreaStore, isAreaSplit, type AreaNode, type Area, type AreaSplit, type EditorType } from '../store/AreaStore';
import { EDITORS, getEditor, getEditorList } from '../engine/EditorRegistry';

// --- AREA HEADER ---
interface AreaHeaderProps {
    area: Area;
    onSplit: (direction: 'horizontal' | 'vertical') => void;
}

const AreaHeader = ({ area, onSplit }: AreaHeaderProps) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const setEditorType = useAreaStore(state => state.setEditorType);
    const editor = getEditor(area.editorType);
    const Icon = editor.icon;

    return (
        <div className="h-6 bg-[#3d3d3d] border-b border-[#1a1a1a] flex items-center px-2 select-none">
            {/* Editor Type Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-1 text-[10px] text-gray-300 hover:text-white px-1 py-0.5 rounded hover:bg-[#4a4a4a]"
                >
                    <Icon className="w-3 h-3" />
                    <span className="uppercase tracking-wider font-medium">{editor.label}</span>
                    <ChevronDown className="w-3 h-3" />
                </button>

                {showDropdown && (
                    <div
                        className="absolute top-full left-0 mt-1 bg-[#2d2d2d] border border-[#1a1a1a] rounded shadow-xl py-1 z-50 min-w-[150px]"
                        onMouseLeave={() => setShowDropdown(false)}
                    >
                        {getEditorList().map(ed => {
                            const EdIcon = ed.icon;
                            return (
                                <button
                                    key={ed.type}
                                    onClick={() => {
                                        setEditorType(area.id, ed.type);
                                        setShowDropdown(false);
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-1 text-[10px] ${area.editorType === ed.type ? 'bg-[#4a6fa5] text-white' : 'text-gray-300 hover:bg-[#3a3a3a]'
                                        }`}
                                >
                                    <EdIcon className="w-3 h-3" />
                                    {ed.label}
                                </button>
                            );
                        })}

                        <div className="h-px bg-[#1a1a1a] my-1" />

                        <button
                            onClick={() => { onSplit('horizontal'); setShowDropdown(false); }}
                            className="w-full flex items-center gap-2 px-3 py-1 text-[10px] text-gray-300 hover:bg-[#3a3a3a]"
                        >
                            ↔ Split Horizontal
                        </button>
                        <button
                            onClick={() => { onSplit('vertical'); setShowDropdown(false); }}
                            className="w-full flex items-center gap-2 px-3 py-1 text-[10px] text-gray-300 hover:bg-[#3a3a3a]"
                        >
                            ↕ Split Vertical
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1" />
        </div>
    );
};

// --- SINGLE AREA ---
interface AreaViewProps {
    area: Area;
}

const AreaView = ({ area }: AreaViewProps) => {
    const splitArea = useAreaStore(state => state.splitArea);
    const editor = getEditor(area.editorType);
    const EditorComponent = editor.component;

    const handleSplit = (direction: 'horizontal' | 'vertical') => {
        splitArea(area.id, direction);
    };

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e]">
            <AreaHeader area={area} onSplit={handleSplit} />
            <div className="flex-1 relative overflow-hidden">
                <Suspense fallback={
                    <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                        Loading...
                    </div>
                }>
                    <EditorComponent />
                </Suspense>
            </div>
        </div>
    );
};

// --- SPLIT VIEW ---
interface SplitViewProps {
    split: AreaSplit;
}

const SplitView = ({ split }: SplitViewProps) => {
    const setSplitRatio = useAreaStore(state => state.setSplitRatio);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        let ratio: number;

        if (split.direction === 'horizontal') {
            ratio = (e.clientX - rect.left) / rect.width;
        } else {
            ratio = (e.clientY - rect.top) / rect.height;
        }

        setSplitRatio(split.id, ratio);
    }, [isDragging, split.id, split.direction, setSplitRatio]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    React.useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const isHorizontal = split.direction === 'horizontal';
    const firstSize = `${split.ratio * 100}%`;
    const secondSize = `${(1 - split.ratio) * 100}%`;

    return (
        <div
            ref={containerRef}
            className={`h-full w-full flex ${isHorizontal ? 'flex-row' : 'flex-col'}`}
        >
            {/* First child */}
            <div style={{ [isHorizontal ? 'width' : 'height']: firstSize }} className="overflow-hidden">
                <AreaNodeView node={split.first} />
            </div>

            {/* Splitter */}
            <div
                onMouseDown={handleMouseDown}
                className={`
                    ${isHorizontal ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'}
                    bg-[#1a1a1a] hover:bg-cyan-500 transition-colors
                    ${isDragging ? 'bg-cyan-500' : ''}
                `}
            />

            {/* Second child */}
            <div style={{ [isHorizontal ? 'width' : 'height']: secondSize }} className="overflow-hidden">
                <AreaNodeView node={split.second} />
            </div>
        </div>
    );
};

// --- RECURSIVE NODE VIEW ---
interface AreaNodeViewProps {
    node: AreaNode;
}

const AreaNodeView = ({ node }: AreaNodeViewProps) => {
    if (isAreaSplit(node)) {
        return <SplitView split={node} />;
    }
    return <AreaView area={node} />;
};

// --- MAIN GRID ---
const DynamicAreaGrid = () => {
    const root = useAreaStore(state => state.root);

    return (
        <div className="w-full h-full overflow-hidden">
            <AreaNodeView node={root} />
        </div>
    );
};

export default DynamicAreaGrid;
