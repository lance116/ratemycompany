import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const container = document.getElementById("root")

if (!container) {
  document.body.innerHTML = '<div style="font-family: system-ui; padding: 20px; color: red;">ERROR: Root element not found</div>'
} else {
  try {
    createRoot(container).render(<App />);
  } catch (error) {
    document.body.innerHTML = `<div style="font-family: system-ui; padding: 20px; color: red; white-space: pre-wrap;">ERROR: ${String(error)}</div>`
    console.error('Failed to render app:', error)
  }
}
