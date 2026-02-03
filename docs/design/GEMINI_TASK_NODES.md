# ЗАДАНИЕ ДЛЯ GEMINI: Реализация системы нод

> **Файл:** `docs/design/GEMINI_TASK_NODES.md`
> **Дата:** 2026-02-03
> **Приоритет:** Высокий

---

## Цель

Создать систему нод для платформы VZOR, где:
- **Точка на 3D графе = Нода в редакторе = Одна задача**
- **Agent Zero** автоматически создаёт и настраивает задачи
- **Node Editor** — ручной режим контроля (страховка)

---

## Архитектура (кратко)

### Основа: Grasshopper (90%) + Blender (10%)

**От Grasshopper берём:**
- Data Flow: данные текут слева → направо
- Steady-state: пересчёт только при изменении входов
- Панели ввода: слайдеры, текстовые поля
- Проверенная логика для расчётов

**От Blender 5.0 берём:**
- Bundle: группировка данных в один сокет
- Closure: агент как передаваемая функция
- Формы сокетов: ● круг, ◆ ромб, ○ обводка

### Синхронизация

```
┌─────────────────────────────────────────┐
│           TaskStore (Zustand)           │
│                                         │
│   tasks: Map<id, Task>                  │
│   connections: Connection[]             │
│   selectedId: string | null             │
└──────────────────┬──────────────────────┘
                   │
       ┌───────────┴───────────┐
       ▼                       ▼
┌─────────────┐         ┌─────────────┐
│  3D ГРАФ    │ ═══════ │ NODE EDITOR │
│  (Three.js) │  ОДНИ   │ (ReactFlow) │
│             │ ДАННЫЕ  │             │
└─────────────┘         └─────────────┘

Изменение в любом месте → обновляется везде
```

---

## Что нужно реализовать

### 1. TypeScript типы

**Файл:** `platform/frontend/src/types/task.ts`

```typescript
// Статусы задачи
type TaskStatus = 'pending' | 'ready' | 'running' | 'done' | 'error';

// Блоки девелопмента
type BlockType = 'invest' | 'design' | 'build' | 'sales';

// Типы агентов
type AgentType = 'analyst' | 'lawyer' | 'architect' | 'engineer' | 'economist' | 'marketer';

// Основной интерфейс задачи
interface Task {
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

    // Позиции
    position2D: { x: number; y: number };
    position3D: [number, number, number];

    // Связи
    dependencies: string[];         // От кого зависит
    dependents: string[];           // Кто зависит от меня
}

// Источник знаний
interface KnowledgeSource {
    id: string;
    name: string;
    type: 'document' | 'api' | 'database' | 'url';
    // ... детали в node-architecture-full.md
}

// Методология
interface Methodology {
    id: string;
    name: string;
    steps: string[];
    promptTemplate: string;
}

// Результат задачи
interface TaskResult {
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
interface Connection {
    id: string;
    sourceId: string;
    targetId: string;
    sourceOutput: string;
    targetInput: string;
}
```

### 2. TaskStore (Zustand)

**Файл:** `platform/frontend/src/store/taskStore.ts`

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface TaskStore {
    // Данные
    tasks: Map<string, Task>;
    connections: Connection[];
    selectedTaskId: string | null;

    // Actions
    addTask: (task: Task) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    removeTask: (id: string) => void;
    selectTask: (id: string | null) => void;

    addConnection: (conn: Connection) => void;
    removeConnection: (id: string) => void;

    // Bulk
    setFromAgentZero: (tasks: Task[], connections: Connection[]) => void;
    clear: () => void;
}

