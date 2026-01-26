
import React, { useEffect, useState } from 'react';
import { VzorCoreController, type VzorObject } from '../vzor-core/controller';

// --- TABS COMPONENT (Engineering Style) ---
const TabButton = ({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors
            ${active
                ? 'border-[#3d7cc9] text-white bg-[#2d2d2d]'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#2a2a2a]'
            }`}
    >
        {label}
    </button>
);

export const VzorDashboard = () => {
    const [controller, setController] = useState<VzorCoreController | null>(null);
    const [objects, setObjects] = useState<VzorObject[]>([]);
    const [totalBudget, setTotalBudget] = useState(0);
    const [status, setStatus] = useState("Offline");
    const [activeTab, setActiveTab] = useState<'GEOMETRY' | 'MATERIALS' | 'ECONOMY'>('ECONOMY');

    useEffect(() => {
        // Start Core
        const core = new VzorCoreController();
        setController(core);

        const unsub = core.subscribe((type, payload) => {
            if (type === 'READY') {
                setStatus("WASM Ready");
                core.getObjects();
            }
            if (type === 'OBJECTS_LIST') setObjects(payload);
            if (type === 'DATA_CHANGED') {
                setTotalBudget(payload.total_budget);
                setStatus(`Calc: ${payload.delta_target}`);
                core.getObjects();
            }
            if (type === 'BUDGET_RECALC_DONE') {
                setTotalBudget(payload.total);
                setStatus("Verified");
            }
        });

        return () => {
            unsub();
            core.terminate();
        }
    }, []);

    const handleCostChange = (name: string, val: string) => {
        if (controller) controller.updateCost(name, parseFloat(val) || 0);
    };

    return (
        <div className="h-full w-full bg-[#1e1e1e] flex flex-col font-sans text-[#cccccc] text-xs">
            {/* INSPECTOR HEADER */}
            <div className="flex bg-[#252526] border-b border-[#111]">
                <TabButton active={activeTab === 'GEOMETRY'} label="Geometry" onClick={() => setActiveTab('GEOMETRY')} />
                <TabButton active={activeTab === 'MATERIALS'} label="Materials" onClick={() => setActiveTab('MATERIALS')} />
                <TabButton active={activeTab === 'ECONOMY'} label="Economy" onClick={() => setActiveTab('ECONOMY')} />
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-2">

                {/* --- ECONOMY TAB (Main VZOR Function) --- */}
                {activeTab === 'ECONOMY' && (
                    <div className="space-y-4">
                        {/* Status Panel */}
                        <div className="bg-[#252526] p-3 rounded border border-[#333]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-500 font-bold">PROJECT ESTIMATE</span>
                                <span className={`w-2 h-2 rounded-full ${status.includes('Calc') ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></span>
                            </div>
                            <div className="text-2xl font-mono text-white tracking-tighter">
                                ${totalBudget.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1 font-mono">KERNEL: {status}</div>
                        </div>

                        {/* Button */}
                        <button
                            onClick={() => controller?.recalculate()}
                            className="w-full py-2 bg-[#3d7cc9] hover:bg-[#3266a8] text-white font-bold rounded shadow-sm transition-all active:scale-95"
                        >
                            VERIFY LEDGER
                        </button>

                        {/* List */}
                        <div className="space-y-1">
                            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1 pl-1">Line Items</div>
                            {objects.map(obj => (
                                <div key={obj.name} className="flex items-center justify-between p-2 bg-[#2a2a2a] rounded border border-[#333] hover:border-[#555] group">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1 h-3 rounded-full ${obj.status === 1 ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                                        <span className="font-medium text-gray-300 group-hover:text-white">{obj.name}</span>
                                    </div>
                                    <input
                                        type="number"
                                        defaultValue={obj.cost}
                                        onBlur={(e) => handleCostChange(obj.name, e.target.value)}
                                        className="w-20 bg-[#111] border border-[#333] rounded px-1 text-right text-orange-400 focus:border-[#3d7cc9] outline-none font-mono"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- MOCK TABS --- */}
                {activeTab === 'GEOMETRY' && (
                    <div className="p-4 text-center text-gray-500">
                        <div className="text-4xl mb-2">📐</div>
                        <div>Mesh Analysis Module</div>
                        <div className="text-[10px] mt-2">Vertex Count: 12,405</div>
                    </div>
                )}
                {activeTab === 'MATERIALS' && (
                    <div className="p-4 text-center text-gray-500">
                        <div className="text-4xl mb-2">🎨</div>
                        <div>Material Shader Graph</div>
                        <div className="text-[10px] mt-2">PBR Workflow Active</div>
                    </div>
                )}

            </div>
        </div>
    );
};
