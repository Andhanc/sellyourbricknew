import { useState } from 'react'
import { FiX, FiCheckCircle, FiFileText, FiCreditCard, FiShield, FiExternalLink, FiCopy } from 'react-icons/fi'
import './BuyNowModal.css'

const BuyNowModal = ({ isOpen, onClose, property }) => {
  const [agreementRead, setAgreementRead] = useState(false)
  const [agreementChecked, setAgreementChecked] = useState(false)
  const [showRequisites, setShowRequisites] = useState(false)
  const [copied, setCopied] = useState(false)

  // Сбрасываем состояние при закрытии модального окна
  const handleClose = () => {
    setAgreementRead(false)
    setAgreementChecked(false)
    setShowRequisites(false)
    setCopied(false)
    onClose()
  }

  if (!isOpen) return null

  const propertyTitle = property?.title || property?.name || 'Объект недвижимости'
  const isAuction = property?.isAuction || false
  // Для аукциона используем текущую ставку, для обычной покупки - цену
  const purchaseAmount = isAuction ? (property?.currentBid || property?.price || 0) : (property?.price || 0)
  const currency = property?.currency || 'USD'
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'BYN' ? 'Br' : ''
  
  // 10% от суммы покупки
  const depositAmount = purchaseAmount * 0.1
  
  // Тестовая ссылка на оферту
  const offerUrl = 'https://www.sellyourbrick.com/offer' // Можно заменить на реальную ссылку
  
  // Тестовые реквизиты
  const requisites = {
    bankName: 'Test Bank International',
    accountNumber: 'LT123456789012345678',
    accountHolder: 'SellYourBrick Ltd',
    swift: 'TESTUS33',
    iban: 'LT123456789012345678',
    purpose: `Оплата 10% за объект: ${propertyTitle}`,
    amount: depositAmount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handleAgreementLinkClick = () => {
    window.open(offerUrl, '_blank')
    setAgreementRead(true)
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="buy-now-modal-overlay" onClick={handleClose}>
      <div className="buy-now-modal" onClick={(e) => e.stopPropagation()}>
        <button 
          className="buy-now-modal__close" 
          onClick={handleClose}
          aria-label="Закрыть"
        >
          <FiX size={24} />
        </button>

        <div className="buy-now-modal__content">
          <div className="buy-now-modal__header">
            <div className="buy-now-modal__icon">
              <FiCheckCircle size={48} />
            </div>
            <h2 className="buy-now-modal__title">Инструкция по покупке</h2>
            <p className="buy-now-modal__subtitle">{propertyTitle}</p>
          </div>

          <div className="buy-now-modal__price-block">
            <span className="buy-now-modal__price-label">
              {isAuction ? 'Сумма покупки (ваша ставка):' : 'Стоимость:'}
            </span>
            <span className="buy-now-modal__price-value">
              {currencySymbol}{purchaseAmount.toLocaleString('ru-RU')}
            </span>
          </div>

          {/* Информация о депозите 10% и 72 часах */}
          <div className="buy-now-modal__deposit-info">
            <div className="buy-now-modal__deposit-icon">⏰</div>
            <div className="buy-now-modal__deposit-content">
              <h3 className="buy-now-modal__deposit-title">Важно!</h3>
              <p className="buy-now-modal__deposit-text">
                У вас есть <strong>72 часа</strong> для внесения предоплаты в размере <strong>10%</strong> от суммы покупки.
              </p>
              <div className="buy-now-modal__deposit-amount">
                <span className="buy-now-modal__deposit-amount-label">Сумма к оплате:</span>
                <span className="buy-now-modal__deposit-amount-value">
                  {currencySymbol}{depositAmount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Чекбокс согласия с офертой */}
          <div className="buy-now-modal__agreement">
            <label className={`buy-now-modal__agreement-label ${!agreementRead ? 'buy-now-modal__agreement-label--disabled' : ''}`}>
              <input
                type="checkbox"
                checked={agreementChecked}
                onChange={(e) => {
                  if (agreementRead) {
                    setAgreementChecked(e.target.checked)
                  }
                }}
                disabled={!agreementRead}
                className="buy-now-modal__agreement-checkbox"
              />
              <span className="buy-now-modal__agreement-text">
                Я ознакомился с{' '}
                <button
                  type="button"
                  onClick={handleAgreementLinkClick}
                  className="buy-now-modal__agreement-link"
                >
                  публичной офертой
                  <FiExternalLink size={14} style={{ marginLeft: '4px', display: 'inline' }} />
                </button>
                {' '}и согласен с условиями
              </span>
            </label>
            {!agreementRead && (
              <p className="buy-now-modal__agreement-hint">
                Пожалуйста, ознакомьтесь с офертой перед подтверждением
              </p>
            )}
          </div>

          {/* Кнопка посмотреть реквизиты */}
          <div className="buy-now-modal__requisites-section">
            <button
              type="button"
              onClick={() => setShowRequisites(!showRequisites)}
              className="buy-now-modal__requisites-btn"
            >
              {showRequisites ? 'Скрыть реквизиты' : 'Посмотреть реквизиты'}
              <FiFileText size={18} style={{ marginLeft: '8px' }} />
            </button>

            {showRequisites && (
              <div className="buy-now-modal__requisites">
                <h4 className="buy-now-modal__requisites-title">Реквизиты для оплаты</h4>
                <div className="buy-now-modal__requisites-list">
                  <div className="buy-now-modal__requisite-item">
                    <span className="buy-now-modal__requisite-label">Банк:</span>
                    <span className="buy-now-modal__requisite-value">{requisites.bankName}</span>
                  </div>
                  <div className="buy-now-modal__requisite-item">
                    <span className="buy-now-modal__requisite-label">Получатель:</span>
                    <span className="buy-now-modal__requisite-value">{requisites.accountHolder}</span>
                  </div>
                  <div className="buy-now-modal__requisite-item">
                    <span className="buy-now-modal__requisite-label">Номер счета:</span>
                    <div className="buy-now-modal__requisite-value-with-copy">
                      <span className="buy-now-modal__requisite-value">{requisites.accountNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(requisites.accountNumber)}
                        className="buy-now-modal__copy-btn"
                        title="Копировать"
                      >
                        <FiCopy size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="buy-now-modal__requisite-item">
                    <span className="buy-now-modal__requisite-label">IBAN:</span>
                    <div className="buy-now-modal__requisite-value-with-copy">
                      <span className="buy-now-modal__requisite-value">{requisites.iban}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(requisites.iban)}
                        className="buy-now-modal__copy-btn"
                        title="Копировать"
                      >
                        <FiCopy size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="buy-now-modal__requisite-item">
                    <span className="buy-now-modal__requisite-label">SWIFT:</span>
                    <div className="buy-now-modal__requisite-value-with-copy">
                      <span className="buy-now-modal__requisite-value">{requisites.swift}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(requisites.swift)}
                        className="buy-now-modal__copy-btn"
                        title="Копировать"
                      >
                        <FiCopy size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="buy-now-modal__requisite-item">
                    <span className="buy-now-modal__requisite-label">Назначение платежа:</span>
                    <div className="buy-now-modal__requisite-value-with-copy">
                      <span className="buy-now-modal__requisite-value">{requisites.purpose}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(requisites.purpose)}
                        className="buy-now-modal__copy-btn"
                        title="Копировать"
                      >
                        <FiCopy size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="buy-now-modal__requisite-item buy-now-modal__requisite-item--amount">
                    <span className="buy-now-modal__requisite-label">Сумма:</span>
                    <span className="buy-now-modal__requisite-value buy-now-modal__requisite-value--highlight">
                      {currencySymbol}{requisites.amount}
                    </span>
                  </div>
                </div>
                {copied && (
                  <div className="buy-now-modal__copied-message">
                    Скопировано в буфер обмена!
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="buy-now-modal__instructions">
            <h3 className="buy-now-modal__instructions-title">Как купить объект:</h3>
            
            <div className="buy-now-modal__step">
              <div className="buy-now-modal__step-number">1</div>
              <div className="buy-now-modal__step-content">
                <h4 className="buy-now-modal__step-title">
                  <FiFileText size={20} />
                  Подготовка документов
                </h4>
                <p className="buy-now-modal__step-text">
                  Подготовьте все необходимые документы: паспорт, документы о доходах, 
                  справки из банка (если требуется кредит).
                </p>
              </div>
            </div>

            <div className="buy-now-modal__step">
              <div className="buy-now-modal__step-number">2</div>
              <div className="buy-now-modal__step-content">
                <h4 className="buy-now-modal__step-title">
                  <FiCreditCard size={20} />
                  Оплата
                </h4>
                <p className="buy-now-modal__step-text">
                  После подтверждения заявки вы получите реквизиты для оплаты. 
                  Оплата может быть произведена банковским переводом или через платежную систему.
                </p>
              </div>
            </div>

            <div className="buy-now-modal__step">
              <div className="buy-now-modal__step-number">3</div>
              <div className="buy-now-modal__step-content">
                <h4 className="buy-now-modal__step-title">
                  <FiShield size={20} />
                  Оформление сделки
                </h4>
                <p className="buy-now-modal__step-text">
                  Наш специалист свяжется с вами для согласования деталей сделки, 
                  оформления договора и передачи документов.
                </p>
              </div>
            </div>
          </div>

          <div className="buy-now-modal__contact">
            <p className="buy-now-modal__contact-text">
              После отправки заявки наш менеджер свяжется с вами в течение 24 часов 
              для уточнения деталей и ответов на ваши вопросы.
            </p>
          </div>

          <div className="buy-now-modal__actions">
            <button 
              className="buy-now-modal__button buy-now-modal__button--secondary"
              onClick={handleClose}
            >
              Отмена
            </button>
            <button 
              className="buy-now-modal__button buy-now-modal__button--primary"
              onClick={handleClose}
              disabled={!agreementChecked}
            >
              Подтвердить
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BuyNowModal
