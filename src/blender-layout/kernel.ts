
export type WindowType = 'VIEWPORT' | 'NODES' | 'PROPERTIES' | 'OUTLINER' | 'TIMELINE' | 'TEXT' | 'INSPECTOR';

export interface AreaNode {
    id: string;
    type: 'AREA';
    windowType: WindowType;
    parent?: string; // ID of parent split
}

export interface SplitNode {
    id: string;
    type: 'SPLIT';
    direction: 'HORIZONTAL' | 'VERTICAL';
    ratio: number; // 0.0 to 1.0 (default 0.5)
    children: [string, string]; // IDs of two children
    parent?: string;
}

export type BSPNode = AreaNode | SplitNode;

export type LayoutState = {
    rootId: string;
    nodes: Record<string, BSPNode>; // Flat map for O(1) access
};

// --- CORE ALGORITHMS ---

export const createInitialState = (): LayoutState => {
    // LAYOUT STRATEGY: 
    // ROOT (Split Horz)
    //  |-- LEFT: OUTLINER (20%)
    //  |-- CENTER: (Split Vert)
    //       |-- VIEWPORT (70%)
    //       |-- ESTIMATE (30%)
    //  |-- RIGHT: PROPERTIES (25%)

    // Changing Root to be Horizontal Split
    // Actually, let's do: [Outliner] - [Main] - [Properties]
    // And Main is [Viewport] / [Timeline]

    const outliner: AreaNode = { id: 'area_outliner', type: 'AREA', windowType: 'OUTLINER' };
    const viewport: AreaNode = { id: 'area_viewport', type: 'AREA', windowType: 'VIEWPORT' };
    const estimate: AreaNode = { id: 'area_estimate', type: 'AREA', windowType: 'PROPERTIES' }; // Using Dashboard logic here
    const inspector: AreaNode = { id: 'area_inspector', type: 'AREA', windowType: 'INSPECTOR' }; // Separate Inspector

    // Middle Column: Viewport (Top) / Estimate (Bottom)
    const splitMiddle: SplitNode = {
        id: 'split_middle', type: 'SPLIT', direction: 'HORIZONTAL', ratio: 0.7,
        children: ['area_viewport', 'area_estimate']
    };

    // Main Row: Outliner | Middle | Inspector
    // BSP is binary, so: [Outliner] | [Rest]
    // [Rest] = [Middle] | [Inspector]

    const splitRight: SplitNode = {
        id: 'split_right', type: 'SPLIT', direction: 'VERTICAL', ratio: 0.75, // 75% for Middle, 25% for Inspector
        children: ['split_middle', 'area_inspector']
    };

    const splitRoot: SplitNode = {
        id: 'root', type: 'SPLIT', direction: 'VERTICAL', ratio: 0.15, // 15% Outliner
        children: ['area_outliner', 'split_right']
    };

    return {
        rootId: 'root',
        nodes: {
            'root': splitRoot,
            'split_right': splitRight,
            'split_middle': splitMiddle,
            'area_outliner': outliner,
            'area_viewport': viewport,
            'area_estimate': estimate,
            'area_inspector': inspector
        }
    };
};

export const splitArea = (state: LayoutState, areaId: string, direction: 'HORIZONTAL' | 'VERTICAL'): LayoutState => {
    const area = state.nodes[areaId];
    if (!area || area.type !== 'AREA') return state;

    const newSplitId = `split-${Date.now()}`;
    const newAreaId = `area-${Date.now()}`;

    // Create new Sibling Area (Clone type)
    const newArea: AreaNode = {
        id: newAreaId,
        type: 'AREA',
        windowType: area.windowType,
        parent: newSplitId
    };

    // Update Original Area
    const updatedOriginal = { ...area, parent: newSplitId };

    // Create Split Container
    const newSplit: SplitNode = {
        id: newSplitId,
        type: 'SPLIT',
        direction,
        ratio: 0.5,
        children: [area.id, newAreaId], // Original Left/Top, New Right/Bottom
        parent: area.parent
    };

    // Update the Parent of the original area to point to the new Split
    const newNodes = { ...state.nodes };
    delete newNodes[areaId]; // We re-add it/update it, but careful with reference

    // Wait, if we replace the node in the parent's children array
    if (area.parent) {
        const parent = newNodes[area.parent] as SplitNode;
        const childIdx = parent.children.indexOf(areaId);
        const newChildren = [...parent.children] as [string, string];
        newChildren[childIdx] = newSplitId;

        newNodes[area.parent] = { ...parent, children: newChildren };
    } else {
        // Root was split
        state.rootId = newSplitId;
    }

    newNodes[newSplitId] = newSplit;
    newNodes[areaId] = updatedOriginal;
    newNodes[newAreaId] = newArea;

    return { ...state, nodes: newNodes };
};

export const resizeNode = (state: LayoutState, nodeId: string, delta: number): LayoutState => {
    // Delta is percentage 0.0 to 1.0 (relative to parent size? No, absolute delta)
    const node = state.nodes[nodeId];
    if (!node || node.type !== 'SPLIT') return state;

    // Clamp ratio between 0.1 and 0.9
    const newRatio = Math.max(0.1, Math.min(0.9, node.ratio + delta));

    return {
        ...state,
        nodes: {
            ...state.nodes,
            [nodeId]: { ...node, ratio: newRatio }
        }
    };
};
