import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import type { Task, Connection } from '../types/task';

enableMapSet();

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

        removeTask: (id) => set((state) => {
            state.tasks.delete(id);
            // Удаляем связанные соединения
            state.connections = state.connections.filter(
                c => c.sourceId !== id && c.targetId !== id
            );
        }),

        selectTask: (id) => set((state) => {
            state.selectedTaskId = id;
        }),

        addConnection: (conn) => set((state) => {
            state.connections.push(conn);
        }),

        removeConnection: (id) => set((state) => {
            state.connections = state.connections.filter(c => c.id !== id);
        }),

        setFromAgentZero: (tasks, connections) => set((state) => {
            state.tasks.clear();
            tasks.forEach(t => state.tasks.set(t.id, t));
            state.connections = connections;
        }),

        clear: () => set((state) => {
            state.tasks.clear();
            state.connections = [];
            state.selectedTaskId = null;
        }),
    }))
);
