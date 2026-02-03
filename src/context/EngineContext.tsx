import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface EngineState {
    sphereScale: number;
    setSphereScale: (scale: number) => void;
    // Project State
    projectState: 'empty' | 'loading' | 'loaded';
    loadProject: () => void;

    // Simulation (Legacy support, but keeping for graph)
    simulationData: {
        area: number;
        density: number;
        price: number;
        volume: number;
        revenue: number;
    };
    updateSimulation: (key: string, value: number) => void;
}

const EngineContext = createContext<EngineState | undefined>(undefined);

export const EngineProvider = ({ children }: { children: ReactNode }) => {
    const [sphereScale, setSphereScale] = useState(1.0);
    const [projectState, setProjectState] = useState<'empty' | 'loading' | 'loaded'>('empty');
    const [simulationData, setSimulationData] = useState({
        area: 0, // Starts empty
        density: 0,
        price: 0,
        volume: 0,
        revenue: 0
    });

    const loadProject = () => {
        setProjectState('loading');
        // Simulate analysis delay
        setTimeout(() => {
            setProjectState('loaded');
            // Auto-fill simulation data after 'analysis'
            setSimulationData(prev => ({ ...prev, area: 23500, density: 15000, price: 350000 }));
        }, 1500);
    };

    const updateSimulation = (key: string, value: number) => {
        setSimulationData(prev => {
            const next = { ...prev, [key]: value };
            next.volume = next.area * (next.density / 10000);
            next.revenue = next.volume * next.price;
            return next;
        });
    };

    return (
        <EngineContext.Provider value={{ sphereScale, setSphereScale, projectState, loadProject, simulationData, updateSimulation }}>
            {children}
        </EngineContext.Provider>
    );
};

export const useEngine = () => {
    const context = useContext(EngineContext);
    if (!context) {
        throw new Error("useEngine must be used within an EngineProvider");
    }
    return context;
};
