import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error("Root element 'root' not found in index.html");

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (e: any) {
  // FINAL FALLBACK: Native DOM manipulation if React fails to boot
  document.body.innerHTML = `
    <div style="background: black; color: red; padding: 20px; font-family: monospace; white-space: pre-wrap;">
      <h1>CRITICAL BOOT ERROR</h1>
      <p>${e.toString()}</p>
      <p>${e.stack || ''}</p>
    </div>
  `;
  console.error("BOOT ERROR:", e);
}
