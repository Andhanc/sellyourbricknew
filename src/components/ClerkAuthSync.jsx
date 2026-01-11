import { useEffect, useRef } from 'react'
import { useUser, useAuth } from '@clerk/clerk-react'
import { saveUserData } from '../services/authService'

/**
 * Компонент для синхронизации данных пользователя Clerk с localStorage и БД
 * Это обеспечивает совместимость со старой системой авторизации
 * Работает аналогично WhatsApp авторизации - сохраняет данные сразу после успешного входа
 * Также сохраняет данные Google в БД, если они еще не были сохранены
 */
const ClerkAuthSync = () => {
  const { user, isLoaded: userLoaded } = useUser()
  const { isSignedIn, isLoaded: authLoaded } = useAuth()
  const hasSyncedRef = useRef(false)

  useEffect(() => {
    // Ждем полной загрузки данных
    if (!userLoaded || !authLoaded) {
      return
    }

    console.log('ClerkAuthSync: Checking sync', { isSignedIn, hasUser: !!user, hasSynced: hasSyncedRef.current })

    // Если пользователь авторизован и данные загружены
    if (isSignedIn && user && !hasSyncedRef.current) {
      // Асинхронная обработка сохранения данных в БД
      const syncUserData = async () => {
        // Формируем имя пользователя
        let userName = 'Пользователь'
        if (user.fullName) {
          userName = user.fullName
        } else if (user.firstName || user.lastName) {
          userName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
        } else if (user.username) {
          userName = user.username
        }
        
        // Получаем email
        let userEmail = ''
        if (user.primaryEmailAddress?.emailAddress) {
          userEmail = user.primaryEmailAddress.emailAddress
        } else if (user.emailAddresses && user.emailAddresses.length > 0) {
          userEmail = user.emailAddresses[0].emailAddress || ''
        }
        
        // Получаем изображение
        let userImage = ''
        if (user.imageUrl) {
          userImage = user.imageUrl
        } else if (user.profileImageUrl) {
          userImage = user.profileImageUrl
        }
        
        // Получаем телефон
        let userPhone = ''
        if (user.primaryPhoneNumber?.phoneNumber) {
          userPhone = user.primaryPhoneNumber.phoneNumber
        } else if (user.phoneNumbers && user.phoneNumbers.length > 0) {
          userPhone = user.phoneNumbers[0].phoneNumber || ''
        }

        // Проверяем, через Google ли зашел пользователь
        let isGoogleAuth = false
        try {
          if (user.externalAccounts && user.externalAccounts.length > 0) {
            isGoogleAuth = user.externalAccounts.some((account) => 
              account.provider === 'oauth_google' || 
              account.provider === 'google' ||
              account.strategy === 'oauth_google'
            )
          }
          
          if (!isGoogleAuth && user.emailAddresses && user.emailAddresses.length > 0) {
            isGoogleAuth = user.emailAddresses.some((email) => 
              email.verification?.strategy === 'oauth_google' ||
              email.verification?.strategy === 'google'
            )
          }
        } catch (e) {
          console.log('ClerkAuthSync: Ошибка проверки провайдера', e)
        }
        
        // Если это Google OAuth, отправляем данные на backend для сохранения в БД (как в WhatsApp)
        if (isGoogleAuth && userEmail) {
          try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
            const response = await fetch(`${API_BASE_URL}/auth/google`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userInfo: {
                  email: userEmail,
                  name: userName,
                  picture: userImage
                }
              })
            })
            
            if (response.ok) {
              const data = await response.json()
              if (data.success && data.user) {
                // Объединяем данные от backend с данными Clerk
                const clerkUserData = {
                  ...data.user,
                  name: data.user.name || userName,
                  email: data.user.email || userEmail,
                  picture: data.user.picture || userImage,
                  phone: userPhone,
                  phoneFormatted: userPhone,
                  id: data.user.id || user.id || '',
                  role: data.user.role || 'client',
                  loginMethod: 'google'
                }
                
                console.log('ClerkAuthSync: User data saved to database via Google OAuth', clerkUserData)
                
                // Сохраняем данные в localStorage (как в WhatsApp)
                saveUserData(clerkUserData, 'google')
                hasSyncedRef.current = true
                return
              }
            } else {
              const errorData = await response.json().catch(() => ({}))
              console.error('ClerkAuthSync: Ошибка при сохранении в БД:', errorData.error || 'Неизвестная ошибка')
            }
          } catch (backendError) {
            console.error('ClerkAuthSync: Backend недоступен, сохраняем только в localStorage:', backendError.message)
          }
        }
        
        // Fallback: сохраняем данные только в localStorage (если не Google или backend недоступен)
        const clerkUserData = {
          name: userName,
          email: userEmail,
          picture: userImage,
          id: user.id || '',
          phone: userPhone,
          phoneFormatted: userPhone,
          role: 'client',
          loginMethod: isGoogleAuth ? 'google' : 'clerk'
        }
        
        console.log('ClerkAuthSync: User authenticated, syncing data to localStorage', clerkUserData)
        
        // Сохраняем данные в localStorage для совместимости (аналогично WhatsApp)
        saveUserData(clerkUserData, isGoogleAuth ? 'google' : 'clerk')
        hasSyncedRef.current = true
      }
      
      // Вызываем асинхронную функцию
      syncUserData()
    } else if (!isSignedIn) {
      // Если пользователь не авторизован, очищаем данные Clerk из localStorage и сбрасываем флаг
      console.log('ClerkAuthSync: User not signed in, clearing Clerk data')
      hasSyncedRef.current = false
    }
  }, [user, userLoaded, isSignedIn, authLoaded])

  return null // Этот компонент не рендерит ничего
}

export default ClerkAuthSync

