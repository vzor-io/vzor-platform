import React, { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { Task } from '../../types/task';
import './TaskNode.css';

// Типы пропсов для ноды: T extends Node
type TaskNodeProps = NodeProps<Node<Task>>;

export const TaskNode = memo(({ data, selected }: { data: Task, selected: boolean }) => {
    return (
        <div className={`task-node ${selected ? 'selected' : ''}`}>
            {/* Header */}
            <div className="task-node-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className={`status-indicator status-${data.status}`} />
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{data.name}</span>
                </div>
                {/* Кнопка закрытия или меню можно добавить здесь */}
            </div>

            {/* Body */}
            <div className="task-node-body">

                {/* Inputs */}
                <div className="io-section">
                    <div className="io-row">
                        <Handle
                            type="target"
                            position={Position.Left}
                            id="context"
                            className="handle-context"
                        />
                        <span className="input-label" style={{ marginLeft: '12px' }}>Context</span>
                    </div>
                    <div className="io-row" style={{ marginTop: '8px' }}>
                        <Handle
                            type="target"
                            position={Position.Left}
                            id="agent"
                            className="handle-agent"
                            style={{ top: 'auto' }}
                        />
                        <span className="input-label" style={{ marginLeft: '12px' }}>Agent</span>
                    </div>
                </div>

                {/* Details Box */}
                <div className="node-details">
                    <div><strong>Agent:</strong> {data.agent.type}</div>
                    <div><strong>Model:</strong> {data.agent.model}</div>
                    {data.status === 'running' && (
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${data.progress}%` }} />
                        </div>
                    )}
                </div>

                {/* Outputs */}
                <div className="io-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div className="io-row">
                        <span className="output-label" style={{ marginRight: '12px' }}>Result</span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="result"
                            className="handle-result"
                        />
                    </div>
                    <div className="io-row" style={{ marginTop: '8px' }}>
                        <span className="output-label" style={{ marginRight: '12px' }}>Data</span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="data"
                            className="handle-data"
                            style={{ top: 'auto' }}
                        />
                    </div>
                    <div className="io-row" style={{ marginTop: '8px' }}>
                        <span className="output-label" style={{ marginRight: '12px' }}>Meta</span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id="meta"
                            className="handle-meta"
                            style={{ top: 'auto' }}
                        />
                    </div>
                </div>

                {/* Actions */}
                <button className="run-button">
                    {data.status === 'running' ? 'RUNNING...' : '▶ EXECUTE'}
                </button>
            </div>
        </div>
    );
});
