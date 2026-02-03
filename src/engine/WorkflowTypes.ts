// VZOR Workflow Types
// Defines the structure for investment analysis and design phases

// --- KNOWLEDGE BASE ---
export interface KnowledgeBase {
    id: string;
    name: string;
    type: 'documents' | 'api' | 'database';
    category: 'legal' | 'technical' | 'market' | 'financial';
    source: string;
    lastUpdated: Date;
    description?: string;
}

// Pre-defined knowledge bases
export const KNOWLEDGE_BASES: KnowledgeBase[] = [
    { id: 'pzz', name: 'ПЗЗ', type: 'documents', category: 'legal', source: 'isogd.mos.ru', lastUpdated: new Date('2024-01-15'), description: 'Правила землепользования и застройки' },
    { id: 'gpzu', name: 'ГПЗУ', type: 'api', category: 'legal', source: 'api.isogd.mos.ru', lastUpdated: new Date('2024-01-20'), description: 'Градостроительный план земельного участка' },
    { id: 'sp', name: 'СП/СНиП', type: 'documents', category: 'technical', source: 'docs.cntd.ru', lastUpdated: new Date('2023-12-01'), description: 'Своды правил и строительные нормы' },
    { id: 'mgsn', name: 'МГСН', type: 'documents', category: 'technical', source: 'mos.ru/mka', lastUpdated: new Date('2023-11-15'), description: 'Московские городские строительные нормы' },
    { id: 'rosreestr', name: 'Росреестр', type: 'api', category: 'legal', source: 'api.rosreestr.ru', lastUpdated: new Date('2024-01-25'), description: 'Данные ЕГРН' },
    { id: 'cian', name: 'ЦИАН/ДомКлик', type: 'api', category: 'market', source: 'api.cian.ru', lastUpdated: new Date('2024-01-27'), description: 'Рыночные данные' },
    { id: 'moek', name: 'МОЭК/МОЭСК', type: 'api', category: 'technical', source: 'api.moek.ru', lastUpdated: new Date('2024-01-10'), description: 'Техусловия на подключение' },
];

// --- AGENT TYPES ---
export type AgentRole =
    | 'orchestrator'      // Agent Zero
    | 'market_analyst'    // Анализ рынка/продаж
    | 'tech_analyst'      // Техусловия
    | 'legal_analyst'     // ГПЗУ/ПЗЗ
    | 'cost_analyst'      // Анализ строителей
    | 'fin_analyst'       // Фин.модель
    | 'architect'         // Архитектор
    | 'structural'        // Конструктор
    | 'mep_engineer'      // Инженер сетей
    | 'landscape';        // Благоустройство

export type AgentStatus =
    | 'idle'
    | 'pending'
    | 'running'
    | 'completed'
    | 'failed'
    | 'waiting';

export interface WorkflowAgent {
    id: string;
    role: AgentRole;
    name: string;
    icon: string;
    status: AgentStatus;
    progress: number;           // 0-100
    knowledgeBases: string[];   // IDs of knowledge bases
    inputs: string[];           // IDs of agents providing input
    outputs: Record<string, any>;  // Results
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
}

// --- WORKFLOW PHASE ---
export type WorkflowPhase = 'investment_analysis' | 'design' | 'sales';

export interface WorkflowBlock {
    id: string;
    phase: WorkflowPhase;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    agents: WorkflowAgent[];
    decision?: 'go' | 'no-go';
    startedAt?: Date;
    completedAt?: Date;
}

// --- FULL WORKFLOW ---
export interface Workflow {
    id: string;
    projectName: string;
    siteAddress: string;
    cadastralNumber?: string;
    createdAt: Date;
    blocks: WorkflowBlock[];
    currentPhase: WorkflowPhase;
}

