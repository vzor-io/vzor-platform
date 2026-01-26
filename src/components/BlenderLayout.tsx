import React, { useRef, useState } from 'react';
import NodeEditor from './NodeEditor';

// --- MOCK COMPONENTS ---
const Viewport3D = () => <div className="h-full w-full bg-[#303030] flex items-center justify-center text-gray-500">3D Viewport</div>;
const Properties = () => <div className="h-full w-full bg-[#2c2c2c] flex items-center justify-center text-gray-500">Properties</div>;
const Outliner = () => <div className="h-full w-full bg-[#2c2c2c] flex items-center justify-center text-gray-500">Outliner</div>;

// --- CUSTOM RESIZABLE PANE ---
// This avoids complex libraries like rc-dock or react-resizable-panels causing blank screens.
const SplitPane = ({
    direction = 'horizontal',
    initialSize = 50,
    minSize = 10,
    children
}: {
    direction?: 'horizontal' | 'vertical',
    initialSize?: number, // Percentage
    minSize?: number,
    children: [React.ReactNode, React.ReactNode]
}) => {
    const [size, setSize] = useState(initialSize);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        e.preventDefault();
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        let newSize;
        if (direction === 'horizontal') {
            newSize = ((e.clientX - rect.left) / rect.width) * 100;
        } else {
            newSize = ((e.clientY - rect.top) / rect.height) * 100;
        }

        if (newSize < minSize) newSize = minSize;
        if (newSize > 100 - minSize) newSize = 100 - minSize;
        setSize(newSize);
    };

    return (
        <div ref={containerRef} className={`flex h-full w-full ${direction === 'horizontal' ? 'flex-row' : 'flex-col'}`}>
            <div style={{ [direction === 'horizontal' ? 'width' : 'height']: `${size}%` }} className="relative">
                {children[0]}
                {/* Overlay to prevent iframe capturing mouse events during drag if needed */}
                {isDragging.current && <div className="absolute inset-0 z-50"></div>}
            </div>

            <div
                className={`flex items-center justify-center bg-[#151515] hover:bg-blender-accent transition-colors z-10
                    ${direction === 'horizontal' ? 'w-1 h-full cursor-col-resize' : 'h-1 w-full cursor-row-resize'}
                `}
                onMouseDown={handleMouseDown}
            >
                {/* Grip Handle Visual */}
                <div className={`bg-[#444] rounded-full ${direction === 'horizontal' ? 'w-[2px] h-8' : 'h-[2px] w-8'}`}></div>
            </div>

            <div className="flex-1 relative min-h-0 min-w-0">
                {children[1]}
                {isDragging.current && <div className="absolute inset-0 z-50"></div>}
            </div>
        </div>
    );
};

export const BlenderLayout = () => {
    return (
        <div className="h-screen w-screen bg-blender-bg text-white overflow-hidden flex flex-col">
            {/* Header */}
            <header className="h-8 shrink-0 bg-blender-header border-b border-blender-border flex items-center px-4 text-xs select-none z-20">
                <span className="font-bold mr-4 text-blender-accent">BlendGraph</span>
                <span className="mr-3 hover:bg-white/10 px-2 py-1 rounded cursor-pointer">File</span>
                <span className="mr-3 hover:bg-white/10 px-2 py-1 rounded cursor-pointer">Edit</span>
                <span className="mr-3 hover:bg-white/10 px-2 py-1 rounded cursor-pointer">Window</span>
                <span className="mr-3 hover:bg-white/10 px-2 py-1 rounded cursor-pointer">Help</span>
            </header>

            {/* Main Workspace with Custom SplitPanes */}
            <div className="flex-1 min-h-0 relative">
                <SplitPane direction="horizontal" initialSize={20}>
                    {/* Left Column */}
                    <SplitPane direction="vertical" initialSize={40}>
                        <div className="h-full w-full border-r border-b border-blender-border flex flex-col">
                            <div className="h-6 bg-blender-header px-2 flex items-center text-xs shrink-0">Outliner</div>
                            <div className="flex-1 min-h-0"><Outliner /></div>
                        </div>
                        <div className="h-full w-full border-r border-blender-border flex flex-col">
                            <div className="h-6 bg-blender-header px-2 flex items-center text-xs shrink-0">Properties</div>
                            <div className="flex-1 min-h-0"><Properties /></div>
                        </div>
                    </SplitPane>

                    {/* Right Column */}
                    <SplitPane direction="vertical" initialSize={70}>
                        <div className="h-full w-full border-b border-blender-border relative flex flex-col">
                            <div className="absolute top-2 left-2 z-10 bg-black/50 px-2 py-1 rounded text-xs pointer-events-none">3D Viewport</div>
                            <div className="flex-1 min-h-0"><Viewport3D /></div>
                        </div>
                        <div className="h-full w-full flex flex-col relative">
                            <div className="absolute top-2 left-2 z-10 bg-black/50 px-2 py-1 rounded text-xs pointer-events-none">Node Graph</div>
                            <div className="flex-1 min-h-0 border-l border-blender-border">
                                <NodeEditor />
                            </div>
                        </div>
                    </SplitPane>
                </SplitPane>
            </div>
        </div>
    );
};
