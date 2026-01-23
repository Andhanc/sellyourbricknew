import { useState, useEffect } from 'react'
import VerificationModal from './VerificationModal'
import './SellerVerificationModal.css'

const SellerVerificationModal = ({ isOpen, onClose, userId, onComplete }) => {
  const [showVerification, setShowVerification] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowVerification(false)
    }
  }, [isOpen])

  const handleStartVerification = () => {
    setShowVerification(true)
  }

  const handleVerificationComplete = () => {
    if (onComplete) {
      onComplete()
    }
    onClose()
  }

  if (!isOpen) return null

  if (showVerification) {
    return (
      <VerificationModal
        isOpen={true}
        onClose={() => {
          setShowVerification(false)
          onClose()
        }}
        userId={userId}
        onComplete={handleVerificationComplete}
      />
    )
  }

  return (
    <div className="seller-verification-modal-overlay" onClick={onClose}>
      <div 
        className="seller-verification-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="seller-verification-modal__close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="seller-verification-modal__content">
          <div className="seller-verification-modal__header">
            <h2 className="seller-verification-modal__title">
              Для публикации объявлений необходимо пройти процедуру верификации
            </h2>
            <p className="seller-verification-modal__subtitle">
              Пожалуйста следуйте инструкциям ниже
            </p>
          </div>

          <div className="seller-verification-modal__info">
            <div className="seller-verification-modal__info-item">
              <div className="seller-verification-modal__icon">📄</div>
              <div className="seller-verification-modal__info-content">
                <h3 className="seller-verification-modal__info-title">Фото паспорта</h3>
                <p className="seller-verification-modal__info-description">
                  Загрузите фото или скан паспорта (разворот с фото)
                </p>
              </div>
            </div>

            <div className="seller-verification-modal__info-item">
              <div className="seller-verification-modal__icon">📷</div>
              <div className="seller-verification-modal__info-content">
                <h3 className="seller-verification-modal__info-title">Ваше селфи</h3>
                <p className="seller-verification-modal__info-description">
                  Загрузите ваше селфи
                </p>
              </div>
            </div>

            <div className="seller-verification-modal__info-item">
              <div className="seller-verification-modal__icon">📸</div>
              <div className="seller-verification-modal__info-content">
                <h3 className="seller-verification-modal__info-title">Селфи с паспортом рядом с лицом</h3>
                <p className="seller-verification-modal__info-description">
                  Загрузите фото, где вы держите паспорт рядом с лицом (селфи с паспортом)
                </p>
              </div>
            </div>
          </div>

          <button
            className="seller-verification-modal__btn"
            onClick={handleStartVerification}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 4H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Начать верификацию
          </button>
        </div>
      </div>
    </div>
  )
}

export default SellerVerificationModal
