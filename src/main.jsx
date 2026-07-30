import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { RefreshStatusProvider } from './realtime/RefreshStatus.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RefreshStatusProvider>
      <App />
    </RefreshStatusProvider>
  </StrictMode>,
)
