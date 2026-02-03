// ==================================================
// Agent Zero - Мета-агент, Диспетчер
// ==================================================

import type { SubAgent, TaskStatus, AgentModel, KnowledgeBase, Methodology } from '../types/agent';

// Генератор UUID
const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Библиотека ролей агентов (предустановленные шаблоны)
 */
const AGENT_ROLES: Record<string, {
    role: string;
    model: AgentModel;
    systemPrompt: string;
    defaultKnowledgeBases: string[];
    methodology?: string;
}> = {
    lawyer: {
        role: 'Юрист-Градостроитель',
        model: 'deepseek-v3',
        systemPrompt: 'Ты — юрист в сфере градостроительства. Анализируй документы на соответствие ПЗЗ, ГПЗУ и действующему законодательству.',
        defaultKnowledgeBases: ['pzz', 'gpzu'],
        methodology: 'legal_analysis'
    },
    economist: {
        role: 'Инвестиционный Аналитик',
        model: 'deepseek-v3',
        systemPrompt: 'Ты — инвестиционный аналитик. Рассчитывай NPV, ROI, срок окупаемости проектов.',
        defaultKnowledgeBases: ['market_data', 'financial_models'],
        methodology: 'npv_calculation'
    },
    urbanist: {
        role: 'Градостроитель',
        model: 'deepseek-v3',
        systemPrompt: 'Ты — градостроитель. Определяй допустимую плотность застройки, этажность, нормы парковки.',
        defaultKnowledgeBases: ['snip', 'gost', 'local_norms'],
        methodology: 'urban_planning'
    },
    ecologist: {
        role: 'Эколог',
        model: 'deepseek-v3',
        systemPrompt: 'Ты — эколог. Оценивай экологические риски, проверяй охранные зоны.',
        defaultKnowledgeBases: ['eco_zones', 'sanpin'],
        methodology: 'eco_assessment'
    }
};

/**
 * Библиотека баз знаний
 */
const KNOWLEDGE_BASES: Record<string, KnowledgeBase> = {
    pzz: { id: 'pzz', name: 'ПЗЗ Москвы', type: 'document', source: '/kb/pzz/' },
    gpzu: { id: 'gpzu', name: 'ГПЗУ', type: 'document', source: '/kb/gpzu/' },
    snip: { id: 'snip', name: 'СНиП', type: 'document', source: '/kb/snip/' },
    gost: { id: 'gost', name: 'ГОСТ', type: 'document', source: '/kb/gost/' },
    market_data: { id: 'market_data', name: 'Рыночные данные', type: 'api', source: '/api/market' },
    financial_models: { id: 'financial_models', name: 'Финансовые модели', type: 'database', source: '/db/finance' },
    local_norms: { id: 'local_norms', name: 'Местные нормативы', type: 'document', source: '/kb/local/' },
    eco_zones: { id: 'eco_zones', name: 'Экологические зоны', type: 'database', source: '/db/eco' },
    sanpin: { id: 'sanpin', name: 'СанПиН', type: 'document', source: '/kb/sanpin/' }
};

/**
 * Agent Zero Class
 */
export class AgentZeroService {
    private subAgents: Map<string, SubAgent> = new Map();

    /**
     * Парсит пользовательский запрос и определяет нужных субагентов
     */
    async parsePrompt(input: string): Promise<{
        rootTask: { id: string; label: string };
        requiredAgents: string[];
    }> {
        // TODO: Здесь будет вызов LLM для умного парсинга
        // Пока — простая логика по ключевым словам

        const requiredAgents: string[] = [];
        const inputLower = input.toLowerCase();

        if (inputLower.includes('участок') || inputLower.includes('гпзу') || inputLower.includes('пзз')) {
            requiredAgents.push('lawyer');
        }
        if (inputLower.includes('инвест') || inputLower.includes('окупаем') || inputLower.includes('npv')) {
            requiredAgents.push('economist');
        }
        if (inputLower.includes('этаж') || inputLower.includes('плотность') || inputLower.includes('застрой')) {
            requiredAgents.push('urbanist');
        }
        if (inputLower.includes('эколог') || inputLower.includes('охран') || inputLower.includes('зона')) {
            requiredAgents.push('ecologist');
        }

        // Если ничего не определили — добавляем юриста по умолчанию
        if (requiredAgents.length === 0) {
            requiredAgents.push('lawyer');
        }

        return {
            rootTask: {
                id: generateId(),
                label: input.slice(0, 50) + (input.length > 50 ? '...' : '')
            },
            requiredAgents
        };
    }

    /**
     * Создаёт субагента для задачи
     */
    createSubAgent(roleKey: string, taskLabel: string): SubAgent {
        const roleConfig = AGENT_ROLES[roleKey];
        if (!roleConfig) {
            throw new Error(`Unknown agent role: ${roleKey}`);
        }

        const knowledgeBases = roleConfig.defaultKnowledgeBases
            .map(kbId => KNOWLEDGE_BASES[kbId])
            .filter(Boolean);

        const agent: SubAgent = {
            id: generateId(),
            role: roleConfig.role,
            model: roleConfig.model,
            systemPrompt: roleConfig.systemPrompt,
            knowledgeBases,
            methodology: roleConfig.methodology ? {
                id: roleConfig.methodology,
                name: roleConfig.methodology.replace('_', ' ').toUpperCase(),
                version: '1.0',
                description: ''
            } : undefined,
            status: 'PENDING',
            progress: 0,
            createdAt: Date.now(),
            parentAgentId: 'agent-zero'
        };

        this.subAgents.set(agent.id, agent);
        return agent;
    }

    /**
     * Получить субагента по ID
     */
    getSubAgent(id: string): SubAgent | undefined {
        return this.subAgents.get(id);
    }

    /**
     * Получить всех субагентов
     */
    getAllSubAgents(): SubAgent[] {
        return Array.from(this.subAgents.values());
    }

    /**
     * Обновить статус субагента
     */
    updateSubAgentStatus(id: string, status: TaskStatus, progress?: number): void {
        const agent = this.subAgents.get(id);
        if (agent) {
            agent.status = status;
            if (progress !== undefined) agent.progress = progress;
            if (status === 'RUNNING' && !agent.startedAt) agent.startedAt = Date.now();
            if (status === 'COMPLETED' || status === 'FAILED') agent.completedAt = Date.now();
        }
    }

    /**
     * Симуляция выполнения задачи (для демо)
     */
    async simulateExecution(agentId: string): Promise<void> {
        const agent = this.subAgents.get(agentId);
        if (!agent) return;

        this.updateSubAgentStatus(agentId, 'RUNNING', 0);

        // Симуляция прогресса
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 300));
            this.updateSubAgentStatus(agentId, 'RUNNING', i);
        }

        // Завершение
        this.updateSubAgentStatus(agentId, 'COMPLETED', 100);
        agent.output = { result: 'Анализ завершён', data: {} };
    }
}

// Singleton instance
export const agentZero = new AgentZeroService();
