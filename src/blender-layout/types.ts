
export type WindowType = 'VIEWPORT' | 'NODES' | 'PROPERTIES' | 'OUTLINER' | 'TIMELINE' | 'TEXT';

export interface LayoutNode {
    id: string;
    type: 'row' | 'column' | 'leaf';
    size: number; // Percentage (flex-basis)
    children?: LayoutNode[]; // For row/column
    windowType?: WindowType; // For leaf
    data?: any;
}

export interface LayoutContextState {
    root: LayoutNode;
    splitWindow: (nodeId: string, direction: 'horizontal' | 'vertical') => void;
    closeWindow: (nodeId: string) => void;
    setWindowType: (nodeId: string, type: WindowType) => void;
    resizeNode: (nodeId: string, delta: number) => void; // Delta in percentage
}
