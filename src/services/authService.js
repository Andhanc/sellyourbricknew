/**
 * Сервис для управления авторизацией пользователей
 */

import emailjs from '@emailjs/browser'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
const GREEN_API_URL = import.meta.env.VITE_GREEN_API_URL || 'https://api.green-api.com'
const GREEN_API_ID = import.meta.env.VITE_GREEN_API_ID || ''
const GREEN_API_TOKEN = import.meta.env.VITE_GREEN_API_TOKEN || ''

// EmailJS настройки
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || ''
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || ''
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || ''

// Инициализация EmailJS
if (EMAILJS_PUBLIC_KEY) {
  emailjs.init(EMAILJS_PUBLIC_KEY)
} else if (import.meta.env.DEV) {
  console.warn('⚠️ VITE_EMAILJS_PUBLIC_KEY не установлен в .env.local')
}

// Диагностика в режиме разработки
if (import.meta.env.DEV) {
  if (!EMAILJS_SERVICE_ID) {
    console.warn('⚠️ VITE_EMAILJS_SERVICE_ID не установлен в .env.local')
  }
  if (!EMAILJS_TEMPLATE_ID) {
    console.warn('⚠️ VITE_EMAILJS_TEMPLATE_ID не установлен в .env.local')
  }
  if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
    console.log('✅ EmailJS переменные загружены:', {
      serviceId: EMAILJS_SERVICE_ID.substring(0, 15) + '...',
      templateId: EMAILJS_TEMPLATE_ID,
      hasPublicKey: !!EMAILJS_PUBLIC_KEY
    })
  }
}

/**
 * Сохраняет информацию о пользователе в localStorage
 */
export const saveUserData = (userData, loginMethod = 'email') => {
  localStorage.setItem('isLoggedIn', 'true')
  localStorage.setItem('loginMethod', loginMethod)
  
  if (userData.email) {
    localStorage.setItem('userEmail', userData.email)
  }
  
  if (userData.name) {
    localStorage.setItem('userName', userData.name)
  }
  
  if (userData.id) {
    localStorage.setItem('userId', userData.id)
  }
  
  if (userData.picture) {
    localStorage.setItem('userPicture', userData.picture)
  }
  
  if (userData.role) {
    localStorage.setItem('userRole', userData.role)
  }

  if (userData.phone) {
    localStorage.setItem('userPhone', userData.phone)
  }
  
  if (userData.phoneFormatted) {
    localStorage.setItem('userPhoneFormatted', userData.phoneFormatted)
  }
  
  if (userData.country) {
    localStorage.setItem('userCountry', userData.country)
  }
  
  if (userData.countryCode) {
    localStorage.setItem('userCountryCode', userData.countryCode)
  }
  
  if (userData.countryFlag) {
    localStorage.setItem('userCountryFlag', userData.countryFlag)
  }
}

/**
 * Получает данные пользователя из localStorage
 */
export const getUserData = () => {
  return {
    isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
    loginMethod: localStorage.getItem('loginMethod') || 'email',
    email: localStorage.getItem('userEmail') || '',
    name: localStorage.getItem('userName') || '',
    id: localStorage.getItem('userId') || '',
    picture: localStorage.getItem('userPicture') || '',
    role: localStorage.getItem('userRole') || 'client',
    phone: localStorage.getItem('userPhone') || '',
    phoneFormatted: localStorage.getItem('userPhoneFormatted') || '',
    country: localStorage.getItem('userCountry') || '',
    countryCode: localStorage.getItem('userCountryCode') || '',
    countryFlag: localStorage.getItem('userCountryFlag') || ''
  }
}

/**
 * Очищает данные пользователя из localStorage
 */
export const clearUserData = () => {
  localStorage.removeItem('isLoggedIn')
  localStorage.removeItem('loginMethod')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('userName')
  localStorage.removeItem('userId')
  localStorage.removeItem('userPicture')
  localStorage.removeItem('userRole')
  localStorage.removeItem('isOwnerLoggedIn')
  localStorage.removeItem('userPhone')
  localStorage.removeItem('userPhoneFormatted')
  localStorage.removeItem('userCountry')
  localStorage.removeItem('userCountryCode')
  localStorage.removeItem('userCountryFlag')
}

/**
 * Генерирует уникальный код верификации
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Сохраняет код верификации в localStorage (временное решение)
 * В production это должно быть на backend
 */
