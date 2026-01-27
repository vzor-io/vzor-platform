export interface ExecutionContext {
    inputs: Record<string, any>;
    globalState: any;
}

export interface ExecutionResult {
    outputs: Record<string, any>;
    effects?: any[]; // Side effects like drawing to canvas, logging, etc.
}

/**
 * Base class for all VZOR Nodes.
 * Implements the "Processor" logic for data streaming.
 */
export abstract class VzorNodeProcessor {
    id: string;
    type: string;

    constructor(id: string, type: string) {
        this.id = id;
        this.type = type;
    }

    /**
     * The core logic calculation.
     * Input -> Process -> Output
     */
    abstract execute(context: ExecutionContext): Promise<ExecutionResult>;

    /**
     * Fractal Engine: Returns child nodes if this node is complex/recursive.
     */
    async subdivide(): Promise<VzorNodeProcessor[]> {
        return []; // Base implementation returns no children
    }
}

// Example Implementation
export class GeometryNode extends VzorNodeProcessor {
    async execute(context: ExecutionContext): Promise<ExecutionResult> {
        const { size = 1 } = context.inputs;
        console.log(`[Processor] Executing Geometry Node ${this.id} with size ${size}`);

        return {
            outputs: { geometry: { type: 'box', size } }
        };
    }
}
