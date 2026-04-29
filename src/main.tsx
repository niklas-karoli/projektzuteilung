import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

const container = document.getElementById('root');

if (!container) {
  throw new Error("Failed to find the root element");
}

try {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (error) {
  console.error("Critical error during app initialization:", error);
  const errorDisplay = document.getElementById('error-display');
  if (errorDisplay) {
    errorDisplay.style.display = 'block';
    errorDisplay.innerHTML += '<h2>Initialisierungsfehler</h2><pre>' + (error instanceof Error ? error.stack : String(error)) + '</pre>';
  }
}
