import { useState, useCallback, useEffect } from 'react';
import { TopMenuBar, Toolbar } from '../components/BlenderUI';
import DynamicAreaGrid from './DynamicAreaGrid';
import { AgentInspector } from '../components/AgentInspector';
import { useEngine } from '../context/EngineContext';
import { useVzorStore } from '../store/store';
import { useWorkflowStore } from '../store/WorkflowStore';
import { createNode, type NodeType } from '../engine/NodeFactory';
import type { Node } from '@xyflow/react';
import type { VzorNodeData } from '../store/store';

const BlenderLayout = () => {
    const { loadProject, projectState } = useEngine();
    const [currentLayout, setCurrentLayout] = useState('default');
    const [isAgentRunning, setIsAgentRunning] = useState(false);
    const [commandInput, setCommandInput] = useState('Москва, Пресненская наб. 12');

    // Store selectors
    const selectedAgentId = useVzorStore(state => state.selectedAgentId);
    const subAgents = useVzorStore(state => state.subAgents);
    const setNodes = useVzorStore(state => state.setNodes);
    const addSubAgent = useVzorStore(state => state.addSubAgent);
    const nodes = useVzorStore(state => state.nodes);
    const selectAgent = useVzorStore(state => state.selectAgent);

    // Workflow Integration
    const workflow = useWorkflowStore(state => state.workflow);
    const startNewWorkflow = useWorkflowStore(state => state.startNewWorkflow);
    const startSimulation = useWorkflowStore(state => state.startSimulation);
    const stopSimulation = useWorkflowStore(state => state.stopSimulation);
    const isSimulating = useWorkflowStore(state => state.isSimulating);

    // Unified Selection Logic
    // Try to find the selected agent in the active Workflow first
    let selectedAgent: any = workflow?.blocks.flatMap(b => b.agents).find(a => a.id === selectedAgentId);

    // Fallback: Legacy agents
    if (!selectedAgent) {
        selectedAgent = subAgents.find(a => a.id === selectedAgentId);
    }

    // Fallback: Virtual Nodes (Site Input, Decision) - Construct fake agent for Inspector
    if (!selectedAgent && selectedAgentId) {
        if (selectedAgentId === 'site-input') {
            selectedAgent = {
                id: 'site-input',
                role: 'Входные данные',
                status: 'COMPLETED',
                progress: 100,
                knowledgeBases: [],
                inputs: [],
                outputs: { 'Адрес': workflow?.siteAddress || 'г. Москва...' },
                icon: '📍'
            } as any;
        } else if (selectedAgentId === 'decision') {
            // Check if decision is made
            const decisionBlock = workflow?.blocks.find(b => b.phase === 'investment_analysis');
            const result = (decisionBlock as any)?.decision; // specific to store logic

            selectedAgent = {
                id: 'decision',
                role: 'Комитет (Decision)',
                status: result ? 'COMPLETED' : 'PENDING',
                progress: result ? 100 : 0,
                knowledgeBases: [],
                inputs: [],
                outputs: result ? { 'Решение': result === 'GO' ? 'GO ✅' : 'NO-GO ❌' } : {},
                icon: '⚖️'
            } as any;
        }
    }

    // Sync isAgentRunning state
    useEffect(() => {
        setIsAgentRunning(isSimulating);
    }, [isSimulating]);

    // --- WORKFLOW TO GRAPH SYNCHRONIZATION ---
    useEffect(() => {
        if (!workflow) return;

        // 1. Static Layout Constants
        const BLOCK_SPACING_X = 600;
        const newNodes: Node<VzorNodeData>[] = [];

        // 2. Add Site Input Node (Static Start)
        newNodes.push({
            id: 'site-input',
            type: 'blender',
            position: { x: 50, y: 300 },
            data: {
                label: 'УЧАСТОК',
                status: 'COMPLETED',
                icon: '📍',
                headerColor: '#2d4a2d',
                outputs: [
                    { id: 'address', label: 'Адрес', type: 'string' },
                    { id: 'cadastr', label: 'Кадастр', type: 'string' },
                ],
                address: workflow.siteAddress,
                cadastr: workflow.cadastralNumber || '77:01:...'
            }
        });

        // 3. Map Agents from Workflow Blocks
        workflow.blocks.forEach((block, blockIndex) => {
            const baseX = 400 + (blockIndex * BLOCK_SPACING_X); // Offset for Site Input

            block.agents.forEach((agent, agentIndex) => {
                // Try to preserve existing node position if it exists
                const existingNode = nodes.find(n => n.id === agent.id);

                // Calculate default position
                let defaultPos = { x: baseX, y: 50 + (agentIndex * 180) };

                // Specific layouts for roles
                if (agent.role === 'orchestrator') defaultPos = { x: baseX, y: 300 };
                if (agent.role === 'fin_analyst') defaultPos = { x: baseX + 350, y: 300 }; // Aggregator after analysts

                // Merge Agent Outputs directly into Node Data for display
                const nodeData: VzorNodeData = {
                    label: agent.name,
                    status: agent.status.toUpperCase(),
                    headerColor: getRoleColor(agent.role),
                    agentId: agent.id,
                    knowledgeBase: agent.knowledgeBases?.[0] || 'NONE',
                    icon: agent.icon,
                    inputs: agent.inputs.map(id => ({ id, label: 'Data', type: 'value' })),
                    outputs: Object.keys(agent.outputs).length > 0
                        ? Object.keys(agent.outputs).map(k => ({ id: k, label: k, type: 'value' }))
                        : [{ id: 'pending', label: 'Computing...', type: 'value' }],
                    ...agent.outputs // SPREAD OUTPUTS INTO DATA ROOT
                };

                newNodes.push({
                    id: agent.id,
                    type: 'blender',
                    position: existingNode ? existingNode.position : defaultPos,
                    data: nodeData,
                    draggable: true,
                });
            });

            // Add Decision Node if block completed
            if (block.decision) {
                const decId = `decision-${block.id}`;
                newNodes.push({
                    id: decId,
                    type: 'blender',
                    position: { x: baseX + 500, y: 300 },
                    data: {
                        label: `DECISION: ${block.decision.toUpperCase()}`,
                        status: 'COMPLETED',
                        headerColor: block.decision === 'go' ? '#2d4a2d' : '#4a2d2d',
                        icon: block.decision === 'go' ? '✅' : '❌',
                        outputs: [{ id: 'decision', label: 'Gateway', type: 'boolean' }]
                    }
                });
            }
        });

        // Simple deep compare to avoid infinite loop (JSON stringify is cheap for this size)
        if (JSON.stringify(newNodes.map(n => n.data)) !== JSON.stringify(nodes.map(n => n.data)) || newNodes.length !== nodes.length) {
            setNodes(newNodes);
        }

    }, [workflow, nodes, setNodes]);

    // Helpers
    const getRoleColor = (role: string) => {
        const colors: Record<string, string> = {
            'market_analyst': '#4a2d4a',
            'tech_analyst': '#2d4a4a',
            'legal_analyst': '#4a4a2d',
            'cost_analyst': '#4a3d2d',
            'fin_analyst': '#2d2d4a',
            'architect': '#2d4a6d',
        };
        return colors[role] || '#333';
    };

    // --- HANDLERS ---
    const handleNewProject = useCallback(() => {
        if (projectState === 'empty') {
            loadProject();
        }
    }, [projectState, loadProject]);

    // Add node via menu
    const handleAddNode = useCallback((nodeType: string) => {
        const newNode = createNode(nodeType as NodeType);
        setNodes([...nodes, newNode]);
        console.log(`Added node: ${nodeType}`, newNode);
    }, [nodes, setNodes]);

    const handleRunAgent = useCallback(async () => {
        if (!commandInput.trim()) return;

        console.log("Starting Investment Analysis Workflow Simulation...");
        console.log("Input:", commandInput);

        // 1. Initialize Workflow
        startNewWorkflow(commandInput);

        // 2. Start Simulation Loop
        startSimulation();

    }, [commandInput, startNewWorkflow, startSimulation]);

    const handleStopAgent = useCallback(() => {
        stopSimulation();
    }, [stopSimulation]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleRunAgent();
        }
    };

    return (
        <div className="w-screen h-screen bg-[#252525] text-white overflow-hidden flex flex-col">
            {/* TOP MENU BAR */}
            <TopMenuBar
                onNewProject={handleNewProject}
                onRunAgent={handleRunAgent}
                onStopAgent={handleStopAgent}
                isAgentRunning={isAgentRunning}
                onAddNode={handleAddNode}
            />

            {/* TOOLBAR */}
            <Toolbar
                currentLayout={currentLayout}
                onLayoutChange={setCurrentLayout}
                projectName={projectState === 'loaded' ? 'Project_01' : 'Untitled'}
            />

            {/* MAIN CONTENT - DYNAMIC AREA GRID */}
            <div className="flex-1 overflow-hidden relative">
                <DynamicAreaGrid />

                {/* FLOATING COMMAND INPUT */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[600px] z-50">
                    <div className="bg-[#2d2d2d]/95 border border-[#444] rounded-lg shadow-xl flex items-center p-2 gap-2 backdrop-blur-sm">
                        <span className="text-cyan-400 text-xs font-mono">▶</span>
                        <input
                            type="text"
                            className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-gray-500 font-mono"
                            placeholder="Введите команду... (например: Проанализируй участок)"
                            value={commandInput}
                            onChange={(e) => setCommandInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button
                            onClick={handleRunAgent}
                            disabled={!commandInput.trim() || isAgentRunning}
                            className="px-3 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-[10px] font-bold transition-all disabled:opacity-30"
                        >
                            {isAgentRunning ? 'RUNNING...' : 'RUN'}
                        </button>
                    </div>
                </div>
            </div>

            {/* BOTTOM STATUS BAR */}
            <div className="h-5 bg-[#3d3d3d] border-t border-[#1a1a1a] flex items-center px-3 text-[10px] text-gray-400 select-none">
                <span>Nodes: {nodes.length}</span>
                <div className="w-px h-3 bg-[#555] mx-3" />
                <span>Agents: {subAgents.length}</span>
                <div className="flex-1" />
                <span>{projectState === 'loaded' ? 'Project Loaded' : 'Ready'}</span>
            </div>

            {/* AGENT INSPECTOR OVERLAY */}
            <AgentInspector
                agent={selectedAgent}
                onClose={() => selectAgent(null)}
            />
        </div>
    );
};

export default BlenderLayout;
