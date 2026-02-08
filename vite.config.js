import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Загружаем переменные окружения
  const env = loadEnv(mode, process.cwd(), '')
  
  // Всегда используем dev tunnel для бэкенда
  const apiUrl = 'https://5f5ntx8k-3000.euw.devtunnels.ms'
  
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          // Для HTTPS dev tunnels
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log(`[Proxy] ${req.method} ${req.url} -> ${apiUrl}${req.url}`)
            })
          }
        }
      }
    },
    // Поддержка переменных REACT_APP_ (как в Create React App)
    define: {
      // Пробрасываем REACT_APP_ переменные в код
      'process.env.REACT_APP_CLERK_PUBLISHABLE_KEY': JSON.stringify(env.REACT_APP_CLERK_PUBLISHABLE_KEY || env.VITE_CLERK_PUBLISHABLE_KEY || ''),
      'process.env.REACT_APP_GOOGLE_CLIENT_ID': JSON.stringify(env.REACT_APP_GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID || ''),
      'process.env.REACT_APP_EMAILJS_SERVICE_ID': JSON.stringify(env.REACT_APP_EMAILJS_SERVICE_ID || env.VITE_EMAILJS_SERVICE_ID || ''),
      'process.env.REACT_APP_EMAILJS_TEMPLATE_ID': JSON.stringify(env.REACT_APP_EMAILJS_TEMPLATE_ID || env.VITE_EMAILJS_TEMPLATE_ID || ''),
      'process.env.REACT_APP_EMAILJS_PUBLIC_KEY': JSON.stringify(env.REACT_APP_EMAILJS_PUBLIC_KEY || env.VITE_EMAILJS_PUBLIC_KEY || ''),
      'process.env.REACT_APP_API_BASE_URL': JSON.stringify(env.REACT_APP_API_BASE_URL || env.VITE_API_BASE_URL || '/api'),
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    },
  }
})





