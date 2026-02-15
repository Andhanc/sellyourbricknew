/**
 * Утилита для определения API Base URL
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
}

/**
 * Сбрасывает кэш (для совместимости, но не используется)
 */
export function resetApiUrlCache() {
  // Не используется, но оставляем для совместимости
}


