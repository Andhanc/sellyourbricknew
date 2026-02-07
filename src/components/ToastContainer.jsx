import { useState, useEffect, useCallback } from 'react'
import Toast from './Toast'
import './ToastContainer.css'

let toastId = 0
let toastListeners = []

export const showToast = (message, type = 'success', duration = 3000) => {
  const id = toastId++
  toastListeners.forEach(listener => listener({ id, message, type, duration }))
  return id
}

const ToastContainer = () => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    setToasts(prev => [...prev, toast])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  useEffect(() => {
    toastListeners.push(addToast)
    return () => {
      toastListeners = toastListeners.filter(listener => listener !== addToast)
    }
  }, [addToast])

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

export default ToastContainer

