import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Загружаем переменные окружения
  const env = loadEnv(mode, process.cwd(), '')
  
  // Определяем URL API
  // В production на Railway: сервер будет на SERVER_PORT (или 3000), Vite на PORT
  const serverPort = process.env.SERVER_PORT || '3000'
  const apiUrl = process.env.API_URL || `http://localhost:${serverPort}`
  
  // Порт для Vite: в production на Railway используем PORT, иначе 5173
  // Railway автоматически устанавливает PORT для основного веб-сервиса
  const vitePort = process.env.PORT ? parseInt(process.env.PORT) : 5173
  
  return {
    plugins: [react()],
    server: {
      port: vitePort,
      host: '0.0.0.0', // Слушаем на всех интерфейсах для Railway
      strictPort: false, // Позволяем использовать другой порт, если указанный занят
      hmr: {
        clientPort: vitePort // Для HMR на Railway
      },
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          // Для локальной разработки
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log(`[Proxy] ${req.method} ${req.url} -> ${apiUrl}${req.url}`)
            })
          }
        },
        '/health': {
          target: apiUrl,
          changeOrigin: true,
          secure: false
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





