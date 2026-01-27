import { create } from 'zustand';
import type { Node, Edge } from '@xyflow/react';
import type { SubAgent } from '../types/agent';

// --- Types ---

// 1. Manifestation Protocol Types
export type TaskType = 'GENERATE' | 'MODIFY' | 'DELETE' | 'QUERY';

export interface AgentTask {
    id: string;
    type: TaskType;
    prompt: string;
    payload?: any;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    createdAt: number;
}

// 2. 3D Viewport Types
export interface ViewportPoint {
    id: string;      // MUST match a Node ID
    position: [number, number, number];
    color?: string;
    size?: number;
    agentId?: string; // Link to SubAgent
    metadata?: any;
}

// 3. Graph Types
export interface VzorNodeData extends Record<string, unknown> {
    label?: string;
    value?: any;
    isOverride?: boolean;
    agentId?: string; // Link to SubAgent
    status?: string;
}

// --- State Interface ---

interface VzorState {
    // Agent Layer
    tasks: AgentTask[];
    subAgents: SubAgent[];
    selectedAgentId: string | null; // For Inspector

    // Graph Layer
    nodes: Node<VzorNodeData>[];
    edges: Edge[];

    // 3D Layer
    points: ViewportPoint[];

    // Global Settings
    isDebug: boolean;

    // --- Actions ---

    // Task Management
    addTask: (task: Omit<AgentTask, 'status' | 'createdAt'>) => void;
    updateTaskStatus: (id: string, status: AgentTask['status']) => void;

    // Agent Management
    addSubAgent: (agent: SubAgent) => void;
    updateSubAgent: (id: string, updates: Partial<SubAgent>) => void;
    selectAgent: (id: string | null) => void;
    getSelectedAgent: () => SubAgent | null;

    // Graph Management
    setNodes: (nodes: Node<VzorNodeData>[]) => void;
    setEdges: (edges: Edge[]) => void;
    onNodesChange: (changes: any[]) => void;
    onEdgesChange: (changes: any[]) => void;
    updateNodeData: (id: string, data: Partial<VzorNodeData>) => void;

    // 3D Management
    setPoints: (points: ViewportPoint[]) => void;
    addPoint: (point: ViewportPoint) => void;
    modifyPoint: (id: string, updates: Partial<ViewportPoint>) => void;
    removePoint: (id: string) => void;

    // Sync: Remove node AND point together
    removeEntity: (id: string) => void;
}

// --- Store Implementation ---

export const useVzorStore = create<VzorState>((set, get) => ({
    tasks: [],
    subAgents: [],
    selectedAgentId: null,
    nodes: [],
    edges: [],
    points: [],
    isDebug: false,

    addTask: (task) => set((state) => ({
        tasks: [...state.tasks, { ...task, status: 'PENDING', createdAt: Date.now() }]
    })),

    updateTaskStatus: (id, status) => set((state) => ({
        tasks: state.tasks.map((t) => t.id === id ? { ...t, status } : t)
    })),

    // Agent actions
    addSubAgent: (agent) => set((state) => ({
        subAgents: [...state.subAgents, agent]
    })),

    updateSubAgent: (id, updates) => set((state) => ({
        subAgents: state.subAgents.map((a) =>
            a.id === id ? { ...a, ...updates } : a
        )
    })),

    selectAgent: (id) => set({ selectedAgentId: id }),

    getSelectedAgent: () => {
        const state = get();
        return state.subAgents.find(a => a.id === state.selectedAgentId) || null;
    },

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),

    onNodesChange: (changes) => {
        console.log("Nodes changed:", changes);
    },
    onEdgesChange: (changes) => {
        console.log("Edges changed:", changes);
    },

    updateNodeData: (id, data) => set((state) => ({
        nodes: state.nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, ...data } } : n
        )
    })),

    setPoints: (points) => set({ points }),

    addPoint: (point) => set((state) => ({
        points: [...state.points, point]
    })),

    modifyPoint: (id, updates) => set((state) => ({
        points: state.points.map((p) =>
            p.id === id ? { ...p, ...updates } : p
        )
    })),

    removePoint: (id) => set((state) => ({
        points: state.points.filter(p => p.id !== id)
    })),

    // Sync removal: removes both node and point with same ID
    removeEntity: (id) => set((state) => ({
        nodes: state.nodes.filter(n => n.id !== id),
        points: state.points.filter(p => p.id !== id),
        edges: state.edges.filter(e => e.source !== id && e.target !== id)
    }))
}));

