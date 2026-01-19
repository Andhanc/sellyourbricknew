import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser, useClerk, useAuth } from '@clerk/clerk-react'
import { getUserData, saveUserData, logout } from '../services/authService'
import VerificationToast from '../components/VerificationToast'
import './Profile.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3000/api')

const Profile = () => {
  const navigate = useNavigate()
  const { user, isLoaded: userLoaded } = useUser()
  const { isSignedIn, isLoaded: authLoaded } = useAuth()
  const { signOut } = useClerk()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    email: '',
    avatar: null,
    country: '',
    countryFlag: ''
  })
  const fileInputRef = useRef(null)
  const passportInputRef = useRef(null)
  const passportWithFaceInputRef = useRef(null)
  const [userId, setUserId] = useState(null)
  const [uploading, setUploading] = useState({ passport: false, passportWithFace: false })
  const [userDocuments, setUserDocuments] = useState({ passport: null, passportWithFace: null })
  const [verificationStatus, setVerificationStatus] = useState(null)
  
  // Используем proxy из vite.config.js или полный URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3000/api')
  
  // Загрузка документов пользователя
  const loadUserDocuments = async (userId) => {
    if (!userId) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/documents/user/${userId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          // Берем только последние документы каждого типа (на случай если их несколько)
          const passportDocs = data.data.filter(doc => doc.document_type === 'passport')
          const passportWithFaceDocs = data.data.filter(doc => doc.document_type === 'passport_with_face')
          
          const documents = {
            passport: passportDocs.length > 0 ? passportDocs[0] : null,
            passportWithFace: passportWithFaceDocs.length > 0 ? passportWithFaceDocs[0] : null
          }
          
          console.log('Загружены документы пользователя:', documents)
          setUserDocuments(documents)
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки документов:', error)
    }
  }
  
  const handleDocumentUpload = async (type, file) => {
    if (!file) {
      alert('Файл не выбран')
      return
    }
    
    if (!userId) {
      alert('Ошибка: ID пользователя не найден. Пожалуйста, обновите страницу.')
      console.error('userId не установлен:', userId)
      return
    }
    
    setUploading(prev => ({ ...prev, [type]: true }))
    
    try {
      const formData = new FormData()
      formData.append('document_photo', file)
      formData.append('user_id', String(userId))
      formData.append('document_type', type === 'passport' ? 'passport' : 'passport_with_face')
      
      console.log('📤 Загрузка документа:', {
        type,
        userId,
        fileName: file.name,
        fileSize: file.size,
        apiUrl: `${API_BASE_URL}/documents`
      })
      
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        body: formData
      })
      
      console.log('📥 Ответ сервера:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Данные от сервера:', data)
        
        if (data.success) {
          alert('Документ успешно загружен и отправлен на верификацию')
          // Обновляем состояние сразу
          const newDoc = {
            id: data.data.id,
            document_type: data.data.document_type,
            document_photo: data.data.document_photo,
            verification_status: data.data.verification_status || 'pending',
            created_at: data.data.created_at
          }
          setUserDocuments(prev => ({
            ...prev,
            [type === 'passport' ? 'passport' : 'passportWithFace']: newDoc
          }))
          // Перезагружаем документы пользователя для синхронизации
          await loadUserDocuments(userId)
          // Загружаем статус верификации после загрузки документа
          await loadVerificationStatus(userId)
          // Отправляем событие для обновления уведомления о верификации
          window.dispatchEvent(new Event('verification-status-update'))
        } else {
          alert(data.error || 'Ошибка загрузки документа')
        }
      } else {
        const errorText = await response.text().catch(() => 'Неизвестная ошибка')
        console.error('❌ Ошибка сервера:', response.status, errorText)
        
        let errorMessage = 'Ошибка загрузки документа'
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `Ошибка ${response.status}: ${errorText.substring(0, 100)}`
        }
        
        alert(errorMessage)
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки документа:', error)
      
      if (error.message === 'Failed to fetch') {
        alert('Не удалось подключиться к серверу. Убедитесь, что сервер запущен на порту 3000.')
      } else {
        alert(`Ошибка: ${error.message}`)
      }
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }))
    }
  }

  // Загружаем статус верификации
  const loadVerificationStatus = async (userId) => {
    if (!userId) return
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/verification-status`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setVerificationStatus(result.data)
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки статуса верификации:', error)
    }
  }

  // Проверяем заполненность документов
  const isDocumentsComplete = () => {
    // Приоритет userDocuments (более актуальные данные, загружаются при открытии страницы)
    const hasDocumentsFromState = !!(userDocuments.passport || userDocuments.passportWithFace)
    if (hasDocumentsFromState) return true
    
    // Если userDocuments пусты, проверяем verificationStatus
    const hasDocumentsFromStatus = verificationStatus?.hasDocuments || false
    return hasDocumentsFromStatus
  }

  // Проверяем заполненность базовых данных
  const isBasicInfoComplete = () => {
    if (!verificationStatus?.missingFields) return false
    const { missingFields } = verificationStatus
    return !missingFields.firstName && 
           !missingFields.lastName && 
           !missingFields.emailOrPhone && 
           !missingFields.country && 
           !missingFields.address
  }

  // Проверяем заполненность паспортных данных
  const isPassportDataComplete = () => {
    if (!verificationStatus?.missingFields) return false
    const { missingFields } = verificationStatus
    return !missingFields.passportSeries && 
           !missingFields.passportNumber && 
           !missingFields.identificationNumber
  }

  // Проверяем, нужно ли показывать индикатор для "Данные"
  const shouldShowDataIndicator = () => {
    // Если verificationStatus еще не загружен, не показываем (чтобы избежать ложных срабатываний)
    if (!verificationStatus) {
      return false
    }
    
    // Если missingFields нет, считаем данные неполными (на всякий случай показываем индикатор)
    if (!verificationStatus.missingFields) {
      return true
    }
    
    const { missingFields } = verificationStatus
    
    // Проверяем базовые данные
    const hasBasicMissing = !!(missingFields.firstName || missingFields.lastName || 
                                missingFields.emailOrPhone || missingFields.country || 
                                missingFields.address)
    
    // Проверяем паспортные данные
    const hasPassportMissing = !!(missingFields.passportSeries || missingFields.passportNumber || 
                                   missingFields.identificationNumber)
    
    // Показываем точку если есть хотя бы одно незаполненное поле
    const shouldShow = hasBasicMissing || hasPassportMissing
    
    if (shouldShow) {
      console.log('🔴 Profile: Показываем индикатор "Данные"', {
        hasBasicMissing,
        hasPassportMissing,
        missingFields
      })
    }
    
    return shouldShow
  }

  // Проверяем, нужно ли показывать индикатор для "Профиль"
  const shouldShowProfileIndicator = () => {
    // Всегда проверяем наличие документов (приоритет userDocuments, потом verificationStatus)
    const hasDocs = isDocumentsComplete()
    // Показываем точку если НЕТ документов
    return !hasDocs
  }

  // Синхронизируем данные Clerk с localStorage и загружаем данные пользователя
  useEffect(() => {
    // Ждем загрузки данных Clerk
    if (!userLoaded || !authLoaded) {
      setIsLoading(true)
      return
    }

    setIsLoading(false)

    console.log('Profile: Auth state', { isSignedIn, userLoaded, authLoaded, hasUser: !!user })

    // Если пользователь авторизован через Clerk, но user еще не загружен, ждем
    if (isSignedIn && !user) {
      console.log('Profile: User is signed in but user data not loaded yet, waiting...')
      setIsLoading(true)
      return
    }

    if (isSignedIn && user) {
      // Пользователь авторизован через Clerk
      console.log('Profile: Clerk user object', user)
      console.log('Profile: Clerk user data loaded', {
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        primaryEmailAddress: user.primaryEmailAddress,
        emailAddresses: user.emailAddresses,
        imageUrl: user.imageUrl,
        profileImageUrl: user.profileImageUrl,
        primaryPhoneNumber: user.primaryPhoneNumber,
        phoneNumbers: user.phoneNumbers
      })
      
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
      
      const clerkUserData = {
        name: userName,
        email: userEmail,
        picture: userImage,
        id: user.id || '',
        phone: userPhone,
        phoneFormatted: userPhone,
      }
      
      console.log('Profile: Processed Clerk user data', clerkUserData)
      
      // Сохраняем данные Clerk в localStorage для совместимости со старой системой
      saveUserData(clerkUserData, 'clerk')
      
      // Находим или создаем пользователя в БД и получаем его ID
      const findOrCreateUserInDB = async () => {
        try {
          let dbUserId = null
          
          // Сначала пытаемся найти пользователя по email
          if (userEmail) {
            const emailResponse = await fetch(`${API_BASE_URL}/users/email/${encodeURIComponent(userEmail.toLowerCase())}`)
            if (emailResponse.ok) {
              const emailData = await emailResponse.json()
              if (emailData.success && emailData.data) {
                dbUserId = emailData.data.id
                console.log('✅ Пользователь найден в БД по email:', dbUserId)
              }
            }
          }
          
          // Если не нашли по email, пытаемся по телефону
          if (!dbUserId && userPhone) {
            const phoneDigits = userPhone.replace(/\D/g, '')
            if (phoneDigits) {
              const phoneResponse = await fetch(`${API_BASE_URL}/users/phone/${phoneDigits}`)
              if (phoneResponse.ok) {
                const phoneData = await phoneResponse.json()
                if (phoneData.success && phoneData.data) {
                  dbUserId = phoneData.data.id
                  console.log('✅ Пользователь найден в БД по телефону:', dbUserId)
                }
              }
            }
          }
          
          // Если пользователь не найден, создаем его
          if (!dbUserId) {
            const nameParts = userName.split(' ')
            const firstName = nameParts[0] || 'Пользователь'
            const lastName = nameParts.slice(1).join(' ') || ''
            
            // Получаем роль из sessionStorage (сохранена при регистрации через Clerk)
            // Или из localStorage, или по умолчанию 'buyer'
            const savedRole = sessionStorage.getItem('clerk_oauth_user_role')
            const storedRole = localStorage.getItem('userRole')
            const userRole = savedRole || storedRole || 'buyer'
            
            // Очищаем сохраненную роль после использования
            if (savedRole) {
              sessionStorage.removeItem('clerk_oauth_user_role')
            }
            
            console.log('Profile: Создание пользователя Clerk в БД с ролью:', userRole)
            
            const createResponse = await fetch(`${API_BASE_URL}/users`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                email: userEmail || null,
                phone_number: userPhone ? userPhone.replace(/\D/g, '') : null,
                role: userRole === 'seller' ? 'seller' : 'buyer',
                is_verified: 0,
                is_online: 1
              })
            })
            
            if (createResponse.ok) {
              const createData = await createResponse.json()
              if (createData.success && createData.data) {
                dbUserId = createData.data.id
                console.log('✅ Пользователь создан в БД:', dbUserId)
              }
            } else {
              const errorData = await createResponse.json().catch(() => ({}))
              console.error('❌ Ошибка создания пользователя:', errorData)
            }
          }
          
          // Используем ID из БД
          if (dbUserId) {
            setUserId(dbUserId)
            // Обновляем localStorage с правильным ID
            localStorage.setItem('userId', String(dbUserId))
            loadUserDocuments(dbUserId)
            loadVerificationStatus(dbUserId)
          } else {
            console.warn('⚠️ Не удалось получить ID пользователя из БД')
            // Fallback на ID из localStorage
            const fallbackId = localStorage.getItem('userId')
            if (fallbackId) {
              setUserId(fallbackId)
              loadUserDocuments(fallbackId)
              loadVerificationStatus(fallbackId)
            }
          }
        } catch (error) {
          console.error('❌ Ошибка при получении/создании пользователя в БД:', error)
          // Fallback на ID из localStorage
          const fallbackId = localStorage.getItem('userId')
          if (fallbackId) {
            setUserId(fallbackId)
            loadUserDocuments(fallbackId)
            loadVerificationStatus(fallbackId)
          }
        }
      }
      
      findOrCreateUserInDB()
      
      const newProfileData = {
        name: clerkUserData.name || 'Пользователь',
        phone: clerkUserData.phoneFormatted || clerkUserData.phone || '',
        email: clerkUserData.email || '',
        avatar: clerkUserData.picture || null,
        country: '',
        countryFlag: ''
      }
      
      console.log('Profile: Setting profile data', newProfileData)
      console.log('Profile: Current profileData before update', profileData)
      
      setProfileData(newProfileData)
      
      // Проверяем, что данные действительно обновились
      setTimeout(() => {
        console.log('Profile: Profile data after update should be', newProfileData)
      }, 100)
    } else {
      // Проверяем старую систему авторизации
      const userData = getUserData()
      
      console.log('Profile: Checking localStorage data', userData)
      
      if (userData.isLoggedIn) {
        setProfileData({
          name: userData.name || 'Пользователь',
          phone: userData.phoneFormatted || userData.phone || '',
          email: userData.email || '',
          avatar: userData.picture || null,
          country: userData.country || '',
          countryFlag: userData.countryFlag || ''
        })
        
        // Находим или создаем пользователя в БД и получаем его ID
        const findOrCreateUser = async () => {
          try {
            let dbUserId = null
            const userEmail = userData.email
            const userPhone = userData.phone || userData.phoneFormatted
            
            // Сначала пытаемся найти пользователя по email
            if (userEmail) {
              const emailResponse = await fetch(`${API_BASE_URL}/users/email/${encodeURIComponent(userEmail.toLowerCase())}`)
              if (emailResponse.ok) {
                const emailData = await emailResponse.json()
                if (emailData.success && emailData.data) {
                  dbUserId = emailData.data.id
                  console.log('✅ Пользователь найден в БД по email:', dbUserId)
                }
              }
            }
            
            // Если не нашли по email, пытаемся по телефону
            if (!dbUserId && userPhone) {
              const phoneDigits = userPhone.replace(/\D/g, '')
              if (phoneDigits) {
                const phoneResponse = await fetch(`${API_BASE_URL}/users/phone/${phoneDigits}`)
                if (phoneResponse.ok) {
                  const phoneData = await phoneResponse.json()
                  if (phoneData.success && phoneData.data) {
                    dbUserId = phoneData.data.id
                    console.log('✅ Пользователь найден в БД по телефону:', dbUserId)
                  }
                }
              }
            }
            
            // Если пользователь не найден, создаем его
            if (!dbUserId) {
              const nameParts = (userData.name || 'Пользователь').split(' ')
              const firstName = nameParts[0] || 'Пользователь'
              const lastName = nameParts.slice(1).join(' ') || ''
              
              // Используем роль из userData или localStorage
              const storedRole = localStorage.getItem('userRole')
              const userRole = userData.role || storedRole || 'buyer'
              
              console.log('Profile: Создание пользователя (старая система) в БД с ролью:', userRole)
              
              const createResponse = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  first_name: firstName,
                  last_name: lastName,
                  email: userEmail || null,
                  phone_number: userPhone ? userPhone.replace(/\D/g, '') : null,
                  role: userRole === 'seller' ? 'seller' : 'buyer',
                  is_verified: 0,
                  is_online: 1
                })
              })
              
              if (createResponse.ok) {
                const createData = await createResponse.json()
                if (createData.success && createData.data) {
                  dbUserId = createData.data.id
                  console.log('✅ Пользователь создан в БД:', dbUserId)
                }
              } else {
                const errorData = await createResponse.json().catch(() => ({}))
                console.error('❌ Ошибка создания пользователя:', errorData)
              }
            }
            
            // Используем ID из БД
            if (dbUserId) {
              setUserId(dbUserId)
              localStorage.setItem('userId', String(dbUserId))
              loadUserDocuments(dbUserId)
            } else {
              console.warn('⚠️ Не удалось получить ID пользователя из БД')
              const fallbackId = userData.id || localStorage.getItem('userId')
              if (fallbackId) {
                setUserId(fallbackId)
                loadUserDocuments(fallbackId)
              }
            }
          } catch (error) {
            console.error('❌ Ошибка при получении/создании пользователя в БД:', error)
            const fallbackId = userData.id || localStorage.getItem('userId')
            if (fallbackId) {
              setUserId(fallbackId)
              loadUserDocuments(fallbackId)
            }
          }
        }
        
        findOrCreateUser()
      } else {
        // Если не авторизован, перенаправляем на главную страницу
        console.warn('⚠️ Пользователь не авторизован, перенаправление на главную')
        navigate('/', { replace: true })
      }
    }
  }, [user, userLoaded, isSignedIn, authLoaded])

  // Отслеживаем изменения profileData для отладки
  useEffect(() => {
    console.log('Profile: profileData changed', profileData)
  }, [profileData])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSave = async () => {
    try {
      // Если пользователь авторизован через Clerk, обновляем данные в Clerk
      if (user) {
        // Обновляем данные пользователя в Clerk
        await user.update({
          firstName: profileData.name.split(' ')[0] || profileData.name,
          lastName: profileData.name.split(' ').slice(1).join(' ') || '',
        })
        
        // Обновляем email если изменился
        if (profileData.email && profileData.email !== user.primaryEmailAddress?.emailAddress) {
          // Email обновляется через отдельный метод в Clerk
          // Здесь можно добавить логику обновления email
        }
      }
      
      // Сохраняем данные в localStorage для совместимости
      const userData = getUserData()
      const updatedUserData = {
        ...userData,
        email: profileData.email,
        phoneFormatted: profileData.phone,
        picture: profileData.avatar,
        country: profileData.country,
        countryFlag: profileData.countryFlag
      }
      saveUserData(updatedUserData, userData.loginMethod || 'clerk')
      setIsEditing(false)
    } catch (error) {
      console.error('Ошибка при сохранении данных:', error)
      // В случае ошибки все равно сохраняем в localStorage
      const userData = getUserData()
      const updatedUserData = {
        ...userData,
        email: profileData.email,
        phoneFormatted: profileData.phone,
        picture: profileData.avatar,
        country: profileData.country,
        countryFlag: profileData.countryFlag
      }
      saveUserData(updatedUserData, userData.loginMethod || 'clerk')
      setIsEditing(false)
    }
  }

  const handleChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLogout = async () => {
    if (!window.confirm('Вы уверены, что хотите выйти?')) {
      return
    }

    try {
      // 1. Если пользователь авторизован через Clerk — выходим из Clerk
      if (user && signOut) {
        await signOut()
      }
    } catch (error) {
      console.warn('⚠️ Ошибка при выходе из Clerk:', error)
      // Даже при ошибке продолжаем локальный выход
    }

    try {
      // 2. Всегда очищаем локальную сессию и помечаем пользователя оффлайн в БД
      await logout()
    } catch (error) {
      console.warn('⚠️ Ошибка при локальном выходе:', error)
    }

    // 3. Перенаправляем на главную и перезагружаем приложение
    navigate('/')
    setTimeout(() => {
      window.location.reload()
    }, 50)
  }

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileData(prev => ({
          ...prev,
          avatar: reader.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Показываем индикатор загрузки, пока данные не загружены
  if (isLoading || !userLoaded) {
    return (
      <div className="profile-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#666', marginBottom: '16px' }}>Загрузка данных профиля...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      {/* Всплывающее уведомление о прогрессе верификации */}
      {userId && <VerificationToast userId={userId} />}
      
      <div className="profile-container">
        <aside className="profile-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#gradient1)"/>
                <path d="M2 17L12 22L22 17" stroke="url(#gradient1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="url(#gradient1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0ABAB5" />
                    <stop offset="100%" stopColor="#089a95" />
                  </linearGradient>
                </defs>
              </svg>
              <span>Профиль</span>
            </div>
          </div>
          <nav className="sidebar-nav">
            <Link to="/profile" className="nav-item active">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" fill="currentColor"/>
                <path d="M10 12C5.58172 12 2 13.7909 2 16V20H18V16C18 13.7909 14.4183 12 10 12Z" fill="currentColor"/>
              </svg>
              <span>Профиль</span>
              {shouldShowProfileIndicator() && (
                <span className="nav-item-indicator"></span>
              )}
            </Link>
            <Link to="/data" className="nav-item">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 8H14M6 12H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Данные</span>
              {shouldShowDataIndicator() && (
                <span className="nav-item-indicator"></span>
              )}
            </Link>
            <Link to="/subscriptions" className="nav-item">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L12.5 7.5L19 10L12.5 12.5L10 19L7.5 12.5L1 10L7.5 7.5L10 2Z" fill="currentColor"/>
              </svg>
              <span>Подписки</span>
            </Link>
            <Link to="/history" className="nav-item">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 8H14M6 12H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>История</span>
            </Link>
            <Link to="/chat" className="nav-item">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 8H13M7 12H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Чат</span>
            </Link>
            <a href="#" className="nav-item">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L12.5 7.5L19 10L12.5 12.5L10 19L7.5 12.5L1 10L7.5 7.5L10 2Z" fill="currentColor"/>
              </svg>
              <span>Фаворит</span>
            </a>
          </nav>

          <div className="sidebar-footer">
            <div className="language-selector">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 1C9.5 3 10.5 5.5 10.5 8C10.5 10.5 9.5 13 8 15M8 1C6.5 3 5.5 5.5 5.5 8C5.5 10.5 6.5 13 8 15M1 8H15" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>Русский</span>
            </div>
            <a href="#" className="help-link">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 5V8M8 11H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Справка</span>
            </a>
            <a href="#" className="help-link">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 6H10M6 10H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Яндекс ID для сайта</span>
            </a>
            <div className="copyright">© 2001-2025 Яндекс</div>
            <button 
              type="button"
              className="logout-button" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleLogout()
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M7 2H3C2.44772 2 2 2.44772 2 3V15C2 15.5523 2.44772 16 3 16H7M12 13L15 10M15 10L12 7M15 10H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Выйти</span>
            </button>
          </div>
        </aside>

        <main className="profile-main">
          <div className="profile-header">
            <div className="profile-avatar-wrapper">
              <div 
                className={`profile-avatar ${isEditing ? 'editable' : ''}`}
                onClick={handleAvatarClick}
              >
                {profileData.avatar ? (
                  <img src={profileData.avatar} alt="Avatar" className="avatar-image" />
                ) : (
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                    <defs>
                      <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0ABAB5" />
                        <stop offset="100%" stopColor="#089a95" />
                      </linearGradient>
                    </defs>
                    <circle cx="60" cy="60" r="60" fill="url(#avatarGradient)"/>
                    <circle cx="60" cy="48" r="18" fill="white" opacity="0.9"/>
                    <path d="M30 90 Q30 75 60 75 Q90 75 90 90 L90 100 L30 100 Z" fill="white" opacity="0.9"/>
                  </svg>
                )}
                {isEditing && (
                  <div className="avatar-edit-overlay">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 4V20M4 12H20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="avatar-edit-text">Изменить фото</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
            <div className="profile-info">
              <div className="profile-name">
                <h1>{profileData.name || 'Загрузка...'}</h1>
                {!isEditing ? (
                  <button className="edit-button" onClick={handleEdit} aria-label="Редактировать">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M12.75 2.25C13.0721 1.92788 13.4563 1.70947 13.8874 1.61553C14.3185 1.52159 14.767 1.46849 15.2188 1.47159C15.6706 1.47469 16.1188 1.53394 16.5474 1.63628C16.976 1.73862 17.3638 1.96012 17.6875 2.28375C18.0111 2.60738 18.2326 2.99525 18.335 3.42381C18.4373 3.85237 18.4966 4.30056 18.4997 4.75237C18.5028 5.20419 18.4497 5.65269 18.3557 6.08381C18.2618 6.51494 18.0434 6.89912 17.7213 7.22125L6.375 18.5625L1.125 19.875L2.4375 14.625L13.7813 3.28125C13.9001 3.16245 14.0438 3.07141 14.2026 3.01406C14.3614 2.95671 14.5316 2.93439 14.7006 2.94844H14.8L12.75 2.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button className="save-button" onClick={handleSave} aria-label="Сохранить">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M15 4.5L6.75 12.75L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button className="cancel-button" onClick={handleCancel} aria-label="Отменить">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="profile-contacts">
                {profileData.email && (
                  <div className="contact-item">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M2 6L9 10L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {isEditing ? (
                      <input
                        type="email"
                        className="contact-input"
                        value={profileData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="email@example.com"
                      />
                    ) : (
                      <span>{profileData.email}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="profile-sections">
            <section className="profile-section">
              <div className="section-header">
                <h2 className="section-title">Мои подписки</h2>
                <div className="section-subtitle">Управляйте своими подписками</div>
              </div>
              <div className="section-cards">
                <div className="section-card subscription-card subscription-active">
                  <div className="subscription-badge">Активна</div>
                  <div className="card-icon-wrapper">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <path d="M20 5L25 15H35L27 22L30 32L20 26L10 32L13 22L5 15H15L20 5Z" fill="url(#subscriptionActiveGrad)"/>
                      <defs>
                        <linearGradient id="subscriptionActiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#0ABAB5" />
                          <stop offset="100%" stopColor="#089a95" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="card-content">
                    <h3>Премиум</h3>
                    <p>Полный доступ ко всем функциям</p>
                    <div className="subscription-price">$999 / month</div>
                  </div>
                </div>
                <div className="section-card subscription-card subscription-inactive">
                  <div className="card-icon-wrapper">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <rect x="8" y="8" width="24" height="24" rx="3" fill="url(#subscriptionInactive1Grad)"/>
                      <path d="M12 20H28M20 12V28" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
                      <defs>
                        <linearGradient id="subscriptionInactive1Grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#999" />
                          <stop offset="100%" stopColor="#666" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="card-content">
                    <h3>Базовый</h3>
                    <p>Основные возможности</p>
                    <div className="subscription-price">$499 / month</div>
                  </div>
                </div>
                <div className="section-card subscription-card subscription-inactive">
                  <div className="card-icon-wrapper">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="12" fill="url(#subscriptionInactive2Grad)"/>
                      <path d="M20 12V20L26 26" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
                      <defs>
                        <linearGradient id="subscriptionInactive2Grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#999" />
                          <stop offset="100%" stopColor="#666" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="card-content">
                    <h3>Стандарт</h3>
                    <p>Расширенные функции</p>
                    <div className="subscription-price">$749 / month</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="profile-section">
              <div className="section-header">
                <h2 className="section-title">
                  Документы
                  {!isDocumentsComplete() && (
                    <span className="section-indicator section-indicator--incomplete"></span>
                  )}
                </h2>
                <div className="section-subtitle">Загрузите документы для верификации</div>
              </div>
              <div className="section-cards">
                <input
                  ref={passportInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      handleDocumentUpload('passport', e.target.files[0])
                    }
                  }}
                />
                <input
                  ref={passportWithFaceInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      handleDocumentUpload('passportWithFace', e.target.files[0])
                    }
                  }}
                />
                {(() => {
                  const doc = userDocuments.passport
                  const status = doc?.verification_status || 'none'
                  const isPending = status === 'pending'
                  const isApproved = status === 'approved'
                  const isRejected = status === 'rejected'
                  const canUpload = !isPending && !uploading.passport && userId
                  
                  return (
                    <div 
                      className={`section-card document-card ${isPending ? 'document-pending' : ''} ${isApproved ? 'document-approved' : ''} ${isRejected ? 'document-rejected' : ''}`}
                      onClick={() => {
                        if (canUpload) {
                          passportInputRef.current?.click()
                        } else if (isPending) {
                          alert('Документ уже на рассмотрении. Дождитесь результата проверки.')
                        } else if (!userId) {
                          alert('Необходимо войти в систему для загрузки документов')
                        }
                      }}
                      style={{ 
                        cursor: canUpload ? 'pointer' : (isPending || !userId) ? 'not-allowed' : 'pointer',
                        opacity: uploading.passport ? 0.6 : isPending ? 0.8 : 1
                      }}
                    >
                      <div className="card-icon-wrapper">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                          <rect x="8" y="6" width="24" height="28" rx="2" fill="url(#passportGrad)"/>
                          <circle cx="20" cy="16" r="3" fill="white" opacity="0.8"/>
                          <path d="M14 22C14 22 16 26 20 26C24 26 26 22 26 22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                          <defs>
                            <linearGradient id="passportGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#0ABAB5" />
                              <stop offset="100%" stopColor="#089a95" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <div className="card-content">
                        <h3>Паспорт</h3>
                        <p>
                          {uploading.passport ? 'Загрузка...' : 
                           isPending ? 'На рассмотрении' :
                           isApproved ? 'Одобрен' :
                           isRejected ? 'Отклонен' :
                           'Загрузите фото или скан паспорта'}
                        </p>
                        {isPending && (
                          <div className="document-status-badge document-status-pending">
                            ⏳ На рассмотрении
                          </div>
                        )}
                        {isApproved && (
                          <div className="document-status-badge document-status-approved">
                            ✅ Одобрен
                          </div>
                        )}
                        {isRejected && (
                          <div className="document-status-badge document-status-rejected">
                            ❌ Отклонен
                          </div>
                        )}
                      </div>
                      {canUpload && <div className="card-badge">+</div>}
                    </div>
                  )
                })()}
                {(() => {
                  const doc = userDocuments.passportWithFace
                  const status = doc?.verification_status || 'none'
                  const isPending = status === 'pending'
                  const isApproved = status === 'approved'
                  const isRejected = status === 'rejected'
                  const canUpload = !isPending && !uploading.passportWithFace && userId
                  
                  return (
                    <div 
                      className={`section-card document-card ${isPending ? 'document-pending' : ''} ${isApproved ? 'document-approved' : ''} ${isRejected ? 'document-rejected' : ''}`}
                      onClick={() => {
                        if (canUpload) {
                          passportWithFaceInputRef.current?.click()
                        } else if (isPending) {
                          alert('Документ уже на рассмотрении. Дождитесь результата проверки.')
                        } else if (!userId) {
                          alert('Необходимо войти в систему для загрузки документов')
                        }
                      }}
                      style={{ 
                        cursor: canUpload ? 'pointer' : (isPending || !userId) ? 'not-allowed' : 'pointer',
                        opacity: uploading.passportWithFace ? 0.6 : isPending ? 0.8 : 1
                      }}
                    >
                      <div className="card-icon-wrapper">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                          <rect x="8" y="6" width="24" height="28" rx="2" fill="url(#passportFaceGrad)"/>
                          <circle cx="20" cy="16" r="3" fill="white" opacity="0.8"/>
                          <path d="M14 22C14 22 16 26 20 26C24 26 26 22 26 22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                          <circle cx="28" cy="12" r="4" fill="white" opacity="0.9"/>
                          <path d="M26 12C26 12 27 13 28 13C29 13 30 12 30 12" stroke="#089a95" strokeWidth="1.5" strokeLinecap="round"/>
                          <defs>
                            <linearGradient id="passportFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#0ABAB5" />
                              <stop offset="100%" stopColor="#089a95" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <div className="card-content">
                        <h3>Паспорт + лицо</h3>
                        <p>
                          {uploading.passportWithFace ? 'Загрузка...' : 
                           isPending ? 'На рассмотрении' :
                           isApproved ? 'Одобрен' :
                           isRejected ? 'Отклонен' :
                           'Селфи с паспортом рядом с лицом'}
                        </p>
                        {isPending && (
                          <div className="document-status-badge document-status-pending">
                            ⏳ На рассмотрении
                          </div>
                        )}
                        {isApproved && (
                          <div className="document-status-badge document-status-approved">
                            ✅ Одобрен
                          </div>
                        )}
                        {isRejected && (
                          <div className="document-status-badge document-status-rejected">
                            ❌ Отклонен
                          </div>
                        )}
                      </div>
                      {canUpload && <div className="card-badge">+</div>}
                    </div>
                  )
                })()}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Profile

