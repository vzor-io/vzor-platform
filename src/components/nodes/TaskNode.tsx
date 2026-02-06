import React, { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { Task } from '../../types/task';
// Keeping the CSS import, but we'll likely rely on inline or Layout.css for some parts, 
// though the component usually needs its own styles. 
// We should update TaskNode.css too or use inline styles for strict spec compliance.
// Spec says: width 220px, bg #1a1a2e, border 2px solid #333.

// We will use inline styles for the container to ensure strictly 220px as per spec, 
// and class names for states.

type TaskNodeProps = NodeProps<Node<Task>>;

const nodeStyle = {
    width: '220px',
    background: '#1a1a2e',
    border: '2px solid #333',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#eee',
    position: 'relative' as const,
    boxSizing: 'border-box' as const,
};

const headerStyle = {
    padding: '8px 12px',
    borderBottom: '1px solid #333',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(255,255,255,0.02)'
};

const bodyStyle = {
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px'
};

export const TaskNode = memo(({ data, selected }: { data: Task, selected: boolean }) => {
    // Dynamic styles for state
    let borderColor = '#333';
    let boxShadow = 'none';

    if (selected) {
        borderColor = '#4ECDC4';
        boxShadow = '0 0 10px rgba(78, 205, 196, 0.3)';
    } else if (data.status === 'running') {
        borderColor = '#3498db';
        // Pulse animation is handled via CSS class 'running' usually, 
        // but we can add simple shadow here.
    } else if (data.status === 'done') {
        borderColor = '#32CD32';
    } else if (data.status === 'error') {
        borderColor = '#FF6B6B';
    }

    const finalStyle = {
        ...nodeStyle,
        borderColor,
        boxShadow
    };

    return (
        <div className={`task-node ${data.status}`} style={finalStyle}>
            {/* HANDLES */}
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#FFD700', width: '10px', height: '10px', left: '-6px' }}
            />

            {/* Header */}
            <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: borderColor }}>●</span>
                    <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {data.name}
                    </span>
                </div>
                <span style={{ fontSize: '10px', color: '#666' }}>▼</span>
            </div>

            {/* Body */}
            <div style={bodyStyle}>
                <div style={{ color: '#aaa' }}>Agent: <span style={{ color: '#fff' }}>{data.agent.type}</span></div>
                <div style={{ color: '#aaa' }}>Status: <span style={{ color: borderColor }}>{data.status}</span></div>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#32CD32', width: '10px', height: '10px', right: '-6px' }}
            />
        </div>
    );
});
