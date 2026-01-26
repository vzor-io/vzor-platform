
export type WindowType = 'VIEWPORT' | 'NODES' | 'PROPERTIES' | 'OUTLINER' | 'TEXT' | 'TERMINAL';

export interface LayoutNode {
    id: string;
    type: 'row' | 'column' | 'window';
    children?: LayoutNode[]; // For row/column
    splitPercentage?: number; // Only for children of row/column (except the last one)

    // For 'window' type
    windowType?: WindowType;
    data?: any; // Extra state for that specific window instance
}

export interface LayoutContextType {
    root: LayoutNode;
    splitWindow: (nodeId: string, direction: 'horizontal' | 'vertical') => void;
    closeWindow: (nodeId: string) => void;
    updateWindowType: (nodeId: string, newType: WindowType) => void;
    resizeWindow: (nodeId: string, newPercentage: number) => void;
}
