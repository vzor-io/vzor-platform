export type TaskStatus = 'pending' | 'ready' | 'running' | 'done' | 'error';

export type BlockType = 'invest' | 'design' | 'build' | 'sales';

export type AgentType = 'analyst' | 'lawyer' | 'architect' | 'engineer' | 'economist' | 'marketer';

export interface Task {
    id: string;                     // UUID
    name: string;                   // "Градостроительный анализ"
    block: BlockType;

    // Контекст (Bundle)
    context: {
        knowledgeSources: KnowledgeSource[];
        methodology: Methodology;
        parameters: Record<string, any>;
        inputData?: any;
    };

    // Агент
    agent: {
        type: AgentType;
        model: string;              // 'deepseek-r1' | 'gpt-4'
    };

    // Выходы
    outputs: {
        formats: ('pdf' | 'excel' | 'json')[];
    };

    // Состояние
    status: TaskStatus;
    progress: number;               // 0-100
    result?: TaskResult;
    error?: string;

    // Позиции
    position2D: { x: number; y: number };
    position3D: [number, number, number];

    // Связи
    dependencies: string[];         // От кого зависит
    dependents: string[];           // Кто зависит от меня

    // Index signature for compatibility
    [key: string]: any;
}

// Источник знаний
export interface KnowledgeSource {
    id: string;
    name: string;
    type: 'document' | 'api' | 'database' | 'url';
    filePath?: string;
    endpoint?: string;
    url?: string;
}

// Методология
export interface Methodology {
    id: string;
    name: string;
    steps: string[];
    promptTemplate: string;
}

// Результат задачи
export interface TaskResult {
    data: Record<string, any>;
    documents: Array<{
        type: string;
        name: string;
        path: string;
    }>;
    meta: {
        executionTime: number;
        tokensUsed: number;
    };
}

// Связь между нодами
export interface Connection {
    id: string;
    sourceId: string;
    targetId: string;
    sourceOutput: string;
    targetInput: string;
}
