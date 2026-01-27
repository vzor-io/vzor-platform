// ==================================================
// VZOR Agent System - Type Definitions
// ==================================================

/**
 * Task Status - состояние выполнения задачи
 */
export type TaskStatus =
    | 'PENDING'    // Ожидает запуска
    | 'RUNNING'    // Выполняется
    | 'COMPLETED'  // Завершена успешно
    | 'FAILED'     // Ошибка
    | 'PAUSED';    // Приостановлена

/**
 * Риск-уровень задачи
 */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Тип модели для субагента
 */
export type AgentModel =
    | 'deepseek-v3'      // DeepSeek (основной для субагентов)
    | 'gemini-1.5-pro'   // Gemini (для Agent Zero)
    | 'gpt-4'            // OpenAI (резерв)
    | 'claude-3';        // Anthropic (резерв)

/**
 * База знаний, к которой агент имеет доступ
 */
export interface KnowledgeBase {
    id: string;
    name: string;           // "ПЗЗ Москвы", "ГПЗУ", "СНиП"
    type: 'document' | 'database' | 'api';
    source: string;         // URL или путь к источнику
}

/**
 * Методика работы агента
 */
export interface Methodology {
    id: string;
    name: string;           // "Правовой анализ", "Расчёт NPV"
    version: string;
    description: string;
}

/**
 * Субагент - создаётся Agent Zero для конкретной задачи
 */
export interface SubAgent {
    id: string;

    // Идентификация
    role: string;           // "Юрист", "Экономист", "Градостроитель"
    model: AgentModel;      // Какая LLM используется

    // Конфигурация
    systemPrompt: string;   // Промпт роли
    knowledgeBases: KnowledgeBase[];  // Доступные базы знаний
    methodology?: Methodology;         // Методика работы

    // Состояние
    status: TaskStatus;
    progress: number;       // 0-100
    riskLevel?: RiskLevel;

    // Результаты
    output?: any;           // JSON результат работы
    error?: string;         // Сообщение об ошибке (если FAILED)

    // Метаданные
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
    parentAgentId: string;  // Всегда "agent-zero" для первого уровня
}

/**
 * Agent Zero - мета-агент, диспетчер
 */
export interface AgentZero {
    id: 'agent-zero';
    model: 'gemini-1.5-pro';  // Agent Zero на Gemini

    // Созданные субагенты
    subAgents: SubAgent[];

    // Методы (будут в классе)
    // createSubAgent(task: Task): SubAgent
    // parsePrompt(input: string): Task[]
    // executeTask(task: Task): Promise<void>
}

/**
 * Point3D - расширенный для привязки агента
 */
export interface Point3D {
    id: string;              // UUID, совпадает с Node ID
    position: [number, number, number];

    // Визуал
    color: string;           // Hex цвет
    size: number;
    glowIntensity: number;   // 0-1

    // Привязка к агенту
    agentId?: string;        // ID субагента (если есть)

    // Состояние (отражает статус агента)
    status: TaskStatus;
    riskLevel?: RiskLevel;

    // Данные задачи
    label: string;
    description?: string;
}

/**
 * VzorNode - нода в графе с привязкой к агенту
 */
export interface VzorNode {
    id: string;              // UUID, совпадает с Point ID
    type: string;            // 'agent' | 'input' | 'output' | 'manual'
    position: { x: number; y: number };

    // Данные
    data: {
        label: string;
        status: TaskStatus;

        // Привязка к агенту
        agentId?: string;

        // Порты
        inputs: NodePort[];
        outputs: NodePort[];
    };
}

/**
 * Порт ноды (вход/выход)
 */
export interface NodePort {
    id: string;
    label: string;
    type: 'data' | 'link' | 'geo';  // Жёлтый, синий, зелёный
    value?: any;
    connected?: boolean;
}
