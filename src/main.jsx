import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/config'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#f9fafb',
      color: '#111827',
      fontFamily: 'Poppins, sans-serif'
    }}>Загрузка...</div>}>
      <App />
    </Suspense>
  </StrictMode>,
)