// --- DEMO WORKFLOW FACTORY ---
export function createDemoWorkflow(siteAddress: string): Workflow {
    const workflowId = `wf-${Date.now()}`;

    return {
        id: workflowId,
        projectName: 'Новый проект',
        siteAddress,
        cadastralNumber: '77:01:0001234:56',
        createdAt: new Date(),
        currentPhase: 'investment_analysis',
        blocks: [
            // BLOCK 1: Investment Analysis
            {
                id: `${workflowId}-invest`,
                phase: 'investment_analysis',
                name: 'Инвестиционный анализ',
                status: 'pending',
                agents: [
                    {
                        id: `${workflowId}-market`,
                        role: 'market_analyst',
                        name: 'Аналитик рынка',
                        icon: '📊',
                        status: 'pending',
                        progress: 0,
                        knowledgeBases: ['cian'],
                        inputs: [],
                        outputs: {}
                    },
                    {
                        id: `${workflowId}-tech`,
                        role: 'tech_analyst',
                        name: 'Аналитик ТУ',
                        icon: '⚡',
                        status: 'pending',
                        progress: 0,
                        knowledgeBases: ['moek', 'rosreestr'],
                        inputs: [],
                        outputs: {}
                    },
                    {
                        id: `${workflowId}-legal`,
                        role: 'legal_analyst',
                        name: 'Юрист ГПЗУ',
                        icon: '⚖️',
                        status: 'pending',
                        progress: 0,
                        knowledgeBases: ['pzz', 'gpzu'],
                        inputs: [],
                        outputs: {}
                    },
                    {
                        id: `${workflowId}-cost`,
                        role: 'cost_analyst',
                        name: 'Сметчик',
                        icon: '👷',
                        status: 'pending',
                        progress: 0,
                        knowledgeBases: [],
                        inputs: [],
                        outputs: {}
                    },
                    {
                        id: `${workflowId}-fin`,
                        role: 'fin_analyst',
                        name: 'Финансист',
                        icon: '💰',
                        status: 'pending',
                        progress: 0,
                        knowledgeBases: [],
                        inputs: [`${workflowId}-market`, `${workflowId}-tech`, `${workflowId}-legal`, `${workflowId}-cost`],
                        outputs: {}
                    }
                ]
            },
            // BLOCK 2: Design (created after GO decision)
            {
                id: `${workflowId}-design`,
                phase: 'design',
                name: 'Проектирование',
                status: 'pending',
                agents: [
                    {
                        id: `${workflowId}-arch`,
                        role: 'architect',
                        name: 'Архитектор',
                        icon: '🏛️',
                        status: 'pending',
                        progress: 0,
                        knowledgeBases: ['sp', 'mgsn'],
                        inputs: [],
                        outputs: {}
                    },
                    {
                        id: `${workflowId}-struct`,
                        role: 'structural',
                        name: 'Конструктор КР',
                        icon: '🏗️',
                        status: 'pending',
                        progress: 0,
                        knowledgeBases: ['sp'],
                        inputs: [`${workflowId}-arch`],
                        outputs: {}
                    },
                    {
                        id: `${workflowId}-mep`,
                        role: 'mep_engineer',
                        name: 'Инженер ИОС',
                        icon: '🔧',
                        status: 'pending',
                        progress: 0,
                        knowledgeBases: ['sp', 'moek'],
                        inputs: [`${workflowId}-arch`],
                        outputs: {}
                    },
                    {
                        id: `${workflowId}-land`,
                        role: 'landscape',
                        name: 'Ландшафт БД',
                        icon: '🌳',
                        status: 'pending',
                        progress: 0,
                        knowledgeBases: ['mgsn'],
                        inputs: [`${workflowId}-arch`],
                        outputs: {}
                    }
                ]
            }
        ]
    };
}

// --- MOCK RESULTS ---
export const MOCK_ANALYSIS_RESULTS = {
    market: {
        avgPricePerSqm: 285000,
        demandIndex: 0.78,
        competitorCount: 12,
        absorptionRate: 0.85,
        recommendation: 'Высокий спрос, конкуренция умеренная'
    },
    tech: {
        electricityAvailable: true,
        electricityPower: 2500, // kW
        gasAvailable: true,
        waterAvailable: true,
        sewerAvailable: true,
        connectionCost: 45000000, // RUB
        recommendation: 'Все сети доступны'
    },
    legal: {
        maxHeight: 75, // meters
        maxDensity: 25000, // sqm/ha
        buildingCoverage: 0.4,
        restrictions: ['Охранная зона метро', 'КУРТ'],
        permitStatus: 'Возможно',
        recommendation: 'Ограничения стандартные для центра'
    },
    cost: {
        constructionCostPerSqm: 95000,
        totalConstructionCost: 2850000000,
        timeline: 24, // months
        contractors: ['ПИК', 'Эталон', 'ФСК'],
        recommendation: 'Стоимость в рынке'
    },
    financial: {
        totalInvestment: 4500000000,
        revenueProjection: 6800000000,
        irr: 22.5,
        npv: 1200000000,
        paybackPeriod: 36, // months
        decision: 'GO',
        recommendation: 'Проект рентабелен, рекомендуем входить'
    }
};
