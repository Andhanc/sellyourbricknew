import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiX, FiMail, FiLock, FiUser } from 'react-icons/fi'
import { FaGoogle, FaWhatsapp } from 'react-icons/fa'
import './LoginModal.css'

const LoginModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true) // true для входа, false для регистрации
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })

  if (!isOpen) return null

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (isLogin) {
      // Проверка для владельца недвижимости
      if (formData.email.toLowerCase() === 'owner' && formData.password === '1234') {
        // Сохраняем информацию о входе владельца
        localStorage.setItem('userRole', 'owner')
        localStorage.setItem('isOwnerLoggedIn', 'true')
        onClose()
        navigate('/owner')
        return
      }
      
      // Здесь будет логика обычного входа
      console.log('Вход', formData)
      // После успешного входа можно закрыть модальное окно
      // onClose()
    } else {
      // Логика регистрации
      console.log('Регистрация', formData)
      // После успешной регистрации можно закрыть модальное окно
      // onClose()
    }
  }

  const handleGoogleLogin = () => {
    // Здесь будет логика входа через Google
    console.log('Вход через Google')
    // В реальном приложении здесь будет OAuth авторизация
    window.open('https://accounts.google.com/o/oauth2/v2/auth', '_blank')
  }

  const handleWhatsAppLogin = () => {
    // Здесь будет логика входа через WhatsApp
    console.log('Вход через WhatsApp')
    // В реальном приложении здесь будет авторизация через WhatsApp API
    window.open('https://wa.me/79991234567', '_blank')
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

        <div className="login-modal__social">
          <button 
            type="button"
            className="login-modal__social-btn login-modal__social-btn--google"
            onClick={handleGoogleLogin}
          >
            <FaGoogle size={20} />
            <span>{isLogin ? 'Войти через Google' : 'Зарегистрироваться через Google'}</span>
          </button>
          
          <button 
            type="button"
            className="login-modal__social-btn login-modal__social-btn--whatsapp"
            onClick={handleWhatsAppLogin}
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
              placeholder={isLogin ? "Введите email или логин (для владельца: owner)" : "Введите ваш email"}
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

          <button type="submit" className="login-modal__submit">
            {isLogin ? 'Войти' : 'Зарегистрироваться'}
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
  )
}

export default LoginModal