const saveVerificationCode = (phone, code) => {
  const codes = JSON.parse(localStorage.getItem('whatsappCodes') || '{}')
  codes[phone] = {
    code,
    timestamp: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 минут
  }
  localStorage.setItem('whatsappCodes', JSON.stringify(codes))
}

/**
 * Проверяет код верификации
 */
const verifyCode = (phone, code) => {
  const codes = JSON.parse(localStorage.getItem('whatsappCodes') || '{}')
  const codeData = codes[phone]
  
  if (!codeData) {
    return { valid: false, error: 'Код не найден' }
  }
  
  if (Date.now() > codeData.expiresAt) {
    delete codes[phone]
    localStorage.setItem('whatsappCodes', JSON.stringify(codes))
    return { valid: false, error: 'Код истек' }
  }
  
  if (codeData.code !== code) {
    return { valid: false, error: 'Неверный код' }
  }
  
  // Код верный, удаляем его
  delete codes[phone]
  localStorage.setItem('whatsappCodes', JSON.stringify(codes))
  
  return { valid: true }
}

/**
 * Форматирует номер телефона для WhatsApp (международный формат)
 * Поддерживает все страны мира
 * Принимает номер в формате: код_страны + номер (например: 375291234567)
 */
const formatPhoneNumber = (phone) => {
  // Удаляем все нецифровые символы
  let cleaned = phone.replace(/\D/g, '')
  
  // Если номер пустой, возвращаем как есть
  if (!cleaned) {
    return cleaned
  }
  
  // Номер уже должен быть в международном формате (с кодом страны)
  // Просто возвращаем его как есть
  // Валидация длины будет в validatePhoneNumber
  
  return cleaned
}

/**
 * Определяет страну по коду номера телефона
 */
const getCountryByPhoneCode = (phone) => {
  const digits = phone.replace(/\D/g, '')
  
  // Маппинг кодов стран (от самых длинных к коротким)
  const countryMap = {
    '375': { name: 'Беларусь', code: 'BY', flag: '🇧🇾' },
    '380': { name: 'Украина', code: 'UA', flag: '🇺🇦' },
    '971': { name: 'ОАЭ', code: 'AE', flag: '🇦🇪' },
    '7': { name: 'Россия/Казахстан', code: 'RU', flag: '🇷🇺' },
    '1': { name: 'США/Канада', code: 'US', flag: '🇺🇸' },
    '44': { name: 'Великобритания', code: 'GB', flag: '🇬🇧' },
    '49': { name: 'Германия', code: 'DE', flag: '🇩🇪' },
    '33': { name: 'Франция', code: 'FR', flag: '🇫🇷' },
    '39': { name: 'Италия', code: 'IT', flag: '🇮🇹' },
    '34': { name: 'Испания', code: 'ES', flag: '🇪🇸' },
    '90': { name: 'Турция', code: 'TR', flag: '🇹🇷' },
    '86': { name: 'Китай', code: 'CN', flag: '🇨🇳' },
    '81': { name: 'Япония', code: 'JP', flag: '🇯🇵' },
    '82': { name: 'Южная Корея', code: 'KR', flag: '🇰🇷' },
    '91': { name: 'Индия', code: 'IN', flag: '🇮🇳' },
    '55': { name: 'Бразилия', code: 'BR', flag: '🇧🇷' },
    '52': { name: 'Мексика', code: 'MX', flag: '🇲🇽' },
    '61': { name: 'Австралия', code: 'AU', flag: '🇦🇺' },
    '27': { name: 'ЮАР', code: 'ZA', flag: '🇿🇦' },
    '20': { name: 'Египет', code: 'EG', flag: '🇪🇬' },
  }
  
  // Проверяем коды от самых длинных к коротким
  const sortedCodes = Object.keys(countryMap).sort((a, b) => b.length - a.length)
  
  for (const code of sortedCodes) {
    if (digits.startsWith(code)) {
      return countryMap[code]
    }
  }
  
  return { name: 'Неизвестно', code: 'UN', flag: '🌍' }
}

/**
 * Получает информацию о пользователе из WhatsApp через Green API
 */
