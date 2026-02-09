import { useEffect } from 'react';
import { FiX, FiUser, FiDollarSign } from 'react-icons/fi';
import { FaTrophy } from 'react-icons/fa';
import './AuctionWinnerModal.css';

const AuctionWinnerModal = ({ isOpen, onClose, winner, currency = 'USD' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !winner) return null;

  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'BYN' ? 'Br' : '';

  return (
    <>
      {/* Затемненный фон */}
      <div className="auction-winner-overlay" onClick={onClose} />
      
      {/* Модальное окно */}
      <div className="auction-winner-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auction-winner-modal__close" onClick={onClose} aria-label="Закрыть">
          <FiX size={24} />
        </button>
        
        <div className="auction-winner-modal__content">
          <div className="auction-winner-modal__icon">
            <FaTrophy size={64} />
          </div>
          
          <h2 className="auction-winner-modal__title">Аукцион завершен!</h2>
          
          <div className="auction-winner-modal__winner-info">
            <div className="auction-winner-modal__winner-label">
              <FiUser size={18} />
              <span>Победитель</span>
            </div>
            <div className="auction-winner-modal__winner-name">
              {winner.firstName && winner.lastName 
                ? `${winner.firstName} ${winner.lastName}`
                : winner.email || 'Игрок'}
            </div>
          </div>
          
          <div className="auction-winner-modal__bid-info">
            <div className="auction-winner-modal__bid-label">
              <FiDollarSign size={18} />
              <span>Выигрышная ставка</span>
            </div>
            <div className="auction-winner-modal__bid-amount">
              {currencySymbol}{winner.bidAmount.toLocaleString('ru-RU')}
            </div>
          </div>
          
          <div className="auction-winner-modal__confetti">
            <div className="confetti-piece"></div>
            <div className="confetti-piece"></div>
            <div className="confetti-piece"></div>
            <div className="confetti-piece"></div>
            <div className="confetti-piece"></div>
            <div className="confetti-piece"></div>
            <div className="confetti-piece"></div>
            <div className="confetti-piece"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuctionWinnerModal;

