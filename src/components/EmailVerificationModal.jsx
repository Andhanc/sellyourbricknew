import { useState, useEffect, useRef, useCallback } from 'react'
import { FiX, FiMail } from 'react-icons/fi'
import { sendEmailVerificationCode, verifyEmailCode, verifyEmailForProfileUpdate, validateEmail } from '../services/authService'
import './EmailVerificationModal.css'

const EmailVerificationModal = ({ isOpen, onClose, onSuccess, email: initialEmail, password, name, isProfileUpdate = false, userId = null }) => {
  const [email, setEmail] = useState(initialEmail || '')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('email') // 'email' или 'code'
  const [countdown, setCountdown] = useState(0)
  const [isValidatingEmail, setIsValidatingEmail] = useState(false)
  const [devCode, setDevCode] = useState(null) // Код для режима разработки
  const [devWarning, setDevWarning] = useState(null) // Предупреждение о dev режиме
  const inputRefs = useRef([])

  const handleSendCode = useCallback(async () => {
    // Валидация email
    setIsValidatingEmail(true)
    const validation = await validateEmail(email)
    setIsValidatingEmail(false)
    
    if (!validation.valid) {
      setError(validation.error || 'Введите корректный email адрес')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await sendEmailVerificationCode(email)

      if (result.success) {
        // Сохраняем код для режима разработки, если он был возвращен
        // Это происходит только если EmailJS не настроен или произошла ошибка
        if (result.code && (result.devMode || result.warning)) {
          setDevCode(result.code)
          console.log('🔐 Код для ввода (режим разработки):', result.code)
        } else {
          // Если код успешно отправлен через EmailJS, не показываем devCode
          setDevCode(null)
        }
        
        // Сохраняем предупреждение, если есть
        if (result.warning || result.devMode) {
          setDevWarning(result.warning || result.message || 'EmailJS не настроен, используется режим разработки')
        } else {
          setDevWarning(null)
        }
        
        setStep('code')
        setCountdown(60) // 60 секунд до возможности повторной отправки
        // Фокусируемся на первом поле ввода кода
        setTimeout(() => {
          if (inputRefs.current[0]) {
            inputRefs.current[0].focus()
          }
        }, 100)
      } else {
        setError(result.error || 'Не удалось отправить код')
        setDevCode(null)
        setDevWarning(null)
      }
    } catch (error) {
      console.error('Ошибка отправки кода:', error)
      setError('Произошла ошибка. Попробуйте позже.')
      setDevCode(null)
      setDevWarning(null)
    } finally {
      setIsLoading(false)
    }
  }, [email])

  useEffect(() => {
    if (isOpen) {
      if (initialEmail) {
        console.log('📧 EmailVerificationModal открыт с email:', initialEmail)
        setEmail(initialEmail)
        // Если email передан, значит код уже отправлен, сразу показываем форму ввода кода
        setStep('code')
        setCountdown(60) // Устанавливаем таймер для повторной отправки
        setError('') // Очищаем ошибки
        // Фокусируемся на первом поле ввода кода
        setTimeout(() => {
          if (inputRefs.current[0]) {
            inputRefs.current[0].focus()
          }
        }, 200)
      } else {
        // Если email не передан, показываем форму ввода email
        setStep('email')
        setEmail('')
        setCode(['', '', '', '', '', ''])
        setError('')
        setDevCode(null)
        setDevWarning(null)
      }
    } else {
      // Когда модальное окно закрывается, сбрасываем состояние
      setStep('email')
      setCode(['', '', '', '', '', ''])
      setError('')
      setCountdown(0)
      setDevCode(null)
      setDevWarning(null)
    }
  }, [initialEmail, isOpen])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleEmailChange = (e) => {
    const value = e.target.value
    setEmail(value)
    setError('')
  }

  const handleCodeChange = (index, value) => {
    // Разрешаем только цифры
    if (value && !/^\d$/.test(value)) {
      return
    }

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    setError('')

    // Автоматически переходим к следующему полю
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Если все поля заполнены, автоматически проверяем код
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerifyCode(newCode.join(''))
    }
  }

  const handleCodeKeyDown = (index, e) => {
    // Обработка Backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    
    // Обработка стрелок
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, 6)
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('')
      setCode(newCode)
      inputRefs.current[5]?.focus()
      
      // Автоматически проверяем код
      setTimeout(() => {
        handleVerifyCode(pastedData)
      }, 100)
    }
  }

  const handleVerifyCode = async (codeToVerify = null) => {
    const codeString = codeToVerify || code.join('')
    
    if (codeString.length !== 6) {
      setError('Введите полный код')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      let result
      
      if (isProfileUpdate && userId) {
        // Обновление профиля
        result = await verifyEmailForProfileUpdate(userId, email, codeString)
        
        if (result.success) {
          // Для обновления профиля передаем данные пользователя в onSuccess
          // onSuccess должен сам закрыть модальное окно после обработки
          if (onSuccess) {
            await onSuccess(result.user || codeString) // Передаем данные пользователя или код
          } else {
            onClose()
          }
        } else {
          setError(result.error || 'Неверный код. Попробуйте еще раз.')
          // Очищаем поля ввода
          setCode(['', '', '', '', '', ''])
          inputRefs.current[0]?.focus()
        }
      } else {
        // Регистрация
        result = await verifyEmailCode(email, codeString, password, name)

        if (result.success) {
          // Успешная регистрация
          if (onSuccess) {
            onSuccess(result.user)
          }
          onClose()
        } else {
          setError(result.error || 'Неверный код. Попробуйте еще раз.')
          // Очищаем поля ввода
          setCode(['', '', '', '', '', ''])
          inputRefs.current[0]?.focus()
        }
      }
    } catch (error) {
      console.error('Ошибка верификации кода:', error)
      setError('Произошла ошибка. Попробуйте позже.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = () => {
    if (countdown > 0) return
    setCode(['', '', '', '', '', ''])
    handleSendCode()
  }

  // Логирование для отладки
  useEffect(() => {
    console.log('📧 EmailVerificationModal состояние:', {
      isOpen,
      step,
      email,
      hasInitialEmail: !!initialEmail,
      codeLength: code.filter(c => c).length,
      password: password ? '***' : 'нет',
      name: name || 'нет'
    })
  }, [isOpen, step, email, initialEmail, code, password, name])

  if (!isOpen) {
    console.log('📧 EmailVerificationModal закрыт (isOpen = false)')
    return null
  }

  console.log('📧 EmailVerificationModal рендерится, isOpen =', isOpen)

  return (
    <div className="email-verification-overlay" onClick={onClose}>
      <div className="email-verification-modal" onClick={(e) => e.stopPropagation()}>
        <button 
          className="email-verification-modal__close" 
          onClick={onClose}
          aria-label="Закрыть"
        >
          <FiX size={24} />
        </button>

        <div className="email-verification-modal__header">
          <div className="email-verification-modal__icon">
            <FiMail size={32} />
          </div>
          <h2 className="email-verification-modal__title">
            {step === 'email' ? 'Подтверждение email' : 'Введите код'}
          </h2>
          <p className="email-verification-modal__subtitle">
            {step === 'email' 
              ? 'Введите email адрес, и мы отправим код подтверждения'
              : `Код отправлен на ${email}`}
          </p>
        </div>

        {error && (
          <div className="email-verification-modal__error">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <div className="email-verification-modal__form">
            <div className="email-verification-modal__field">
              <label htmlFor="email" className="email-verification-modal__label">
                Email адрес
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                className="email-verification-modal__input"
                placeholder="example@mail.com"
                disabled={isLoading || isValidatingEmail}
                autoFocus
              />
              {isValidatingEmail && (
                <p className="email-verification-modal__validating">
                  Проверка email адреса...
                </p>
              )}
            </div>

            <button 
              type="button"
              className="email-verification-modal__submit"
              onClick={handleSendCode}
              disabled={isLoading || isValidatingEmail || !email || !email.includes('@')}
            >
              {isLoading || isValidatingEmail ? 'Проверка...' : 'Отправить код'}
            </button>
          </div>
        ) : (
          <div className="email-verification-modal__form">
            {/* Показываем код в режиме разработки, если EmailJS не настроен */}
            {devCode && (
              <div className="email-verification-modal__dev-code">
                <div className="email-verification-modal__dev-code-label">
                  ⚠️ Режим разработки: код не отправлен на email
                </div>
                <div className="email-verification-modal__dev-code-value">
                  Ваш код: <strong>{devCode}</strong>
                </div>
                {devWarning && (
                  <div className="email-verification-modal__dev-warning">
                    {devWarning}
                  </div>
                )}
              </div>
            )}
            
            <div className="email-verification-modal__code-container">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="email-verification-modal__code-input"
                  disabled={isLoading}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <div className="email-verification-modal__resend">
              <span className="email-verification-modal__resend-text">
                Не получили код?
              </span>
              <button
                type="button"
                className="email-verification-modal__resend-button"
                onClick={handleResendCode}
                disabled={countdown > 0 || isLoading}
              >
                {countdown > 0 ? `Отправить снова (${countdown}с)` : 'Отправить снова'}
              </button>
            </div>

            <button 
              type="button"
              className="email-verification-modal__submit"
              onClick={() => handleVerifyCode()}
              disabled={isLoading || code.some(digit => !digit)}
            >
              {isLoading ? 'Проверка...' : 'Подтвердить'}
            </button>
          </div>
        )}

        <div className="email-verification-modal__footer">
          <button 
            type="button"
            className="email-verification-modal__back-button"
            onClick={() => {
              setStep('email')
              setCode(['', '', '', '', '', ''])
              setError('')
            }}
            style={{ display: step === 'code' ? 'block' : 'none' }}
          >
            Изменить email
          </button>
        </div>
      </div>
    </div>
  )
}

export default EmailVerificationModal