const getWhatsAppUserInfo = async (phone) => {
  try {
    if (!GREEN_API_ID || !GREEN_API_TOKEN) {
      console.log('Green API credentials не настроены')
      return null
    }
    
    const formattedPhone = formatPhoneNumber(phone)
    const chatId = `${formattedPhone}@c.us`
    
    console.log('Попытка получить информацию о пользователе:', chatId)
    
    // Метод 1: getContactInfo - получение информации о контакте
    // Green API может требовать, чтобы номер был в контактах или был активный чат
    try {
      const response = await fetch(`${GREEN_API_URL}/waInstance${GREEN_API_ID}/getContactInfo/${GREEN_API_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: chatId
        })
      })
      
      const responseText = await response.text()
      console.log('Raw response от getContactInfo:', responseText)
      
      if (response.ok) {
        let data
        try {
          data = JSON.parse(responseText)
        } catch (e) {
          console.log('Ошибка парсинга JSON:', e)
          data = {}
        }
        
        console.log('Данные от getContactInfo (полный ответ):', JSON.stringify(data, null, 2))
        
        // Green API может вернуть данные в разных форматах
        // Проверяем все возможные поля для имени
        const name = data.name || 
                     data.pushName || 
                     data.notifyName || 
                     data.contactName ||
                     data.displayName ||
                     data.formattedName ||
                     data.profileName ||
                     (data.result && (data.result.name || data.result.pushName || data.result.notifyName)) ||
                     (data.data && (data.data.name || data.data.pushName)) ||
                     null
        
        const photo = data.avatar || 
                      data.avatarUrl || 
                      data.profilePicture || 
                      data.profilePicUrl ||
                      (data.result && data.result.avatar) ||
                      (data.data && data.data.avatar) ||
                      null
        
        console.log('Извлеченное имя:', name, 'Фото:', photo)
        
        if (name && name.trim() !== '' && name.trim() !== 'null' && name.trim() !== 'undefined') {
          console.log('✅ Имя успешно получено из getContactInfo:', name)
          return { name: name.trim(), photo }
        } else {
          console.log('⚠️ Имя не найдено в ответе getContactInfo. Структура ответа:', Object.keys(data))
        }
      } else {
        console.log('❌ Ошибка getContactInfo:', response.status, responseText)
        // Если ошибка 404 или другая, пробуем другие методы
      }
    } catch (error) {
      console.log('❌ Ошибка при вызове getContactInfo:', error.message)
    }
    
    // Метод 2: Проверяем через getChatInfo (может содержать информацию о чате)
    try {
      const chatResponse = await fetch(`${GREEN_API_URL}/waInstance${GREEN_API_ID}/getChatInfo/${GREEN_API_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: chatId
        })
      })
      
      if (chatResponse.ok) {
        const chatData = await chatResponse.json()
        console.log('Данные от getChatInfo:', chatData)
        
        const name = chatData.name || chatData.pushName || chatData.notifyName || null
        const photo = chatData.avatar || chatData.avatarUrl || null
        
        if (name) {
          return { name, photo }
        }
      }
    } catch (error) {
      console.log('Ошибка при вызове getChatInfo:', error.message)
    }
    
    // Метод 3: Проверяем через checkWhatsApp (проверка номера и получение информации)
    try {
      const checkResponse = await fetch(`${GREEN_API_URL}/waInstance${GREEN_API_ID}/checkWhatsapp/${GREEN_API_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone
        })
      })
      
      if (checkResponse.ok) {
        const checkData = await checkResponse.json()
        console.log('Данные от checkWhatsApp:', checkData)
        
        // Если номер есть в WhatsApp, пробуем получить информацию еще раз
        if (checkData.existsWhatsapp) {
          console.log('Номер подтвержден в WhatsApp, повторно запрашиваем информацию...')
          // Повторный запрос через getContactInfo после подтверждения
          const retryResponse = await fetch(`${GREEN_API_URL}/waInstance${GREEN_API_ID}/getContactInfo/${GREEN_API_TOKEN}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chatId: chatId
            })
          })
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json()
            console.log('Данные от повторного getContactInfo:', retryData)
            const name = retryData.name || retryData.pushName || retryData.notifyName || null
            const photo = retryData.avatar || retryData.avatarUrl || null
            if (name && name.trim() !== '') {
              return { name: name.trim(), photo }
            }
          }
        }
      }
    } catch (error) {
      console.log('Ошибка при вызове checkWhatsApp:', error.message)
    }
    
    // Метод 4: Проверяем через getContacts (список контактов)
    try {
      const contactsResponse = await fetch(`${GREEN_API_URL}/waInstance${GREEN_API_ID}/getContacts/${GREEN_API_TOKEN}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json()
        console.log('Данные от getContacts:', contactsData)
        
        // Ищем контакт по номеру
        if (Array.isArray(contactsData)) {
          const contact = contactsData.find(c => {
            const contactId = c.id || c.chatId || c.phoneNumber || ''
            return contactId.includes(formattedPhone) || contactId === chatId
          })
          
          if (contact) {
            console.log('Найден контакт в списке:', contact)
            const name = contact.name || contact.pushName || contact.notifyName || contact.displayName || null
            const photo = contact.avatar || contact.avatarUrl || null
            if (name && name.trim() !== '') {
              console.log('✅ Имя найдено в getContacts:', name)
              return { name: name.trim(), photo }
            }
          }
        }
      }
    } catch (error) {
      console.log('Ошибка при вызове getContacts:', error.message)
    }
    
    console.log('⚠️ Не удалось получить имя пользователя из WhatsApp через все методы')
    return null
  } catch (error) {
    console.error('Ошибка получения информации о пользователе:', error)
    return null
  }
}

/**
 * Валидирует номер телефона (базовая проверка)
 */
export const validatePhoneNumber = (phone) => {
  // Удаляем все нецифровые символы, кроме +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Минимальная длина международного номера (с кодом страны) - 10 цифр
  // Максимальная - 15 цифр (стандарт E.164)
  const digitsOnly = cleaned.replace(/\+/g, '')
  
  if (digitsOnly.length < 10) {
    return { valid: false, error: 'Номер слишком короткий' }
  }
  
  if (digitsOnly.length > 15) {
    return { valid: false, error: 'Номер слишком длинный' }
  }
  
  return { valid: true }
}

/**
 * Отправляет код верификации через WhatsApp
 */
export const sendWhatsAppVerificationCode = async (phone) => {
  try {
    const formattedPhone = formatPhoneNumber(phone)
    const code = generateVerificationCode()
    
    // Сохраняем код
    saveVerificationCode(formattedPhone, code)
    
    // Если есть Green API credentials, отправляем через API
    if (GREEN_API_ID && GREEN_API_TOKEN) {
      try {
        // Формируем URL для отправки сообщения
        // Green API использует формат: {baseUrl}/waInstance{id}/sendMessage/{token}
        const apiUrl = `${GREEN_API_URL}/waInstance${GREEN_API_ID}/sendMessage/${GREEN_API_TOKEN}`
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId: `${formattedPhone}@c.us`,
            message: `🔐 Ваш код авторизации: ${code}\n\nКод действителен в течение 10 минут.\n\nЕсли вы не запрашивали этот код, проигнорируйте это сообщение.`
          })
        })
        
        if (response.ok) {
          return {
            success: true,
            message: 'Код отправлен в WhatsApp'
          }
        }
      } catch (error) {
        console.error('Ошибка отправки через Green API:', error)
      }
    }
    
    // Fallback: открываем WhatsApp с предзаполненным сообщением
    const whatsappMessage = encodeURIComponent(`🔐 Ваш код авторизации: ${code}\n\nКод действителен в течение 10 минут.`)
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${whatsappMessage}`
    
    // В реальном приложении здесь должен быть backend, который отправляет сообщение
    // Для демо мы просто открываем WhatsApp
    window.open(whatsappUrl, '_blank')
    
    return {
      success: true,
      message: 'Откройте WhatsApp для получения кода',
      code: code // Для демо возвращаем код (в production не должно быть)
    }
  } catch (error) {
    console.error('Ошибка отправки кода:', error)
    return {
      success: false,
      error: 'Не удалось отправить код. Попробуйте позже.'
    }
  }
}

