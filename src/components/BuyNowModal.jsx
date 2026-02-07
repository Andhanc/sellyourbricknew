import { FiX, FiCheckCircle, FiFileText, FiCreditCard, FiShield } from 'react-icons/fi'
import './BuyNowModal.css'

const BuyNowModal = ({ isOpen, onClose, property }) => {
  if (!isOpen) return null

  const propertyTitle = property?.title || property?.name || 'Объект недвижимости'
  const propertyPrice = property?.price || 0
  const currency = property?.currency || 'USD'
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'BYN' ? 'Br' : ''

  return (
    <div className="buy-now-modal-overlay" onClick={onClose}>
      <div className="buy-now-modal" onClick={(e) => e.stopPropagation()}>
        <button 
          className="buy-now-modal__close" 
          onClick={onClose}
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
            <span className="buy-now-modal__price-label">Стоимость:</span>
            <span className="buy-now-modal__price-value">
              {currencySymbol}{propertyPrice.toLocaleString('ru-RU')}
            </span>
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
              className="buy-now-modal__button buy-now-modal__button--primary"
              onClick={onClose}
            >
              Понятно
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BuyNowModal
