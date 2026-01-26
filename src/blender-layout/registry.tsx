
import React from 'react';
import NodeEditor from '../components/NodeGraph'; // Upgraded from NodeEditor
import { VzorDashboard } from '../components/VzorDashboard';

// Mock components
const Viewport3D = () => <div className="h-full w-full bg-[#151515] flex items-center justify-center text-gray-500 font-bold select-none border border-white/5 relative">
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
    3D VIEWPORT (Three.js Mock)
</div>;

const Outliner = () => <div className="h-full w-full bg-[#111] p-2 text-gray-400 text-xs font-mono">
    <h3 className="uppercase font-bold mb-2 text-[#00f2ff]">Project Hierarchy</h3>
    <ul className="space-y-1">
        <li className="text-white">▼ Scene Collection</li>
        <li className="pl-4 text-[#00f2ff]">⦿ Construction Site</li>
        <li className="pl-4">○ Crane_01</li>
        <li className="pl-4">○ Foundation</li>
    </ul>
</div>;
const Timeline = () => <div className="h-full w-full bg-[#111] border-t border-[#222] p-1 text-gray-500 text-xs flex items-center justify-center font-mono">TIME: 00:00:00 [PLAY]</div>;
const TextEditor = () => <div className="h-full w-full bg-[#111] text-gray-300 font-mono p-2 text-xs">print("Hello VZOR")</div>;

export const EDITOR_REGISTRY: Record<string, React.FC> = {
    'VIEWPORT': Viewport3D,
    'NODES': NodeEditor,
    'PROPERTIES': VzorDashboard, // Replacing "Properties" with our Core Dashboard for demo
    'OUTLINER': Outliner,
    'TIMELINE': Timeline,
    'TEXT': TextEditor,
    'INSPECTOR': VzorDashboard // Mapping Inspector to our Dashboard
};

export const EDITOR_ICONS: Record<string, string> = {
    'VIEWPORT': '🌐',
    'NODES': '🕸️',
    'PROPERTIES': '📊', // Updated Icon
    'OUTLINER': '≣',
    'TIMELINE': '⏱️',
    'TEXT': '📝',
    'INSPECTOR': '🏗️' // Construction Icon
};
