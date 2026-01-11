import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiX, FiMail, FiLock, FiUser } from 'react-icons/fi'
import { FaGoogle, FaWhatsapp, FaFacebook } from 'react-icons/fa'
import { useSignIn, useSignUp, SignIn, SignUp, useAuth } from '@clerk/clerk-react'
import WhatsAppVerificationModal from './WhatsAppVerificationModal'
import EmailVerificationModal from './EmailVerificationModal'
import { registerWithEmail, loginWithEmail } from '../services/authService'
import './LoginModal.css'

const LoginModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const { signIn, isLoaded: signInLoaded } = useSignIn()
  const { signUp, isLoaded: signUpLoaded } = useSignUp()
  const { isSignedIn } = useAuth()
  const [isLogin, setIsLogin] = useState(true) // true для входа, false для регистрации
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false)
  const [showClerkSignInModal, setShowClerkSignInModal] = useState(false)
  const [showClerkSignUpModal, setShowClerkSignUpModal] = useState(false)

  // Обработка успешной авторизации через Clerk
  useEffect(() => {
    if (isSignedIn && (showClerkSignInModal || showClerkSignUpModal)) {
      console.log('LoginModal: User signed in through Clerk, closing modals')
      setShowClerkSignInModal(false)
      setShowClerkSignUpModal(false)
      onClose()
      navigate('/profile')
    }
  }, [isSignedIn, showClerkSignInModal, showClerkSignUpModal, onClose, navigate])

  // Не скрываем LoginModal полностью, чтобы EmailVerificationModal мог рендериться
  // Вместо этого скрываем только содержимое LoginModal
  if (!isOpen) return null

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    if (isLogin) {
      // Проверка для администратора
      if (formData.email.toLowerCase() === 'admin' && formData.password === 'admin') {
        // Сохраняем информацию о входе администратора
        localStorage.setItem('userRole', 'admin')
        localStorage.setItem('isAdminLoggedIn', 'true')
        localStorage.setItem('isLoggedIn', 'true')
        setIsLoading(false)
        onClose()
        navigate('/admin')
        return
      }
      
      // Проверка для владельца недвижимости
      if (formData.email.toLowerCase() === 'owner' && formData.password === '1234') {
        // Сохраняем информацию о входе владельца
        localStorage.setItem('userRole', 'owner')
        localStorage.setItem('isOwnerLoggedIn', 'true')
        setIsLoading(false)
        onClose()
        navigate('/owner')
        return
      }
      
      // Проверка для клиента
      if (formData.email.toLowerCase() === 'client' && formData.password === '1234') {
        // Сохраняем информацию о входе клиента
        localStorage.setItem('userRole', 'client')
        localStorage.setItem('isLoggedIn', 'true')
        setIsLoading(false)
        onClose()
        navigate('/profile')
        return
      }
      
      // Обычный вход с email и паролем
      try {
        const result = await loginWithEmail(formData.email, formData.password)
        
        if (result.success) {
          setIsLoading(false)
          onClose()
          navigate('/profile')
        } else {
          setError(result.error || 'Неверный email или пароль')
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Ошибка входа:', error)
        setError('Произошла ошибка при входе. Попробуйте позже.')
        setIsLoading(false)
      }
    } else {
      // Регистрация с email и паролем
      // Проверка паролей
      if (formData.password !== formData.confirmPassword) {
        setError('Пароли не совпадают')
        setIsLoading(false)
        return
      }
      
      if (formData.password.length < 6) {
        setError('Пароль должен содержать минимум 6 символов')
        setIsLoading(false)
        return
      }
      
      if (!formData.name || formData.name.trim().length < 2) {
        setError('Имя должно содержать минимум 2 символа')
        setIsLoading(false)
        return
      }
      
      try {
        const result = await registerWithEmail(formData.email, formData.password, formData.name)
        
        if (result.success) {
          // Открываем модальное окно для ввода кода подтверждения
          console.log('✅ Код отправлен, открываем модальное окно для ввода кода', {
            email: formData.email,
            showModal: true
          })
          setIsLoading(false)
          // Закрываем LoginModal и открываем EmailVerificationModal
          setShowEmailVerificationModal(true)
          console.log('📧 showEmailVerificationModal установлен в true')
        } else {
          setError(result.error || 'Не удалось зарегистрироваться')
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Ошибка регистрации:', error)
        setError('Произошла ошибка при регистрации. Попробуйте позже.')
        setIsLoading(false)
      }
    }
  }

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      console.log('LoginModal: Opening Clerk modal for Google auth', { signInLoaded, signUpLoaded, isLogin })
      
      // Устанавливаем флаг, что начался Google OAuth (для ClerkAuthHandler)
      sessionStorage.setItem('clerk_oauth_redirect_started', 'true')
      sessionStorage.setItem('clerk_oauth_provider', 'google')
      
      // Закрываем текущее модальное окно и открываем Clerk модальное окно с кнопкой Google
      if (isLogin) {
        if (signInLoaded && signIn) {
          // Открываем модальное окно Clerk для входа (там будет кнопка Google)
          console.log('LoginModal: Opening Clerk SignIn modal with Google button')
          setShowClerkSignInModal(true)
          setIsLoading(false)
        } else {
          setError('Система авторизации не готова. Попробуйте обновить страницу.')
          setIsLoading(false)
        }
      } else {
        if (signUpLoaded && signUp) {
          // Открываем модальное окно Clerk для регистрации (там будет кнопка Google)
          console.log('LoginModal: Opening Clerk SignUp modal with Google button')
          setShowClerkSignUpModal(true)
          setIsLoading(false)
        } else {
          setError('Система регистрации не готова. Попробуйте обновить страницу.')
          setIsLoading(false)
        }
      }
    } catch (error) {
      console.error('LoginModal: Ошибка открытия модального окна Google:', error)
      setError(`Не удалось открыть окно авторизации: ${error.message || 'Проверьте настройки'}`)
      setIsLoading(false)
    }
  }

  const handleFacebookAuth = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      console.log('LoginModal: Starting Facebook auth', { signInLoaded, signUpLoaded, isLogin })
      
      if (isLogin) {
        if (signInLoaded && signIn) {
          console.log('LoginModal: Redirecting to Facebook OAuth via Clerk')
          // Устанавливаем флаг, что начался OAuth редирект
          sessionStorage.setItem('clerk_oauth_redirect_started', 'true')
          await signIn.authenticateWithRedirect({
            strategy: 'oauth_facebook',
            redirectUrl: `${window.location.origin}/profile`,
            redirectUrlComplete: `${window.location.origin}/profile`,
          })
        } else {
          setError('Система авторизации не готова. Попробуйте обновить страницу.')
          setIsLoading(false)
        }
      } else {
        if (signUpLoaded && signUp) {
          console.log('LoginModal: Redirecting to Facebook OAuth via Clerk')
          // Устанавливаем флаг, что начался OAuth редирект
          sessionStorage.setItem('clerk_oauth_redirect_started', 'true')
          await signUp.authenticateWithRedirect({
            strategy: 'oauth_facebook',
            redirectUrl: `${window.location.origin}/profile`,
            redirectUrlComplete: `${window.location.origin}/profile`,
          })
        } else {
          setError('Система регистрации не готова. Попробуйте обновить страницу.')
          setIsLoading(false)
        }
      }
    } catch (error) {
      console.error('LoginModal: Ошибка авторизации через Facebook:', error)
      setError(`Не удалось войти через Facebook: ${error.message || 'Проверьте настройки'}`)
      setIsLoading(false)
    }
  }

  const handleWhatsAppLogin = () => {
    setError('')
    // Открываем модальное окно для ввода номера телефона и кода
    setShowWhatsAppModal(true)
  }

  const handleWhatsAppSuccess = (user) => {
    // Успешная авторизация через WhatsApp
    onClose()
    
    // Показываем уведомление
    alert(`Добро пожаловать, ${user.name || 'Пользователь'}!`)
    
    // Перенаправляем на страницу профиля
    navigate('/profile')
  }

  const handleEmailVerificationSuccess = (user) => {
    // Успешная регистрация через email
    onClose()
    
    // Показываем уведомление
    alert(`Добро пожаловать, ${user.name || 'Пользователь'}! Регистрация завершена.`)
    
    // Перенаправляем на страницу профиля
    navigate('/profile')
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setFormData({
      email: '',
      password: '',
      name: '',
      confirmPassword: ''
    })
  }

  return (
    <>
      {/* Скрываем LoginModal когда открыт EmailVerificationModal или Clerk модальное окно */}
      {!showEmailVerificationModal && !showClerkSignInModal && !showClerkSignUpModal && (
        <div className="login-modal-overlay" onClick={onClose}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <button 
          className="login-modal__close" 
          onClick={onClose}
          aria-label="Закрыть"
        >
          <FiX size={24} />
        </button>

        <div className="login-modal__header">
          <h2 className="login-modal__title">
            {isLogin ? 'Вход' : 'Регистрация'}
          </h2>
          <p className="login-modal__subtitle">
            {isLogin 
              ? 'Войдите в свой аккаунт, чтобы продолжить' 
              : 'Создайте новый аккаунт для начала работы'}
          </p>
        </div>

        {error && (
          <div className="login-modal__error" style={{
            padding: '12px',
            margin: '16px 32px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c33',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <div className="login-modal__social">
          <button 
            type="button"
            className="login-modal__social-btn login-modal__social-btn--facebook"
            onClick={handleFacebookAuth}
            disabled={isLoading || !signInLoaded || !signUpLoaded}
            style={{ 
              opacity: (isLoading || !signInLoaded || !signUpLoaded) ? 0.6 : 1, 
              cursor: (isLoading || !signInLoaded || !signUpLoaded) ? 'not-allowed' : 'pointer' 
            }}
          >
            <FaFacebook size={20} />
            <span>
              {isLoading 
                ? 'Подключение...' 
                : (isLogin ? 'Войти через Facebook' : 'Зарегистрироваться через Facebook')}
            </span>
          </button>
          
          <button 
            type="button"
            className="login-modal__social-btn login-modal__social-btn--google"
            onClick={handleGoogleAuth}
            disabled={isLoading || !signInLoaded || !signUpLoaded}
            style={{ 
              opacity: (isLoading || !signInLoaded || !signUpLoaded) ? 0.6 : 1, 
              cursor: (isLoading || !signInLoaded || !signUpLoaded) ? 'not-allowed' : 'pointer' 
            }}
          >
            <FaGoogle size={20} />
            <span>
              {isLoading 
                ? 'Подключение...' 
                : (isLogin ? 'Войти через Google' : 'Зарегистрироваться через Google')}
            </span>
          </button>
          
          <button 
            type="button"
            className="login-modal__social-btn login-modal__social-btn--whatsapp"
            onClick={handleWhatsAppLogin}
            disabled={isLoading}
            style={{ 
              opacity: isLoading ? 0.6 : 1, 
              cursor: isLoading ? 'not-allowed' : 'pointer' 
            }}
          >
            <FaWhatsapp size={20} />
            <span>{isLogin ? 'Войти через WhatsApp' : 'Зарегистрироваться через WhatsApp'}</span>
          </button>
        </div>

        <div className="login-modal__divider">
          <span>или</span>
        </div>

        <form className="login-modal__form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="login-modal__field">
              <label htmlFor="name" className="login-modal__label">
                <FiUser size={18} />
                Имя
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="login-modal__input"
                placeholder="Введите ваше имя"
                required={!isLogin}
              />
            </div>
          )}

          <div className="login-modal__field">
            <label htmlFor="email" className="login-modal__label">
              <FiMail size={18} />
              {isLogin ? 'Email или логин' : 'Email'}
            </label>
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="login-modal__input"
              placeholder={isLogin ? "Введите email или логин (admin/owner/client)" : "Введите ваш email"}
              required
            />
          </div>

          <div className="login-modal__field">
            <label htmlFor="password" className="login-modal__label">
              <FiLock size={18} />
              Пароль
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="login-modal__input"
              placeholder="Введите пароль"
              required
            />
          </div>

          {!isLogin && (
            <div className="login-modal__field">
              <label htmlFor="confirmPassword" className="login-modal__label">
                <FiLock size={18} />
                Подтвердите пароль
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="login-modal__input"
                placeholder="Повторите пароль"
                required={!isLogin}
              />
            </div>
          )}

          {isLogin && (
            <div className="login-modal__forgot">
              <button type="button" className="login-modal__forgot-link">
                Забыли пароль?
              </button>
            </div>
          )}

          <button type="submit" className="login-modal__submit" disabled={isLoading}>
            {isLoading ? (isLogin ? 'Вход...' : 'Регистрация...') : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>

        <div className="login-modal__footer">
          <span className="login-modal__footer-text">
            {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          </span>
          <button 
            type="button"
            className="login-modal__footer-link"
            onClick={toggleMode}
          >
            {isLogin ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </div>
      </div>
      </div>
      )}
      
      <WhatsAppVerificationModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        onSuccess={handleWhatsAppSuccess}
      />
      
      <EmailVerificationModal
        isOpen={showEmailVerificationModal}
        onClose={() => {
          console.log('📧 Закрываем EmailVerificationModal')
          setShowEmailVerificationModal(false)
          onClose() // Также закрываем LoginModal
        }}
        onSuccess={handleEmailVerificationSuccess}
        email={formData.email}
        password={formData.password}
        name={formData.name}
      />
      
      {/* Модальное окно Clerk для входа через Google */}
      {showClerkSignInModal && (
        <div 
          className="login-modal-overlay" 
          onClick={() => {
            setShowClerkSignInModal(false)
            setIsLoading(false)
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <div style={{ position: 'relative', width: '100%' }}>
              <button
                onClick={() => {
                  setShowClerkSignInModal(false)
                  setIsLoading(false)
                  onClose()
                }}
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontSize: '24px',
                  cursor: 'pointer',
                  zIndex: 10001,
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
                aria-label="Закрыть"
              >
                <FiX size={20} />
              </button>
              <SignIn
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: {
                      margin: '0 auto',
                      width: '100%'
                    },
                    card: {
                      boxShadow: 'none',
                      border: 'none'
                    }
                  }
                }}
                afterSignInUrl="/profile"
                afterSignUpUrl="/profile"
                afterSignInComplete={() => {
                  console.log('LoginModal: SignIn completed, closing modal')
                  setShowClerkSignInModal(false)
                  setIsLoading(false)
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно Clerk для регистрации через Google */}
      {showClerkSignUpModal && (
        <div 
          className="login-modal-overlay" 
          onClick={() => {
            setShowClerkSignUpModal(false)
            setIsLoading(false)
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <div style={{ position: 'relative', width: '100%' }}>
              <button
                onClick={() => {
                  setShowClerkSignUpModal(false)
                  setIsLoading(false)
                  onClose()
                }}
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontSize: '24px',
                  cursor: 'pointer',
                  zIndex: 10001,
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
                aria-label="Закрыть"
              >
                <FiX size={20} />
              </button>
              <SignUp
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: {
                      margin: '0 auto',
                      width: '100%'
                    },
                    card: {
                      boxShadow: 'none',
                      border: 'none'
                    }
                  }
                }}
                afterSignInUrl="/profile"
                afterSignUpUrl="/profile"
                afterSignUpComplete={() => {
                  console.log('LoginModal: SignUp completed, closing modal')
                  setShowClerkSignUpModal(false)
                  setIsLoading(false)
                  // Закрываем модальное окно, данные обработаются через ClerkAuthSync/ClerkAuthHandler
                }}
                afterSignInComplete={() => {
                  console.log('LoginModal: SignIn completed, closing modal')
                  setShowClerkSignUpModal(false)
                  setIsLoading(false)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default LoginModal
