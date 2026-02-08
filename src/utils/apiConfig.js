/**
 * Утилита для определения API Base URL
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
}

/**
 * Сбрасывает кэш (для совместимости, но не используется)
 */
export function resetApiUrlCache() {
  // Не используется, но оставляем для совместимости
}
