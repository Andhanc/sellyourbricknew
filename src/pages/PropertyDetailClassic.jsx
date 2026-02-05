import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useUser } from '@clerk/clerk-react'
import {
  FiArrowLeft,
  FiShare2,
  FiHeart,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi'
import { FaHeart as FaHeartSolid } from 'react-icons/fa'
import { IoLocationOutline } from 'react-icons/io5'
import { isAuthenticated } from '../services/authService'
import PropertyTimer from '../components/PropertyTimer'
import BiddingHistoryModal from '../components/BiddingHistoryModal'
import LocationMap from '../components/LocationMap'
import './PropertyDetailClassic.css'

// Классическая страница объекта.
// Для аукционных объектов дополнительно отображает таймер и историю ставок.
function PropertyDetailClassic({ property, onBack }) {
  const { t } = useTranslation()
  const { user, isLoaded: userLoaded } = useUser()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const thumbnailScrollRef = useRef(null)
  const [isBidHistoryOpen, setIsBidHistoryOpen] = useState(false)
  const [mapCoordinates, setMapCoordinates] = useState(null)
  const [isGeocoding, setIsGeocoding] = useState(false)

  // Выводим ВСЕ данные в консоль для отладки
  console.log('🔍 PropertyDetailClassic - ВСЕ ДАННЫЕ ОБЪЕКТА:', property)
  console.log('🔍 PropertyDetailClassic - Координаты (raw):', property.coordinates)
  console.log('🔍 PropertyDetailClassic - Удобства (raw):', {
    balcony: property.balcony,
    parking: property.parking,
    elevator: property.elevator,
    garage: property.garage,
    pool: property.pool,
    garden: property.garden,
    electricity: property.electricity,
    internet: property.internet,
    security: property.security,
    furniture: property.furniture,
  })

  // Обрабатываем координаты (как в админке - просто используем как есть)
  let coordinates = [53.9045, 27.5615] // Дефолтные координаты (Минск)
  if (property.coordinates) {
    try {
      if (typeof property.coordinates === 'string') {
        const parsed = JSON.parse(property.coordinates)
        if (Array.isArray(parsed) && parsed.length >= 2) {
          const lat = parseFloat(parsed[0])
          const lng = parseFloat(parsed[1])
          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            coordinates = [lat, lng]
          }
        }
      } else if (Array.isArray(property.coordinates) && property.coordinates.length >= 2) {
        const lat = parseFloat(property.coordinates[0])
        const lng = parseFloat(property.coordinates[1])
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          coordinates = [lat, lng]
        }
      }
    } catch (e) {
      console.warn('Ошибка парсинга coordinates:', e)
    }
  }

  console.log('🔍 PropertyDetailClassic - Координаты (processed):', coordinates)

  // Геокодирование адреса, если координат нет
  useEffect(() => {
    const geocodeAddress = async () => {
      // Если координаты уже есть и валидны, используем их
      const hasValidCoordinates = coordinates && 
        coordinates[0] !== 53.9045 && 
        coordinates[1] !== 27.5615 &&
        !isNaN(coordinates[0]) && 
        !isNaN(coordinates[1])
      
      if (hasValidCoordinates) {
        setMapCoordinates(coordinates)
        return
      }

      // Если координат нет, но есть адрес, пытаемся геокодировать
      const address = property.location || property.address
      if (address && !isGeocoding && !mapCoordinates) {
        setIsGeocoding(true)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&accept-language=ru&addressdetails=1`
          )
          if (response.ok) {
            const data = await response.json()
            if (data && data.length > 0) {
              const lat = parseFloat(data[0].lat)
              const lon = parseFloat(data[0].lon)
              if (!isNaN(lat) && !isNaN(lon)) {
                setMapCoordinates([lat, lon])
                console.log('✅ Адрес геокодирован:', address, '->', [lat, lon])
              } else {
                // Если геокодирование не удалось, используем дефолтные координаты
                setMapCoordinates(coordinates)
              }
            } else {
              // Если результатов нет, используем дефолтные координаты
              setMapCoordinates(coordinates)
            }
          } else {
            setMapCoordinates(coordinates)
          }
        } catch (error) {
          console.warn('Ошибка геокодирования адреса:', error)
          setMapCoordinates(coordinates)
        } finally {
          setIsGeocoding(false)
        }
      } else if (!address) {
        // Если нет ни координат, ни адреса, используем дефолтные координаты
        setMapCoordinates(coordinates)
      }
    }

    geocodeAddress()
  }, [property.location, property.address, coordinates])

  // Используем геокодированные координаты или исходные
  const finalCoordinates = mapCoordinates || coordinates

  // Нормализуем данные под формат детальной страницы (используем данные как есть, как в админке)
  const displayProperty = {
    ...property,
    name: property.title || property.name,
    sqft: property.area || property.sqft,
    area: property.area || property.sqft,
    beds: property.rooms ?? property.beds,
    rooms: property.rooms ?? property.beds,
    bedrooms: property.bedrooms || property.rooms,
    bathrooms: property.bathrooms,
    coordinates: coordinates,
    // Убеждаемся, что все поля передаются
    floor: property.floor,
    total_floors: property.total_floors,
    year_built: property.year_built,
    land_area: property.land_area,
    renovation: property.renovation,
    condition: property.condition,
    heating: property.heating,
    water_supply: property.water_supply,
    sewerage: property.sewerage,
    commercial_type: property.commercial_type,
    business_hours: property.business_hours,
    additional_amenities: property.additional_amenities,
    // Удобства
    balcony: property.balcony,
    parking: property.parking,
    elevator: property.elevator,
    garage: property.garage,
    pool: property.pool,
    garden: property.garden,
    electricity: property.electricity,
    internet: property.internet,
    security: property.security,
    furniture: property.furniture,
  }

  console.log('🔍 PropertyDetailClassic - displayProperty:', displayProperty)

  const images =
    displayProperty.images && displayProperty.images.length > 0
      ? displayProperty.images
      : [
          'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
        ]

  // Получаем видео из property
  let videos = []
  if (displayProperty.videos && Array.isArray(displayProperty.videos) && displayProperty.videos.length > 0) {
    videos = displayProperty.videos
  } else if (displayProperty.videos && typeof displayProperty.videos === 'string') {
    try {
      const parsed = JSON.parse(displayProperty.videos)
      if (Array.isArray(parsed)) {
        videos = parsed
      }
    } catch (e) {
      console.warn('Ошибка парсинга videos:', e)
    }
  }

  // Объединяем фото и видео в один массив медиа (БЕЗ дублирования фотографий)
  const allMedia = [
    ...images.map((img, idx) => ({ type: 'photo', url: img, index: idx })),
    ...videos.map((video, idx) => ({ 
      type: 'video', 
      url: typeof video === 'string' ? video : (video.url || video.embedUrl || video.videoId),
      videoId: typeof video === 'object' ? video.videoId : null,
      videoType: typeof video === 'object' ? video.type : null,
      thumbnail: typeof video === 'object' ? video.thumbnail : null,
      index: images.length + idx 
    }))
  ]

  // Используем все медиа без дублирования
  const galleryMedia = allMedia

  const currentMedia = galleryMedia[currentImageIndex] || galleryMedia[0]
  
  // Функции для работы с YouTube и Google Drive
  const getYouTubeEmbedUrl = (videoId) => {
    return `https://www.youtube.com/embed/${videoId}`
  }
  
  const getGoogleDriveEmbedUrl = (fileId) => {
    return `https://drive.google.com/file/d/${fileId}/preview`
  }

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : galleryMedia.length - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < galleryMedia.length - 1 ? prev + 1 : 0))
  }

  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index)
    if (thumbnailScrollRef.current) {
      const thumbnail = thumbnailScrollRef.current.children[index]
      if (thumbnail) {
        thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }

  useEffect(() => {
    if (thumbnailScrollRef.current) {
      const thumbnail = thumbnailScrollRef.current.children[currentImageIndex]
      if (thumbnail) {
        thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [currentImageIndex])

  const propertyInfo = displayProperty.title || displayProperty.name

  const [isFavorite, setIsFavorite] = useState(false)

  // Признак аукционного объекта
  const isAuctionProperty =
    displayProperty.isAuction === true ||
    displayProperty.is_auction === true ||
    displayProperty.is_auction === 1

  const auctionEndTime =
    displayProperty.endTime ||
    displayProperty.auction_end_date ||
    null

  const handleToggleFavorite = () => {
    // Проверяем авторизацию через Clerk или старую систему
    const isClerkAuth = user && userLoaded
    const isOldAuth = isAuthenticated()
    
    // Разрешаем удаление из избранного без авторизации, но добавление требует авторизации
    if (!isFavorite && !isClerkAuth && !isOldAuth) {
      alert('Пожалуйста, войдите в систему, чтобы добавлять объявления в избранное')
      return
    }
    
    setIsFavorite((prev) => !prev)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: propertyInfo,
          text: displayProperty.description,
          url: window.location.href,
        })
        .catch(() => {})
    }
  }

  const handleBookNow = () => {
    alert(t('buyNow') || 'Заявка отправлена')
  }

  return (
    <div className="property-detail-page-new">
      {/* Заголовок */}
      <div className="property-detail-header">
        <div className="property-detail-header__container">
          <button
            type="button"
            className="property-detail-header__back"
            onClick={onBack || (() => window.history.back())}
          >
            <FiArrowLeft size={20} />
            <span>{t('back') || 'Назад'}</span>
          </button>
          <div className="property-detail-header__info">
            <span className="property-detail-header__path">
              {t('searchResults') || 'Результаты поиска'}
            </span>
            <span className="property-detail-header__separator">/</span>
            <span className="property-detail-header__property">{propertyInfo}</span>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="property-detail-main">
        <div className="property-detail-main__container">
          {/* Левая колонка - обёртка для галереи и информации */}
          <div className="property-detail-left-column">
            {/* Галерея */}
            <div className="property-detail-gallery">
              <div className="property-detail-gallery__main">
                {currentMedia && (
                  currentMedia.type === 'video' ? (
                    <div style={{ width: '100%', height: '100%', position: 'relative', paddingBottom: '56.25%', backgroundColor: '#000' }}>
                      <iframe
                        src={
                          currentMedia.videoType === 'youtube' 
                            ? getYouTubeEmbedUrl(currentMedia.videoId || currentMedia.url)
                            : currentMedia.videoType === 'googledrive'
                              ? getGoogleDriveEmbedUrl(currentMedia.videoId || currentMedia.url)
                              : currentMedia.url
                        }
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          borderRadius: '12px'
                        }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <img
                      src={currentMedia.url}
                      alt={displayProperty.name}
                      className="property-detail-gallery__main-image"
                    />
                  )
                )}
                {galleryMedia.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="property-detail-gallery__nav property-detail-gallery__nav--prev"
                      onClick={handlePreviousImage}
                      aria-label={t('previousImage') || 'Предыдущее фото'}
                    >
                      <FiChevronLeft size={24} />
                    </button>
                    <button
                      type="button"
                      className="property-detail-gallery__nav property-detail-gallery__nav--next"
                      onClick={handleNextImage}
                      aria-label={t('nextImage') || 'Следующее фото'}
                    >
                      <FiChevronRight size={24} />
                    </button>
                    <div className="property-detail-gallery__counter">
                      {currentImageIndex + 1} / {galleryMedia.length}
                    </div>
                  </>
                )}
                <div className="property-detail-gallery__actions">
                  <button
                    type="button"
                    className="property-detail-gallery__action-btn"
                    onClick={handleShare}
                    aria-label={t('share') || 'Поделиться'}
                  >
                    <FiShare2 size={20} />
                  </button>
                  <button
                    type="button"
                    className={`property-detail-gallery__action-btn ${
                      isFavorite ? 'property-detail-gallery__action-btn--active' : ''
                    }`}
                    onClick={handleToggleFavorite}
                    aria-label={t('addToFavorites') || 'В избранное'}
                  >
                    {isFavorite ? <FaHeartSolid size={20} /> : <FiHeart size={20} />}
                  </button>
                </div>
              </div>

              {galleryMedia.length > 0 && (
                <div className="property-detail-gallery__thumbnails-wrapper">
                  <div className="property-detail-gallery__thumbnails" ref={thumbnailScrollRef}>
                    {galleryMedia.map((media, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`property-detail-gallery__thumbnail ${
                          currentImageIndex === index
                            ? 'property-detail-gallery__thumbnail--active'
                            : ''
                        }`}
                        onClick={() => handleThumbnailClick(index)}
                      >
                        {media.type === 'video' ? (
                          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            {media.thumbnail ? (
                              <img src={media.thumbnail} alt={`Видео ${index + 1}`} />
                            ) : (
                              <div style={{ 
                                width: '100%', 
                                height: '100%', 
                                backgroundColor: '#000', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: '12px'
                              }}>
                                ▶ Видео
                              </div>
                            )}
                          </div>
                        ) : (
                          <img src={media.url} alt={`${displayProperty.name} ${index + 1}`} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Блок с подробной информацией об объекте - под галереей */}
            <div className="property-detail-info-section">
              {/* Основные характеристики */}
              {(displayProperty.area || displayProperty.sqft || displayProperty.rooms || displayProperty.beds || 
                displayProperty.bedrooms || displayProperty.bathrooms || displayProperty.floor || 
                displayProperty.total_floors || displayProperty.year_built || displayProperty.land_area) && (
                <div className="property-detail-info-block">
                  <h3 className="property-detail-info-block__title">Основные характеристики</h3>
                  <div className="property-detail-info-block__content property-detail-info-block__content--grid">
                    {(displayProperty.area || displayProperty.sqft) && (
                      <div className="property-detail-info-item">
                        <span className="property-detail-info-label">Площадь:</span>
                        <span className="property-detail-info-value">
                          {displayProperty.area || displayProperty.sqft} м²
                        </span>
                      </div>
                    )}
                    {(displayProperty.rooms || displayProperty.beds) && (
                      <div className="property-detail-info-item">
                        <span className="property-detail-info-label">Комнат:</span>
                        <span className="property-detail-info-value">
                          {displayProperty.rooms || displayProperty.beds || displayProperty.bedrooms}
                        </span>
                      </div>
                    )}
                    {displayProperty.bedrooms && (
                      <div className="property-detail-info-item">
                        <span className="property-detail-info-label">Спальни:</span>
                        <span className="property-detail-info-value">{displayProperty.bedrooms}</span>
                      </div>
                    )}
                    {displayProperty.bathrooms && (
                      <div className="property-detail-info-item">
                        <span className="property-detail-info-label">Ванные:</span>
                        <span className="property-detail-info-value">{displayProperty.bathrooms}</span>
                      </div>
                    )}
                    {displayProperty.floor && (
                      <div className="property-detail-info-item">
                        <span className="property-detail-info-label">Этаж:</span>
                        <span className="property-detail-info-value">{displayProperty.floor}</span>
                      </div>
                    )}
                    {displayProperty.total_floors && (
                      <div className="property-detail-info-item">
                        <span className="property-detail-info-label">Всего этажей:</span>
                        <span className="property-detail-info-value">{displayProperty.total_floors}</span>
                      </div>
                    )}
                    {displayProperty.year_built && (
                      <div className="property-detail-info-item">
                        <span className="property-detail-info-label">Год постройки:</span>
                        <span className="property-detail-info-value">{displayProperty.year_built}</span>
                      </div>
                    )}
                    {displayProperty.land_area && (
                      <div className="property-detail-info-item">
                        <span className="property-detail-info-label">Площадь участка:</span>
                        <span className="property-detail-info-value">{displayProperty.land_area} м²</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Дополнительная информация */}
              {(displayProperty.renovation || displayProperty.condition || displayProperty.heating || 
                displayProperty.water_supply || displayProperty.sewerage || displayProperty.commercial_type || 
                displayProperty.business_hours) && (
                <div className="property-detail-info-block">
                  <h3 className="property-detail-info-block__title">Дополнительная информация</h3>
                  <div className="property-detail-info-block__content property-detail-info-block__content--grid">
                    {displayProperty.renovation && (
                      <div className="property-detail-info-item">
                        <span className="property-detail-info-label">Ремонт:</span>
                        <span className="property-detail-info-value">{displayProperty.renovation}</span>
                      </div>
                    )}
                    {displayProperty.condition && (
                      <div className="property-detail-info-item">
                        <span className="property-detail-info-label">Состояние:</span>
                        <span className="property-detail-info-value">{displayProperty.condition}</span>
                      </div>
                    )}
                    {displayProperty.heating && (
                      <div className="property-detail-info-item">
                        <span className="property-detail-info-label">Отопление:</span>
                        <span className="property-detail-info-value">{displayProperty.heating}</span>
                      </div>
                    )}
                    {displayProperty.water_supply && (
                      <div className="property-detail-info-item">
                        <span className="property-detail-info-label">Водоснабжение:</span>
                        <span className="property-detail-info-value">{displayProperty.water_supply}</span>
                      </div>
                    )}
                    {displayProperty.sewerage && (
                      <div className="property-detail-info-item">
                        <span className="property-detail-info-label">Канализация:</span>
                        <span className="property-detail-info-value">{displayProperty.sewerage}</span>
                      </div>
                    )}
                    {displayProperty.commercial_type && (
                      <div className="property-detail-info-item">
                        <span className="property-detail-info-label">Тип коммерческой:</span>
                        <span className="property-detail-info-value">{displayProperty.commercial_type}</span>
                      </div>
                    )}
                    {displayProperty.business_hours && (
                      <div className="property-detail-info-item">
                        <span className="property-detail-info-label">Часы работы:</span>
                        <span className="property-detail-info-value">{displayProperty.business_hours}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Удобства - используем формат как в админке модерации */}
              <div className="property-detail-info-block">
                <h3 className="property-detail-info-block__title">Удобства</h3>
                <div className="property-detail-info-block__content">
                  {(() => {
                    // Функция для проверки удобства (работает с разными форматами)
                    const hasAmenity = (value) => {
                      return value === 1 || value === true || value === '1' || value === 'true'
                    }
                    
                    const amenities = []
                    
                    if (hasAmenity(property.balcony) || hasAmenity(displayProperty.balcony)) {
                      amenities.push(<span key="balcony" className="amenity-tag">Балкон</span>)
                    }
                    if (hasAmenity(property.parking) || hasAmenity(displayProperty.parking)) {
                      amenities.push(<span key="parking" className="amenity-tag">Парковка</span>)
                    }
                    if (hasAmenity(property.elevator) || hasAmenity(displayProperty.elevator)) {
                      amenities.push(<span key="elevator" className="amenity-tag">Лифт</span>)
                    }
                    if (hasAmenity(property.garage) || hasAmenity(displayProperty.garage)) {
                      amenities.push(<span key="garage" className="amenity-tag">Гараж</span>)
                    }
                    if (hasAmenity(property.pool) || hasAmenity(displayProperty.pool)) {
                      amenities.push(<span key="pool" className="amenity-tag">Бассейн</span>)
                    }
                    if (hasAmenity(property.garden) || hasAmenity(displayProperty.garden)) {
                      amenities.push(<span key="garden" className="amenity-tag">Сад</span>)
                    }
                    if (hasAmenity(property.electricity) || hasAmenity(displayProperty.electricity)) {
                      amenities.push(<span key="electricity" className="amenity-tag">Электричество</span>)
                    }
                    if (hasAmenity(property.internet) || hasAmenity(displayProperty.internet)) {
                      amenities.push(<span key="internet" className="amenity-tag">Интернет</span>)
                    }
                    if (hasAmenity(property.security) || hasAmenity(displayProperty.security)) {
                      amenities.push(<span key="security" className="amenity-tag">Охрана</span>)
                    }
                    if (hasAmenity(property.furniture) || hasAmenity(displayProperty.furniture)) {
                      amenities.push(<span key="furniture" className="amenity-tag">Мебель</span>)
                    }
                    
                    if (amenities.length === 0) {
                      return <span className="amenity-tag" style={{ opacity: 0.6 }}>Удобства не указаны</span>
                    }
                    
                    return amenities
                  })()}
                </div>
              </div>

              {/* Дополнительные удобства (текст, который пользователь написал сам) */}
              {displayProperty.additional_amenities && (
                <div className="property-detail-info-block">
                  <h3 className="property-detail-info-block__title">Дополнительные удобства</h3>
                  <div className="property-detail-info-block__content property-detail-info-block__content--text">
                    <p>{displayProperty.additional_amenities}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Правая колонка */}
          <div className="property-detail-sidebar">
            <div className="property-detail-sidebar__content">
              {/* Название */}
              <h1 className="property-detail-sidebar__title">{propertyInfo}</h1>

              {/* Описание */}
              {displayProperty.description && (
                <div className="property-detail-sidebar__description">
                  <p className="property-detail-sidebar__description-text">
                    {displayProperty.description}
                  </p>
                </div>
              )}

              {/* Местоположение */}
              <div className="property-detail-sidebar__location">
                <IoLocationOutline size={18} />
                <span>{displayProperty.location}</span>
              </div>

              {/* Блок таймера аукциона, текущей ставки и истории ставок */}
              {isAuctionProperty && auctionEndTime && (
                <div className="property-detail-sidebar__auction-block">
                  <PropertyTimer endTime={auctionEndTime} />
                  <div className="property-detail-sidebar__current-bid">
                    <span className="current-bid-label">Текущая ставка:</span>
                    <span className="current-bid-value">
                      {displayProperty.currency === 'USD' ? '$' : displayProperty.currency === 'EUR' ? '€' : displayProperty.currency === 'BYN' ? 'Br' : ''}
                      {(displayProperty.currentBid || displayProperty.price || 0).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="property-detail-sidebar__history-btn"
                    onClick={() => setIsBidHistoryOpen(true)}
                  >
                    История ставок
                  </button>
                </div>
              )}

              {/* Карта */}
              <div className="property-detail-sidebar__map">
                <h2 className="property-detail-sidebar__map-title">
                  {t('locationTitle') || 'Местоположение'}
                </h2>
                <div className="property-detail-sidebar__map-container">
                  {typeof window !== 'undefined' && (
                    <>
                      <LocationMap
                        center={finalCoordinates}
                        zoom={finalCoordinates && finalCoordinates[0] !== 53.9045 && finalCoordinates[1] !== 27.5615 ? 15 : 10}
                        marker={finalCoordinates && finalCoordinates[0] !== 53.9045 && finalCoordinates[1] !== 27.5615 ? finalCoordinates : null}
                      />
                      {isGeocoding && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          background: 'rgba(255, 255, 255, 0.95)',
                          padding: '12px 20px',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                          zIndex: 1000,
                          fontSize: '14px',
                          color: '#4b5563',
                          fontFamily: 'Montserrat, sans-serif',
                          fontWeight: 500
                        }}>
                          Поиск местоположения...
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно истории ставок для аукционных объектов */}
      {isAuctionProperty && (
        <BiddingHistoryModal
          isOpen={isBidHistoryOpen}
          onClose={() => setIsBidHistoryOpen(false)}
          property={{
            id: displayProperty.id,
            title: propertyInfo,
            start_date: displayProperty.auction_start_date,
            end_date: displayProperty.auction_end_date,
            auction_starting_price: displayProperty.auction_starting_price,
            price: displayProperty.price,
            currentBid: displayProperty.currentBid || displayProperty.price
          }}
        />
      )}
    </div>
  )
}

export default PropertyDetailClassic


