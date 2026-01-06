import { useEffect } from 'react'
import { useUser, useAuth } from '@clerk/clerk-react'
import { saveUserData } from '../services/authService'

/**
 * Компонент для синхронизации данных пользователя Clerk с localStorage
 * Это обеспечивает совместимость со старой системой авторизации
 * Работает аналогично WhatsApp авторизации - сохраняет данные сразу после успешного входа
 */
const ClerkAuthSync = () => {
  const { user, isLoaded: userLoaded } = useUser()
  const { isSignedIn, isLoaded: authLoaded } = useAuth()

  useEffect(() => {
    // Ждем полной загрузки данных
    if (!userLoaded || !authLoaded) {
      return
    }

    console.log('ClerkAuthSync: Checking sync', { isSignedIn, hasUser: !!user })

    // Если пользователь авторизован и данные загружены
    if (isSignedIn && user) {
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
      
      // Синхронизируем данные Clerk с localStorage (как в WhatsApp)
      const clerkUserData = {
        name: userName,
        email: userEmail,
        picture: userImage,
        id: user.id || '',
        phone: userPhone,
        phoneFormatted: userPhone,
        role: 'client'
      }
      
      console.log('ClerkAuthSync: User authenticated, syncing data to localStorage', clerkUserData)
      
      // Сохраняем данные в localStorage для совместимости (аналогично WhatsApp)
      saveUserData(clerkUserData, 'clerk')
    } else if (!isSignedIn) {
      // Если пользователь не авторизован, очищаем данные Clerk из localStorage
      console.log('ClerkAuthSync: User not signed in, clearing Clerk data')
    }
  }, [user, userLoaded, isSignedIn, authLoaded])

  return null // Этот компонент не рендерит ничего
}

export default ClerkAuthSync

