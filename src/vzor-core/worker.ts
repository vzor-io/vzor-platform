
// worker.ts
// This runs in a separate thread. It holds the C++ instance.

// Mocking the import for the example (In real setup: import Module from './vzor_core.wasm')
// Since we don't have the compiled WASM binary, we will MOCK the WASM behavior purely in JS 
// to ensure the frontend actually works for the user right now.

/* --- MOCK WASM MODULE (Simulating the C++ code behavior) --- */
class MockVzorManager {
    objects = [
        { name: "Foundation Block A", cost: 50000.0, status: 1 },
        { name: "Steel Beams L2", cost: 120000.0, status: 0 },
        { name: "Concrete Slab", cost: 35000.0, status: 0 }
    ];
    listener: any = null;

    subscribe(cb: any) { this.listener = cb; }

    getObjects() { return this.objects; }

    updateObjectCost(name: string, cost: number) {
        const obj = this.objects.find(o => o.name === name);
        if (obj) {
            obj.cost = cost;
            // C++ Logic: Calculate total
            const total = this.objects.reduce((acc, o) => acc + o.cost, 0);

            // Callback
            if (this.listener) {
                this.listener({ type: "DATA_CHANGED", delta_target: name, total_budget: total });
            }
        }
    }

    recalculateBudget() {
        // Simulate heavy C++ delay
        setTimeout(() => {
            const total = this.objects.reduce((acc, o) => acc + o.cost, 0);
            if (this.listener) this.listener({ type: "BUDGET_RECALC_DONE", total });
        }, 800);
    }
}
/* ------------------------------------------------------------- */

let kernel: MockVzorManager | null = null;

self.onmessage = (e: MessageEvent) => {
    const { type, payload } = e.data;

    switch (type) {
        case 'INIT':
            // Instantiate "WASM"
            kernel = new MockVzorManager();

            // "Embind" mapping: We pass a JS function that postMessages back
            kernel.subscribe((eventData: any) => {
                self.postMessage({ type: 'EVENT', payload: eventData });
            });

            self.postMessage({ type: 'READY' });
            break;

        case 'GET_OBJECTS':
            if (kernel) {
                const data = kernel.getObjects();
                self.postMessage({ type: 'OBJECTS_LIST', payload: data });
            }
            break;

        case 'UPDATE_COST':
            if (kernel) {
                kernel.updateObjectCost(payload.name, payload.cost);
            }
            break;

        case 'RECALC':
            if (kernel) kernel.recalculateBudget();
            break;
    }
};
