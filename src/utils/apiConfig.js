/**
 * Утилита для определения API Base URL
<<<<<<< HEAD
 * Всегда использует dev tunnel для бэкенда
 */

const DEV_TUNNEL_URL = 'https://5f5ntx8k-3000.euw.devtunnels.ms/api'

/**
 * Получает API Base URL
 * Всегда возвращает dev tunnel URL
 */
export async function getApiBaseUrl() {
  return DEV_TUNNEL_URL
}

/**
 * Синхронная версия - возвращает dev tunnel URL
 */
export function getApiBaseUrlSync() {
  return DEV_TUNNEL_URL
=======
 * Использует localhost для локальной разработки
 */

// Используем относительный путь для работы через Vite proxy
const API_BASE_URL = '/api'

/**
 * Получает API Base URL
 * Возвращает localhost URL для локальной разработки
 */
export async function getApiBaseUrl() {
  return API_BASE_URL
}

/**
 * Синхронная версия - возвращает localhost URL
 */
export function getApiBaseUrlSync() {
  return API_BASE_URL
>>>>>>> 9834624ce85afa7fe9aa397716cd67d8da737a39
}

/**
 * Сбрасывает кэш (для совместимости, но не используется)
 */
export function resetApiUrlCache() {
  // Не используется, но оставляем для совместимости
}


