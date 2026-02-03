import React, { useState } from 'react';
// import { useLayout } from './context'; // Deprecated
import type { WorkspaceType } from './workspaces';

const MenuTab = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`px-4 py-1.5 text-xs font-bold tracking-widest uppercase transition-all relative border border-transparent rounded-sm
             ${active
                ? 'text-[#050505] bg-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.4)]'
                : 'text-gray-400 hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 hover:border-[#00f2ff]/30'
            }
        `}
    >
        {label}
    </button>
);

export const TopBar = () => {
    // Replaced legacy useLayout with local state for now
    const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceType>('CORE');

    return (
        <div className="h-10 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/10 flex items-center px-4 shrink-0 z-50">
            {/* LOGO */}
            <div className="mr-8 flex items-center gap-2 group cursor-pointer text-[#00f2ff]">
                <div className="w-5 h-5 border-2 border-[#00f2ff] rounded-sm flex items-center justify-center font-black text-[10px] shadow-[0_0_10px_rgba(0,242,255,0.5)]">
                    V
                </div>
                <span className="font-bold tracking-tighter text-sm text-white group-hover:text-[#00f2ff] transition-colors">VZOR</span>
            </div>

            {/* WORKSPACE TABS */}
            <div className="flex-1 flex items-center gap-2 justify-center">
                {(['CORE', 'FINANCE', 'TIMELINE', 'ANALYTICS'] as WorkspaceType[]).map(ws => (
                    <MenuTab
                        key={ws}
                        label={ws}
                        active={activeWorkspace === ws}
                        onClick={() => setActiveWorkspace(ws)}
                    />
                ))}
            </div>

            {/* SYSTEM STATUS */}
            <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500">
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span>WASM: ONLINE</span>
                </div>
                <span>v2.1.0-beta</span>
            </div>
        </div>
    );
};
