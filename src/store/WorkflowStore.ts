import { create } from 'zustand';
import {
    type Workflow,
    type WorkflowAgent,
    type WorkflowBlock,
    type AgentStatus,
    createDemoWorkflow,
    MOCK_ANALYSIS_RESULTS
} from '../engine/WorkflowTypes';

interface WorkflowState {
    // Current workflow
    workflow: Workflow | null;

    // Simulation state
    isSimulating: boolean;
    simulationSpeed: number; // ms per tick

    // Actions
    startNewWorkflow: (siteAddress: string) => void;
    startSimulation: () => void;
    stopSimulation: () => void;
    setAgentStatus: (agentId: string, status: AgentStatus, progress?: number) => void;
    setAgentOutput: (agentId: string, outputs: Record<string, any>) => void;
    setBlockDecision: (blockId: string, decision: 'go' | 'no-go') => void;
    resetWorkflow: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
    workflow: null,
    isSimulating: false,
    simulationSpeed: 500,

    startNewWorkflow: (siteAddress: string) => {
        const workflow = createDemoWorkflow(siteAddress);
        set({ workflow });
        console.log('[Workflow] Created new workflow:', workflow.id);
    },

    startSimulation: () => {
        set({ isSimulating: true });
        const { workflow } = get();
        if (!workflow) return;

        console.log('[Workflow] Starting simulation...');

        // Simulate investment analysis block
        simulateBlock(get, set, workflow.blocks[0]);
    },

    stopSimulation: () => {
        set({ isSimulating: false });
    },

    setAgentStatus: (agentId: string, status: AgentStatus, progress?: number) => {
        set(state => {
            if (!state.workflow) return state;

            const newBlocks = state.workflow.blocks.map(block => ({
                ...block,
                agents: block.agents.map(agent =>
                    agent.id === agentId
                        ? { ...agent, status, progress: progress ?? agent.progress }
                        : agent
                )
            }));

            return {
                workflow: { ...state.workflow, blocks: newBlocks }
            };
        });
    },

    setAgentOutput: (agentId: string, outputs: Record<string, any>) => {
        set(state => {
            if (!state.workflow) return state;

            const newBlocks = state.workflow.blocks.map(block => ({
                ...block,
                agents: block.agents.map(agent =>
                    agent.id === agentId
                        ? { ...agent, outputs, status: 'completed' as AgentStatus, progress: 100 }
                        : agent
                )
            }));

            return {
                workflow: { ...state.workflow, blocks: newBlocks }
            };
        });
    },

    setBlockDecision: (blockId: string, decision: 'go' | 'no-go') => {
        set(state => {
            if (!state.workflow) return state;

            const newBlocks = state.workflow.blocks.map(block =>
                block.id === blockId
                    ? { ...block, decision, status: 'completed' as const }
                    : block
            );

            // If GO, start next phase
            const nextPhase = decision === 'go' ? 'design' : state.workflow.currentPhase;

            return {
                workflow: { ...state.workflow, blocks: newBlocks, currentPhase: nextPhase }
            };
        });
    },

    resetWorkflow: () => {
        set({ workflow: null, isSimulating: false });
    }
}));

// --- SIMULATION LOGIC ---
async function simulateBlock(
    get: () => WorkflowState,
    set: any,
    block: WorkflowBlock
) {
    const { simulationSpeed } = get();

    // Update block status to running
    set((state: WorkflowState) => {
        if (!state.workflow) return state;
        const newBlocks = state.workflow.blocks.map(b =>
            b.id === block.id ? { ...b, status: 'running' as const } : b
        );
        return { workflow: { ...state.workflow, blocks: newBlocks } };
    });

    // Find agents without dependencies (can run parallel)
    const independentAgents = block.agents.filter(a => a.inputs.length === 0);
    const dependentAgents = block.agents.filter(a => a.inputs.length > 0);

    console.log(`[Simulation] Block ${block.name}: ${independentAgents.length} parallel, ${dependentAgents.length} dependent`);

    // Run independent agents in parallel
    await Promise.all(independentAgents.map(agent =>
        simulateAgent(get, set, agent, simulationSpeed)
    ));

    // Run dependent agents (after their inputs complete)
    for (const agent of dependentAgents) {
        await simulateAgent(get, set, agent, simulationSpeed);
    }

    // Check if investment analysis - make decision
    if (block.phase === 'investment_analysis') {
        const finAgent = block.agents.find(a => a.role === 'fin_analyst');
        if (finAgent) {
            const decision = MOCK_ANALYSIS_RESULTS.financial.irr > 15 ? 'go' : 'no-go';
            console.log(`[Simulation] Decision: ${decision.toUpperCase()} (IRR: ${MOCK_ANALYSIS_RESULTS.financial.irr}%)`);

            get().setBlockDecision(block.id, decision);

            // If GO, simulate design block
            if (decision === 'go') {
                const { workflow } = get();
                if (workflow) {
                    const designBlock = workflow.blocks.find(b => b.phase === 'design');
                    if (designBlock) {
                        await simulateBlock(get, set, designBlock);
                    }
                }
            }
        }
    }

    set({ isSimulating: false });
}

async function simulateAgent(
    get: () => WorkflowState,
    set: any,
    agent: WorkflowAgent,
    speed: number
) {
    const { setAgentStatus, setAgentOutput } = get();

    console.log(`[Agent ${agent.name}] Starting...`);
    setAgentStatus(agent.id, 'running', 0);

    // Simulate progress
    for (let progress = 0; progress <= 100; progress += 20) {
        await delay(speed);
        if (!get().isSimulating) return;
        setAgentStatus(agent.id, 'running', progress);
    }

    // Set mock output based on role
    const outputs = getMockOutputForRole(agent.role);
    setAgentOutput(agent.id, outputs);

    console.log(`[Agent ${agent.name}] Completed with outputs:`, outputs);
}

function getMockOutputForRole(role: string): Record<string, any> {
    switch (role) {
        case 'market_analyst': return MOCK_ANALYSIS_RESULTS.market;
        case 'tech_analyst': return MOCK_ANALYSIS_RESULTS.tech;
        case 'legal_analyst': return MOCK_ANALYSIS_RESULTS.legal;
        case 'cost_analyst': return MOCK_ANALYSIS_RESULTS.cost;
        case 'fin_analyst': return MOCK_ANALYSIS_RESULTS.financial;
        case 'architect': return { floors: 25, gfa: 45000, units: 380 };
        case 'structural': return { system: 'Монолитный каркас', foundation: 'Свайный' };
        case 'mep_engineer': return { heating: 'Central', ventilation: 'Mechanical' };
        case 'landscape': return { greenArea: 2500, parking: 450 };
        default: return {};
    }
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
