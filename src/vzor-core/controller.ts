
// React imports removed as they are unused

// Types representing our C++ Data
export interface VzorObject {
    name: string;
    cost: number;
    status: number;
}

export class VzorCoreController {
    private worker: Worker;
    private listeners: ((type: string, data: any) => void)[] = [];

    constructor() {
        // Initialize Worker
        this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

        this.worker.onmessage = (e) => {
            const { type, payload } = e.data;
            this.notify(type, payload);
        };

        this.worker.postMessage({ type: 'INIT' });
    }

    // Pub/Sub for React Components
    subscribe(callback: (type: string, data: any) => void) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private notify(type: string, data: any) {
        this.listeners.forEach(l => l(type, data));
    }

    // Actions
    getObjects() {
        this.worker.postMessage({ type: 'GET_OBJECTS' });
    }

    updateCost(name: string, cost: number) {
        this.worker.postMessage({ type: 'UPDATE_COST', payload: { name, cost } });
    }

    recalculate() {
        this.worker.postMessage({ type: 'RECALC' });
    }

    terminate() {
        this.worker.terminate();
    }
}
