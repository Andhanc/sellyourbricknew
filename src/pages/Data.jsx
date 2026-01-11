import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getUserData, logout, sendEmailVerificationCode, verifyEmailForProfileUpdate } from '../services/authService'
import EmailVerificationModal from '../components/EmailVerificationModal'
import ProfileDataWarningToast from '../components/ProfileDataWarningToast'
import './Data.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const Data = () => {
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    login: '',
    password: '',
    phone: '',
    country: '',
    countryFlag: '',
    address: '',
    passportSeries: '',
    passportNumber: '',
    identificationNumber: ''
  })
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [originalEmail, setOriginalEmail] = useState('')
  const [userId, setUserId] = useState(null)
  const [isWhatsAppUser, setIsWhatsAppUser] = useState(false)
  const [hasProfileData, setHasProfileData] = useState(false)
  const [hasDocuments, setHasDocuments] = useState(false)
  const [showDataWarning, setShowDataWarning] = useState(false)
  const [shouldHighlightFields, setShouldHighlightFields] = useState(false)

  // Вспомогательная функция для форматирования номера телефона с плюсом
  const formatPhoneWithPlus = (phone) => {
    if (!phone) return ''
    // Убираем все пробелы и нецифровые символы, кроме +
    const cleaned = phone.replace(/[^\d+]/g, '')
    // Если номер начинается с цифр, добавляем плюс
    if (cleaned && !cleaned.startsWith('+')) {
      return '+' + cleaned
    }
    return cleaned
  }

  // Загружаем данные пользователя при монтировании компонента
  useEffect(() => {
    const loadUserData = async () => {
      const savedUserData = getUserData()
      
      if (savedUserData.isLoggedIn) {
        // Определяем, зарегистрирован ли пользователь через WhatsApp
        const whatsAppUser = savedUserData.loginMethod === 'whatsapp' || 
                            (savedUserData.phone && !savedUserData.email)
        setIsWhatsAppUser(whatsAppUser)
        setUserId(savedUserData.id)
        
        // Если пользователь авторизован в localStorage, загружаем его данные
        // Также пытаемся синхронизировать с БД, если есть ID
        if (savedUserData.id) {
          try {
            const response = await fetch(`${API_BASE_URL}/users/${savedUserData.id}`)
            if (response.ok) {
              const result = await response.json()
              if (result.success && result.data) {
                // Обновляем данные из БД
                const dbUser = result.data
                const nameParts = (dbUser.first_name && dbUser.last_name 
                  ? `${dbUser.first_name} ${dbUser.last_name}`.trim()
                  : savedUserData.name || '').split(' ')
                const firstName = nameParts[0] || dbUser.first_name || ''
                const lastName = nameParts.slice(1).join(' ') || dbUser.last_name || ''
                
                const email = dbUser.email || savedUserData.email || ''
                setOriginalEmail(email)
                
                // Форматируем номер телефона с плюсом
                const phoneFromDB = dbUser.phone_number || ''
                const phoneFormatted = formatPhoneWithPlus(savedUserData.phoneFormatted || phoneFromDB)
                
                setUserData({
                  firstName: firstName,
                  lastName: lastName,
                  middleName: '',
                  email: email,
                  login: savedUserData.login || '',
                  password: '',
                  phone: phoneFormatted,
                  country: dbUser.country || savedUserData.country || '',
                  countryFlag: savedUserData.countryFlag || '',
                  address: dbUser.address || '',
                  passportSeries: dbUser.passport_series || '',
                  passportNumber: dbUser.passport_number || '',
                  identificationNumber: dbUser.identification_number || ''
                })
                
                // Обновляем информацию о пользователе WhatsApp, если email был null или is_verified = 0
                if (whatsAppUser && dbUser.phone_number && (!dbUser.email || dbUser.is_verified === 0)) {
                  setIsWhatsAppUser(true)
                }
                
                return
              }
            }
          } catch (error) {
            console.warn('⚠️ Не удалось загрузить данные из БД, используем localStorage:', error.message)
          }
        }
        
        // Fallback: используем данные из localStorage
        const nameParts = (savedUserData.name || '').split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        
        const email = savedUserData.email || ''
        setOriginalEmail(email)
        
        // Форматируем номер телефона с плюсом
        const phoneFromStorage = savedUserData.phoneFormatted || savedUserData.phone || ''
        const phoneFormattedStorage = formatPhoneWithPlus(phoneFromStorage)
        
        setUserData({
          firstName: firstName,
          lastName: lastName,
          middleName: '',
          email: email,
          login: savedUserData.login || '',
          password: '',
          phone: phoneFormattedStorage,
          country: savedUserData.country || '',
          countryFlag: savedUserData.countryFlag || '',
          address: '',
          passportSeries: '',
          passportNumber: '',
          identificationNumber: ''
        })
      } else {
        // Если не авторизован, перенаправляем на главную страницу
        console.warn('⚠️ Пользователь не авторизован, перенаправление на главную')
        navigate('/')
      }
    }
    
    loadUserData()
  }, [navigate])

  // Проверяем заполненность данных (для страницы Данные) и документов
  useEffect(() => {
    const checkDataCompleteness = async () => {
      try {
        const savedUserData = getUserData()
        
        if (!savedUserData.isLoggedIn || !savedUserData.id) {
          return
        }

        // Проверяем данные в БД
        try {
          const response = await fetch(`${API_BASE_URL}/users/${savedUserData.id}`)
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              const dbUser = result.data
              // Проверяем обязательные поля: имя, фамилия, email, телефон
              const isComplete = 
                dbUser.first_name?.trim() && 
                dbUser.last_name?.trim() && 
                dbUser.email?.trim() && 
                dbUser.phone_number?.trim()
              
              setHasProfileData(isComplete)
              
              if (!isComplete) {
                setShowDataWarning(true)
              }
            } else {
              setHasProfileData(false)
              setShowDataWarning(true)
            }
          }
        } catch (error) {
          console.warn('Не удалось загрузить данные из БД для проверки:', error)
        }

        // Проверяем документы
        try {
          const docsResponse = await fetch(`${API_BASE_URL}/documents/user/${savedUserData.id}`)
          if (docsResponse.ok) {
            const docsResult = await docsResponse.json()
            if (docsResult.success && docsResult.data) {
              const documents = docsResult.data || []
              setHasDocuments(documents.length >= 2)
            } else {
              setHasDocuments(false)
            }
          }
        } catch (error) {
          console.warn('Не удалось загрузить документы из БД для проверки:', error)
        }
      } catch (error) {
        console.error('Ошибка при проверке данных:', error)
      }
    }

    checkDataCompleteness()
  }, [])

  // Проверяем флаг подсветки полей при загрузке
  useEffect(() => {
    const shouldHighlight = localStorage.getItem('highlightEmptyFields') === 'true'
    if (shouldHighlight) {
      // Включаем режим редактирования
      setIsEditing(true)
      setShouldHighlightFields(true)
      // Убираем флаг
      localStorage.removeItem('highlightEmptyFields')
    }
  }, [])

  const [connectedAccounts, setConnectedAccounts] = useState({
    google: true,
    whatsapp: false,
    facebook: false
  })

  // Функция для проверки, является ли поле обязательным и незаполненным
  const isFieldEmpty = (fieldName) => {
    if (!isEditing) return false
    const requiredFields = ['firstName', 'lastName', 'email', 'phone']
    if (!requiredFields.includes(fieldName)) return false
    const value = userData[fieldName]
    return !value || value.trim() === ''
  }

  // Проверяем, все ли обязательные поля заполнены и обновляем hasProfileData
  useEffect(() => {
    if (isEditing) {
      const allFieldsFilled = 
        userData.firstName?.trim() && 
        userData.lastName?.trim() && 
        userData.email?.trim() && 
        userData.phone?.trim()
      
      setHasProfileData(allFieldsFilled)
      if (allFieldsFilled && shouldHighlightFields) {
        setShouldHighlightFields(false)
      }
    }
  }, [userData.firstName, userData.lastName, userData.email, userData.phone, isEditing, shouldHighlightFields])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSave = async () => {
    try {
      const savedUserData = getUserData()
      
      // Если пользователь не авторизован, просто сохраняем в localStorage
      if (!savedUserData.isLoggedIn || !savedUserData.id) {
        console.warn('⚠️ Пользователь не авторизован, данные сохранены только локально')
        setIsEditing(false)
        return
      }

      // Проверяем, изменился ли email для пользователя WhatsApp
      const emailChanged = userData.email && userData.email !== originalEmail
      
      if (emailChanged && isWhatsAppUser && userData.email.trim() !== '') {
        // Если email изменился для пользователя WhatsApp, требуем подтверждение
        // Сначала отправляем код подтверждения
        try {
          const emailLower = userData.email.toLowerCase()
          const codeResult = await sendEmailVerificationCode(emailLower)
          
          if (codeResult.success) {
            // Сохраняем новый email как pending
            setPendingEmail(emailLower)
            // Показываем модальное окно для ввода кода
            setShowEmailVerificationModal(true)
            return // Не сохраняем данные, пока не подтвержден email
          } else {
            alert(codeResult.error || 'Не удалось отправить код подтверждения. Попробуйте позже.')
            return
          }
        } catch (error) {
          console.error('Ошибка отправки кода подтверждения:', error)
          alert('Ошибка отправки кода подтверждения. Попробуйте позже.')
          return
        }
      }

      // Форматируем номер телефона (убираем все кроме цифр)
      const phoneDigits = userData.phone.replace(/\D/g, '') || null

      // Подготавливаем данные для отправки на backend
      const updateData = {
        first_name: userData.firstName || null,
        last_name: userData.lastName || null,
        email: userData.email || null,
        phone_number: phoneDigits,
        address: userData.address || null,
        country: userData.country || null,
        passport_series: userData.passportSeries || null,
        passport_number: userData.passportNumber || null,
        identification_number: userData.identificationNumber || null
      }
      
      // Если пароль заполнен, добавляем его в данные для обновления
      // ВАЖНО: пароль отправляется только если поле заполнено (для изменения существующего пароля)
      if (userData.password && userData.password.trim() !== '') {
        updateData.password = userData.password.trim() // Пароль будет захеширован на backend
        console.log('🔐 Пароль будет обновлен при сохранении')
      } else {
        // Если пароль пустой, не отправляем его (не меняем существующий пароль)
        console.log('ℹ️ Пароль не изменен (поле пустое)')
      }

      // Отправляем данные на backend
      const response = await fetch(`${API_BASE_URL}/users/${savedUserData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const result = await response.json()
        
        // Проверяем, требуется ли подтверждение email
        if (result.requiresVerification === true) {
          // Если требуется подтверждение, отправляем код и показываем модальное окно
          try {
            const emailLower = (userData.email || '').toLowerCase()
            if (emailLower) {
              const codeResult = await sendEmailVerificationCode(emailLower)
              
              if (codeResult.success) {
                setPendingEmail(emailLower)
                setShowEmailVerificationModal(true)
                return
              } else {
                alert(codeResult.error || 'Не удалось отправить код подтверждения. Попробуйте позже.')
                return
              }
            }
          } catch (error) {
            console.error('Ошибка отправки кода подтверждения:', error)
            alert('Ошибка отправки кода подтверждения. Попробуйте позже.')
            return
          }
        }
        
        console.log('✅ Данные успешно сохранены в БД:', result.data)
        
        // Форматируем номер телефона с плюсом для обновления состояния
        const formattedPhone = formatPhoneWithPlus(userData.phone || '')
        
        // Обновляем данные в localStorage
        const updatedUserData = {
          ...savedUserData,
          name: `${userData.firstName} ${userData.lastName}`.trim(),
          email: result.data?.email || userData.email || savedUserData.email,
          phoneFormatted: formattedPhone || savedUserData.phoneFormatted,
          phone: phoneDigits || savedUserData.phone,
          country: userData.country || savedUserData.country,
          address: userData.address || savedUserData.address
        }
        localStorage.setItem('userData', JSON.stringify(updatedUserData))
        
        // Обновляем originalEmail после успешного сохранения
        setOriginalEmail(result.data?.email || userData.email || originalEmail)
        
        // Обновляем состояние, включая номер телефона с плюсом
        setUserData(prev => ({ 
          ...prev, 
          phone: formattedPhone || prev.phone,
          password: '' 
        }))
        
        setIsEditing(false)
        
        // Обновляем hasProfileData после сохранения
        const allFieldsFilled = 
          userData.firstName?.trim() && 
          userData.lastName?.trim() && 
          userData.email?.trim() && 
          userData.phone?.trim()
        
        const wasIncomplete = !hasProfileData
        const isNowComplete = allFieldsFilled
        
        setHasProfileData(allFieldsFilled)
        
        // Если данные только что заполнились, отправляем событие
        if (wasIncomplete && isNowComplete) {
          window.dispatchEvent(new CustomEvent('profileDataCompleted'))
        }
        
        alert('Данные успешно сохранены!')
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Ошибка при сохранении в БД:', errorData.error || 'Неизвестная ошибка')
        
        // Fallback: сохраняем только в localStorage
        const updatedUserData = {
          ...savedUserData,
          name: `${userData.firstName} ${userData.lastName}`.trim(),
          email: userData.email || savedUserData.email,
          phoneFormatted: userData.phone || savedUserData.phoneFormatted,
          phone: phoneDigits || savedUserData.phone,
          country: userData.country || savedUserData.country,
          address: userData.address || savedUserData.address
        }
        localStorage.setItem('userData', JSON.stringify(updatedUserData))
        
        alert('⚠️ Данные сохранены локально, но не в БД. Убедитесь, что backend сервер запущен.')
        setIsEditing(false)
      }
    } catch (error) {
      console.error('❌ Ошибка при сохранении данных:', error)
      
      // Fallback: сохраняем только в localStorage
      const savedUserData = getUserData()
      const updatedUserData = {
        ...savedUserData,
        name: `${userData.firstName} ${userData.lastName}`.trim(),
        email: userData.email || savedUserData.email,
        phoneFormatted: userData.phone || savedUserData.phoneFormatted,
        country: userData.country || savedUserData.country,
        address: userData.address || savedUserData.address
      }
      localStorage.setItem('userData', JSON.stringify(updatedUserData))
      
      alert('⚠️ Ошибка при сохранении. Данные сохранены локально. Проверьте подключение к серверу.')
      setIsEditing(false)
    }
  }
  
  // Обработчик успешного подтверждения email
  const handleEmailVerificationSuccess = async (userDataOrCode) => {
    try {
      // После подтверждения email на сервере, загружаем обновленные данные пользователя
      if (!userId) {
        console.error('Ошибка: userId не определен')
        setShowEmailVerificationModal(false)
        setPendingEmail('')
        return
      }
      
      // Сохраняем email перед очисткой pendingEmail
      const confirmedEmailForUpdate = pendingEmail || userData.email
      
      // Закрываем модальное окно сразу после успешного подтверждения
      setShowEmailVerificationModal(false)
      setPendingEmail('')

      // Сначала загружаем обновленные данные пользователя с сервера
      try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`)
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            // Обновляем данные из БД
            const dbUser = result.data
            const nameParts = (dbUser.first_name && dbUser.last_name 
              ? `${dbUser.first_name} ${dbUser.last_name}`.trim()
              : dbUser.first_name || '').split(' ')
            const firstName = nameParts[0] || dbUser.first_name || ''
            const lastName = nameParts.slice(1).join(' ') || dbUser.last_name || ''
            
            const confirmedEmail = dbUser.email || confirmedEmailForUpdate
            
            // Обновляем состояние полностью с новым email
            setUserData(prev => {
              // Форматируем номер телефона с плюсом
              const phoneFromDB = dbUser.phone_number || ''
              const formattedPhone = formatPhoneWithPlus(phoneFromDB || prev.phone || '')
              
              return {
                ...prev,
                firstName: firstName,
                lastName: lastName,
                email: confirmedEmail,
                phone: formattedPhone,
                country: dbUser.country || prev.country || '',
                address: dbUser.address || prev.address || '',
                passportSeries: dbUser.passport_series || prev.passportSeries || '',
                passportNumber: dbUser.passport_number || prev.passportNumber || '',
                identificationNumber: dbUser.identification_number || prev.identificationNumber || '',
                password: '' // Очищаем пароль
              }
            })
            
            // Обновляем originalEmail
            setOriginalEmail(confirmedEmail)
            
            // Обновляем localStorage с данными с сервера
            const savedUserData = getUserData()
            const updatedUserData = {
              ...savedUserData,
              ...result.data,
              email: confirmedEmail
            }
            localStorage.setItem('userData', JSON.stringify(updatedUserData))
            
            console.log('✅ Данные пользователя обновлены с сервера:', result.data)
            
            // Обновляем остальные данные, если они были изменены (имя, фамилия и т.д.)
            const phoneDigits = userData.phone.replace(/\D/g, '') || null
            const updateData = {
              first_name: userData.firstName || null,
              last_name: userData.lastName || null,
              phone_number: phoneDigits,
              address: userData.address || null,
              country: userData.country || null,
              passport_series: userData.passportSeries || null,
              passport_number: userData.passportNumber || null,
              identification_number: userData.identificationNumber || null
            }
            
            if (userData.password && userData.password.trim() !== '') {
              updateData.password = userData.password.trim()
            }
            
            // Обновляем остальные данные на сервере, если они были изменены
            try {
              const updateResponse = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
              })
              
              if (updateResponse.ok) {
                const updateResult = await updateResponse.json()
                if (updateResult.success && updateResult.data) {
                  console.log('✅ Все данные успешно сохранены:', updateResult.data)
                  
                  // Обновляем состояние еще раз с данными с сервера
                  const updatedDbUser = updateResult.data
                  const updatedNameParts = (updatedDbUser.first_name && updatedDbUser.last_name 
                    ? `${updatedDbUser.first_name} ${updatedDbUser.last_name}`.trim()
                    : updatedDbUser.first_name || '').split(' ')
                  const updatedFirstName = updatedNameParts[0] || updatedDbUser.first_name || ''
                  const updatedLastName = updatedNameParts.slice(1).join(' ') || updatedDbUser.last_name || ''
                  
                  setUserData(prev => {
                    // Форматируем номер телефона с плюсом
                    const updatedPhoneFromDB = updatedDbUser.phone_number || ''
                    const updatedFormattedPhone = formatPhoneWithPlus(updatedPhoneFromDB || prev.phone || '')
                    
                    return {
                      ...prev,
                      firstName: updatedFirstName,
                      lastName: updatedLastName,
                      email: updatedDbUser.email || confirmedEmail || prev.email,
                      phone: updatedFormattedPhone,
                      address: updatedDbUser.address || prev.address,
                      country: updatedDbUser.country || prev.country,
                      passportSeries: updatedDbUser.passport_series || prev.passportSeries,
                      passportNumber: updatedDbUser.passport_number || prev.passportNumber,
                      identificationNumber: updatedDbUser.identification_number || prev.identificationNumber,
                      password: '' // Очищаем пароль
                    }
                  })
                  
                  // Обновляем originalEmail на случай, если email изменился
                  if (updatedDbUser.email) {
                    setOriginalEmail(updatedDbUser.email)
                  }
                  
                  // Обновляем localStorage
                  const currentSavedData = getUserData()
                  const finalUpdatedData = {
                    ...currentSavedData,
                    ...updateResult.data
                  }
                  localStorage.setItem('userData', JSON.stringify(finalUpdatedData))
                }
              }
            } catch (updateError) {
              console.warn('⚠️ Не удалось сохранить остальные данные:', updateError)
            }
            
            // Выходим из режима редактирования
            setIsEditing(false)
            
            alert('Email успешно подтвержден и данные сохранены!')
            return // Прерываем выполнение, так как уже все обновили
          }
        }
      } catch (error) {
        console.warn('⚠️ Не удалось загрузить данные с сервера, используем localStorage:', error)
        // Fallback: используем данные из localStorage
        const savedUserData = getUserData()
        if (savedUserData.email) {
          setUserData(prev => ({
            ...prev,
            email: savedUserData.email
          }))
          setOriginalEmail(savedUserData.email)
          
          setIsEditing(false)
          alert('Email успешно подтвержден! Данные обновлены из локального хранилища.')
          return
        }
      }
    } catch (error) {
      console.error('Ошибка обновления данных после подтверждения email:', error)
      alert('Email подтвержден, но возникла ошибка при обновлении данных. Попробуйте обновить страницу.')
      
      // Закрываем модальное окно даже при ошибке
      setShowEmailVerificationModal(false)
      setPendingEmail('')
    }
  }

  const handleChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDisconnectAccount = (account) => {
    setConnectedAccounts(prev => ({
      ...prev,
      [account]: false
    }))
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.')) {
      // Здесь можно добавить логику удаления аккаунта
      alert('Аккаунт будет удален')
    }
  }

  const handleLogout = async () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      await logout()
      navigate('/')
      // Небольшая задержка перед перезагрузкой, чтобы данные успели очиститься
      setTimeout(() => {
        window.location.reload() // Перезагружаем страницу для обновления состояния
      }, 100)
    }
  }

  return (
    <div className="data-page">
      <div className="data-container">
        <aside className="data-sidebar">
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
            <Link to="/profile" className="nav-item">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" fill="currentColor"/>
                <path d="M10 12C5.58172 12 2 13.7909 2 16V20H18V16C18 13.7909 14.4183 12 10 12Z" fill="currentColor"/>
              </svg>
              <span>Профиль</span>
            </Link>
            <Link to="/data" className="nav-item active">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 8H14M6 12H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Данные</span>
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

          <button 
            className="logout-button" 
            onClick={handleLogout}
            style={{
              width: 'calc(100% - 32px)',
              margin: '16px',
              padding: '12px 16px',
              backgroundColor: 'transparent',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              color: '#ff4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#fff5f5'
              e.target.style.borderColor = '#ff4444'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.borderColor = '#e0e0e0'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 2H3C2.44772 2 2 2.44772 2 3V15C2 15.5523 2.44772 16 3 16H7M12 13L15 10M15 10L12 7M15 10H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Выйти</span>
          </button>
        </aside>

        <main className="data-main">
          <div className="data-header">
            <h1>Личные данные</h1>
            {!isEditing ? (
              <button className="edit-button" onClick={handleEdit}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M12.75 2.25C13.0721 1.92788 13.4563 1.70947 13.8874 1.61553C14.3185 1.52159 14.767 1.46849 15.2188 1.47159C15.6706 1.47469 16.1188 1.53394 16.5474 1.63628C16.976 1.73862 17.3638 1.96012 17.6875 2.28375C18.0111 2.60738 18.2326 2.99525 18.335 3.42381C18.4373 3.85237 18.4966 4.30056 18.4997 4.75237C18.5028 5.20419 18.4497 5.65269 18.3557 6.08381C18.2618 6.51494 18.0434 6.89912 17.7213 7.22125L6.375 18.5625L1.125 19.875L2.4375 14.625L13.7813 3.28125C13.9001 3.16245 14.0438 3.07141 14.2026 3.01406C14.3614 2.95671 14.5316 2.93439 14.7006 2.94844H14.8L12.75 2.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Редактировать</span>
              </button>
            ) : (
              <div className="edit-actions">
                <button className="save-button" onClick={handleSave}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M15 4.5L6.75 12.75L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Сохранить</span>
                </button>
                <button className="cancel-button" onClick={handleCancel}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Отменить</span>
                </button>
              </div>
            )}
          </div>

          <div className="data-content">
            <section className="data-section">
              <h2 className="section-title">Основная информация</h2>
              <div className="data-grid">
                <div className="data-field">
                  <label>Имя</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className={`data-input ${isFieldEmpty('firstName') ? 'data-input--error' : ''}`}
                    />
                  ) : (
                    <div className="data-value">{userData.firstName || 'Не указано'}</div>
                  )}
                </div>

                <div className="data-field">
                  <label>Фамилия</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className={`data-input ${isFieldEmpty('lastName') ? 'data-input--error' : ''}`}
                    />
                  ) : (
                    <div className="data-value">{userData.lastName || 'Не указано'}</div>
                  )}
                </div>

                <div className="data-field">
                  <label>Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={userData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={`data-input ${isFieldEmpty('email') ? 'data-input--error' : ''}`}
                    />
                  ) : (
                    <div className="data-value">{userData.email || 'Не указан'}</div>
                  )}
                </div>

                <div className="data-field">
                  <label>Логин</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.login}
                      onChange={(e) => handleChange('login', e.target.value)}
                      className="data-input"
                      placeholder="Введите логин"
                    />
                  ) : (
                    <div className="data-value">{userData.login || 'Не указан'}</div>
                  )}
                </div>

                <div className="data-field">
                  <label>Пароль</label>
                  {isEditing ? (
                    <input
                      type="password"
                      value={userData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className="data-input"
                      placeholder="Введите новый пароль (оставьте пустым, чтобы не изменять)"
                    />
                  ) : (
                    <div className="data-value">••••••••</div>
                  )}
                </div>

                <div className="data-field">
                  <label>Номер телефона</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={userData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className={`data-input ${isFieldEmpty('phone') ? 'data-input--error' : ''}`}
                    />
                  ) : (
                    <div className="data-value">{formatPhoneWithPlus(userData.phone) || 'Не указан'}</div>
                  )}
                </div>

                {userData.country && (
                  <div className="data-field">
                    <label>Страна</label>
                    <div className="data-value">
                      {userData.countryFlag && <span style={{ marginRight: '6px' }}>{userData.countryFlag}</span>}
                      {userData.country}
                    </div>
                  </div>
                )}

                <div className="data-field">
                  <label>Адрес проживания</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className="data-input"
                      placeholder="Введите адрес"
                    />
                  ) : (
                    <div className="data-value">{userData.address || 'Не указан'}</div>
                  )}
                </div>
              </div>
            </section>

            <section className="data-section">
              <h2 className="section-title">Паспортные данные</h2>
              <div className="data-grid">
                <div className="data-field">
                  <label>Серия паспорта</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.passportSeries}
                      onChange={(e) => handleChange('passportSeries', e.target.value)}
                      className="data-input"
                      maxLength="2"
                    />
                  ) : (
                    <div className="data-value">{userData.passportSeries}</div>
                  )}
                </div>

                <div className="data-field">
                  <label>Номер паспорта</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.passportNumber}
                      onChange={(e) => handleChange('passportNumber', e.target.value)}
                      className="data-input"
                    />
                  ) : (
                    <div className="data-value">{userData.passportNumber}</div>
                  )}
                </div>

                <div className="data-field data-field-full">
                  <label>Идентификационный номер</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.identificationNumber}
                      onChange={(e) => handleChange('identificationNumber', e.target.value)}
                      className="data-input"
                    />
                  ) : (
                    <div className="data-value">{userData.identificationNumber}</div>
                  )}
                </div>
              </div>
            </section>

            <section className="data-section">
              <h2 className="section-title">Подключенные аккаунты</h2>
              <div className="connected-accounts">
                <div className="account-item">
                  <div className="account-info">
                    <div className="account-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    </div>
                    <div className="account-details">
                      <div className="account-name">Google</div>
                      <div className="account-status">
                        {connectedAccounts.google ? 'Подключен' : 'Не подключен'}
                      </div>
                    </div>
                  </div>
                  {connectedAccounts.google && (
                    <button
                      className="disconnect-button"
                      onClick={() => handleDisconnectAccount('google')}
                    >
                      Отключить
                    </button>
                  )}
                </div>

                <div className="account-item">
                  <div className="account-info">
                    <div className="account-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="12" fill="#25D366"/>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="white"/>
                      </svg>
                    </div>
                    <div className="account-details">
                      <div className="account-name">WhatsApp</div>
                      <div className="account-status">
                        {connectedAccounts.whatsapp ? 'Подключен' : 'Не подключен'}
                      </div>
                    </div>
                  </div>
                  {connectedAccounts.whatsapp && (
                    <button
                      className="disconnect-button"
                      onClick={() => handleDisconnectAccount('whatsapp')}
                    >
                      Отключить
                    </button>
                  )}
                </div>

                <div className="account-item">
                  <div className="account-info">
                    <div className="account-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="12" fill="#1877F2"/>
                        <path d="M16.5 14.5l.5-3.2h-3.1v-2.07c0-.88.43-1.73 1.81-1.73h1.4V4.64c-.71-.07-1.42-.1-2.13-.1-2.13 0-3.59 1.29-3.59 3.64v2.32H8v3.2h2.39V19.5h2.91v-5h2.2z" fill="white"/>
                      </svg>
                    </div>
                    <div className="account-details">
                      <div className="account-name">Facebook</div>
                      <div className="account-status">
                        {connectedAccounts.facebook ? 'Подключен' : 'Не подключен'}
                      </div>
                    </div>
                  </div>
                  {connectedAccounts.facebook && (
                    <button
                      className="disconnect-button"
                      onClick={() => handleDisconnectAccount('facebook')}
                    >
                      Отключить
                    </button>
                  )}
                </div>
              </div>
            </section>

            <section className="data-section danger-section">
              <div className="danger-actions">
                <div className="danger-info">
                  <h3>Удаление аккаунта</h3>
                  <p>После удаления аккаунта все ваши данные будут безвозвратно удалены. Это действие нельзя отменить.</p>
                </div>
                <button className="delete-account-button" onClick={handleDeleteAccount}>
                  Удалить аккаунт
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
      
      {/* Модальное окно подтверждения email */}
      <EmailVerificationModal
        isOpen={showEmailVerificationModal}
        onClose={() => {
          // При закрытии без подтверждения возвращаем email к исходному значению
          setUserData(prev => ({
            ...prev,
            email: originalEmail
          }))
          setShowEmailVerificationModal(false)
          setPendingEmail('')
        }}
        onSuccess={handleEmailVerificationSuccess}
        email={pendingEmail}
        isProfileUpdate={true}
        userId={userId}
      />
      
      <ProfileDataWarningToast
        isOpen={showDataWarning}
        onClose={() => setShowDataWarning(false)}
        onGoToData={() => {
          setShowDataWarning(false)
          setIsEditing(true)
          setShouldHighlightFields(true)
        }}
        message="Пожалуйста, заполните личные данные в разделе Данные"
      />
    </div>
  )
}

export default Data

