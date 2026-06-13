import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Remove inline HTML splash once React mounts
const splash = document.getElementById('splash')
if (splash) splash.classList.add('hidden')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
