import { LayoutProvider, WorkspaceView } from './blender-layout'
import { TopBar } from './blender-layout/TopBar'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

function App() {
  return (
    <ErrorBoundary>
      <LayoutProvider>
        <div className="flex flex-col h-screen w-screen bg-[#050505] overflow-hidden">
          <TopBar />
          <div className="flex-1 min-h-0 relative">
            <WorkspaceView />
          </div>
        </div>
      </LayoutProvider>
    </ErrorBoundary>
  )
}

export default App
