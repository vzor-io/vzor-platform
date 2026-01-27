import { useState, useCallback } from 'react';
import { ChevronDown, Upload, Play, Pause, Settings, Layers, Box, GitBranch } from 'lucide-react';

// --- MENU ITEM ---
interface MenuItemProps {
    label: string;
    shortcut?: string;
    onClick?: () => void;
    disabled?: boolean;
}

const MenuItem = ({ label, shortcut, onClick, disabled }: MenuItemProps) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`
            w-full px-3 py-1 text-left text-[11px] flex justify-between items-center
            ${disabled ? 'text-gray-600' : 'text-gray-300 hover:bg-[#4a6fa5] hover:text-white'}
        `}
    >
        <span>{label}</span>
        {shortcut && <span className="text-gray-500 text-[10px]">{shortcut}</span>}
    </button>
);

// --- DROPDOWN MENU ---
interface DropdownMenuProps {
    label: string;
    children: React.ReactNode;
}

const DropdownMenu = ({ label, children }: DropdownMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button className="px-2.5 py-1 text-[11px] text-gray-300 hover:bg-[#3a3a3a] hover:text-white transition-colors">
                {label}
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 bg-[#2d2d2d] border border-[#1a1a1a] rounded shadow-xl min-w-[180px] py-1 z-50">
                    {children}
                </div>
            )}
        </div>
    );
};

const MenuSeparator = () => <div className="h-px bg-[#1a1a1a] my-1" />;

// --- TOP MENU BAR ---
interface TopMenuBarProps {
    onNewProject: () => void;
    onRunAgent: () => void;
    onStopAgent: () => void;
    isAgentRunning: boolean;
    onAddNode?: (nodeType: string) => void;
}

export const TopMenuBar = ({ onNewProject, onRunAgent, onStopAgent, isAgentRunning, onAddNode }: TopMenuBarProps) => {
    return (
        <div className="h-6 bg-[#2d2d2d] border-b border-[#1a1a1a] flex items-center select-none">
            {/* LOGO */}
            <div className="px-3 text-[11px] font-bold text-cyan-400 tracking-wider">
                VZOR
            </div>

            {/* MENUS */}
            <DropdownMenu label="File">
                <MenuItem label="New Project" shortcut="Ctrl+N" onClick={onNewProject} />
                <MenuItem label="Open..." shortcut="Ctrl+O" />
                <MenuItem label="Open Recent" />
                <MenuSeparator />
                <MenuItem label="Save" shortcut="Ctrl+S" />
                <MenuItem label="Save As..." shortcut="Ctrl+Shift+S" />
                <MenuSeparator />
                <MenuItem label="Export Report" shortcut="Ctrl+E" />
                <MenuItem label="Export to Excel" />
                <MenuSeparator />
                <MenuItem label="Quit" shortcut="Ctrl+Q" />
            </DropdownMenu>

            <DropdownMenu label="Edit">
                <MenuItem label="Undo" shortcut="Ctrl+Z" />
                <MenuItem label="Redo" shortcut="Ctrl+Shift+Z" />
                <MenuSeparator />
                <MenuItem label="Cut" shortcut="Ctrl+X" />
                <MenuItem label="Copy" shortcut="Ctrl+C" />
                <MenuItem label="Paste" shortcut="Ctrl+V" />
                <MenuItem label="Delete" shortcut="Del" />
                <MenuSeparator />
                <MenuItem label="Preferences..." />
            </DropdownMenu>

            <DropdownMenu label="View">
                <MenuItem label="Toggle 3D Viewport" shortcut="Shift+F5" />
                <MenuItem label="Toggle Node Editor" shortcut="Shift+F6" />
                <MenuItem label="Toggle Properties" shortcut="N" />
                <MenuItem label="Toggle Console" shortcut="`" />
                <MenuSeparator />
                <MenuItem label="Zoom In" shortcut="+" />
                <MenuItem label="Zoom Out" shortcut="-" />
                <MenuItem label="Fit All" shortcut="Home" />
            </DropdownMenu>

            <DropdownMenu label="Add">
                <MenuItem label="📍 Site Input" shortcut="Shift+A" onClick={() => onAddNode?.('site')} />
                <MenuItem label="🤖 Agent Node" onClick={() => onAddNode?.('agent')} />
                <MenuSeparator />
                <MenuItem label="📊 Analysis Node" onClick={() => onAddNode?.('analysis')} />
                <MenuItem label="🏗️ Generator Node" onClick={() => onAddNode?.('generator')} />
                <MenuItem label="✅ Validator Node" onClick={() => onAddNode?.('validator')} />
                <MenuSeparator />
                <MenuItem label="📥 Input Node" onClick={() => onAddNode?.('input')} />
                <MenuItem label="📤 Output Node" onClick={() => onAddNode?.('output')} />
            </DropdownMenu>

            <DropdownMenu label="Agent">
                <MenuItem
                    label={isAgentRunning ? "Stop Agent" : "Run Agent"}
                    shortcut="F5"
                    onClick={isAgentRunning ? onStopAgent : onRunAgent}
                />
                <MenuSeparator />
                <MenuItem label="Configure Agent Zero..." />
                <MenuItem label="Knowledge Bases..." />
                <MenuItem label="Model Settings..." />
            </DropdownMenu>

            <DropdownMenu label="Tools">
                <MenuItem label="Site Analysis" />
                <MenuItem label="Legal Check" />
                <MenuItem label="Economic Feasibility" />
                <MenuItem label="Generate Massing" />
                <MenuSeparator />
                <MenuItem label="Batch Process..." />
            </DropdownMenu>

            <DropdownMenu label="Window">
                <MenuItem label="Default Layout" />
                <MenuItem label="Node Editing" />
                <MenuItem label="Analysis" />
                <MenuSeparator />
                <MenuItem label="Toggle Full Screen" shortcut="F11" />
            </DropdownMenu>

            <DropdownMenu label="Help">
                <MenuItem label="Documentation" />
                <MenuItem label="Keyboard Shortcuts" />
                <MenuSeparator />
                <MenuItem label="About VZOR" />
            </DropdownMenu>

            {/* SPACER */}
            <div className="flex-1" />

            {/* RIGHT SIDE INDICATORS */}
            <div className="flex items-center gap-2 px-3">
                {isAgentRunning && (
                    <div className="flex items-center gap-1 text-[10px] text-cyan-400">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                        Agent Running
                    </div>
                )}
                <span className="text-[10px] text-gray-500">v0.1.0</span>
            </div>
        </div>
    );
};

