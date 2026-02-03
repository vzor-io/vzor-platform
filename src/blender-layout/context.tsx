import { createContext, useContext } from 'react';
import type { LayoutState, WindowType } from './kernel';
import type { WorkspaceType } from './workspaces';

export interface ILayoutContext {
    state: LayoutState;
    splitArea: (id: string, dir: 'HORIZONTAL' | 'VERTICAL') => void;
    setWindowType: (id: string, type: WindowType) => void;
    closeArea: (id: string) => void;
    resizeNode: (id: string, delta: number) => void;
    switchWorkspace: (type: WorkspaceType) => void;
    activeWorkspace: WorkspaceType;
}

export const LayoutContext = createContext<ILayoutContext | null>(null);

export const useLayout = () => {
    const ctx = useContext(LayoutContext);
    if (!ctx) throw new Error("useLayout must be used within LayoutManager");
    return ctx;
};
