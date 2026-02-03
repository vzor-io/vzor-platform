import { useVzorStore } from '../store/store';
import type { AgentTask, ViewportPoint, VzorNodeData } from '../store/store';
import type { Node } from '@xyflow/react';

// Generator for UUIDs (simplified for now)
const generateId = () => Math.random().toString(36).substr(2, 9);

export class ManifestationEngine {

    /**
     * Parses a raw prompt from the user/agent and converts it into actionable Tasks.
     * This is where the Agent logic will eventually sit.
     */
    static async parsePrompt(prompt: string): Promise<AgentTask[]> {
        console.log(`[Manifestation] Parsing prompt: "${prompt}"`);

        // MOCK: Simple parser for demonstration
        // If prompt is "create box", we generate a CREATE task
        if (prompt.toLowerCase().includes('create')) {
            return [{
                id: generateId(),
                type: 'GENERATE',
                prompt: prompt,
                status: 'PENDING',
                createdAt: Date.now(),
                payload: { type: 'geometry_box', params: { size: 1 } }
            }];
        }

        return [];
    }

    /**
     * Executes the tasks, updating the Global Store (Event Bus).
     * Ensuring synchronization between Graph Nodes and 3D Points.
     */
    static manifest(tasks: AgentTask[]) {
        const store = useVzorStore.getState();
        const newNodes: Node<VzorNodeData>[] = [...store.nodes];
        const newPoints: ViewportPoint[] = [...store.points];

        tasks.forEach(task => {
            if (task.type === 'GENERATE') {
                const id = task.id; // SHARED ID for Synchronization

                // 1. Create Graph Node
                const node: Node<VzorNodeData> = {
                    id: id,
                    position: { x: Math.random() * 400, y: Math.random() * 400 },
                    data: { label: task.prompt, value: task.payload },
                    type: 'default', // Using default for now, will be 'agent' or specialized later
                };
                newNodes.push(node);

                // 2. Create 3D Point
                const point: ViewportPoint = {
                    id: id,
                    position: [Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5],
                    color: '#00ff88',
                    size: 1.0,
                    metadata: task.payload
                };
                newPoints.push(point);

                console.log(`[Manifestation] Manifested ID: ${id}`);
                store.updateTaskStatus(task.id, 'COMPLETED');
            }
        });

        // Atomic / Batch update to store
        store.setNodes(newNodes);
        store.setPoints(newPoints);
    }
}
