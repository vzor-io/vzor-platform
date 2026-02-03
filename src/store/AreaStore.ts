import { create } from 'zustand';

// --- TYPES ---

export type EditorType = '3d' | 'nodes' | 'properties' | 'console' | 'outliner';

export interface Area {
    id: string;
    editorType: EditorType;
}

export interface AreaSplit {
    id: string;
    direction: 'horizontal' | 'vertical';
    ratio: number; // 0-1, position of splitter
    first: AreaNode;
    second: AreaNode;
}

export type AreaNode = Area | AreaSplit;

function isAreaSplit(node: AreaNode): node is AreaSplit {
    return 'direction' in node;
}

// --- STORE ---

interface AreaState {
    root: AreaNode;

    // Actions
    setEditorType: (areaId: string, editorType: EditorType) => void;
    splitArea: (areaId: string, direction: 'horizontal' | 'vertical') => void;
    joinAreas: (areaId: string, direction: 'left' | 'right' | 'up' | 'down') => void;
    setSplitRatio: (splitId: string, ratio: number) => void;
    resetLayout: () => void;
}

// Generate unique ID
const genId = () => Math.random().toString(36).substr(2, 9);

// Default layout: 3 columns (3D | Nodes | Properties)
const DEFAULT_LAYOUT: AreaNode = {
    id: 'root',
    direction: 'horizontal',
    ratio: 0.35,
    first: { id: 'area-3d', editorType: '3d' as EditorType },
    second: {
        id: 'split-right',
        direction: 'horizontal',
        ratio: 0.6,
        first: { id: 'area-nodes', editorType: 'nodes' as EditorType },
        second: { id: 'area-props', editorType: 'properties' as EditorType }
    }
};

// Recursive helper to find and update area
function updateAreaInNode(node: AreaNode, areaId: string, updater: (area: Area) => Area): AreaNode {
    if (isAreaSplit(node)) {
        return {
            ...node,
            first: updateAreaInNode(node.first, areaId, updater),
            second: updateAreaInNode(node.second, areaId, updater)
        };
    }

    if (node.id === areaId) {
        return updater(node);
    }

    return node;
}

// Recursive helper to find and split area
function splitAreaInNode(
    node: AreaNode,
    areaId: string,
    direction: 'horizontal' | 'vertical'
): AreaNode {
    if (isAreaSplit(node)) {
        return {
            ...node,
            first: splitAreaInNode(node.first, areaId, direction),
            second: splitAreaInNode(node.second, areaId, direction)
        };
    }

    if (node.id === areaId) {
        // Split this area into two
        return {
            id: `split-${genId()}`,
            direction,
            ratio: 0.5,
            first: { ...node, id: `${node.id}-a` },
            second: { id: `area-${genId()}`, editorType: node.editorType }
        };
    }

    return node;
}

// Recursive helper to update split ratio
function updateSplitRatio(node: AreaNode, splitId: string, ratio: number): AreaNode {
    if (isAreaSplit(node)) {
        if (node.id === splitId) {
            return { ...node, ratio: Math.max(0.1, Math.min(0.9, ratio)) };
        }
        return {
            ...node,
            first: updateSplitRatio(node.first, splitId, ratio),
            second: updateSplitRatio(node.second, splitId, ratio)
        };
    }
    return node;
}

export const useAreaStore = create<AreaState>((set) => ({
    root: DEFAULT_LAYOUT,

    setEditorType: (areaId, editorType) => set((state) => ({
        root: updateAreaInNode(state.root, areaId, (area) => ({ ...area, editorType }))
    })),

    splitArea: (areaId, direction) => set((state) => ({
        root: splitAreaInNode(state.root, areaId, direction)
    })),

    joinAreas: (areaId, direction) => {
        // TODO: implement join logic
        console.log('Join area', areaId, direction);
    },

    setSplitRatio: (splitId, ratio) => set((state) => ({
        root: updateSplitRatio(state.root, splitId, ratio)
    })),

    resetLayout: () => set({ root: DEFAULT_LAYOUT })
}));

// Helper exports
export { isAreaSplit };
