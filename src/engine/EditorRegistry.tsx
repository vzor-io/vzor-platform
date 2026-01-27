import React from 'react';
import { Box, GitBranch, Settings, Terminal, Layers } from 'lucide-react';
import Viewport3D from '../components/Viewport3D';
import NodeGraph from '../components/NodeGraph';
import type { EditorType } from '../store/AreaStore';

// Lazy placeholder components for optional editors
const PropertiesPanel = React.lazy(() => import('../components/PropertiesPanel'));
const ConsolePanel = React.lazy(() => import('../components/ConsolePanel'));
const OutlinerPanel = React.lazy(() => import('../components/OutlinerPanel'));

export interface EditorDefinition {
    type: EditorType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    component: React.ComponentType<any>;
}

export const EDITORS: Record<EditorType, EditorDefinition> = {
    '3d': {
        type: '3d',
        label: '3D Viewport',
        icon: Box,
        component: Viewport3D
    },
    'nodes': {
        type: 'nodes',
        label: 'Agent Nodes',
        icon: GitBranch,
        component: NodeGraph
    },
    'properties': {
        type: 'properties',
        label: 'Properties',
        icon: Settings,
        component: PropertiesPanel
    },
    'console': {
        type: 'console',
        label: 'Console',
        icon: Terminal,
        component: ConsolePanel
    },
    'outliner': {
        type: 'outliner',
        label: 'Outliner',
        icon: Layers,
        component: OutlinerPanel
    }
};

export function getEditor(type: EditorType): EditorDefinition {
    return EDITORS[type] || EDITORS['3d'];
}

export function getEditorList(): EditorDefinition[] {
    return Object.values(EDITORS);
}
