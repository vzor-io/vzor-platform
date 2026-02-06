import React, { useMemo, useCallback } from 'react';
import { ReactFlow, Background, Controls, type Node, type Edge, useNodesState, useEdgesState, type Connection, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useTaskStore } from '../../store/taskStore';
import { TaskNode } from '../nodes/TaskNode';
import type { Task } from '../../types/task';
import { useShallow } from 'zustand/react/shallow';

const nodeTypes = { task: TaskNode };

export const NodeEditor = () => {
    // Get store actions and data
    const tasks = useTaskStore(useShallow(state => Array.from(state.tasks.values())));
    const connections = useTaskStore(useShallow(state => state.connections));
    const selectTask = useTaskStore(state => state.selectTask);
    const addConnection = useTaskStore(state => state.addConnection);

    // Convert Store Tasks -> ReactFlow Nodes
    // We use useMemo to avoid unnecessary re-renders, but we need to be careful about stale data.
    // In a real app with frequent updates, we might pass store state directly into custom nodes context
    // or use specific selectors. For now, regenerating nodes on tasks change is acceptable.
    const nodes: Node<Task>[] = useMemo(() => tasks.map(task => ({
        id: task.id,
        type: 'task',
        position: task.position2D,
        data: task,
    })), [tasks]);

    // Convert Store Connections -> ReactFlow Edges
    const edges: Edge[] = useMemo(() => connections.map(conn => ({
        id: conn.id,
        source: conn.sourceId,
        target: conn.targetId,
        sourceHandle: conn.sourceOutput,
        targetHandle: conn.targetInput,
        animated: true,
        style: { stroke: '#4ECDC4' },
    })), [connections]);

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        selectTask(node.id);
    }, [selectTask]);

    const onConnect = useCallback((params: Connection) => {
        if (!params.source || !params.target) return;

        // Add to store
        addConnection({
            id: `e${params.source}-${params.target}-${Date.now()}`,
            sourceId: params.source,
            targetId: params.target,
            sourceOutput: params.sourceHandle || 'result',
            targetInput: params.targetHandle || 'context',
        });
    }, [addConnection]);

    return (
        <div style={{ width: '100%', height: '100%', background: '#0f0f23' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={onNodeClick}
                onConnect={onConnect}
                fitView
                colorMode="dark"
            >
                <Background color="#333" gap={20} />
                <Controls />
            </ReactFlow>
        </div>
    );
};
