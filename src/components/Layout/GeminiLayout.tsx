import React, { useState, useEffect } from 'react';
import './Layout.css';
import { useTaskStore } from '../../store/taskStore';
import { useShallow } from 'zustand/react/shallow';
import { BarChart, PencilRuler, HardHat, CircleDollarSign, FolderOpen, Settings, X, Download, Eye } from 'lucide-react';
import { FloatingInput } from '../UI/FloatingInput';

interface GeminiLayoutProps {
    children: React.ReactNode;
    NodeEditorComponent: React.ReactNode;
    inputText?: string;
    setInputText?: (text: string) => void;
    onTaskCreate?: () => void;
    isListening?: boolean;
    onMicToggle?: () => void;
}

export const GeminiLayout: React.FC<GeminiLayoutProps> = ({
    children,
    NodeEditorComponent,
    inputText = '',
    setInputText = () => { },
    onTaskCreate = () => { },
    isListening = false,
    onMicToggle = () => { }
}) => {
    // --- STATE ---
    const [activeLeftPanel, setActiveLeftPanel] = useState<string | null>(null);
    const [rightPanelOpen, setRightPanelOpen] = useState(false);
    const [nodeEditorOpen, setNodeEditorOpen] = useState(false);

    // Store Data
    const tasks = useTaskStore(useShallow(state => Array.from(state.tasks.values())));
    const selectedTask = useTaskStore(state => state.selectedTaskId ? state.tasks.get(state.selectedTaskId) : null);
    const selectTask = useTaskStore(state => state.selectTask);

    useEffect(() => {
        if (selectedTask) setRightPanelOpen(true);
        else setRightPanelOpen(false);
    }, [selectedTask]);

    const toggleLeftPanel = (panel: string) => {
        if (activeLeftPanel === panel) setActiveLeftPanel(null);
        else setActiveLeftPanel(panel);
    };

    const handleTaskClick = (id: string) => selectTask(id);
    const closeRightPanel = () => selectTask(null);

    return (
        <div className="main-layout">
            {/* 1. LEFT ICON BAR */}
            <div className="icon-bar">
                <IconButton icon={<BarChart />} label="Invest" active={activeLeftPanel === 'invest'} onClick={() => toggleLeftPanel('invest')} />
                <IconButton icon={<PencilRuler />} label="Design" active={activeLeftPanel === 'design'} onClick={() => toggleLeftPanel('design')} />
                <IconButton icon={<HardHat />} label="Build" active={activeLeftPanel === 'build'} onClick={() => toggleLeftPanel('build')} />
                <IconButton icon={<CircleDollarSign />} label="Sales" active={activeLeftPanel === 'sales'} onClick={() => toggleLeftPanel('sales')} />
                <div className="icon-separator" />
                <IconButton icon={<FolderOpen />} label="Files" active={activeLeftPanel === 'files'} onClick={() => toggleLeftPanel('files')} />
                <div style={{ marginTop: 'auto' }}></div>
                <IconButton icon={<Settings />} label="Settings" active={activeLeftPanel === 'settings'} onClick={() => toggleLeftPanel('settings')} />
            </div>

            {/* 2. LEFT PANEL */}
            <div className={`left-panel ${activeLeftPanel ? 'open' : ''}`}>
                <div className="panel-header">
                    <span>{activeLeftPanel ? getPanelTitle(activeLeftPanel) : ''}</span>
                    <X size={16} className="panel-close-btn" onClick={() => setActiveLeftPanel(null)} />
                </div>
                <div className="task-list">
                    {activeLeftPanel === 'invest' && (
                        <>
                            {tasks.filter(t => t.block === 'invest' || !t.block).map(task => (
                                <TaskListItem key={task.id} task={task} active={selectedTask?.id === task.id} onClick={() => handleTaskClick(task.id)} />
                            ))}
                            {tasks.length === 0 && <div style={{ padding: '20px', color: '#666', fontSize: '12px' }}>No tasks found.</div>}
                        </>
                    )}
                    {activeLeftPanel !== 'invest' && (
                        <div style={{ padding: '20px', color: '#666', fontSize: '12px' }}>
                            Module <strong>{activeLeftPanel}</strong> is empty.
                        </div>
                    )}
                </div>
            </div>

            {/* 3. CENTER CONTENT */}
            <div className="center-container">
                <div className="center-content">
                    {children}
                </div>
                {/* 4. RIGHT PANEL */}
                <div className={`right-panel-container ${rightPanelOpen ? 'open' : ''}`}>
                    {selectedTask ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div className="panel-header">
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{selectedTask.name}</span>
                                <X size={16} className="panel-close-btn" onClick={closeRightPanel} />
                            </div>
                            <div className="right-panel-content" style={{ padding: '20px' }}>
                                <div style={{ marginBottom: '20px', fontSize: '13px', color: '#aaa' }}>
                                    <div>Status: <span style={{ color: getStatusColor(selectedTask.status) }}>{selectedTask.status}</span></div>
                                    <div>Agent: {selectedTask.agent.type}</div>
                                </div>
                                <div className="section-title" style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '10px', textTransform: 'uppercase' }}>Results</div>
                                <div className="result-item" style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '13px' }}>Report.pdf</span>
                                    <Eye size={14} style={{ cursor: 'pointer' }} />
                                </div>
                                <div className="result-item" style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px', marginBottom: '20px' }}>
                                    <span style={{ fontSize: '13px' }}>Data.csv</span>
                                    <Download size={14} style={{ cursor: 'pointer' }} />
                                </div>
                                <div className="section-title" style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '10px', textTransform: 'uppercase' }}>Data</div>
                                <div style={{ fontSize: '13px', color: '#ccc', lineHeight: '1.6' }}>
                                    <div>Floors: 25</div>
                                    <div>Area: 25,000 m²</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '20px', color: '#666' }}>Select a task...</div>
                    )}
                </div>
            </div>

            {/* 5. FLOATING INPUT (Replaces Bottom Bar) */}
            <FloatingInput
                value={inputText}
                onChange={setInputText}
                onSubmit={onTaskCreate}
                onMicClick={onMicToggle}
                isListening={isListening}
            />

            {/* 6. FLOATING NODES BUTTON */}
            <button
                onClick={() => setNodeEditorOpen(true)}
                className="fixed bottom-6 right-6 z-40 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.12] hover:bg-white/10 flex items-center gap-2 text-sm text-white/60 hover:text-white transition-all backdrop-blur-sm"
            >
                <Settings size={14} />
                <span>Nodes</span>
            </button>

            {/* 7. NODE EDITOR MODAL */}
            {nodeEditorOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm modal-enter"
                    onClick={() => setNodeEditorOpen(false)}
                >
                    <div
                        className="w-[85vw] h-[75vh] bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="h-12 flex items-center justify-between px-5 border-b border-white/10 bg-black/50">
                            <span className="text-sm font-medium text-white/80">Node Editor</span>
                            <button
                                onClick={() => setNodeEditorOpen(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="h-[calc(100%-48px)]">
                            {NodeEditorComponent}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SUB-COMPONENTS ---

const IconButton = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
    <div className={`icon-button ${active ? 'active' : ''}`} onClick={onClick} title={label}>
        {icon}
    </div>
);

const TaskListItem = ({ task, active, onClick }: { task: any, active: boolean, onClick: () => void }) => (
    <div className={`task-list-item ${active ? 'active' : ''}`} onClick={onClick}>
        <div className="task-status-icon">
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(task.status) }} />
        </div>
        <div style={{ fontSize: '13px' }}>{task.name}</div>
    </div>
);

// Helpers
const getPanelTitle = (id: string) => {
    switch (id) {
        case 'invest': return 'Invest Analysis';
        case 'design': return 'Design';
        case 'build': return 'Construction';
        case 'sales': return 'Sales';
        case 'files': return 'Documents';
        case 'settings': return 'Settings';
        default: return id;
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'done': return '#32CD32';
        case 'running': return '#4ECDC4';
        case 'error': return '#FF6B6B';
        default: return '#666';
    }
};
