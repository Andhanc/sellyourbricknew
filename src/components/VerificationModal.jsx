import { useState, useRef, useEffect } from 'react'
import './VerificationModal.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3000/api')

const VerificationModal = ({ isOpen, onClose, userId, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [photos, setPhotos] = useState({
    passport: null,
    selfie: null,
    selfieWithPassport: null
  })
  const [previews, setPreviews] = useState({
    passport: null,
    selfie: null,
    selfieWithPassport: null
  })
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [cameraType, setCameraType] = useState(null) // 'passport', 'selfie', 'selfieWithPassport'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [animationClass, setAnimationClass] = useState('')
  const [hintModalOpen, setHintModalOpen] = useState(false)
  const [hintStep, setHintStep] = useState(1)

  const fileInputRef = useRef(null)
  const cameraRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setAnimationClass('slide-in')
      // Сброс при открытии
      if (currentStep === 1) {
        setPhotos({ passport: null, selfie: null, selfieWithPassport: null })
        setPreviews({ passport: null, selfie: null, selfieWithPassport: null })
      }
    }
  }, [isOpen])

  const handleStepChange = (newStep) => {
    setAnimationClass('slide-out')
    setTimeout(() => {
      setCurrentStep(newStep)
      setAnimationClass('slide-in')
    }, 300)
  }

  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotos(prev => ({ ...prev, [type]: file }))
        setPreviews(prev => ({ ...prev, [type]: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCameraCapture = (imageBlob, type) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const file = new File([imageBlob], `photo_${type}_${Date.now()}.jpg`, { type: 'image/jpeg' })
      setPhotos(prev => ({ ...prev, [type]: file }))
      setPreviews(prev => ({ ...prev, [type]: reader.result }))
      setIsCameraOpen(false)
      setCameraType(null)
    }
    reader.readAsDataURL(imageBlob)
  }

  const handleNext = () => {
    if (currentStep === 1 && !photos.passport) {
      alert('Пожалуйста, загрузите или сфотографируйте паспорт')
      return
    }
    if (currentStep === 2 && !photos.selfie) {
      alert('Пожалуйста, сделайте селфи')
      return
    }
    if (currentStep === 3 && !photos.selfieWithPassport) {
      alert('Пожалуйста, сделайте селфи с паспортом')
      return
    }
    if (currentStep < 3) {
      handleStepChange(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      handleStepChange(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!photos.passport || !photos.selfie || !photos.selfieWithPassport) {
      alert('Пожалуйста, загрузите все три фотографии')
      return
    }

    setIsSubmitting(true)

    try {
      // Загружаем все три фото
      const uploadPromises = [
        uploadPhoto(photos.passport, 'passport'),
        uploadPhoto(photos.selfie, 'selfie'), // Новый тип для селфи
        uploadPhoto(photos.selfieWithPassport, 'passport_with_face') // Используем существующий тип
      ]

      const results = await Promise.all(uploadPromises)

      if (results.every(r => r.success)) {
        // Отправляем событие для обновления уведомления о верификации
        window.dispatchEvent(new Event('verification-status-update'))
        
        alert('Все фотографии успешно отправлены на модерацию!')
        
        // Вызываем callback для обновления данных в родительском компоненте
        if (onComplete) {
          onComplete()
        }
        
        onClose()
      } else {
        const errors = results.filter(r => !r.success).map(r => r.error).join(', ')
        alert(`Ошибка при загрузке: ${errors}`)
      }
    } catch (error) {
      console.error('Ошибка отправки:', error)
      alert('Произошла ошибка при отправке фотографий. Попробуйте еще раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const uploadPhoto = async (file, documentType) => {
    if (!userId) {
      return { success: false, error: 'ID пользователя не найден' }
    }

    const formData = new FormData()
    formData.append('document_photo', file)
    formData.append('user_id', String(userId))
    formData.append('document_type', documentType)

    try {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, data: data.data }
      } else {
        const errorData = await response.json().catch(() => ({}))
        return { success: false, error: errorData.error || 'Ошибка загрузки' }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const openCamera = (type) => {
    setCameraType(type)
    setIsCameraOpen(true)
  }

  const openFileUpload = (type) => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('data-type', type)
      fileInputRef.current.click()
    }
  }

  const openHintModal = (step) => {
    setHintStep(step)
    setHintModalOpen(true)
  }

  const closeHintModal = () => {
    setHintModalOpen(false)
  }

  // Данные для подсказок по шагам
  const hintData = {
    1: {
      title: 'Шаг 1: Паспорт',
      description: 'Для верификации необходимо загрузить фотографию паспорта. Убедитесь, что:',
      requirements: [
        'Паспорт полностью виден в кадре',
        'Все данные четко читаемы (серия, номер, ФИО, дата рождения)',
        'Фото сделано при хорошем освещении',
        'Паспорт открыт на странице с фотографией и основными данными',
        'Нет бликов и теней, которые закрывают информацию'
      ],
      exampleText: 'Пример правильного фото паспорта:'
    },
    2: {
      title: 'Шаг 2: Селфи',
      description: 'Сделайте селфи для подтверждения вашей личности. Важно:',
      requirements: [
        'Ваше лицо полностью видно и занимает большую часть кадра',
        'Хорошее освещение лица (без теней)',
        'Вы смотрите прямо в камеру',
        'Нет солнцезащитных очков, масок или других предметов, закрывающих лицо',
        'Фон нейтральный, не отвлекает внимание'
      ],
      exampleText: 'Пример правильного селфи:'
    },
    3: {
      title: 'Шаг 3: Селфи с паспортом',
      description: 'Сделайте селфи, держа паспорт рядом с лицом. Это необходимо для подтверждения, что паспорт принадлежит вам. Убедитесь, что:',
      requirements: [
        'И ваше лицо, и паспорт четко видны в одном кадре',
        'Паспорт открыт на странице с фотографией',
        'Вы держите паспорт рядом с лицом (не закрывая его)',
        'Данные в паспорте читаемы',
        'Хорошее освещение для лица и паспорта',
        'Вы смотрите прямо в камеру'
      ],
      exampleText: 'Пример правильного селфи с паспортом:'
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="verification-modal-overlay" onClick={onClose}>
        <div 
          className={`verification-modal ${animationClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="verification-modal__close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <div className="verification-modal__header">
            <div className="verification-progress">
              {[1, 2, 3].map((step) => (
                <div key={step} className="verification-progress__item">
                  <div 
                    className={`verification-progress__circle ${
                      currentStep >= step ? 'active' : ''
                    } ${currentStep === step ? 'current' : ''}`}
                  >
                    {currentStep > step ? '✓' : step}
                  </div>
                  <div className="verification-progress__label">
                    {step === 1 ? 'Паспорт' : step === 2 ? 'Селфи' : 'Паспорт + селфи'}
                  </div>
                  {step < 3 && (
                    <div 
                      className={`verification-progress__line ${
                        currentStep > step ? 'active' : ''
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="verification-modal__content">
            {currentStep === 1 && (
              <div className="verification-step">
                {previews.passport ? (
                  <div className="verification-step__preview verification-step__preview--image-only">
                    <img src={previews.passport} alt="Паспорт" />
                    <button 
                      className="verification-step__change"
                      onClick={() => {
                        setPhotos(prev => ({ ...prev, passport: null }))
                        setPreviews(prev => ({ ...prev, passport: null }))
                      }}
                    >
                      Изменить фото
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="verification-step__icon">📄</div>
                    <div className="verification-step__title-wrapper">
                      <h2 className="verification-step__title">Шаг 1: Паспорт</h2>
                      <button 
                        className="verification-step__hint-btn"
                        onClick={() => openHintModal(1)}
                        aria-label="Подсказка"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    <p className="verification-step__description">
                      Загрузите или сфотографируйте ваш паспорт. Убедитесь, что все данные четко видны.
                    </p>
                    <div className="verification-step__actions">
                      <button 
                        className="verification-step__btn verification-step__btn--primary"
                        onClick={() => openCamera('passport')}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 4H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Сфотографировать
                      </button>
                      <button 
                        className="verification-step__btn verification-step__btn--secondary"
                        onClick={() => openFileUpload('passport')}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Загрузить из файлов
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="verification-step">
                {previews.selfie ? (
                  <div className="verification-step__preview verification-step__preview--image-only">
                    <img src={previews.selfie} alt="Селфи" />
                    <button 
                      className="verification-step__change"
                      onClick={() => {
                        setPhotos(prev => ({ ...prev, selfie: null }))
                        setPreviews(prev => ({ ...prev, selfie: null }))
                      }}
                    >
                      Изменить фото
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="verification-step__icon">📷</div>
                    <div className="verification-step__title-wrapper">
                      <h2 className="verification-step__title">Шаг 2: Селфи</h2>
                      <button 
                        className="verification-step__hint-btn"
                        onClick={() => openHintModal(2)}
                        aria-label="Подсказка"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    <p className="verification-step__description">
                      Сделайте селфи. Убедитесь, что ваше лицо четко видно и хорошо освещено.
                    </p>
                    <div className="verification-step__actions">
                      <button 
                        className="verification-step__btn verification-step__btn--primary"
                        onClick={() => openCamera('selfie')}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 4H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Сделать селфи
                      </button>
                      <button 
                        className="verification-step__btn verification-step__btn--secondary"
                        onClick={() => openFileUpload('selfie')}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Загрузить из файлов
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="verification-step">
                {previews.selfieWithPassport ? (
                  <div className="verification-step__preview verification-step__preview--image-only">
                    <img src={previews.selfieWithPassport} alt="Селфи с паспортом" />
                    <button 
                      className="verification-step__change"
                      onClick={() => {
                        setPhotos(prev => ({ ...prev, selfieWithPassport: null }))
                        setPreviews(prev => ({ ...prev, selfieWithPassport: null }))
                      }}
                    >
                      Изменить фото
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="verification-step__icon">📸</div>
                    <div className="verification-step__title-wrapper">
                      <h2 className="verification-step__title">Шаг 3: Селфи с паспортом</h2>
                      <button 
                        className="verification-step__hint-btn"
                        onClick={() => openHintModal(3)}
                        aria-label="Подсказка"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    <p className="verification-step__description">
                      Сделайте селфи с паспортом рядом с лицом. Убедитесь, что и ваше лицо, и паспорт четко видны.
                    </p>
                    <div className="verification-step__actions">
                      <button 
                        className="verification-step__btn verification-step__btn--primary"
                        onClick={() => openCamera('selfieWithPassport')}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 4H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Сделать селфи с паспортом
                      </button>
                      <button 
                        className="verification-step__btn verification-step__btn--secondary"
                        onClick={() => openFileUpload('selfieWithPassport')}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Загрузить из файлов
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>

          <div className="verification-modal__footer">
            {currentStep > 1 && (
              <button 
                className="verification-modal__btn verification-modal__btn--secondary"
                onClick={handleBack}
              >
                Назад
              </button>
            )}
            {currentStep < 3 ? (
              <button 
                className="verification-modal__btn verification-modal__btn--primary"
                onClick={handleNext}
                disabled={!photos[['passport', 'selfie', 'selfieWithPassport'][currentStep - 1]]}
              >
                Дальше
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ) : (
              <button 
                className="verification-modal__btn verification-modal__btn--primary"
                onClick={handleSubmit}
                disabled={isSubmitting || !photos.passport || !photos.selfie || !photos.selfieWithPassport}
              >
                {isSubmitting ? (
                  <>
                    <svg className="spinner" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeDasharray="50.24" strokeDashoffset="25.12" strokeLinecap="round">
                        <animateTransform attributeName="transform" type="rotate" values="0 10 10;360 10 10" dur="1s" repeatCount="indefinite"/>
                      </circle>
                    </svg>
                    Отправка...
                  </>
                ) : (
                  <>
                    Отправить на модерацию
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M17.5 2.5L8.75 11.25M17.5 2.5L12.5 17.5L8.75 11.25M17.5 2.5L2.5 7.5L8.75 11.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {isCameraOpen && (
        <Camera 
          type={cameraType}
          onCapture={(blob) => {
            handleCameraCapture(blob, cameraType)
          }}
          onClose={() => {
            setIsCameraOpen(false)
            setCameraType(null)
          }}
        />
      )}

      {hintModalOpen && (
        <VerificationHintModal
          isOpen={hintModalOpen}
          onClose={closeHintModal}
          step={hintStep}
          data={hintData[hintStep]}
        />
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const type = e.target.getAttribute('data-type') || cameraType || 'passport'
          handleFileSelect(e, type)
          e.target.value = '' // Сброс для повторного выбора
        }}
      />
    </>
  )
}

// Компонент модального окна с подсказкой
const VerificationHintModal = ({ isOpen, onClose, step, data }) => {
  if (!isOpen || !data) return null

  // Примеры фото
  const exampleImages = {
    1: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Pasport_RF.jpg/330px-Pasport_RF.jpg',
    2: 'https://pechater.ru/wp-content/uploads/2019/08/foto-ot-pechaterfoto-foto-s-retushyu.jpg',
    3: 'https://www.computerra.ru/wp-content/uploads/2015/06/1e7fcc548a024256a091661587173216.jpg'
  }

  return (
    <div className="verification-hint-modal-overlay" onClick={onClose}>
      <div 
        className="verification-hint-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="verification-hint-modal__close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="verification-hint-modal__content">
          <h2 className="verification-hint-modal__title">{data.title}</h2>
          
          <p className="verification-hint-modal__description">{data.description}</p>

          <div className="verification-hint-modal__requirements">
            <h3 className="verification-hint-modal__requirements-title">Требования:</h3>
            <ul className="verification-hint-modal__requirements-list">
              {data.requirements.map((req, index) => (
                <li key={index} className="verification-hint-modal__requirements-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="verification-hint-modal__check-icon">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <div className="verification-hint-modal__example">
            <p className="verification-hint-modal__example-text">{data.exampleText}</p>
            <div className="verification-hint-modal__example-image">
              <img 
                src={exampleImages[step]} 
                alt="Пример фото"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'block'
                }}
              />
              <div className="verification-hint-modal__placeholder" style={{ display: 'none' }}>
                <svg width="200" height="150" viewBox="0 0 200 150" fill="none">
                  <rect width="200" height="150" fill="#f5f5f5"/>
                  <path d="M80 60H120V90H80V60Z" fill="#ddd"/>
                  <path d="M70 100H130M70 110H130" stroke="#ddd" strokeWidth="2"/>
                  <text x="100" y="130" textAnchor="middle" fill="#999" fontSize="14">Пример фото</text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Компонент камеры
const Camera = ({ type, onCapture, onClose }) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [facingMode, setFacingMode] = useState('environment') // 'user' для фронтальной, 'environment' для задней

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [facingMode])

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: type === 'selfie' || type === 'selfieWithPassport' ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
    } catch (error) {
      console.error('Ошибка доступа к камере:', error)
      alert('Не удалось получить доступ к камере. Проверьте разрешения.')
      onClose()
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsCapturing(true)

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    context.drawImage(video, 0, 0)

    canvas.toBlob((blob) => {
      if (blob) {
        onCapture(blob)
      }
      setIsCapturing(false)
    }, 'image/jpeg', 0.95)
  }

  const switchCamera = () => {
    stopCamera()
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  return (
    <div className="camera-overlay">
      <div className="camera-container">
        <button className="camera-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="camera-preview">
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            className={`camera-video ${(type === 'selfie' || type === 'selfieWithPassport') ? 'mirrored' : ''}`}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Контур для селфи (только для второго шага) */}
          {type === 'selfie' && (
            <div className="camera-face-overlay">
              <div className="camera-face-guide">
                <div className="camera-face-guide__oval"></div>
                <div className="camera-face-guide__text">
                  Расположите лицо в рамке
                </div>
              </div>
            </div>
          )}

          {/* Контур для паспорта */}
          {type === 'passport' && (
            <div className="camera-passport-overlay">
              <div className="camera-passport-guide">
                <div className="camera-passport-guide__rect"></div>
                <div className="camera-passport-guide__text">
                  Расположите паспорт в рамке
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="camera-controls">
          <button className="camera-switch" onClick={switchCamera}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 3L21 6L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 6H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M6 21L3 18L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button 
            className="camera-capture"
            onClick={capturePhoto}
            disabled={isCapturing}
          >
            <div className="camera-capture__button"></div>
          </button>
          <div style={{ width: '48px' }}></div>
        </div>
      </div>
    </div>
  )
}

export default VerificationModal

