import { useState, useEffect } from 'react';
import { FiClock, FiLock } from 'react-icons/fi';
import './ReservationStatus.css';

const ReservationStatus = ({ propertyId, propertyType, currentUserId, onReservationExpired }) => {
  const [reservationInfo, setReservationInfo] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [loading, setLoading] = useState(true);

  // Функция для форматирования времени
  const formatTimeRemaining = (milliseconds) => {
    if (milliseconds <= 0) return '0ч 0м';
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}ч ${minutes}м`;
  };

  // Загрузка информации о бронировании
  useEffect(() => {
    const fetchReservationInfo = async () => {
      if (!propertyId || !propertyType) {
        setLoading(false);
        return;
      }

      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
        const response = await fetch(
          `${API_BASE_URL}/properties/${propertyType}/${propertyId}/reservation`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.isReserved) {
            setReservationInfo(data);
          } else {
            setReservationInfo(null);
          }
        }
      } catch (error) {
        console.error('Ошибка получения информации о бронировании:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservationInfo();
    // Обновляем каждые 30 секунд
    const interval = setInterval(fetchReservationInfo, 30000);
    
    return () => clearInterval(interval);
  }, [propertyId, propertyType]);

  // Обновление таймера
  useEffect(() => {
    if (!reservationInfo || !reservationInfo.reservedUntil) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const reserved = new Date(reservationInfo.reservedUntil).getTime();
      const remaining = reserved - now;

      if (remaining <= 0) {
        setTimeRemaining(0);
        if (onReservationExpired) {
          onReservationExpired();
        }
        setReservationInfo(null);
      } else {
        setTimeRemaining(remaining);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [reservationInfo, onReservationExpired]);

  if (loading || !reservationInfo) return null;

  const isOwnReservation = currentUserId && reservationInfo.reservedBy && 
    String(currentUserId) === String(reservationInfo.reservedBy);

  return (
    <div className={`reservation-status ${isOwnReservation ? 'reservation-status--own' : 'reservation-status--locked'}`}>
      <div className="reservation-status__icon">
        {isOwnReservation ? <FiClock size={24} /> : <FiLock size={24} />}
      </div>
      <div className="reservation-status__content">
        <div className="reservation-status__title">
          {isOwnReservation ? 'Вы забронировали этот объект' : 'Объект забронирован'}
        </div>
        <div className="reservation-status__timer">
          <FiClock size={16} />
          <span>Осталось: {formatTimeRemaining(timeRemaining)}</span>
        </div>
        {!isOwnReservation && (
          <div className="reservation-status__message">
            Другие пользователи не могут отправить запрос на покупку этого объекта
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservationStatus;
