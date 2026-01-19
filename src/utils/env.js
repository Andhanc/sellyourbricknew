/**
 * Утилита для работы с переменными окружения
 * Поддерживает как REACT_APP_ (Create React App), так и VITE_ (Vite)
 */

/**
 * Получает переменную окружения с поддержкой обоих форматов
 * @param {string} key - Имя переменной без префикса (например, 'CLERK_PUBLISHABLE_KEY')
 * @param {string} defaultValue - Значение по умолчанию
 * @returns {string} Значение переменной окружения
 */
export const getEnv = (key, defaultValue = '') => {
  // В Vite переменные доступны через import.meta.env
  const viteKey = `VITE_${key}`
  const viteValue = import.meta.env[viteKey]
  
  // В Create React App переменные доступны через process.env
  // process.env будет определен через define в vite.config.js
  const reactKey = `REACT_APP_${key}`
  // Проверяем process.env (определен через define в vite.config.js)
  let reactValue = undefined
  try {
    // process.env определен через define в vite.config.js
    if (typeof process !== 'undefined' && process.env && process.env[reactKey]) {
      reactValue = process.env[reactKey]
    }
  } catch (e) {
    // Игнорируем ошибки, если process не определен
  }
  
  // Возвращаем первое доступное значение (приоритет REACT_APP_)
  return reactValue || viteValue || defaultValue
}

/**
 * Получает Clerk Publishable Key
 */
export const getClerkPublishableKey = () => {
  return getEnv('CLERK_PUBLISHABLE_KEY')
}

/**
 * Получает Google Client ID
 */
export const getGoogleClientId = () => {
  return getEnv('GOOGLE_CLIENT_ID')
}

/**
 * Получает API Base URL
 */
export const getApiBaseUrl = () => {
  return getEnv('API_BASE_URL', '/api')
}

/**
 * Получает EmailJS переменные
 */
export const getEmailJsConfig = () => {
  return {
    serviceId: getEnv('EMAILJS_SERVICE_ID'),
    templateId: getEnv('EMAILJS_TEMPLATE_ID'),
    publicKey: getEnv('EMAILJS_PUBLIC_KEY'),
  }
}

/**
 * Проверяет, является ли режим разработки
 */
export const isDevelopment = () => {
  // В Vite используется import.meta.env.DEV
  if (import.meta.env.DEV) {
    return true
  }
  // В Create React App используется process.env.NODE_ENV
  try {
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
      return true
    }
  } catch (e) {
    // Игнорируем ошибки
  }
  return false
}
