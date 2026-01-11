import { FiX, FiAlertCircle } from 'react-icons/fi'
import './ProfileDataWarningToast.css'

const ProfileDataWarningToast = ({ isOpen, onClose, onGoToData, message }) => {
  if (!isOpen) return null

  return (
    <div className="profile-warning-toast">
      <div className="profile-warning-toast__content">
        <div className="profile-warning-toast__icon">
          <FiAlertCircle size={20} />
        </div>
        <div className="profile-warning-toast__text">
          {message || 'Пожалуйста, заполните личные данные'}
        </div>
        <div className="profile-warning-toast__actions">
          <button 
            className="profile-warning-toast__button"
            onClick={onGoToData}
          >
            Заполнить
          </button>
          <button 
            className="profile-warning-toast__close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <FiX size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileDataWarningToast

