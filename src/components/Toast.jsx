import { useState, useEffect } from 'react'
import { FiCheck, FiX, FiAlertCircle, FiInfo } from 'react-icons/fi'
import './Toast.css'

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => {
          if (onClose) onClose()
        }, 300) // Ждем завершения анимации
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheck size={20} />
      case 'error':
        return <FiX size={20} />
      case 'warning':
        return <FiAlertCircle size={20} />
      case 'info':
        return <FiInfo size={20} />
      default:
        return <FiInfo size={20} />
    }
  }

  return (
    <div className={`toast toast--${type} ${isVisible ? 'toast--visible' : ''}`}>
      <div className="toast__icon">{getIcon()}</div>
      <div className="toast__message">{message}</div>
      <button
        className="toast__close"
        onClick={() => {
          setIsVisible(false)
          setTimeout(() => {
            if (onClose) onClose()
          }, 300)
        }}
        aria-label="Закрыть"
      >
        <FiX size={16} />
      </button>
    </div>
  )
}

export default Toast