// --- TOOLBAR ---
interface ToolbarProps {
    currentLayout: string;
    onLayoutChange: (layout: string) => void;
    projectName: string;
}

export const Toolbar = ({ currentLayout, onLayoutChange, projectName }: ToolbarProps) => {
    return (
        <div className="h-7 bg-[#333] border-b border-[#1a1a1a] flex items-center px-2 gap-2 select-none">
            {/* MODE BUTTONS */}
            <div className="flex items-center bg-[#2a2a2a] rounded overflow-hidden">
                <button className="p-1.5 hover:bg-[#444] text-gray-400 hover:text-white" title="Object Mode">
                    <Box className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 hover:bg-[#444] text-gray-400 hover:text-white" title="Node Mode">
                    <GitBranch className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 hover:bg-[#444] text-gray-400 hover:text-white" title="Layers">
                    <Layers className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="w-px h-4 bg-[#1a1a1a]" />

            {/* LAYOUT SELECTOR */}
            <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-500">Layout:</span>
                <select
                    value={currentLayout}
                    onChange={(e) => onLayoutChange(e.target.value)}
                    className="bg-[#2a2a2a] border border-[#1a1a1a] rounded px-2 py-0.5 text-[10px] text-gray-300 outline-none"
                >
                    <option value="default">Default</option>
                    <option value="nodes">Node Editing</option>
                    <option value="analysis">Analysis</option>
                </select>
            </div>

            <div className="w-px h-4 bg-[#1a1a1a]" />

            {/* PROJECT NAME */}
            <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-500">Project:</span>
                <span className="text-[10px] text-white">{projectName}</span>
            </div>

            <div className="flex-1" />

            {/* PLAYBACK CONTROLS */}
            <div className="flex items-center gap-1">
                <button className="p-1 hover:bg-[#444] rounded text-gray-400 hover:text-green-400">
                    <Play className="w-3.5 h-3.5" />
                </button>
                <button className="p-1 hover:bg-[#444] rounded text-gray-400 hover:text-yellow-400">
                    <Pause className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

// --- AREA HEADER ---
interface AreaHeaderProps {
    title: string;
    icon?: React.ReactNode;
    areaType: string;
    onTypeChange?: (type: string) => void;
}

export const AreaHeader = ({ title, icon, areaType, onTypeChange }: AreaHeaderProps) => {
    const [showDropdown, setShowDropdown] = useState(false);

    const areaTypes = [
        { id: '3d', label: '3D Viewport', icon: <Box className="w-3 h-3" /> },
        { id: 'nodes', label: 'Node Editor', icon: <GitBranch className="w-3 h-3" /> },
        { id: 'properties', label: 'Properties', icon: <Settings className="w-3 h-3" /> },
    ];

    return (
        <div className="h-6 bg-[#3d3d3d] border-b border-[#1a1a1a] flex items-center px-2 select-none">
            {/* AREA TYPE DROPDOWN */}
            <div className="relative">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-1 text-[10px] text-gray-300 hover:text-white px-1 py-0.5 rounded hover:bg-[#4a4a4a]"
                >
                    {icon}
                    <span className="uppercase tracking-wider font-medium">{title}</span>
                    <ChevronDown className="w-3 h-3" />
                </button>

                {showDropdown && onTypeChange && (
                    <div className="absolute top-full left-0 mt-1 bg-[#2d2d2d] border border-[#1a1a1a] rounded shadow-xl py-1 z-50 min-w-[150px]">
                        {areaTypes.map(type => (
                            <button
                                key={type.id}
                                onClick={() => {
                                    onTypeChange(type.id);
                                    setShowDropdown(false);
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-1 text-[10px] ${areaType === type.id ? 'bg-[#4a6fa5] text-white' : 'text-gray-300 hover:bg-[#3a3a3a]'
                                    }`}
                            >
                                {type.icon}
                                {type.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-1" />
        </div>
    );
};

export default { TopMenuBar, Toolbar, AreaHeader };
