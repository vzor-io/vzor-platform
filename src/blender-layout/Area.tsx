
import React, { useState } from 'react';
import type { AreaNode, WindowType } from './kernel';
import { EDITOR_ICONS, EDITOR_REGISTRY } from './registry';
import { useLayout } from './context';

// --- BLENDER REGION LOGIC ---
// In Blender source: A_REGION_ALIGN_TOP, A_REGION_ALIGN_BOTTOM, etc.
// We map this to Flexbox layout.

const AreaHeader = ({
    area,
    onSplit
}: {
    area: AreaNode,
    onSplit: (dir: 'HORIZONTAL' | 'VERTICAL') => void
}) => {
    const { setWindowType, closeArea } = useLayout();

    return (
        <div className="h-6 bg-[#2d2d2d] flex items-center justify-between px-2 border-b border-[#111] select-none shrink-0 z-20">
            {/* LEFT: Editor Type Selector */}
            <div className="flex items-center gap-2 group relative">
                <div className="w-6 h-6 flex items-center justify-center bg-transparent group-hover:bg-white/10 rounded cursor-pointer">
                    {EDITOR_ICONS[area.windowType]}
                    <select
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        value={area.windowType}
                        onChange={(e) => setWindowType(area.id, e.target.value as WindowType)}
                    >
                        {Object.keys(EDITOR_REGISTRY).map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
                <span className="text-xs text-gray-300 font-semibold">{area.windowType}</span>
            </div>

            {/* RIGHT: Window Controls (Simulating Corner Action for now via buttons + Close) */}
            <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                <button onClick={() => closeArea(area.id)} className="text-[10px] hover:text-red-500">✖</button>
            </div>
        </div>
    );
};

export const Area = ({ area }: { area: AreaNode }) => {
    const { splitArea } = useLayout();
    const EditorComponent = EDITOR_REGISTRY[area.windowType];

    // NOTE: In Blender, 3D View has N-Panel (Right) and T-Panel (Left).
    // Logic: If type === VIEWPORT, render sidebars. Else, just main.
    const hasSidebar = area.windowType === 'VIEWPORT';
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex flex-col w-full h-full bg-[#1d1d1d] relative group border-[0.5px] border-black text-[#dadada] font-sans overflow-hidden">
            {/* REGION: HEADER (Top by default, can be Bottom) */}
            <AreaHeader area={area} onSplit={(d) => splitArea(area.id, d)} />

            <div className="flex-1 min-h-0 flex relative">
                {/* REGION: TOOLS (Left - 'T') */}
                {hasSidebar && (
                    <div className="w-8 bg-[#282828] border-r border-[#111] flex flex-col items-center py-2 gap-2 opacity-50 hover:opacity-100 transition-opacity z-10">
                        {/* Icons would go here */}
                        <div className="w-4 h-4 bg-gray-500 rounded-sm"></div>
                        <div className="w-4 h-4 bg-gray-500 rounded-sm"></div>
                        <div className="w-4 h-4 bg-gray-500 rounded-sm cursor-col-resize"></div>
                    </div>
                )}

                {/* REGION: MAIN (Window Content) */}
                <div className="flex-1 min-w-0 relative bg-[#1d1d1d] overflow-hidden">
                    <EditorComponent />

                    {/* Corner Click Targets (Invisible Hitboxes for Splitting) */}
                    {/* Top Right Corner */}
                    <div
                        className="absolute top-0 right-0 w-4 h-4 cursor-crosshair z-50 hover:bg-white/10 rounded-bl-lg"
                        title="Drag to Split (Simulated: Click)"
                        onClick={() => splitArea(area.id, 'VERTICAL')}
                    />
                    {/* Bottom Left Corner */}
                    <div
                        className="absolute bottom-0 left-0 w-4 h-4 cursor-crosshair z-50 hover:bg-white/10 rounded-tr-lg"
                        title="Drag to Split (Simulated: Click)"
                        onClick={() => splitArea(area.id, 'HORIZONTAL')}
                    />
                </div>

                {/* REGION: UI (Right - 'N') */}
                {hasSidebar && sidebarOpen && (
                    <div className="w-48 bg-[#282828] border-l border-[#111] flex flex-col z-10">
                        <div className="p-2 text-xs border-b border-[#444]">Transform</div>
                        <div className="p-2 space-y-2 text-[10px]">
                            <div className="flex justify-between"><span>Loc X</span><span className="bg-[#111] px-1 rounded text-gray-400">0m</span></div>
                            <div className="flex justify-between"><span>Loc Y</span><span className="bg-[#111] px-1 rounded text-gray-400">0m</span></div>
                            <div className="flex justify-between"><span>Loc Z</span><span className="bg-[#111] px-1 rounded text-gray-400">0m</span></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
