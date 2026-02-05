import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MdBed, MdOutlineBathtub } from 'react-icons/md';
import { BiArea } from 'react-icons/bi';
import BiddingHistoryModal from '../BiddingHistoryModal';
import './NearestAuctionsSlider.css';

const AuctionCardItem = ({ auction, onHistoryClick }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(auction.end_date).getTime();
      const difference = end - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [auction.end_date]);

  const getTypeLabel = (type) => {
    const types = {
      apartment: 'Квартира',
      villa: 'Вилла',
      house: 'Дом'
    };
    return types[type] || type;
  };

  return (
    <div className="auction-card">
      <div className="nearest-auction-timer-centered">
        <div className="nearest-auction-timer">
          <div className="timer-item">
            <div className="timer-value">{String(timeLeft.days).padStart(2, '0')}</div>
            <div className="timer-label">дней</div>
          </div>
          <div className="timer-separator">:</div>
          <div className="timer-item">
            <div className="timer-value">{String(timeLeft.hours).padStart(2, '0')}</div>
            <div className="timer-label">часов</div>
          </div>
          <div className="timer-separator">:</div>
          <div className="timer-item">
            <div className="timer-value">{String(timeLeft.minutes).padStart(2, '0')}</div>
            <div className="timer-label">мин</div>
          </div>
          <div className="timer-separator">:</div>
          <div className="timer-item">
            <div className="timer-value">{String(timeLeft.seconds).padStart(2, '0')}</div>
            <div className="timer-label">сек</div>
          </div>
        </div>
      </div>
      <div className="nearest-auction-content">
        <div className="nearest-auction-image-wrapper">
          <div className="nearest-auction-image">
            <img src={auction.image_url} alt={auction.object_title} />
          </div>
          <div className="nearest-auction-image-info">
            <div className="image-info-item">
              <MdBed size={16} />
              <span>{auction.bedrooms || 3}</span>
            </div>
            <div className="image-info-item">
              <MdOutlineBathtub size={16} />
              <span>{auction.bathrooms || 2}</span>
            </div>
            <div className="image-info-item">
              <BiArea size={16} />
              <span>{auction.area || 120} м²</span>
            </div>
          </div>
        </div>
        <div className="nearest-auction-info">
          <div className="nearest-auction-object-title">{auction.object_title}</div>
          <div className="nearest-auction-object-description">
            {auction.description || `${getTypeLabel(auction.object_type)} в престижном районе с современной отделкой и всеми удобствами`}
          </div>
          <div className="nearest-auction-object-location">
            <i className="fas fa-map-marker-alt"></i>
            {auction.object_location}
          </div>
          <div className="nearest-auction-price">
        <div className="price-label">Стартовая ставка:</div>
        <div className="price-value">
          ${Number(auction.starting_price || auction.auction_starting_price || auction.current_bid || 0).toLocaleString('ru-RU')}
        </div>
          </div>
          <button 
            className="history-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onHistoryClick) {
                onHistoryClick(auction);
              }
            }}
            type="button"
          >
            <i className="fas fa-history"></i> История ставок
          </button>
        </div>
      </div>
    </div>
  );
};