export const useTaskStore = create<TaskStore>()(
    immer((set) => ({
        tasks: new Map(),
        connections: [],
        selectedTaskId: null,

        addTask: (task) => set((state) => {
            state.tasks.set(task.id, task);
        }),

        updateTask: (id, updates) => set((state) => {
            const task = state.tasks.get(id);
            if (task) Object.assign(task, updates);
        }),

        selectTask: (id) => set((state) => {
            state.selectedTaskId = id;
        }),

        setFromAgentZero: (tasks, connections) => set((state) => {
            state.tasks.clear();
            tasks.forEach(t => state.tasks.set(t.id, t));
            state.connections = connections;
        }),

        // ... остальные методы
    }))
);
```

### 3. Компонент ноды (TaskNode)

**Файл:** `platform/frontend/src/components/nodes/TaskNode.tsx`

Визуальная структура:

```
┌────────────────────────────────────────────────────────┐
│  [●] ГРАДОСТРОИТЕЛЬНЫЙ АНАЛИЗ               [▼] [×]   │
│═══════════════════════════════════════════════════════│
│                                                        │
│  ВХОДЫ                              ВЫХОДЫ            │
│                                                        │
│  ◆ Context ────┐                                      │
│                │     ┌──────────▶ ● Result            │
│                ▼     │                                │
│  ● Agent ───▶ [EXEC] ├──────────▶ ● Data              │
│                      │                                │
│                      └──────────▶ ○ Meta              │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  АГЕНТ: [Analyst        ▼]  MODEL: [DeepSeek ▼]  │ │
│  │  БАЗА:  [ПЗЗ, СНиП     +]                        │ │
│  │  МЕТОД: [Расширенный   ▼]                        │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  ████████████████░░░░░░░░ 65%                    │ │
│  │  Этап: Анализ данных...                          │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  [▶ ВЫПОЛНИТЬ]                       [RUNNING ⟳]      │
└────────────────────────────────────────────────────────┘
```

**Цвета сокетов:**

| Тип | Цвет | Форма |
|-----|------|-------|
| bundle (Context) | #FF6B6B красный | ◆ ромб |
| closure (Agent) | #4ECDC4 бирюзовый | ● круг |
| data | #FFD700 жёлтый | ● круг |
| document (Result) | #32CD32 зелёный | ● круг |
| meta | #FFFFFF белый | ○ обводка |

**Цвета состояний (рамка):**

| Статус | Цвет |
|--------|------|
| pending | серый |
| ready | оранжевый |
| running | синий + пульсация |
| done | зелёный |
| error | красный |
| selected | бирюзовая подсветка |

### 4. Node Editor

**Файл:** `platform/frontend/src/components/NodeEditor/NodeEditor.tsx`

Использовать библиотеку **@xyflow/react** (бывший React Flow).

```typescript
import { ReactFlow, Background, Controls } from '@xyflow/react';
import { useTaskStore } from '../../store/taskStore';
import { TaskNode } from '../nodes/TaskNode';

const nodeTypes = { task: TaskNode };

export const NodeEditor = () => {
    const tasks = useTaskStore(state => Array.from(state.tasks.values()));
    const connections = useTaskStore(state => state.connections);
    const selectTask = useTaskStore(state => state.selectTask);

    // Конвертация Task → ReactFlow Node
    const nodes = tasks.map(task => ({
        id: task.id,
        type: 'task',
        position: task.position2D,
        data: task,
    }));

    // Конвертация Connection → ReactFlow Edge
    const edges = connections.map(conn => ({
        id: conn.id,
        source: conn.sourceId,
        target: conn.targetId,
        sourceHandle: conn.sourceOutput,
        targetHandle: conn.targetInput,
    }));

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => selectTask(node.id)}
            fitView
        >
            <Background />
            <Controls />
        </ReactFlow>
    );
};
```

### 5. Синхронизация с 3D графом

**Файл:** `platform/frontend/src/components/Viewport3D/TaskPoint.tsx`

```typescript
import { useTaskStore } from '../../store/taskStore';

export const Viewport3D = () => {
    const tasks = useTaskStore(state => Array.from(state.tasks.values()));
    const selectedId = useTaskStore(state => state.selectedTaskId);
    const selectTask = useTaskStore(state => state.selectTask);

    return (
        <Canvas>
            {tasks.map(task => (
                <TaskPoint
                    key={task.id}
                    position={task.position3D}
                    status={task.status}
                    isSelected={task.id === selectedId}
                    onClick={() => selectTask(task.id)}
                />
            ))}
            {/* Линии связей между точками */}
        </Canvas>
    );
};
```

---

## Порядок реализации

1. **Создать типы** (`types/task.ts`)
2. **Создать TaskStore** (`store/taskStore.ts`)
3. **Создать компонент TaskNode** (`components/nodes/TaskNode.tsx`)
4. **Интегрировать ReactFlow** (`components/NodeEditor/`)
5. **Синхронизировать с 3D** (`components/Viewport3D/`)
6. **Добавить правую панель** для детального просмотра задачи

---

## Дополнительная документация

Полная спецификация: **`docs/design/node-architecture-full.md`**

Там описано:
- Жизненный цикл задачи (7 шагов выполнения)
- Источники знаний (API, документы, парсинг)
- Методологии и промпты агентов
- Панели ввода данных
- WebSocket для прогресса
- Обработка ошибок

---

## Зависимости (npm)

```json
{
  "@xyflow/react": "^12.0.0",
  "zustand": "^4.5.0",
  "immer": "^10.0.0",
  "three": "^0.160.0",
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.90.0"
}
```

---

## Критерии готовности

- [ ] Ноды отображаются в Node Editor
- [ ] Ноды соединяются проводами
- [ ] Клик на ноду → выделяется точка на 3D графе
- [ ] Клик на точку → выделяется нода
- [ ] Изменение в ноде → обновляется точка
- [ ] Статус задачи отображается цветом (рамка ноды, цвет точки)
- [ ] Прогресс выполнения виден в ноде

---

*Создано для Gemini Pro*
