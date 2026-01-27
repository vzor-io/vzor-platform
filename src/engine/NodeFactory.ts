import type { Node } from '@xyflow/react';

// Node template definitions with inputs/outputs
export const NODE_TEMPLATES = {
    site: {
        label: 'Site Input',
        icon: '📍',
        headerColor: '#2d4a2d',
        inputs: [],
        outputs: [
            { id: 'geometry', label: 'Geometry', type: 'geometry' as const },
            { id: 'area', label: 'Area (m²)', type: 'value' as const },
            { id: 'cad_number', label: 'CAD No.', type: 'string' as const },
            { id: 'address', label: 'Address', type: 'string' as const },
        ]
    },
    agent: {
        label: 'Agent',
        icon: '🤖',
        headerColor: '#4a3d2d',
        inputs: [
            { id: 'task', label: 'Task', type: 'string' as const },
            { id: 'context', label: 'Context', type: 'geometry' as const },
        ],
        outputs: [
            { id: 'result', label: 'Result', type: 'string' as const },
            { id: 'status', label: 'Status', type: 'boolean' as const },
        ]
    },
    analysis: {
        label: 'Analysis',
        icon: '📊',
        headerColor: '#4a2d4a',
        inputs: [
            { id: 'geometry', label: 'Geometry', type: 'geometry' as const },
            { id: 'params', label: 'Parameters', type: 'value' as const },
        ],
        outputs: [
            { id: 'result', label: 'Result', type: 'value' as const },
            { id: 'report', label: 'Report', type: 'string' as const },
            { id: 'valid', label: 'Valid', type: 'boolean' as const },
        ]
    },
    generator: {
        label: 'Generator',
        icon: '🏗️',
        headerColor: '#2d3d4a',
        inputs: [
            { id: 'geometry', label: 'Site', type: 'geometry' as const },
            { id: 'max_height', label: 'Max Height', type: 'value' as const },
            { id: 'max_density', label: 'Max Density', type: 'value' as const },
        ],
        outputs: [
            { id: 'volume', label: 'Volume', type: 'geometry' as const },
            { id: 'gfa', label: 'GFA (m²)', type: 'value' as const },
            { id: 'floors', label: 'Floors', type: 'value' as const },
        ]
    },
    validator: {
        label: 'Validator',
        icon: '✅',
        headerColor: '#2d4a4a',
        inputs: [
            { id: 'geometry', label: 'Geometry', type: 'geometry' as const },
            { id: 'rules', label: 'Rules', type: 'string' as const },
        ],
        outputs: [
            { id: 'valid', label: 'Valid', type: 'boolean' as const },
            { id: 'errors', label: 'Errors', type: 'string' as const },
        ]
    },
    input: {
        label: 'Input',
        icon: '📥',
        headerColor: '#3d3d2d',
        inputs: [],
        outputs: [
            { id: 'value', label: 'Value', type: 'value' as const },
        ]
    },
    output: {
        label: 'Output',
        icon: '📤',
        headerColor: '#3d2d3d',
        inputs: [
            { id: 'value', label: 'Value', type: 'value' as const },
        ],
        outputs: []
    },
};

export type NodeType = keyof typeof NODE_TEMPLATES;

let nodeCounter = 0;

export function createNode(type: NodeType, position?: { x: number, y: number }): Node {
    const template = NODE_TEMPLATES[type];
    nodeCounter++;

    const pos = position || {
        x: 100 + (nodeCounter % 5) * 220,
        y: 100 + Math.floor(nodeCounter / 5) * 150
    };

    return {
        id: `${type}_${Date.now()}_${nodeCounter}`,
        type: 'blender',
        position: pos,
        data: {
            label: template.label,
            icon: template.icon,
            headerColor: template.headerColor,
            inputs: template.inputs,
            outputs: template.outputs,
            status: type === 'agent' ? 'IDLE' : undefined,
        }
    };
}

// Get all node types for menus
export function getNodeTypes(): { type: NodeType, label: string, icon: string }[] {
    return Object.entries(NODE_TEMPLATES).map(([type, template]) => ({
        type: type as NodeType,
        label: template.label,
        icon: template.icon
    }));
}