/**
 * Проверяет код верификации и авторизует пользователя
 */
export const verifyWhatsAppCode = async (phone, code) => {
  try {
    const formattedPhone = formatPhoneNumber(phone)
    const verification = verifyCode(formattedPhone, code)
    
    if (!verification.valid) {
      return {
        success: false,
        error: verification.error || 'Неверный код'
      }
    }
    
    // Попытка отправить на бэкенд
    try {
      const response = await fetch(`${API_BASE_URL}/auth/whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formattedPhone,
          code
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        saveUserData(data.user, 'whatsapp')
        return {
          success: true,
          user: data.user
        }
      }
    } catch (backendError) {
      console.log('Бэкенд недоступен, используем локальную обработку:', backendError.message)
    }
    
    // Определяем страну по коду номера
    const countryInfo = getCountryByPhoneCode(formattedPhone)
    
    // Форматируем номер для отображения
    const formatPhoneForDisplay = (phone) => {
      const digits = phone.replace(/\D/g, '')
      if (digits.startsWith('375') && digits.length === 12) {
        // Беларусь: +375 (29) 180-33-72
        return `+${digits.substring(0, 3)} (${digits.substring(3, 5)}) ${digits.substring(5, 8)}-${digits.substring(8, 10)}-${digits.substring(10)}`
      } else if (digits.startsWith('7') && digits.length === 11) {
        // Россия: +7 (999) 123-45-67
        return `+${digits.substring(0, 1)} (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7, 9)}-${digits.substring(9)}`
      } else if (digits.startsWith('1') && digits.length === 11) {
        // США/Канада: +1 (555) 123-4567
        return `+${digits.substring(0, 1)} (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`
      }
      // Общий формат
      return `+${digits}`
    }
    
    // Получаем информацию о пользователе из WhatsApp
    // Делаем небольшую задержку, чтобы чат успел создаться после отправки кода
    console.log('Начинаем получение информации о пользователе из WhatsApp...')
    console.log('Номер телефона:', formattedPhone)
    
    // Пробуем получить информацию несколько раз с задержками
    let whatsappInfo = null
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // Ждем 2 секунды между попытками
      }
      whatsappInfo = await getWhatsAppUserInfo(formattedPhone)
      if (whatsappInfo && whatsappInfo.name) {
        console.log(`✅ Имя получено с попытки ${attempt + 1}:`, whatsappInfo.name)
        break
      }
      console.log(`Попытка ${attempt + 1} не удалась, пробуем еще раз...`)
    }
    
    console.log('Итоговая информация из WhatsApp:', whatsappInfo)
    
    // Fallback: создаем пользователя локально
    const userData = {
      phone: formattedPhone,
      phoneFormatted: formatPhoneForDisplay(formattedPhone),
      name: whatsappInfo?.name || `Пользователь ${formattedPhone.substring(formattedPhone.length - 4)}`,
      id: `whatsapp_${formattedPhone}`,
      role: 'client',
      country: countryInfo.name,
      countryCode: countryInfo.code,
      countryFlag: countryInfo.flag,
      picture: whatsappInfo?.photo || null,
      loginMethod: 'whatsapp'
    }
    
    console.log('Созданные данные пользователя:', userData)
    
    saveUserData(userData, 'whatsapp')
    
    return {
      success: true,
      user: userData
    }
  } catch (error) {
    console.error('Ошибка верификации кода:', error)
    return {
      success: false,
      error: 'Не удалось проверить код. Попробуйте позже.'
    }
  }
}

/**
 * Обрабатывает авторизацию через Google
 * Может принимать как credential (JWT токен), так и access_token
 */
export const handleGoogleAuth = async (googleResponse) => {
  try {
    // Если это credential (JWT токен из GoogleOneTap)
    if (googleResponse.credential) {
      return await handleGoogleCredential(googleResponse.credential)
    }
    
    // Если это access_token из useGoogleLogin
    if (googleResponse.access_token) {
      return await handleGoogleAccessToken(googleResponse.access_token)
    }
    
    throw new Error('Неизвестный формат ответа от Google')
  } catch (error) {
    console.error('Ошибка Google авторизации:', error)
    return {
      success: false,
      error: error.message || 'Не удалось обработать данные авторизации'
    }
  }
}

/**
 * Обрабатывает JWT credential токен от Google
 */
const handleGoogleCredential = async (credential) => {
  try {
    // Попытка отправить на бэкенд
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential })
    })

    if (response.ok) {
      const data = await response.json()
      saveUserData(data.user, 'google')
      return {
        success: true,
        user: data.user
      }
    }
  } catch (error) {
    console.log('Бэкенд недоступен, используем локальную обработку:', error.message)
  }
  
  // Fallback: локальное декодирование токена (только для разработки!)
  // ВНИМАНИЕ: В production токен должен проверяться на сервере
  try {
    const payload = JSON.parse(atob(credential.split('.')[1]))
    
    const userData = {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      id: payload.sub || payload.email,
      role: 'client'
    }
    
    saveUserData(userData, 'google')
    
    return {
      success: true,
      user: userData
    }
  } catch (fallbackError) {
    console.error('Ошибка обработки токена:', fallbackError)
    return {
      success: false,
      error: 'Не удалось обработать данные авторизации'
    }
  }
}

/**
 * Обрабатывает access_token от Google OAuth
 */
const handleGoogleAccessToken = async (accessToken) => {
  try {
    // Получаем информацию о пользователе через Google API
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    if (!userInfoResponse.ok) {
      throw new Error('Не удалось получить данные пользователя')
    }

    const userInfo = await userInfoResponse.json()
    
    // Отправляем на бэкенд для регистрации/входа
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
          userInfo
        })
      })

      if (response.ok) {
        const data = await response.json()
        saveUserData(data.user, 'google')
        return {
          success: true,
          user: data.user
        }
      }
    } catch (backendError) {
      console.log('Бэкенд недоступен, используем локальные данные:', backendError.message)
    }
    
    // Fallback: сохраняем данные локально
    const userData = {
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      id: userInfo.id || userInfo.email,
      role: 'client'
    }
    
    saveUserData(userData, 'google')
    
    return {
      success: true,
      user: userData
    }
  } catch (error) {
    console.error('Ошибка получения данных пользователя:', error)
    return {
      success: false,
      error: 'Не удалось получить данные пользователя от Google'
    }
  }
}

/**
 * Проверяет, авторизован ли пользователь
 */
export const isAuthenticated = () => {
  return localStorage.getItem('isLoggedIn') === 'true'
}

/**
 * Выход пользователя
 */
export const logout = () => {
  clearUserData()
}

/**
 * Валидирует email адрес (формат и проверка MX записей)
 */
export const validateEmail = async (email) => {
  // Базовая проверка формата email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Неверный формат email адреса' }
  }

  // Извлекаем домен из email
  const domain = email.split('@')[1]
  
  // Проверка MX записей через публичный API
  try {
    // Используем API для проверки MX записей
    // Можно использовать различные сервисы, например:
    // 1. https://dns.google/resolve?name=domain&type=MX
    // 2. Или собственный backend endpoint
    
    // Попытка через Google DNS API
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      
      // Проверяем, есть ли MX записи
      if (data.Answer && data.Answer.length > 0) {
        // Есть MX записи - домен валиден
        return { valid: true }
      } else {
        // Нет MX записей, но это не всегда означает, что email не существует
        // Многие домены используют A записи для почты
        // Поэтому мы просто предупреждаем, но не блокируем
        console.warn(`Не найдены MX записи для домена ${domain}, но продолжаем`)
        return { valid: true }
      }
    } else {
      // Если API недоступен, просто проверяем формат
      console.warn('DNS API недоступен, проверяем только формат email')
      return { valid: true }
    }
  } catch (error) {
    // Если проверка MX не удалась, все равно разрешаем (формат уже проверен)
    console.warn('Ошибка проверки MX записей:', error.message)
    return { valid: true }
  }
}

/**
 * Сохраняет код верификации email в localStorage
 */
const saveEmailVerificationCode = (email, code) => {
  const codes = JSON.parse(localStorage.getItem('emailCodes') || '{}')
  codes[email.toLowerCase()] = {
    code,
    timestamp: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 минут
    password: null, // Будет сохранен при верификации
    name: null
  }
  localStorage.setItem('emailCodes', JSON.stringify(codes))
}

/**
 * Сохраняет дополнительные данные для регистрации
 */
const saveEmailRegistrationData = (email, password, name) => {
  const codes = JSON.parse(localStorage.getItem('emailCodes') || '{}')
  const emailLower = email.toLowerCase()
  if (codes[emailLower]) {
    codes[emailLower].password = password
    codes[emailLower].name = name
    localStorage.setItem('emailCodes', JSON.stringify(codes))
  }
}

/**
 * Проверяет код верификации email
 */
const verifyEmailCodeLocal = (email, code) => {
  const codes = JSON.parse(localStorage.getItem('emailCodes') || '{}')
  const emailLower = email.toLowerCase()
  const codeData = codes[emailLower]
  
  if (!codeData) {
    return { valid: false, error: 'Код не найден. Запросите новый код.' }
  }
  
  if (Date.now() > codeData.expiresAt) {
    delete codes[emailLower]
    localStorage.setItem('emailCodes', JSON.stringify(codes))
    return { valid: false, error: 'Код истек. Запросите новый код.' }
  }
  
  if (codeData.code !== code) {
    return { valid: false, error: 'Неверный код' }
  }
  
  // Код верный, возвращаем данные регистрации
  const registrationData = {
    password: codeData.password,
    name: codeData.name
  }
  
  // Удаляем код после использования
  delete codes[emailLower]
  localStorage.setItem('emailCodes', JSON.stringify(codes))
  
  return { valid: true, registrationData }
}

/**
 * Отправляет код верификации на email
 */
export const sendEmailVerificationCode = async (email) => {
  try {
    const emailLower = email.toLowerCase()
    const code = generateVerificationCode()
    
    // Сохраняем код
    saveEmailVerificationCode(emailLower, code)
    
    // Попытка отправить через backend API
    try {
      const response = await fetch(`${API_BASE_URL}/auth/email/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailLower,
          code
        })
      })
      
      if (response.ok) {
        return {
          success: true,
          message: 'Код отправлен на email'
        }
      }
    } catch (backendError) {
      console.log('Backend недоступен, пробуем EmailJS:', backendError.message)
    }
    
    // Отправка через EmailJS
    if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
      try {
        // Вычисляем время истечения (10 минут от текущего времени)
        const expirationTime = new Date(Date.now() + 10 * 60 * 1000)
        const expirationTimeString = expirationTime.toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        
        const templateParams = {
          // Стандартные переменные для шаблона "One-Time Password"
          email: emailLower,           // для поля "To Email"
          passcode: code,              // для кода в контенте
          time: expirationTimeString,   // для времени истечения
          // Дополнительные переменные (на случай кастомного шаблона)
          to_email: emailLower,
          verification_code: code,
          from_name: 'Real Estate Auction',
          message: `Ваш код подтверждения: ${code}. Код действителен в течение 10 минут.`
        }
        
        console.log('📧 Отправка email через EmailJS...', {
          serviceId: EMAILJS_SERVICE_ID,
          templateId: EMAILJS_TEMPLATE_ID,
          email: emailLower
        })
        
        const result = await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          templateParams,
          EMAILJS_PUBLIC_KEY
        )
        
        if (result.status === 200) {
          console.log('✅ Email успешно отправлен через EmailJS')
          return {
            success: true,
            message: 'Код отправлен на email'
          }
        } else {
          console.error('❌ EmailJS вернул статус:', result.status)
          return {
            success: false,
            error: 'Не удалось отправить код. Попробуйте позже.'
          }
        }
      } catch (emailjsError) {
        console.error('Ошибка отправки через EmailJS:', emailjsError)
        
        // Проверяем тип ошибки и выводим понятное сообщение
        if (emailjsError.status === 400) {
          const errorText = emailjsError.text || ''
          if (errorText.includes('template ID not found')) {
            console.error('❌ Template ID не найден. Проверьте VITE_EMAILJS_TEMPLATE_ID в .env.local')
            console.error('   Убедитесь, что шаблон существует в EmailJS Dashboard')
          } else if (errorText.includes('service ID')) {
            console.error('❌ Service ID не найден. Проверьте VITE_EMAILJS_SERVICE_ID в .env.local')
          } else if (errorText.includes('Public Key')) {
            console.error('❌ Public Key неверный. Проверьте VITE_EMAILJS_PUBLIC_KEY в .env.local')
          } else {
            console.error('❌ Ошибка EmailJS:', errorText)
          }
        }
        
        // Возвращаем ошибку вместо fallback
        return {
          success: false,
          error: 'Не удалось отправить код на email. Проверьте настройки EmailJS в .env.local'
        }
      }
    }
    
    // Если EmailJS не настроен (нет переменных окружения)
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      console.warn('⚠️ EmailJS не настроен. Добавьте переменные в .env.local:')
      console.warn('   VITE_EMAILJS_SERVICE_ID=service_xxxxxxx')
      console.warn('   VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx')
      console.warn('   VITE_EMAILJS_PUBLIC_KEY=your_public_key')
      console.log(`🔐 Код верификации для ${emailLower}: ${code}`)
      
      return {
        success: false,
        error: 'EmailJS не настроен. Настройте переменные окружения в .env.local'
      }
    }
    
    // Если дошли сюда, значит что-то пошло не так
    return {
      success: false,
      error: 'Не удалось отправить код. Попробуйте позже.'
    }
  } catch (error) {
    console.error('Ошибка отправки кода:', error)
    return {
      success: false,
      error: 'Не удалось отправить код. Попробуйте позже.'
    }
  }
}

