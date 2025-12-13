import { FiUpload, FiArrowRight } from 'react-icons/fi'
import './QuickAddCard.css'

const QuickAddCard = ({ onClick }) => {
  return (
    <div className="quick-add-card" onClick={onClick}>
      <div className="quick-add-card__content-wrapper">
        <div className="quick-add-card__icon-wrapper">
          <div className="quick-add-card__icon">
            <FiUpload size={24} />
          </div>
        </div>
        <div className="quick-add-card__content">
          <div className="quick-add-card__main-text">
            <p className="quick-add-card__value">Быстрое</p>
            <p className="quick-add-card__value">добавление</p>
          </div>
          <div className="quick-add-card__footer">
            <p className="quick-add-card__subtext">CSV или Excel</p>
            <FiArrowRight className="quick-add-card__arrow" size={18} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickAddCard
