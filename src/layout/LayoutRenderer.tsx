
import React from 'react';
import { LayoutNode } from './types';
import { Panel } from 'react-resizable-panels';
import ResizeHandle from './ResizeHandle'; // We will create this
import Tile from './Tile'; // We will create this

// We avoid react-resizable-panels for now to build a pure recursion to match Blender's behavior precisely
// Or we use a custom implementation. For speed and robustness, let's use a simple flex-based recursion first
// or maintain the custom SplitPane approach but recursive.

// LET'S USE THE CUSTOM SPLIT PANE LOGIC RECURSIVELY AS IT PROVED STABLE
// But we need to adapt it to take nodes.

const LayoutRenderer = ({ node, context }: { node: LayoutNode, context: any }) => {
    if (node.type === 'window') {
        return <Tile node={node} context={context} />;
    }

    if (!node.children || node.children.length === 0) return null;

    // For Row/Column, we render children with splitters
    const direction = node.type === 'row' ? 'horizontal' : 'vertical';

    return (
        <div className={`flex h-full w-full ${direction === 'horizontal' ? 'flex-row' : 'flex-col'}`}>
            {node.children.map((child, index) => {
                const isLast = index === node.children.length - 1;
                const size = child.splitPercentage || (100 / node.children!.length);

                return (
                    <React.Fragment key={child.id}>
                        <div style={{ flex: \`\${size} 1 0%\`, position: 'relative' }}>
                        <LayoutRenderer node={child} context={context} />
                    </div>
                         {
                    !isLast && (
                        <div className={`bg-blender-border hover:bg-blender-accent transition-colors z-10
                                 ${direction === 'horizontal' ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'}
                             `}>
                            {/* TODO: Implement Resizing Logic here later */}
                        </div>
                    )
                }
                     </React.Fragment>
    );
})}
        </div >
    );
};

export default LayoutRenderer;
