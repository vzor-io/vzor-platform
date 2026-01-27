import { Layers, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useVzorStore } from '../store/store';

// Outliner Panel - shows scene tree
const OutlinerPanel = () => {
    const nodes = useVzorStore(state => state.nodes);
    const subAgents = useVzorStore(state => state.subAgents);
    const points = useVzorStore(state => state.points);
    const selectAgent = useVzorStore(state => state.selectAgent);

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        agents: true,
        nodes: true,
        points: false
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const SectionHeader = ({ id, label, count }: { id: string, label: string, count: number }) => (
        <button
            onClick={() => toggleSection(id)}
            className="w-full flex items-center gap-1 px-2 py-1 hover:bg-[#3a3a3a] text-[10px]"
        >
            {expandedSections[id] ? (
                <ChevronDown className="w-3 h-3 text-gray-500" />
            ) : (
                <ChevronRight className="w-3 h-3 text-gray-500" />
            )}
            <span className="text-gray-300 uppercase tracking-wider">{label}</span>
            <span className="text-gray-600 ml-auto">{count}</span>
        </button>
    );

    return (
        <div className="h-full bg-[#2d2d2d] text-white overflow-auto font-mono text-[10px]">
            {/* Agents */}
            <SectionHeader id="agents" label="Agents" count={subAgents.length} />
            {expandedSections.agents && (
                <div className="ml-4">
                    {subAgents.map(agent => (
                        <button
                            key={agent.id}
                            onClick={() => selectAgent(agent.id)}
                            className="w-full flex items-center gap-2 px-2 py-0.5 hover:bg-[#3a3a3a] text-left"
                        >
                            <span className="text-cyan-400">🤖</span>
                            <span className="text-gray-300">{agent.role}</span>
                            <span className={`ml-auto text-[9px] ${agent.status === 'COMPLETED' ? 'text-green-400' :
                                    agent.status === 'RUNNING' ? 'text-cyan-400' :
                                        'text-gray-600'
                                }`}>{agent.status}</span>
                        </button>
                    ))}
                    {subAgents.length === 0 && (
                        <div className="px-2 py-1 text-gray-600 italic">No agents</div>
                    )}
                </div>
            )}

            {/* Nodes */}
            <SectionHeader id="nodes" label="Nodes" count={nodes.length} />
            {expandedSections.nodes && (
                <div className="ml-4">
                    {nodes.map(node => (
                        <div
                            key={node.id}
                            className="flex items-center gap-2 px-2 py-0.5 hover:bg-[#3a3a3a]"
                        >
                            <span className="text-orange-400">◆</span>
                            <span className="text-gray-300">{node.data?.label || node.id}</span>
                        </div>
                    ))}
                    {nodes.length === 0 && (
                        <div className="px-2 py-1 text-gray-600 italic">No nodes</div>
                    )}
                </div>
            )}

            {/* Points */}
            <SectionHeader id="points" label="Points" count={points.length} />
            {expandedSections.points && (
                <div className="ml-4">
                    {points.slice(0, 50).map(point => (
                        <div
                            key={point.id}
                            className="flex items-center gap-2 px-2 py-0.5 hover:bg-[#3a3a3a]"
                        >
                            <span style={{ color: point.color }}>●</span>
                            <span className="text-gray-400">{point.id.slice(0, 8)}</span>
                        </div>
                    ))}
                    {points.length > 50 && (
                        <div className="px-2 py-1 text-gray-600">...and {points.length - 50} more</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OutlinerPanel;
