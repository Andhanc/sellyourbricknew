import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth, useUser, useSession } from '@clerk/clerk-react'
import { saveUserData } from '../services/authService'

/**
 * Компонент для обработки успешной авторизации через Clerk OAuth
 * Проверяет URL параметры после редиректа и синхронизирует данные
 */
const ClerkAuthHandler = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isSignedIn, isLoaded: authLoaded } = useAuth()
  const { user, isLoaded: userLoaded } = useUser()
  const { session } = useSession()
  const [hasProcessed, setHasProcessed] = useState(false)

  useEffect(() => {
    // Ждем загрузки данных
    if (!authLoaded || !userLoaded) {
      console.log('ClerkAuthHandler: Waiting for data to load...', { authLoaded, userLoaded })
      return
    }

    // Проверяем, есть ли параметры OAuth в URL (после редиректа)
    const urlParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const hasOAuthParams = urlParams.has('__clerk_redirect_url') || 
                          urlParams.has('__clerk_handshake') ||
                          urlParams.has('__clerk_redirect') ||
                          urlParams.has('__clerk_redirect_complete') ||
                          urlParams.has('__clerk_state') ||
                          hashParams.has('__clerk_redirect_url') ||
                          hashParams.has('__clerk_handshake') ||
                          hashParams.has('__clerk_state') ||
                          window.location.search.includes('__clerk') ||
                          window.location.search.includes('oauth') ||
                          window.location.search.includes('code=') ||
                          window.location.hash.includes('__clerk') ||
                          window.location.hash.includes('oauth') ||
                          window.location.hash.includes('code=')

    // Проверяем, был ли недавний редирект (проверяем sessionStorage)
    const oauthRedirectKey = 'clerk_oauth_redirect_started'
    const oauthProviderKey = 'clerk_oauth_provider'
    const oauthRedirectStarted = sessionStorage.getItem(oauthRedirectKey)
    const oauthProvider = sessionStorage.getItem(oauthProviderKey) // 'google', 'facebook', etc.
    
    // Проверяем, были ли мы на Clerk домене (проверяем document.referrer)
    const wasOnClerkDomain = document.referrer.includes('clerk.accounts.dev') || 
                            document.referrer.includes('clerk.com')
    
    console.log('ClerkAuthHandler: Checking auth state', {
      isSignedIn,
      hasUser: !!user,
      hasSession: !!session,
      hasOAuthParams,
      oauthRedirectStarted,
      wasOnClerkDomain,
      searchParams: window.location.search,
      hash: window.location.hash,
      fullUrl: window.location.href,
      userLoaded,
      authLoaded,
      userId: session?.userId,
      userObject: user ? {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName || user.firstName
      } : null,
      referrer: document.referrer,
      previousUrl: sessionStorage.getItem('clerk_previous_url'),
      cookies: document.cookie
    })
    
    // Проверяем, откуда пришли (для диагностики)
    if (oauthRedirectStarted && !hasOAuthParams && !isSignedIn) {
      console.error('ClerkAuthHandler: CRITICAL - OAuth redirect started but no Clerk params in URL!')
      console.error('ClerkAuthHandler: This means Google redirected directly to localhost, bypassing Clerk!')
      console.error('ClerkAuthHandler: Referrer:', document.referrer)
      console.error('ClerkAuthHandler: This indicates Redirect URI in Google Cloud Console is WRONG!')
      console.error('ClerkAuthHandler: Redirect URI should be: https://meet-hound-54.clerk.accounts.dev/v1/oauth_callback')
      console.error('ClerkAuthHandler: NOT: http://localhost:5173 or any localhost URL!')
    }

    // Если пользователь авторизован и есть данные
    if ((isSignedIn || session) && user && !hasProcessed) {
      // Асинхронная обработка сохранения данных в БД
      const processUserData = async () => {
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

        // Проверяем, через какой провайдер зашел пользователь (Google, Facebook и т.д.)
        // Проверяем externalAccounts для определения OAuth провайдера
        let isGoogleAuth = false
        try {
          // Логируем данные пользователя для отладки
          console.log('ClerkAuthHandler: Checking OAuth provider', {
            hasExternalAccounts: !!user.externalAccounts,
            externalAccountsLength: user.externalAccounts?.length || 0,
            externalAccounts: user.externalAccounts,
            emailAddresses: user.emailAddresses,
            oauthRedirectStarted,
            userEmail,
            userImage
          })
          
          if (user.externalAccounts && user.externalAccounts.length > 0) {
            const googleAccount = user.externalAccounts.find((account) => 
              account.provider === 'oauth_google' || 
              account.provider === 'google' ||
              account.strategy === 'oauth_google' ||
              (typeof account.provider === 'string' && account.provider.toLowerCase().includes('google'))
            )
            if (googleAccount) {
              console.log('ClerkAuthHandler: Found Google OAuth in externalAccounts', googleAccount)
              isGoogleAuth = true
            }
          }
          
          // Также проверяем через emailAddresses verification strategy
          if (!isGoogleAuth && user.emailAddresses && user.emailAddresses.length > 0) {
            const googleEmail = user.emailAddresses.find((email) => 
              email.verification?.strategy === 'oauth_google' ||
              email.verification?.strategy === 'google' ||
              (email.verification?.strategy && typeof email.verification.strategy === 'string' && email.verification.strategy.toLowerCase().includes('google'))
            )
            if (googleEmail) {
              console.log('ClerkAuthHandler: Found Google OAuth in emailAddresses', googleEmail)
              isGoogleAuth = true
            }
          }
          
          // Проверяем по провайдеру из sessionStorage (установлен при нажатии на кнопку Google)
          if (!isGoogleAuth && oauthProvider === 'google') {
            console.log('ClerkAuthHandler: Detected Google OAuth from sessionStorage provider')
            isGoogleAuth = true
          }
          
          // Проверяем по домену email (gmail.com, googlemail.com)
          if (!isGoogleAuth && userEmail && (
            userEmail.toLowerCase().endsWith('@gmail.com') ||
            userEmail.toLowerCase().endsWith('@googlemail.com') ||
            userEmail.toLowerCase().endsWith('@google.com')
          )) {
            console.log('ClerkAuthHandler: Detected Google email domain, likely Google OAuth')
            // Если был OAuth редирект и есть email с Google доменом + изображение, вероятно это Google
            if (oauthRedirectStarted && userImage) {
              isGoogleAuth = true
            }
          }
          
          // Если был OAuth редирект через модальное окно Google и есть email + изображение, вероятно это Google
          if (!isGoogleAuth && oauthRedirectStarted && userEmail && userImage) {
            console.log('ClerkAuthHandler: OAuth redirect detected with email and image, assuming Google OAuth')
            isGoogleAuth = true
          }
        } catch (e) {
          console.error('ClerkAuthHandler: Ошибка проверки провайдера, используем fallback', e)
          // Fallback: если есть email и изображение и был OAuth редирект, считаем что это Google
          if (oauthRedirectStarted && userEmail && userImage) {
            console.log('ClerkAuthHandler: Using fallback - assuming Google OAuth')
            isGoogleAuth = true
          }
        }
        
        console.log('ClerkAuthHandler: Final isGoogleAuth check', { isGoogleAuth, userEmail, userImage })
        
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
                
                console.log('ClerkAuthHandler: User data saved to database via Google OAuth', clerkUserData)
                
                // Сохраняем данные в localStorage (как в WhatsApp)
                saveUserData(clerkUserData, 'google')
                
                setHasProcessed(true)
                
                // Очищаем флаг OAuth редиректа
                if (oauthRedirectStarted) {
                  sessionStorage.removeItem(oauthRedirectKey)
                }
                
                // Очищаем OAuth параметры из URL
                if (hasOAuthParams) {
                  const cleanUrl = window.location.pathname
                  window.history.replaceState({}, '', cleanUrl)
                  console.log('ClerkAuthHandler: Cleaned OAuth params from URL')
                }
                
                // Навигация на страницу профиля, если мы не там
                if (window.location.pathname !== '/profile') {
                  console.log('ClerkAuthHandler: Navigating to profile page')
                  navigate('/profile', { replace: true })
                } else {
                  console.log('ClerkAuthHandler: Already on profile page, data should update automatically')
                }
                return
              }
            } else {
              const errorData = await response.json().catch(() => ({}))
              console.error('ClerkAuthHandler: Ошибка при сохранении в БД:', errorData.error || 'Неизвестная ошибка')
            }
          } catch (backendError) {
            console.error('ClerkAuthHandler: Backend недоступен, сохраняем только в localStorage:', backendError.message)
            console.warn('⚠️ Данные сохранены только в localStorage. Запустите backend сервер для полной функциональности.')
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
        
        console.log('ClerkAuthHandler: User authenticated, saving data to localStorage', clerkUserData)
        
        // Сохраняем данные в localStorage (как в WhatsApp)
        saveUserData(clerkUserData, isGoogleAuth ? 'google' : 'clerk')
        
        setHasProcessed(true)
        
        // Очищаем флаг OAuth редиректа
        if (oauthRedirectStarted) {
          sessionStorage.removeItem(oauthRedirectKey)
          sessionStorage.removeItem(oauthProviderKey)
        }
        
        // Очищаем OAuth параметры из URL
        if (hasOAuthParams) {
          const cleanUrl = window.location.pathname
          window.history.replaceState({}, '', cleanUrl)
          console.log('ClerkAuthHandler: Cleaned OAuth params from URL')
        }
        
        // Навигация на страницу профиля, если мы не там
        if (window.location.pathname !== '/profile') {
          console.log('ClerkAuthHandler: Navigating to profile page')
          navigate('/profile', { replace: true })
        } else {
          console.log('ClerkAuthHandler: Already on profile page, data should update automatically')
        }
      }
      
      // Вызываем асинхронную функцию
      processUserData()
    } else if ((!isSignedIn && !session) && (hasOAuthParams || oauthRedirectStarted || wasOnClerkDomain) && !hasProcessed) {
      // Если есть OAuth параметры или был запущен OAuth редирект, но пользователь не авторизован, ждем и проверяем повторно
      console.log('ClerkAuthHandler: OAuth redirect detected but user not signed in yet, waiting...')
      console.log('ClerkAuthHandler: Referrer:', document.referrer)
      console.log('ClerkAuthHandler: Was on Clerk domain:', wasOnClerkDomain)
      console.log('ClerkAuthHandler: This might indicate:')
      console.log('1. Clerk callback was processed but session not established')
      console.log('2. Check Clerk Dashboard → Settings → Domains (localhost should be allowed)')
      console.log('3. Check Network tab for requests to clerk.accounts.dev after Google redirect')
      console.log('4. Check if there are CORS errors in console')
      
      // Проверяем каждые 500мс в течение 10 секунд (увеличено время ожидания)
      let attempts = 0
      const maxAttempts = 20
      
      const checkInterval = setInterval(() => {
        attempts++
        console.log(`ClerkAuthHandler: Checking auth state (attempt ${attempts}/${maxAttempts})`, {
          isSignedIn,
          hasUser: !!user,
          hasSession: !!session,
          authLoaded,
          userLoaded
        })
        
        // Если пользователь появился, обрабатываем
        if ((isSignedIn || session) && user) {
          clearInterval(checkInterval)
          console.log('ClerkAuthHandler: User data appeared! Processing...')
          // Данные будут обработаны в следующем рендере
          return
        }
        
        // Если превысили лимит попыток
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval)
          console.error('ClerkAuthHandler: Timeout waiting for user data after OAuth redirect')
          console.error('ClerkAuthHandler: Possible issues:')
          console.error('1. Redirect URIs in Google/Facebook are incorrect')
          console.error('2. Redirect URIs should point to Clerk domain (e.g., https://YOUR_APP.clerk.accounts.dev/v1/oauth_callback)')
          console.error('3. Check Clerk Dashboard → Domains to find your Clerk domain')
          console.error('4. Current URL:', window.location.href)
          console.error('5. Check if you were redirected to Clerk domain after Google auth')
          console.error('6. Expected flow: Google → Clerk domain → Your app')
          console.error('7. If you were NOT redirected to Clerk domain, Redirect URI in Google is wrong')
          console.error('8. Detailed troubleshooting guide: See TROUBLESHOOTING_OAUTH.md')
        }
      }, 500)
      
      return () => clearInterval(checkInterval)
    } else if (!isSignedIn && !session && !hasOAuthParams) {
      // Нет OAuth параметров и пользователь не авторизован - это нормально
      console.log('ClerkAuthHandler: No OAuth params, user not signed in - normal state')
    }
  }, [isSignedIn, user, userLoaded, authLoaded, session, searchParams, navigate, hasProcessed])

  return null
}

export default ClerkAuthHandler

