
import React, { useState, useCallback } from 'react';
import {
    type LayoutState,
    createInitialState,
    splitArea as kernelSplitArea,
    resizeNode as kernelResizeNode,
    type WindowType,
    type BSPNode
} from './kernel';
import { Area } from './Area';
import { Resizer } from './Resizer';
import { LayoutContext, useLayout, type ILayoutContext } from './context';
export { useLayout };

// --- RECURSIVE RENDERER ---
const BSPRenderer = ({ nodeId, state }: { nodeId: string, state: LayoutState }) => {
    const { resizeNode } = useLayout();
    const node = state.nodes[nodeId];
    if (!node) return null;

    if (node.type === 'AREA') {
        return <Area area={node} />;
    }

    if (node.type === 'SPLIT') {
        // In Blender: Horizontal Split = Top/Bottom. Vertical Split = Left/Right.
        // Wait, "Split Area Horizontally" allows dragging the line UP/DOWN. So the containers are stacked Vertically.
        // Let's stick to flex definitions: ROW (Left/Right), COL (Top/Bottom).

        const flexClass = node.direction === 'VERTICAL' ? 'flex-row' : 'flex-col';

        return (
            <div className={`flex w-full h-full ${flexClass}`}>
                {/* Child A */}
                <div style={{ flex: `${node.ratio} 1 0%`, position: 'relative', overflow: 'hidden' }}>
                    <BSPRenderer nodeId={node.children[0]} state={state} />
                </div>

                {/* Divide Line */}
                <Resizer
                    direction={node.direction}
                    onResize={(delta) => resizeNode(node.id, delta)}
                />

                {/* Child B */}
                <div style={{ flex: `${1 - node.ratio} 1 0%`, position: 'relative', overflow: 'hidden' }}>
                    <BSPRenderer nodeId={node.children[1]} state={state} />
                </div>
            </div>
        );
    }

    return null;
};

import { createWorkspaceState, type WorkspaceType } from './workspaces';

// ... (BSPRenderer stays same)

// --- MAIN PROVIDER ---
export const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
    const [layout, setLayout] = useState<LayoutState>(createWorkspaceState('CORE'));
    const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceType>('CORE');

    const splitArea = useCallback((id: string, dir: 'HORIZONTAL' | 'VERTICAL') => {
        setLayout(prev => kernelSplitArea(prev, id, dir));
    }, []);

    const resizeNode = useCallback((id: string, delta: number) => {
        setLayout(prev => kernelResizeNode(prev, id, delta));
    }, []);

    const setWindowType = useCallback((id: string, type: WindowType) => {
        setLayout(prev => {
            const node = prev.nodes[id];
            if (node && node.type === 'AREA') {
                return { ...prev, nodes: { ...prev.nodes, [id]: { ...node, windowType: type } } };
            }
            return prev;
        });
    }, []);

    const closeArea = useCallback((id: string) => {
        console.log("Close requested", id);
    }, []);

    const switchWorkspace = useCallback((type: WorkspaceType) => {
        setActiveWorkspace(type);
        setLayout(createWorkspaceState(type));
    }, []);

    const ctx: ILayoutContext = {
        state: layout,
        splitArea,
        setWindowType,
        closeArea,
        resizeNode,
        switchWorkspace,
        activeWorkspace
    };

    return (
        <LayoutContext.Provider value={ctx}>
            {children}
        </LayoutContext.Provider>
    );
};

// --- VIEW COMPONENT ---
export const WorkspaceView = () => {
    const { state } = useLayout();
    return (
        <div className="w-full h-full bg-transparent text-white font-sans overflow-hidden">
            <BSPRenderer nodeId={state.rootId} state={state} />
        </div>
    );
};