const NearestAuctionsSlider = ({ auctions }) => {
  // Проверка на пустой массив
  if (!auctions || auctions.length === 0) {
    return (
      <div className="nearest-auctions-slider-container">
        <div className="slider-header">
          <h3 className="slider-title">Ближайшие аукционы</h3>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
          Нет доступных аукционов
        </div>
      </div>
    );
  }

  const [currentIndex, setCurrentIndex] = useState(auctions.length);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selectedAuctionForHistory, setSelectedAuctionForHistory] = useState(null);
  const sliderRef = useRef(null);
  const trackWrapperRef = useRef(null);
  const itemsPerView = 2;
  const totalItems = auctions.length;

  // Создаем расширенный массив для бесконечного слайдера (клонируем элементы)
  // Структура: [копия] [оригинал] [копия]
  const extendedAuctions = [...auctions, ...auctions, ...auctions];

  useEffect(() => {
    // Устанавливаем начальную позицию на середину (оригинальный массив)
    if (sliderRef.current && totalItems > 0) {
      const itemWidth = 100 / itemsPerView;
      const translateValue = currentIndex * itemWidth;
      sliderRef.current.style.transition = 'none';
      sliderRef.current.style.transform = `translate3d(-${translateValue}%, 0, 0)`;
      // Принудительно перерисовываем
      setTimeout(() => {
        if (sliderRef.current) {
          sliderRef.current.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }
      }, 50);
    }
  }, [totalItems, currentIndex, itemsPerView]);

  const goToSlide = useCallback((index, immediate = false) => {
    if (isTransitioning && !immediate) return;
    
    setIsTransitioning(true);
    setCurrentIndex(index);

    if (sliderRef.current) {
      const itemWidth = 100 / itemsPerView;
      const translateValue = index * itemWidth;
      if (immediate) {
        sliderRef.current.style.transition = 'none';
      }
      // Используем translate3d для лучшего рендеринга
      sliderRef.current.style.transform = `translate3d(-${translateValue}%, 0, 0)`;
    }

    if (!immediate) {
      setTimeout(() => {
        setIsTransitioning(false);
        
        // Если дошли до конца второго клона (оригинал + копия), переходим к началу оригинала
        if (index >= totalItems * 2) {
        const newIndex = totalItems;
        const itemWidth = 100 / itemsPerView;
        const translateValue = newIndex * itemWidth;
        setCurrentIndex(newIndex);
        if (sliderRef.current) {
          sliderRef.current.style.transition = 'none';
          sliderRef.current.style.transform = `translate3d(-${translateValue}%, 0, 0)`;
            setTimeout(() => {
              if (sliderRef.current) {
                sliderRef.current.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                setIsTransitioning(false);
              }
            }, 50);
          }
        }
        // Если дошли до начала первого клона, переходим к концу оригинала
        else if (index < totalItems) {
          // Переходим к последнему видимому индексу оригинала
        const newIndex = totalItems - itemsPerView;
        const itemWidth = 100 / itemsPerView;
        const translateValue = newIndex * itemWidth;
        setCurrentIndex(newIndex);
        if (sliderRef.current) {
          sliderRef.current.style.transition = 'none';
          sliderRef.current.style.transform = `translate3d(-${translateValue}%, 0, 0)`;
            setTimeout(() => {
              if (sliderRef.current) {
                sliderRef.current.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                setIsTransitioning(false);
              }
            }, 50);
          }
        } else {
          setIsTransitioning(false);
        }
      }, 800);
    }
  }, [totalItems, itemsPerView]);

  const handleMouseDown = (e) => {
    if (isTransitioning) return;
    setIsDragging(true);
    setStartX(e.clientX);
    setCurrentX(e.clientX);
    setOffset(0);
    if (sliderRef.current) {
      sliderRef.current.style.transition = 'none';
    }
  };


  useEffect(() => {
    const handleMouseMoveEvent = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const diff = e.clientX - startX;
      setCurrentX(e.clientX);
      setOffset(diff);
      
      if (sliderRef.current && trackWrapperRef.current) {
        const itemWidth = 100 / itemsPerView;
        const baseOffset = currentIndex * itemWidth;
        const trackWidth = trackWrapperRef.current.offsetWidth;
        const dragOffset = (diff / trackWidth) * 100;
        const translateValue = -baseOffset + dragOffset;
        sliderRef.current.style.transform = `translate3d(${translateValue}%, 0, 0)`;
      }
    };

    const handleMouseUpEvent = () => {
      if (!isDragging) return;
      setIsDragging(false);
      
      const threshold = 50; // Минимальное расстояние для переключения слайда
      const itemWidth = 100 / itemsPerView;
      
      if (Math.abs(offset) > threshold) {
        if (offset > 0) {
          // Перетаскивание вправо - предыдущий слайд
          goToSlide(currentIndex - 1);
        } else {
          // Перетаскивание влево - следующий слайд
          goToSlide(currentIndex + 1);
        }
      } else {
        // Возвращаемся к текущему слайду
        goToSlide(currentIndex, true);
        setTimeout(() => {
          if (sliderRef.current) {
            sliderRef.current.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          }
        }, 50);
      }
      
      setOffset(0);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMoveEvent);
      document.addEventListener('mouseup', handleMouseUpEvent);
      return () => {
        document.removeEventListener('mousemove', handleMouseMoveEvent);
        document.removeEventListener('mouseup', handleMouseUpEvent);
      };
    }
  }, [isDragging, startX, offset, currentIndex, itemsPerView, goToSlide]);

  const nextSlide = () => {
    goToSlide(currentIndex + 1);
  };

  const prevSlide = () => {
    goToSlide(currentIndex - 1);
  };

  return (
    <div className="nearest-auctions-slider-container">
      <div className="slider-header">
        <h3 className="slider-title">Ближайшие аукционы</h3>
      </div>
      
      <div className="slider-wrapper">
        <button 
          className="slider-arrow slider-arrow-left" 
          onClick={prevSlide}
          disabled={isTransitioning || isDragging}
          aria-label="Предыдущий слайд"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <div 
          className="slider-track-wrapper"
          ref={trackWrapperRef}
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div 
            className="slider-track" 
            ref={sliderRef}
          >
            {extendedAuctions.map((auction, index) => (
              <div key={`auction-${index}`} className="slider-item">
                <AuctionCardItem 
                  auction={auction} 
                  onHistoryClick={(auction) => setSelectedAuctionForHistory(auction)}
                />
              </div>
            ))}
          </div>
        </div>
        <button 
          className="slider-arrow slider-arrow-right" 
          onClick={nextSlide}
          disabled={isTransitioning || isDragging}
          aria-label="Следующий слайд"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      {selectedAuctionForHistory && (
        <BiddingHistoryModal
          isOpen={!!selectedAuctionForHistory}
          onClose={() => setSelectedAuctionForHistory(null)}
          property={{
            title: selectedAuctionForHistory.object_title,
            id: selectedAuctionForHistory.object_id || selectedAuctionForHistory.id,
            end_date: selectedAuctionForHistory.end_date
          }}
        />
      )}
    </div>
  );
};

export default NearestAuctionsSlider;

