export const SocketType = {
    GEOMETRY: "RED",
    DATA: "BLUE",
    FLOW: "WHITE"
} as const;

export type SocketType = typeof SocketType[keyof typeof SocketType];

export interface Socket {
    name: string;
    type: SocketType;
}

export interface NodeData {
    id: string;
    type: string;
    label: string;
    inputs: Socket[];
    outputs: Socket[];
    position: { x: number, y: number };
}

export interface GraphData {
    nodes: NodeData[];
    edges: any[];
}
