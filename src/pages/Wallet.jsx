import { useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FaArrowLeft, FaArrowUp, FaArrowDown, FaLock, FaWifi } from 'react-icons/fa'
import { getUserData } from '../services/authService'
import { validateLuhn, detectCardType, formatCardNumber, maskCardNumber } from '../utils/cardValidation'
import './Wallet.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const Wallet = () => {
  const navigate = useNavigate()
  const userData = getUserData()
  const userId = userData?.id

  const [depositAmount, setDepositAmount] = useState(0)
  const [hasCard, setHasCard] = useState(false)
  const [cardType, setCardType] = useState(null)
  const [cardNumber, setCardNumber] = useState('') // Только последние 4 цифры после сохранения
  const [cardCvv, setCardCvv] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [savedCardNumber, setSavedCardNumber] = useState('') // Полный номер для показа при разблокировке
  const [savedCardExpiry, setSavedCardExpiry] = useState('') // Дата для показа при разблокировке
  const [savedCardCvv, setSavedCardCvv] = useState('') // CVV для показа при разблокировке
  const [isCardFlipped, setIsCardFlipped] = useState(false)
  const [isEditingCard, setIsEditingCard] = useState(false)
  const [isCardDataVisible, setIsCardDataVisible] = useState(false)
  const [cardError, setCardError] = useState('')
  
  // Автоматический переворот карточки при заполнении номера и даты
  useEffect(() => {
    if (isEditingCard && !hasCard) {
      const cleanedNumber = cardNumber.replace(/\D/g, '')
      const hasNumber = cleanedNumber.length >= 13
      const hasExpiry = cardExpiry.length === 5
      
      if (hasNumber && hasExpiry && !isCardFlipped) {
        // Небольшая задержка для плавности
        setTimeout(() => setIsCardFlipped(true), 300)
      }
    }
  }, [cardNumber, cardExpiry, isEditingCard, hasCard, isCardFlipped])
  const [loading, setLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [analytics, setAnalytics] = useState({
    totalDeposit: 0,
    totalWithdrawal: 0
  })
  const [userBid, setUserBid] = useState(null)

  // Загружаем данные пользователя
  useEffect(() => {
    if (!userId) {
      navigate('/')
      return
    }
    loadUserData(true)
    
    // Обновляем данные каждые 5 секунд без показа загрузки
    const interval = setInterval(() => loadUserData(false), 5000)
    return () => clearInterval(interval)
  }, [userId])

  // Автоматически включаем редактирование, если карты нет
  useEffect(() => {
    if (!hasCard && !isEditingCard && !loading) {
      setIsEditingCard(true)
    }
  }, [hasCard, loading])

  // Автоматический переворот карточки при заполнении номера и даты
  useEffect(() => {
    if (isEditingCard && !hasCard) {
      const cleanedNumber = cardNumber.replace(/\D/g, '')
      const hasNumber = cleanedNumber.length >= 13
      const hasExpiry = cardExpiry.length === 5
      
      if (hasNumber && hasExpiry && !isCardFlipped) {
        // Небольшая задержка для плавности
        setTimeout(() => setIsCardFlipped(true), 300)
      } else if ((!hasNumber || !hasExpiry) && isCardFlipped && isEditingCard) {
        // Не переворачиваем обратно автоматически, только если пользователь не редактирует
      }
    }
  }, [cardNumber, cardExpiry, isEditingCard, hasCard])

  const loadUserData = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      
      const [depositRes, transactionsRes, analyticsRes, bidsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users/${userId}/deposit`),
        fetch(`${API_BASE_URL}/users/${userId}/transactions`),
        fetch(`${API_BASE_URL}/users/${userId}/analytics`),
        fetch(`${API_BASE_URL}/bids/user/${userId}`)
      ])

      if (depositRes.ok) {
        const depositData = await depositRes.json()
        if (depositData.success) {
          const newDeposit = depositData.data.depositAmount || 0
          setDepositAmount(prev => {
            if (prev !== newDeposit) {
              return newDeposit
            }
            return prev
          })
          
          const newHasCard = depositData.data.hasCard || false
          setHasCard(prev => {
            if (prev !== newHasCard) {
              // Устанавливаем isEditingCard только если карта была сохранена (переход из false в true)
              // Не сбрасываем isEditingCard, если пользователь активно редактирует
              if (newHasCard && !prev) {
                // Карта была сохранена - выключаем редактирование
                setIsEditingCard(false)
              } else if (!newHasCard && prev) {
                // Если карта была удалена, разрешаем редактирование
                setIsEditingCard(true)
              }
              return newHasCard
            }
            // Если hasCard не изменился, НЕ трогаем isEditingCard
            // Это важно для периодических обновлений - не сбрасываем состояние редактирования
            // Но если карты нет и isEditingCard false, устанавливаем его в true (первая загрузка)
            if (!newHasCard && !isEditingCard && showLoading) {
              setIsEditingCard(true)
            }
            return prev
          })
          
          const newCardType = depositData.data.cardType
          setCardType(prev => {
            if (prev !== newCardType) {
              return newCardType
            }
            return prev
          })
        }
      }

      if (transactionsRes.ok) {
        const transData = await transactionsRes.json()
        if (transData.success) {
          const newTransactions = transData.data || []
          setTransactions(prev => {
            const prevStr = JSON.stringify(prev)
            const newStr = JSON.stringify(newTransactions)
            if (prevStr !== newStr) {
              return newTransactions
            }
            return prev
          })
        }
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        if (analyticsData.success) {
          const newAnalytics = {
            totalDeposit: analyticsData.data.totalDeposit || 0,
            totalWithdrawal: analyticsData.data.totalWithdrawal || 0
          }
          setAnalytics(prev => {
            if (prev.totalDeposit !== newAnalytics.totalDeposit || 
                prev.totalWithdrawal !== newAnalytics.totalWithdrawal) {
              return newAnalytics
            }
            return prev
          })
        }
      }

      // Загружаем ставки пользователя
      if (bidsRes.ok) {
        const bidsData = await bidsRes.json()
        if (bidsData.success && bidsData.data && bidsData.data.length > 0) {
          const newUserBid = bidsData.data[0]
          setUserBid(prev => {
            const prevStr = JSON.stringify(prev)
            const newStr = JSON.stringify(newUserBid)
            if (prevStr !== newStr) {
              return newUserBid
            }
            return prev
          })
        } else {
          setUserBid(prev => {
            if (prev !== null) {
              return null
            }
            return prev
          })
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      if (showLoading) {
        setLoading(false)
        setIsInitialLoad(false)
      }
    }
  }

  const handleCardSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault()
    }
    setCardError('')

    // Валидация
    const cleanedCardNumber = cardNumber.replace(/\D/g, '')
    if (cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19) {
      setCardError('Номер карты должен содержать от 13 до 19 цифр')
      return
    }

    if (!validateLuhn(cleanedCardNumber)) {
      setCardError('Номер карты недействителен (не прошел проверку алгоритма Луна)')
      return
    }

    if (!cardCvv || cardCvv.length < 3 || cardCvv.length > 4) {
      setCardError('CVV должен содержать 3 или 4 цифры')
      return
    }

    if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      setCardError('Укажите срок действия в формате MM/YY')
      return
    }

    const detectedType = detectCardType(cleanedCardNumber)
    if (detectedType === 'UNKNOWN') {
      setCardError('Неподдерживаемый тип карты. Используйте VISA или Mastercard')
      return
    }

    try {
      console.log('📤 Отправка данных карты:', {
        userId,
        cardNumber: cleanedCardNumber.slice(0, 4) + '****', // Логируем только первые 4 цифры
        cardCvv: '***',
        cardType: detectedType
      })
      
      const response = await fetch(`${API_BASE_URL}/users/${userId}/card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cardNumber: cleanedCardNumber,
          cardCvv: cardCvv,
          cardType: detectedType
        })
      })

      console.log('📥 Ответ сервера:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Ошибка HTTP:', response.status, errorText)
        let errorMessage = `Ошибка сервера: ${response.status}`
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          // Используем стандартное сообщение
        }
        setCardError(errorMessage)
        return
      }

      const data = await response.json()
      console.log('📥 Данные ответа:', data)
      
      if (data.success) {
        setHasCard(true)
        setCardType(detectedType)
        // Сохраняем полные данные для показа при разблокировке
        setSavedCardNumber(cleanedCardNumber)
        setSavedCardExpiry(cardExpiry)
        setSavedCardCvv(cardCvv)
        // Сохраняем только последние 4 цифры для обычного отображения
        setCardNumber(cleanedCardNumber.slice(-4))
        setCardExpiry('') // Очищаем форму
        setCardCvv('') // Очищаем CVV
        setIsEditingCard(false)
        setIsCardFlipped(false) // Возвращаем карточку на лицевую сторону
        setIsCardDataVisible(false) // Сбрасываем видимость
        await loadUserData()
      } else {
        setCardError(data.error || 'Ошибка при сохранении карты')
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения карты:', error)
      setCardError(`Ошибка при сохранении карты: ${error.message}`)
    }
  }

  const handleTopUp = async () => {
    if (!hasCard) {
      setIsEditingCard(true)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/deposit/top-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      if (data.success) {
        // Обновляем депозит из ответа
        const newDeposit = data.data.depositAmount || 0
        setDepositAmount(newDeposit)
        // Перезагружаем все данные для синхронизации
        await loadUserData()
        alert(`Депозит пополнен на 3000 евро! Текущий баланс: ${formatAmount(newDeposit)}`)
      } else {
        alert(data.error || 'Ошибка при пополнении депозита')
      }
    } catch (error) {
      console.error('Ошибка пополнения:', error)
      alert('Ошибка при пополнении депозита')
    }
  }

  const handleWithdraw = async () => {
    const amount = prompt('Введите сумму для вывода (евро):')
    if (!amount || parseFloat(amount) <= 0) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/deposit/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: parseFloat(amount) })
      })

      const data = await response.json()
      if (data.success) {
        setDepositAmount(data.data.depositAmount)
        await loadUserData()
        alert(`Выведено ${amount} евро!`)
      } else {
        alert(data.error || 'Ошибка при выводе средств')
      }
    } catch (error) {
      console.error('Ошибка вывода:', error)
      alert('Ошибка при выводе средств')
    }
  }

  const getCardColor = () => {
    // Если карта не сохранена и номер не введен - нейтральный дизайн
    if (!hasCard && !cardNumber) {
      return 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)'
    }
    if (cardType === 'VISA') {
      return 'linear-gradient(135deg, #0ABAB5 0%, #089a95 50%, #0ABAB5 100%)'
    } else if (cardType === 'MASTERCARD') {
      return 'linear-gradient(135deg, #EB001B 0%, #F79E1B 50%, #EB001B 100%)'
    }
    // По умолчанию нейтральный дизайн
    return 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)'
  }
  
  const getCardLogo = () => {
    if (!hasCard && !cardNumber) {
      return null // Нет логотипа пока не введен номер
    }
    if (cardType === 'MASTERCARD') {
      return (
        <div className="mastercard-logo">
          <div className="mastercard-circle mastercard-circle--red"></div>
          <div className="mastercard-circle mastercard-circle--yellow"></div>
        </div>
      )
    }
    return <span>VISA</span>
  }
  
  const formatCardNumberForDisplay = () => {
    if (hasCard) {
      // После сохранения показываем только последние 4 цифры
      return getMaskedCardNumber()
    }
    // При вводе показываем введенные цифры с подчеркиваниями
    const cleaned = cardNumber.replace(/\D/g, '')
    if (cleaned.length === 0) {
      return '____ ____ ____ ____'
    }
    const formatted = cleaned.padEnd(16, '_')
    // Форматируем с пробелами каждые 4 символа
    return formatted.match(/.{1,4}/g)?.join(' ') || formatted
  }
  
  const formatExpiryForDisplay = () => {
    if (hasCard) {
      return '**/**'
    }
    if (cardExpiry) {
      return cardExpiry
    }
    return 'MM/YY'
  }
  
  const formatCvvForDisplay = () => {
    if (hasCard) {
      return '***'
    }
    if (cardCvv) {
      return cardCvv
    }
    return '___'
  }
  
  // Проверка, можно ли сохранить карту
  const canSaveCard = () => {
    const cleanedNumber = cardNumber.replace(/\D/g, '')
    return cleanedNumber.length >= 13 && 
           cardExpiry.length === 5 && 
           cardCvv.length >= 3 &&
           validateLuhn(cleanedNumber)
  }
  
  // Определяем тип карты при вводе номера
  const handleCardNumberChange = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 19)
    setCardNumber(cleaned)
    setCardError('')
    
    // Определяем тип карты при вводе
    if (cleaned.length >= 4) {
      const detectedType = detectCardType(cleaned)
      if (detectedType !== 'UNKNOWN') {
        setCardType(detectedType)
      }
    }
  }

  const formatAmount = (amount) => {
    if (amount >= 1000000) {
      return `€${(amount / 1000000).toFixed(2)}M`
    }
    return `€${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getMaskedCardNumber = () => {
    if (!hasCard) {
      // При редактировании показываем введенный номер
      if (cardNumber) {
        const cleaned = cardNumber.replace(/\D/g, '')
        if (cleaned.length === 0) {
          return '____ ____ ____ ____'
        }
        const formatted = cleaned.padEnd(16, '_')
        return formatted.match(/.{1,4}/g)?.join(' ') || formatted
      }
      return '____ ____ ____ ____'
    }
    
    // После сохранения
    if (isCardDataVisible && savedCardNumber) {
      // Показываем полный номер
      return formatCardNumber(savedCardNumber)
    }
    // Показываем только последние 4 цифры
    return `**** **** **** ${cardNumber}`
  }
  
  const getCardExpiryDisplay = () => {
    if (!hasCard) {
      return formatExpiryForDisplay()
    }
    
    // После сохранения
    if (isCardDataVisible && savedCardExpiry) {
      return savedCardExpiry
    }
    return '**/**'
  }
  
  const getCardCvvDisplay = () => {
    if (!hasCard) {
      return formatCvvForDisplay()
    }
    
    // После сохранения
    if (isCardDataVisible && savedCardCvv) {
      return savedCardCvv
    }
    return '***'
  }

  const handleCardLockClick = (e) => {
    e.stopPropagation()
    setIsCardDataVisible(!isCardDataVisible)
  }

  if (loading) {
    return (
      <div className="wallet-page">
        <div className="wallet-container">
          <div style={{ textAlign: 'center', padding: '50px', color: 'white' }}>
            Загрузка...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wallet-page">
      <div className="wallet-background">
        <div className="wallet-background__gradient"></div>
        <div className="wallet-background__pattern"></div>
      </div>

      <div className="wallet-container">
        {/* Заголовок */}
        <div className="wallet-header">
          <button onClick={() => navigate(-1)} className="wallet-back-button">
            <FaArrowLeft />
            <span>Назад</span>
          </button>
          <h1 className="wallet-title">Депозит</h1>
        </div>

        {/* Инструкция о депозите */}
        <div className="deposit-instruction">
          <div className="deposit-instruction__content">
            <h2>Что такое депозит?</h2>
            <p>Депозит — это 3000 евро, которые вы вносите для участия в аукционе.</p>
          </div>
        </div>

        {/* Банковская карта */}
        <div className="wallet-card-section">
          <div className="wallet-card-header">
            <h2 className="wallet-card-title">{hasCard ? 'Моя карта' : 'Добавьте карту'}</h2>
          </div>
          
          {/* Карточка всегда видна */}
          <div className="wallet-cards-carousel">
            <div
              className={`bank-card ${isCardFlipped ? 'flipped' : ''} ${isEditingCard ? 'editing' : ''}`}
              onClick={(e) => {
                // Если пользователь кликает на карту и нет карты, всегда начинаем редактирование
                if (!hasCard) {
                  setIsEditingCard(true)
                } else if (hasCard && !isEditingCard) {
                  // Если карта есть, переворачиваем её
                  setIsCardFlipped(!isCardFlipped)
                }
              }}
              style={{ '--card-color': getCardColor() }}
            >
              <div className="bank-card__front">
                <div className="bank-card__background" style={{ background: getCardColor() }}>
                  <div className="bank-card__pattern"></div>
                  <div className="bank-card__shine"></div>
                </div>
                <div className="bank-card__content">
                  <div className="bank-card__top">
                    <div className={`bank-card__logo ${cardType === 'MASTERCARD' ? 'mastercard' : ''}`}>
                      {getCardLogo()}
                    </div>
                    {hasCard && !isEditingCard && (
                      <div 
                        className="bank-card__security"
                        onClick={handleCardLockClick}
                      >
                        <FaLock className={`bank-card__lock-icon ${isCardDataVisible ? 'unlocked' : ''}`} />
                      </div>
                    )}
                  </div>
                  
                  <div className="bank-card__middle">
                    <div className="bank-card__chip">
                      <div className="chip"></div>
                    </div>
                    <div className="bank-card__contactless">
                      <FaWifi className="contactless-icon" />
                    </div>
                  </div>
                  
                  <div className="bank-card__number" onClick={(e) => e.stopPropagation()}>
                    {isEditingCard ? (
                      <input
                        type="text"
                        className="bank-card__number-input"
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        autoFocus
                      />
                    ) : (
                      <span className="bank-card__number-text">
                        {formatCardNumberForDisplay()}
                      </span>
                    )}
                    {hasCard && isCardDataVisible && !isEditingCard && (
                      <FaLock 
                        className={`bank-card__number-lock unlocked`}
                        onClick={handleCardLockClick}
                      />
                    )}
                  </div>
                  
                  <div className="bank-card__bottom">
                    <div className="bank-card__expiry" onClick={(e) => e.stopPropagation()}>
                      {isEditingCard && !hasCard ? (
                        <input
                          type="text"
                          className="bank-card__expiry-input"
                          value={cardExpiry}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '').slice(0, 4)
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2)
                            }
                            setCardExpiry(value)
                            setCardError('')
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="MM/YY"
                          maxLength="5"
                        />
                      ) : (
                        <span className="bank-card__expiry-text">{getCardExpiryDisplay()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bank-card__back">
                <div className="bank-card__back-content">
                  <div className="bank-card__magnetic-stripe"></div>
                  <div className="bank-card__cvv" onClick={(e) => e.stopPropagation()}>
                    <div className="cvv-label">CVV</div>
                    <div className="cvv-value">
                      {isEditingCard ? (
                        <input
                          type="text"
                          className="bank-card__cvv-input"
                          value={cardCvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                            setCardCvv(value)
                            setCardError('')
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="___"
                          maxLength="4"
                        />
                      ) : (
                        getCardCvvDisplay()
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Кнопка сохранения (показывается только когда все поля заполнены) */}
          {isEditingCard && !hasCard && canSaveCard() && (
            <div className="card-save-container">
              {cardError && <div className="card-error">{cardError}</div>}
              <button 
                type="button"
                onClick={handleCardSubmit}
                className="card-form-submit"
              >
                Сохранить карту
              </button>
            </div>
          )}

          {/* Блок депозита (показывается только после сохранения карты) */}
          {hasCard && (
            <>
              <div className="deposit-info-block">
                <div className="deposit-info-label">Депозит</div>
                <div className="deposit-info-amount">{formatAmount(depositAmount)}</div>
              </div>
              
              {/* Кнопки действий */}
              <div className="wallet-actions">
                <button 
                  className="wallet-action-btn deposit-action"
                  onClick={handleTopUp}
                >
                  <div className="wallet-action-icon-wrapper">
                    <FaArrowUp className="wallet-action-icon" />
                  </div>
                  <span>Пополнить</span>
                </button>
                <button 
                  className="wallet-action-btn withdraw-action"
                  onClick={handleWithdraw}
                >
                  <div className="wallet-action-icon-wrapper">
                    <FaArrowDown className="wallet-action-icon" />
                  </div>
                  <span>Вывести</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Объект с активной ставкой */}
        {userBid && (
          <div className="wallet-bid-object" style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '18px' }}>
              Ваш объект с активной ставкой
            </h3>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              {(() => {
                // Обрабатываем photos - может быть массивом или JSON строкой
                let photos = []
                if (userBid.photos) {
                  if (typeof userBid.photos === 'string') {
                    try {
                      photos = JSON.parse(userBid.photos)
                    } catch (e) {
                      photos = [userBid.photos]
                    }
                  } else if (Array.isArray(userBid.photos)) {
                    photos = userBid.photos
                  }
                }
                
                const baseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '')
                const firstPhoto = photos.length > 0 ? photos[0] : null
                const photoUrl = firstPhoto 
                  ? (typeof firstPhoto === 'string'
                      ? (firstPhoto.startsWith('http') 
                          ? firstPhoto 
                          : firstPhoto.startsWith('/uploads/') || firstPhoto.startsWith('uploads/')
                            ? `${baseUrl}${firstPhoto.startsWith('/') ? '' : '/'}${firstPhoto}`
                            : `${baseUrl}/uploads/${firstPhoto}`)
                      : firstPhoto?.url || firstPhoto)
                  : null
                
                return photoUrl ? (
                  <img 
                    src={photoUrl}
                    alt={userBid.title}
                    style={{
                      width: '100px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                ) : null
              })()}
              <div style={{ flex: 1 }}>
                <h4 style={{ color: 'white', marginBottom: '8px', fontSize: '16px' }}>
                  {userBid.title}
                </h4>
                {userBid.location && (
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px', fontSize: '14px' }}>
                    {userBid.location}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                  <div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>Ваша ставка:</span>
                    <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                      {formatAmount(userBid.bid_amount)}
                    </div>
                  </div>
                </div>
                <Link 
                  to={`/property/${userBid.property_id}`}
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                >
                  Перейти к объекту →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Аналитика и Транзакции в одной строке */}
        <div className="wallet-stats-transactions">
          {/* Аналитика */}
          <div className="wallet-analytics-block">
            <h2 className="wallet-analytics-title">Аналитика</h2>
            <div className="wallet-stats">
              <div className="wallet-stat-card">
                <div className="wallet-stat-header">
                  <div className="wallet-stat-label">Всего выведено</div>
                  <div className="wallet-stat-icon">
                    <FaArrowDown />
                  </div>
                </div>
                <div className="wallet-stat-amount">{formatAmount(analytics.totalWithdrawal)}</div>
              </div>
              <div className="wallet-stat-card">
                <div className="wallet-stat-header">
                  <div className="wallet-stat-label">Всего пополнено</div>
                  <div className="wallet-stat-icon">
                    <FaArrowUp />
                  </div>
                </div>
                <div className="wallet-stat-amount">{formatAmount(analytics.totalDeposit)}</div>
              </div>
            </div>
          </div>

          {/* Транзакции */}
          <div className="wallet-transactions-block">
            <div className="wallet-transactions-header">
              <h3 className="wallet-transactions-title">Транзакции</h3>
            </div>
            
            <div className="wallet-transactions-list">
              {transactions.length === 0 ? (
                <div className="wallet-transaction-empty">Нет транзакций</div>
              ) : (
                transactions.map((transaction, index) => (
                  <div key={transaction.id || index} className="wallet-transaction-item">
                    <div className="wallet-transaction-info">
                      <div className="wallet-transaction-name">{transaction.description || transaction.type}</div>
                      <div className="wallet-transaction-time">
                        {new Date(transaction.created_at).toLocaleString('ru-RU')}
                      </div>
                    </div>
                    <div className="wallet-transaction-right">
                      <div className={`wallet-transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}`}>
                        {transaction.amount > 0 ? '+' : ''}{formatAmount(Math.abs(transaction.amount))}
                      </div>
                      <div className="wallet-transaction-type">
                        {transaction.type === 'deposit' ? 'Пополнение' : 'Вывод'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Wallet