/**
 * Проверяет код верификации email и регистрирует пользователя
 */
export const verifyEmailCode = async (email, code, password, name) => {
  try {
    const emailLower = email.toLowerCase()
    
    // Сохраняем данные регистрации перед проверкой кода
    if (password && name) {
      saveEmailRegistrationData(emailLower, password, name)
    }
    
    // Проверяем код
    const verification = verifyEmailCodeLocal(emailLower, code)
    
    if (!verification.valid) {
      return {
        success: false,
        error: verification.error || 'Неверный код'
      }
    }
    
    // Используем сохраненные данные регистрации или переданные
    const registrationPassword = verification.registrationData?.password || password
    const registrationName = verification.registrationData?.name || name
    
    // Попытка отправить на backend
    try {
      const response = await fetch(`${API_BASE_URL}/auth/email/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailLower,
          password: registrationPassword,
          name: registrationName,
          code
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        saveUserData(data.user, 'email')
        return {
          success: true,
          user: data.user
        }
      }
    } catch (backendError) {
      console.log('Backend недоступен, используем локальную обработку:', backendError.message)
    }
    
    // Fallback: создаем пользователя локально
    const userData = {
      email: emailLower,
      name: registrationName || emailLower.split('@')[0],
      id: `email_${emailLower}`,
      role: 'client',
      loginMethod: 'email'
    }
    
    // Сохраняем пароль в зашифрованном виде (в production должно быть на backend)
    // Здесь просто сохраняем в localStorage для демо
    if (registrationPassword) {
      // ВНИМАНИЕ: В production пароли НЕ должны храниться на клиенте!
      // Это только для демонстрации
      const hashedPassword = btoa(registrationPassword) // Простое кодирование (не безопасно!)
      localStorage.setItem(`userPassword_${emailLower}`, hashedPassword)
    }
    
    saveUserData(userData, 'email')
    
    return {
      success: true,
      user: userData
    }
  } catch (error) {
    console.error('Ошибка верификации кода:', error)
    return {
      success: false,
      error: 'Не удалось проверить код. Попробуйте позже.'
    }
  }
}

/**
 * Регистрация пользователя с email и паролем
 */
export const registerWithEmail = async (email, password, name) => {
  try {
    // Валидация email
    const emailValidation = await validateEmail(email)
    if (!emailValidation.valid) {
      return {
        success: false,
        error: emailValidation.error || 'Неверный email адрес'
      }
    }
    
    // Валидация пароля
    if (!password || password.length < 6) {
      return {
        success: false,
        error: 'Пароль должен содержать минимум 6 символов'
      }
    }
    
    // Валидация имени
    if (!name || name.trim().length < 2) {
      return {
        success: false,
        error: 'Имя должно содержать минимум 2 символа'
      }
    }
    
    // Отправляем код на email
    const codeResult = await sendEmailVerificationCode(email)
    
    if (!codeResult.success) {
      return {
        success: false,
        error: codeResult.error || 'Не удалось отправить код'
      }
    }
    
    return {
      success: true,
      message: 'Код отправлен на email',
      code: codeResult.code // Только для разработки
    }
  } catch (error) {
    console.error('Ошибка регистрации:', error)
    return {
      success: false,
      error: 'Произошла ошибка при регистрации'
    }
  }
}

/**
 * Вход пользователя с email и паролем
 */
export const loginWithEmail = async (email, password) => {
  try {
    const emailLower = email.toLowerCase()
    
    // Попытка через backend
    try {
      const response = await fetch(`${API_BASE_URL}/auth/email/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailLower,
          password
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        saveUserData(data.user, 'email')
        return {
          success: true,
          user: data.user
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error || 'Неверный email или пароль'
        }
      }
    } catch (backendError) {
      console.log('Backend недоступен, используем локальную проверку:', backendError.message)
    }
    
    // Fallback: локальная проверка (только для разработки!)
    const storedPassword = localStorage.getItem(`userPassword_${emailLower}`)
    if (storedPassword) {
      const decodedPassword = atob(storedPassword)
      if (decodedPassword === password) {
        const userData = getUserData()
        if (userData.email === emailLower) {
          return {
            success: true,
            user: userData
          }
        }
      }
    }
    
    return {
      success: false,
      error: 'Неверный email или пароль'
    }
  } catch (error) {
    console.error('Ошибка входа:', error)
    return {
      success: false,
      error: 'Произошла ошибка при входе'
    }
  }
}

