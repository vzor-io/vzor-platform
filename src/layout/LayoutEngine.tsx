
import React, { useState, useCallback } from 'react';
import type { LayoutNode, LayoutContextType, WindowType } from './types';
import LayoutRenderer from './LayoutRenderer';

const INITIAL_LAYOUT: LayoutNode = {
    id: 'root',
    type: 'row',
    children: [
        {
            id: '1',
            type: 'column',
            splitPercentage: 20,
            children: [
                { id: '1a', type: 'window', windowType: 'OUTLINER', splitPercentage: 50 },
                { id: '1b', type: 'window', windowType: 'PROPERTIES', splitPercentage: 50 }
            ]
        },
        {
            id: '2',
            type: 'column',
            splitPercentage: 80,
            children: [
                { id: '2a', type: 'window', windowType: 'VIEWPORT', splitPercentage: 70 },
                { id: '2b', type: 'window', windowType: 'NODES', splitPercentage: 30 }
            ]
        }
    ]
};

// Helper to deeply clone and modify tree
// In a real app we'd use Immer or similar
const modifyTree = (root: LayoutNode, targetId: string, modifier: (node: LayoutNode) => LayoutNode | void): LayoutNode => {
    if (root.id === targetId) {
        const res = modifier(root);
        return res ? res : root;
    }

    if (root.children) {
        return {
            ...root,
            children: root.children.map(c => modifyTree(c, targetId, modifier))
        };
    }
    return root;
};

const findParent = (root: LayoutNode, targetId: string): LayoutNode | null => {
    if (root.children) {
        if (root.children.some(c => c.id === targetId)) return root;
        for (const c of root.children) {
            const found = findParent(c, targetId);
            if (found) return found;
        }
    }
    return null;
};

export const LayoutEngine = () => {
    const [layout, setLayout] = useState<LayoutNode>(INITIAL_LAYOUT);

    const splitWindow = useCallback((nodeId: string, direction: 'horizontal' | 'vertical') => {
        setLayout(prev => {
            // Find parent to replace the node with a new container
            // Actually, we can just replace the node itself in the tree if we traverse

            // Logic: Replace Node X with Container(Row/Col) -> [Node X, Node Y(Copy)]
            const replaceNode = (node: LayoutNode): LayoutNode => {
                if (node.id === nodeId) {
                    const newId = Math.random().toString(36).substr(2, 9);
                    const copy: LayoutNode = { ...node, id: Math.random().toString(36).substr(2, 9) };
                    const fresh: LayoutNode = {
                        id: newId,
                        type: 'window',
                        windowType: node.windowType, // Duplicate type by default
                        splitPercentage: 50
                    };

                    // Correct splitPercentage for the old node if it becomes a child?
                    // No, children of the new container will share 50/50
                    copy.splitPercentage = 50;

                    return {
                        id: node.id, // Keep ID for stability?? No, usually container takes ID? Let's keep original ID for container to avoid parent ref issues
                        type: direction === 'vertical' ? 'column' : 'row',
                        children: [copy, fresh],
                        windowType: undefined // Clear window props
                    };
                }
                if (node.children) {
                    return { ...node, children: node.children.map(replaceNode) };
                }
                return node;
            };

            return replaceNode(prev);
        });
    }, []);

    const closeWindow = useCallback((nodeId: string) => {
        setLayout(prev => {
            // Logic: Remove node from parent. If parent has 1 child left, replace parent with that child.
            // This requires parent access easily.
            // Simplified: DFS to find parent, remove child, collapse if needed.

            // For now, simpler implementation: Just clear content? No, need true close.
            // Let's defer complex Close logic for a second iteration to ensure Split works first.
            console.log("Close requested for", nodeId);
            return prev;
        });
    }, []);

    const updateWindowType = useCallback((nodeId: string, newType: WindowType) => {
        setLayout(prev => modifyTree(prev, nodeId, (n) => ({ ...n, windowType: newType })));
    }, []);

    const resizeWindow = useCallback((_nodeId: string, _newPercentage: number) => {
        console.log("Resize not implemented yet");
    }, []);

    const contextValue: LayoutContextType = {
        root: layout,
        splitWindow,
        closeWindow,
        updateWindowType,
        resizeWindow
    };

    return (
        <div className="w-screen h-screen bg-black text-white overflow-hidden">
            <LayoutRenderer node={layout} context={contextValue} />
        </div>
    );
};
