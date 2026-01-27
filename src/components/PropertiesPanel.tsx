import { useVzorStore } from '../store/store';
import { Settings } from 'lucide-react';

// Properties Panel - shows selected agent or scene info
const PropertiesPanel = () => {
    const selectedAgentId = useVzorStore(state => state.selectedAgentId);
    const subAgents = useVzorStore(state => state.subAgents);
    const nodes = useVzorStore(state => state.nodes);

    const selectedAgent = subAgents.find(a => a.id === selectedAgentId);

    return (
        <div className="h-full bg-[#2d2d2d] text-white p-3 overflow-auto font-mono text-[11px]">
            {selectedAgent ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase">
                        <Settings className="w-4 h-4" />
                        {selectedAgent.role}
                    </div>

                    <div className="space-y-2 text-gray-400">
                        <div className="flex justify-between">
                            <span>ID:</span>
                            <span className="text-white">{selectedAgent.id.slice(0, 8)}...</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Model:</span>
                            <span className="text-white">{selectedAgent.model}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Status:</span>
                            <span className={
                                selectedAgent.status === 'COMPLETED' ? 'text-green-400' :
                                    selectedAgent.status === 'RUNNING' ? 'text-cyan-400' :
                                        'text-gray-400'
                            }>{selectedAgent.status}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Progress:</span>
                            <span className="text-white">{selectedAgent.progress}%</span>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1 bg-[#1a1a1a] rounded overflow-hidden">
                        <div
                            className="h-full bg-cyan-500 transition-all"
                            style={{ width: `${selectedAgent.progress}%` }}
                        />
                    </div>

                    {/* Knowledge bases */}
                    {selectedAgent.knowledgeBases && selectedAgent.knowledgeBases.length > 0 && (
                        <div>
                            <div className="text-gray-500 mb-1">Knowledge Bases:</div>
                            {selectedAgent.knowledgeBases.map((kb, i) => (
                                <div key={i} className="text-[10px] text-gray-400 pl-2">• {kb.name}</div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-400 font-bold uppercase">
                        <Settings className="w-4 h-4" />
                        Scene
                    </div>
                    <div className="space-y-2 text-gray-400">
                        <div className="flex justify-between">
                            <span>Nodes:</span>
                            <span className="text-white">{nodes.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Agents:</span>
                            <span className="text-white">{subAgents.length}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertiesPanel;
