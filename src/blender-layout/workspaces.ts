
import type { LayoutState, AreaNode, SplitNode } from './kernel';

// FACTORY: Generates different Layout States based on the requested workspace
export type WorkspaceType = 'CORE' | 'FINANCE' | 'TIMELINE' | 'ANALYTICS';

export const createWorkspaceState = (type: WorkspaceType): LayoutState => {
    switch (type) {
        case 'CORE':
            // Classic Engineering: Outliner | Viewport | Inspector
            return createCoreLayout();
        case 'FINANCE':
            // Data Heavy: Table (Big) | Estimator
            return createFinanceLayout();
        case 'TIMELINE':
            // Animation focus: Viewport (Top) | Timeline (Bottom)
            return createTimelineLayout();
        case 'ANALYTICS':
            // Graphs
            return createAnalyticsLayout();
        default:
            return createCoreLayout();
    }
};

const createCoreLayout = (): LayoutState => {
    // [Outliner] | [Viewport / Inspector]
    // Inspector is integrated or split?
    // Let's do: Outliner (Left) - Viewport (Center) - Properties (Right)

    // Nodes
    const outliner: AreaNode = { id: 'w1_outliner', type: 'AREA', windowType: 'OUTLINER' };
    const viewport: AreaNode = { id: 'w1_viewport', type: 'AREA', windowType: 'VIEWPORT' };
    const props: AreaNode = { id: 'w1_props', type: 'AREA', windowType: 'PROPERTIES' };

    // Splits
    const splitRight: SplitNode = {
        id: 'split_r', type: 'SPLIT', direction: 'VERTICAL', ratio: 0.75,
        children: ['w1_viewport', 'w1_props']
    };

    const root: SplitNode = {
        id: 'root', type: 'SPLIT', direction: 'VERTICAL', ratio: 0.2,
        children: ['w1_outliner', 'split_r']
    };

    return {
        rootId: 'root',
        nodes: { 'root': root, 'split_r': splitRight, 'w1_outliner': outliner, 'w1_viewport': viewport, 'w1_props': props }
    };
};

const createFinanceLayout = (): LayoutState => {
    // Focus on ECONOMY Inspector (The Dashboard)
    const table: AreaNode = { id: 'w2_table', type: 'AREA', windowType: 'INSPECTOR' };
    const notes: AreaNode = { id: 'w2_notes', type: 'AREA', windowType: 'TEXT' };

    const root: SplitNode = {
        id: 'root', type: 'SPLIT', direction: 'VERTICAL', ratio: 0.7,
        children: ['w2_table', 'w2_notes']
    };

    return { rootId: 'root', nodes: { 'root': root, 'w2_table': table, 'w2_notes': notes } };
};

const createTimelineLayout = (): LayoutState => {
    const view: AreaNode = { id: 'w3_view', type: 'AREA', windowType: 'VIEWPORT' };
    const time: AreaNode = { id: 'w3_time', type: 'AREA', windowType: 'TIMELINE' };

    const root: SplitNode = {
        id: 'root', type: 'SPLIT', direction: 'HORIZONTAL', ratio: 0.6,
        children: ['w3_view', 'w3_time']
    };

    return { rootId: 'root', nodes: { 'root': root, 'w3_view': view, 'w3_time': time } };
};

const createAnalyticsLayout = (): LayoutState => {
    // Just a placeholder layout for now
    const graph: AreaNode = { id: 'w4_graph', type: 'AREA', windowType: 'NODES' };
    return { rootId: 'root', nodes: { 'root': graph, 'w4_graph': graph } };
}
