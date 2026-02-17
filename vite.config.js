import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Загружаем переменные окружения
  const env = loadEnv(mode, process.cwd(), '')
  
  // ============================================================
  // КОНФИГУРАЦИЯ ПОРТОВ:
  // ============================================================
  // Локальная разработка:
  //   - Vite (фронтенд): 5173
  //   - Сервер (бэкенд): 3000
  //
  // На Railway (production):
  //   - Vite (фронтенд): PORT (Railway установит автоматически, например 8080)
  //   - Сервер (бэкенд): SERVER_PORT (нужно установить 3000 в Railway Variables)
  // ============================================================
  
  // Порт сервера (бэкенд) - всегда 3000 (локально и на Railway)
  const serverPort = process.env.SERVER_PORT || '3000'
  
  // URL API для проксирования
  // Используем 127.0.0.1 вместо localhost для избежания проблем с IPv6/DNS на Railway
  const apiUrl = process.env.API_URL || `http://127.0.0.1:${serverPort}`
  
  // Порт для Vite (фронтенд)
  // Локально: 5173, на Railway: PORT (устанавливает Railway автоматически)
  const vitePort = process.env.PORT ? parseInt(process.env.PORT) : 5173
  
  // Логирование для диагностики (важно для Railway - видим, что Vite запускается)
  console.log('═══════════════════════════════════════════════════════');
  console.log('[FRONTEND] 🚀 Инициализация Vite...');
  console.log('[FRONTEND] 📋 Переменные окружения:');
  console.log('[FRONTEND]    - PORT:', process.env.PORT || 'не установлен');
  console.log('[FRONTEND]    - SERVER_PORT:', process.env.SERVER_PORT || 'не установлен');
  console.log('[FRONTEND]    - NODE_ENV:', process.env.NODE_ENV || 'не установлен');
  console.log('[FRONTEND] 🌐 Vite будет слушать на порту:', vitePort);
  console.log('[FRONTEND] 🔗 API URL для прокси:', apiUrl);
  console.log('[FRONTEND] ═══════════════════════════════════════════════════════');
  
  return {
    plugins: [react()],
    server: {
      port: vitePort,
      host: '0.0.0.0', // Слушаем на всех интерфейсах для Railway
      strictPort: false, // НЕ строгий порт - если порт занят, попробуем другой (для диагностики)
      // ВАЖНО: Railway устанавливает PORT, но если порт занят, лучше увидеть ошибку, чем молча падать
      // Разрешаем все Railway хосты
      allowedHosts: [
        '.railway.app',
        '.up.railway.app',
        'web-production-5f1e0.up.railway.app' // Конкретный хост из ошибки
      ],
      hmr: {
        clientPort: vitePort // Для HMR на Railway
      },
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          // Используем IPv4 для избежания проблем с IPv6 на Railway
          // Это решает ошибки NO_SOCKET и IPV6_NDISC_BAD_CODE
          family: 4, // Принудительно используем IPv4
          // Для локальной разработки
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log(`[Proxy] ${req.method} ${req.url} -> ${apiUrl}${req.url}`)
            })
            proxy.on('error', (err, req, res) => {
              console.error(`[Proxy Error] ${err.message} для ${req.url}`)
            })
          }
        },
        '/health': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          // Используем IPv4 для избежания проблем с IPv6 на Railway
          family: 4 // Принудительно используем IPv4
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





