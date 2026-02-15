import { useState, useEffect } from 'react';
import { FiX, FiAlertCircle, FiCheck } from 'react-icons/fi';
import './BuySharesModal.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const BuySharesModal = ({ isOpen, onClose, property, currentUserId }) => {
  const [sharesCount, setSharesCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sharesStats, setSharesStats] = useState(null);

  useEffect(() => {
    if (isOpen && property) {
      fetchSharesStats();
    }
  }, [isOpen, property]);

  const fetchSharesStats = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/property-shares/${property.property_type}/${property.id}/stats`
      );
      const data = await response.json();
      if (data.success) {
        setSharesStats(data.data);
      }
    } catch (err) {
      console.error('Ошибка при загрузке статистики долей:', err);
    }
  };

  const availableShares = sharesStats 
    ? sharesStats.shares_available 
    : (property.total_shares - (property.shares_sold || 0));

  const pricePerShare = property.price && property.total_shares 
    ? Math.ceil(property.price / property.total_shares)
    : 0;

  const totalPrice = pricePerShare * sharesCount;

  const handlePurchase = async () => {
    if (!currentUserId) {
      setError('Необходимо войти в систему для покупки долей');
      return;
    }

    if (sharesCount < 1) {
      setError('Укажите количество долей');
      return;
    }

    if (sharesCount > availableShares) {
      setError(`Доступно только ${availableShares} долей`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/property-shares`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: property.id,
          propertyType: property.property_type,
          buyerId: currentUserId,
          sharesCount: parseInt(sharesCount),
          pricePerShare: pricePerShare,
          currency: property.currency || 'USD'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          window.location.reload(); // Перезагружаем страницу для обновления данных
        }, 2000);
      } else {
        setError(data.error || 'Ошибка при покупке долей');
      }
    } catch (err) {
      console.error('Ошибка при покупке долей:', err);
      setError('Произошла ошибка при покупке долей');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getCurrencySymbol = () => {
    switch (property.currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'RUB': return '₽';
      case 'GBP': return '£';
      default: return property.currency || '$';
    }
  };

  return (
    <div className="buy-shares-modal-overlay" onClick={onClose}>
      <div className="buy-shares-modal" onClick={(e) => e.stopPropagation()}>
        <button className="buy-shares-modal-close" onClick={onClose}>
          <FiX size={24} />
        </button>

        {success ? (
          <div className="buy-shares-success">
            <div className="buy-shares-success-icon">
              <FiCheck size={48} />
            </div>
            <h2 className="buy-shares-success-title">Доли успешно приобретены!</h2>
            <p className="buy-shares-success-text">
              Вы приобрели {sharesCount} {sharesCount === 1 ? 'долю' : sharesCount < 5 ? 'доли' : 'долей'} объекта
            </p>
          </div>
        ) : (
          <>
            <h2 className="buy-shares-modal-title">Купить доли объекта</h2>
            
            <div className="buy-shares-property-info">
              <h3 className="buy-shares-property-name">{property.title}</h3>
              <p className="buy-shares-property-location">{property.location}</p>
            </div>

            <div className="buy-shares-stats">
              <div className="buy-shares-stat">
                <span className="buy-shares-stat-label">Всего долей:</span>
                <span className="buy-shares-stat-value">{property.total_shares}</span>
              </div>
              <div className="buy-shares-stat">
                <span className="buy-shares-stat-label">Доступно:</span>
                <span className="buy-shares-stat-value buy-shares-stat-value--highlight">
                  {availableShares}
                </span>
              </div>
              <div className="buy-shares-stat">
                <span className="buy-shares-stat-label">Цена за долю:</span>
                <span className="buy-shares-stat-value">
                  {getCurrencySymbol()} {pricePerShare.toLocaleString('ru-RU')}
                </span>
              </div>
            </div>

            <div className="buy-shares-input-group">
              <label className="buy-shares-label">
                Количество долей
              </label>
              <input
                type="number"
                min="1"
                max={availableShares}
                value={sharesCount}
                onChange={(e) => setSharesCount(Math.min(Math.max(1, parseInt(e.target.value) || 1), availableShares))}
                className="buy-shares-input"
              />
              <div className="buy-shares-quick-buttons">
                <button
                  type="button"
                  onClick={() => setSharesCount(1)}
                  className="buy-shares-quick-btn"
                >
                  1
                </button>
                {availableShares >= 5 && (
                  <button
                    type="button"
                    onClick={() => setSharesCount(5)}
                    className="buy-shares-quick-btn"
                  >
                    5
                  </button>
                )}
                {availableShares >= 10 && (
                  <button
                    type="button"
                    onClick={() => setSharesCount(10)}
                    className="buy-shares-quick-btn"
                  >
                    10
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSharesCount(availableShares)}
                  className="buy-shares-quick-btn"
                >
                  Все
                </button>
              </div>
            </div>

            <div className="buy-shares-total">
              <span className="buy-shares-total-label">Итого к оплате:</span>
              <span className="buy-shares-total-value">
                {getCurrencySymbol()} {totalPrice.toLocaleString('ru-RU')}
              </span>
            </div>
            
            <div style={{ 
              fontSize: '13px', 
              color: '#6b7280', 
              textAlign: 'center',
              marginBottom: '16px',
              padding: '8px 12px',
              background: '#f9fafb',
              borderRadius: '8px'
            }}>
              {sharesCount} {sharesCount === 1 ? 'доля' : sharesCount < 5 ? 'доли' : 'долей'} × {getCurrencySymbol()} {pricePerShare.toLocaleString('ru-RU')}
            </div>

            {error && (
              <div className="buy-shares-error">
                <FiAlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="buy-shares-actions">
              <button
                type="button"
                onClick={onClose}
                className="buy-shares-btn buy-shares-btn--cancel"
                disabled={isLoading}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handlePurchase}
                className="buy-shares-btn buy-shares-btn--confirm"
                disabled={isLoading || sharesCount < 1 || sharesCount > availableShares}
              >
                {isLoading ? 'Обработка...' : 'Купить'}
              </button>
            </div>

            <div className="buy-shares-info">
              <FiAlertCircle size={16} />
              <p>
                После покупки вы станете совладельцем данного объекта недвижимости. 
                Информация о покупке будет доступна в вашем личном кабинете.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BuySharesModal;
