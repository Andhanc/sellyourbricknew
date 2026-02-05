import { FiX, FiClock, FiDollarSign } from 'react-icons/fi'
import CountdownTimer from './CountdownTimer'
import './BiddingHistoryModal.css'

const BiddingHistoryModal = ({ isOpen, onClose, property }) => {
  if (!isOpen) return null

  const auctionStartDate =
    property?.start_date ||
    property?.auction_start_date ||
    property?.auctionStartDate ||
    null

  const auctionEndDate =
    property?.end_date ||
    property?.auction_end_date ||
    property?.auctionEndDate ||
    property?.endTime ||
    null

  const startingPriceRaw =
    property?.auction_starting_price ??
    property?.auctionStartingPrice ??
    property?.starting_price ??
    property?.startingPrice ??
    property?.price ??
    property?.current_bid ??
    null

  const formatPrice = (price) => {
    const num = Number(price)
    if (!num || Number.isNaN(num)) return '—'
    return `$${num.toLocaleString('ru-RU')}`
  }

  const formatDate = (date) => {
    if (!date) return ''
    const d =
      typeof date === 'string' || typeof date === 'number'
        ? new Date(date)
        : date
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const hasPeriod = auctionStartDate || auctionEndDate

  return (
    <div className="bidding-history-overlay" onClick={onClose}>
      <div className="bidding-history-modal" onClick={(e) => e.stopPropagation()}>
        <button 
          className="bidding-history-modal__close" 
          onClick={onClose}
          aria-label="Закрыть"
        >
          <FiX size={24} />
        </button>

        <div className="bidding-history-modal__content">
          <div className="bidding-history-modal__header">
            <h2 className="bidding-history-modal__title">История ставок</h2>
            <p className="bidding-history-modal__subtitle">{property?.title || 'Объект недвижимости'}</p>
          </div>

          {hasPeriod && (
            <div className="bidding-history-period">
              <div className="bidding-history-period__icon">
                <FiClock size={18} />
              </div>
              <div>
                <div className="bidding-history-period__label">Период аукциона</div>
                <div className="bidding-history-period__value">
                  {formatDate(auctionStartDate)}
                  {auctionStartDate && auctionEndDate ? ' — ' : ''}
                  {formatDate(auctionEndDate)}
                </div>
              </div>
            </div>
          )}

          {auctionEndDate && (
            <div className="bidding-history-timer-wrapper">
              <CountdownTimer endTime={auctionEndDate} />
            </div>
          )}

          <div className="bidding-history-start-price">
            <div className="bidding-history-start-price__icon">
              <FiDollarSign size={20} />
            </div>
            <div className="bidding-history-start-price__info">
              <div className="bidding-history-start-price__label">Стартовая ставка</div>
              <div className="bidding-history-start-price__value">
                {startingPriceRaw != null ? formatPrice(startingPriceRaw) : '—'}
              </div>
            </div>
          </div>

          <p className="bidding-history-placeholder">
            История пользовательских ставок и детальная аналитика будут доступны в следующей версии.
          </p>
        </div>
      </div>
    </div>
  )
}

export default BiddingHistoryModal
