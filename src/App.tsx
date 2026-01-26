import LayoutManager from './layout/LayoutManager';
import { TopBar } from './blender-layout/TopBar';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

import { EngineProvider } from './context/EngineContext'; // Import

function App() {
  return (
    <ErrorBoundary>
      <EngineProvider>
        <div className="flex flex-col h-screen w-screen bg-[#050505] overflow-hidden">
          <TopBar />
          <div className="flex-1 min-h-0 relative">
            <LayoutManager />
          </div>
        </div>
      </EngineProvider>
    </ErrorBoundary>
  )
}

export default App;
