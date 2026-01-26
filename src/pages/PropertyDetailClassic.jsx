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
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { isAuthenticated } from '../services/authService'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './PropertyDetailClassic.css'

// Фикс для иконок Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Классическая страница объекта (без аукциона)
// Ожидает объект из массива properties.js
function PropertyDetailClassic({ property, onBack }) {
  const { t } = useTranslation()
  const { user, isLoaded: userLoaded } = useUser()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const thumbnailScrollRef = useRef(null)

  // Нормализуем данные под формат детальной страницы
  const displayProperty = {
    ...property,
    name: property.title || property.name,
    sqft: property.area || property.sqft,
    beds: property.rooms ?? property.beds,
    coordinates: property.coordinates || [28.1000, -16.7200], // базовые координаты, как на макете
  }

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

            <div className="property-detail-gallery__action-buttons">
              <button
                type="button"
                className="property-detail-gallery__buy-btn"
                onClick={handleBookNow}
              >
                {t('buyNow') || 'Купить сейчас'}
              </button>
            </div>
          </div>

          {/* Правая колонка */}
          <div className="property-detail-sidebar">
            <div className="property-detail-sidebar__content">
              <h1 className="property-detail-sidebar__title">{propertyInfo}</h1>

              <div className="property-detail-sidebar__location">
                <IoLocationOutline size={18} />
                <span>{displayProperty.location}</span>
              </div>

              {displayProperty.price && (
                <div className="property-detail-sidebar__price" style={{ 
                  fontSize: '28px', 
                  fontWeight: 700, 
                  color: '#000', 
                  marginTop: '16px',
                  marginBottom: '16px'
                }}>
                  {displayProperty.currency === 'USD' ? '$' : displayProperty.currency === 'EUR' ? '€' : ''}
                  {displayProperty.price.toLocaleString('ru-RU')}
                </div>
              )}

              <div className="property-detail-sidebar__features">
                <div className="property-detail-sidebar__feature">
                  <span className="property-detail-sidebar__feature-label">
                    {t('area') || 'Площадь'}
                  </span>
                  <span className="property-detail-sidebar__feature-value">
                    {displayProperty.sqft || displayProperty.area || 'Не указано'} м²
                  </span>
                </div>
                {displayProperty.land_area && (
                  <div className="property-detail-sidebar__feature">
                    <span className="property-detail-sidebar__feature-label">
                      {t('landArea') || 'Площадь участка'}
                    </span>
                    <span className="property-detail-sidebar__feature-value">
                      {displayProperty.land_area} м²
                    </span>
                  </div>
                )}
                <div className="property-detail-sidebar__feature">
                  <span className="property-detail-sidebar__feature-label">
                    {t('roomsCount') || 'Комнат'}
                  </span>
                  <span className="property-detail-sidebar__feature-value">
                    {displayProperty.beds || displayProperty.rooms || 'Студия'}
                  </span>
                </div>
                {displayProperty.bathrooms && (
                  <div className="property-detail-sidebar__feature">
                    <span className="property-detail-sidebar__feature-label">
                      {t('bathrooms') || 'Ванных'}
                    </span>
                    <span className="property-detail-sidebar__feature-value">
                      {displayProperty.bathrooms}
                    </span>
                  </div>
                )}
                {displayProperty.floor !== null && displayProperty.floor !== undefined && (
                  <div className="property-detail-sidebar__feature">
                    <span className="property-detail-sidebar__feature-label">
                      {t('floorNumber') || 'Этаж'}
                    </span>
                    <span className="property-detail-sidebar__feature-value">
                      {displayProperty.floor} {displayProperty.total_floors ? `из ${displayProperty.total_floors}` : ''}
                    </span>
                  </div>
                )}
                {displayProperty.year_built && (
                  <div className="property-detail-sidebar__feature">
                    <span className="property-detail-sidebar__feature-label">
                      {t('yearBuilt') || 'Год постройки'}
                    </span>
                    <span className="property-detail-sidebar__feature-value">
                      {displayProperty.year_built}
                    </span>
                  </div>
                )}
                {displayProperty.property_type && (
                  <div className="property-detail-sidebar__feature">
                    <span className="property-detail-sidebar__feature-label">
                      {t('propertyType') || 'Тип недвижимости'}
                    </span>
                    <span className="property-detail-sidebar__feature-value">
                      {displayProperty.property_type === 'apartment' ? 'Квартира' :
                       displayProperty.property_type === 'house' ? 'Дом' :
                       displayProperty.property_type === 'villa' ? 'Вилла' :
                       displayProperty.property_type === 'commercial' ? 'Коммерческая' :
                       displayProperty.property_type}
                    </span>
                  </div>
                )}
                {displayProperty.renovation && (
                  <div className="property-detail-sidebar__feature">
                    <span className="property-detail-sidebar__feature-label">
                      {t('renovation') || 'Ремонт'}
                    </span>
                    <span className="property-detail-sidebar__feature-value">
                      {displayProperty.renovation}
                    </span>
                  </div>
                )}
                {displayProperty.condition && (
                  <div className="property-detail-sidebar__feature">
                    <span className="property-detail-sidebar__feature-label">
                      {t('condition') || 'Состояние'}
                    </span>
                    <span className="property-detail-sidebar__feature-value">
                      {displayProperty.condition}
                    </span>
                  </div>
                )}
                {displayProperty.heating && (
                  <div className="property-detail-sidebar__feature">
                    <span className="property-detail-sidebar__feature-label">
                      {t('heating') || 'Отопление'}
                    </span>
                    <span className="property-detail-sidebar__feature-value">
                      {displayProperty.heating}
                    </span>
                  </div>
                )}
                {displayProperty.water_supply && (
                  <div className="property-detail-sidebar__feature">
                    <span className="property-detail-sidebar__feature-label">
                      {t('waterSupply') || 'Водоснабжение'}
                    </span>
                    <span className="property-detail-sidebar__feature-value">
                      {displayProperty.water_supply}
                    </span>
                  </div>
                )}
                {displayProperty.sewerage && (
                  <div className="property-detail-sidebar__feature">
                    <span className="property-detail-sidebar__feature-label">
                      {t('sewerage') || 'Канализация'}
                    </span>
                    <span className="property-detail-sidebar__feature-value">
                      {displayProperty.sewerage}
                    </span>
                  </div>
                )}
                <div className="property-detail-sidebar__feature">
                  <span className="property-detail-sidebar__feature-label">
                    {t('seller') || 'Продавец'}
                  </span>
                  <span className="property-detail-sidebar__feature-value">
                    {displayProperty.seller || 'Не указано'}
                  </span>
                </div>
                {/* Дополнительные характеристики */}
                {(displayProperty.balcony || displayProperty.parking || displayProperty.elevator || 
                  displayProperty.garage || displayProperty.pool || displayProperty.garden ||
                  displayProperty.electricity || displayProperty.internet || displayProperty.security || 
                  displayProperty.furniture) && (
                  <div className="property-detail-sidebar__feature" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
                    <span className="property-detail-sidebar__feature-label" style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                      {t('additionalFeatures') || 'Дополнительно'}
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {displayProperty.balcony && <span style={{ padding: '4px 8px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>Балкон</span>}
                      {displayProperty.parking && <span style={{ padding: '4px 8px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>Парковка</span>}
                      {displayProperty.elevator && <span style={{ padding: '4px 8px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>Лифт</span>}
                      {displayProperty.garage && <span style={{ padding: '4px 8px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>Гараж</span>}
                      {displayProperty.pool && <span style={{ padding: '4px 8px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>Бассейн</span>}
                      {displayProperty.garden && <span style={{ padding: '4px 8px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>Сад</span>}
                      {displayProperty.electricity && <span style={{ padding: '4px 8px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>Электричество</span>}
                      {displayProperty.internet && <span style={{ padding: '4px 8px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>Интернет</span>}
                      {displayProperty.security && <span style={{ padding: '4px 8px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>Охрана</span>}
                      {displayProperty.furniture && <span style={{ padding: '4px 8px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>Мебель</span>}
                    </div>
                  </div>
                )}
                {displayProperty.commercial_type && (
                  <div className="property-detail-sidebar__feature">
                    <span className="property-detail-sidebar__feature-label">
                      {t('commercialType') || 'Тип коммерческой недвижимости'}
                    </span>
                    <span className="property-detail-sidebar__feature-value">
                      {displayProperty.commercial_type}
                    </span>
                  </div>
                )}
                {displayProperty.business_hours && (
                  <div className="property-detail-sidebar__feature">
                    <span className="property-detail-sidebar__feature-label">
                      {t('businessHours') || 'Часы работы'}
                    </span>
                    <span className="property-detail-sidebar__feature-value">
                      {displayProperty.business_hours}
                    </span>
                  </div>
                )}
              </div>

              <div className="property-detail-sidebar__description">
                <h2 className="property-detail-sidebar__description-title">
                  {t('description') || 'Описание'}
                </h2>
                <p className="property-detail-sidebar__description-text">
                  {displayProperty.description}
                </p>
              </div>

              {/* Карта */}
              {displayProperty.coordinates && (
                <div className="property-detail-sidebar__map">
                  <h2 className="property-detail-sidebar__map-title">
                    {t('locationTitle') || 'Местоположение'}
                  </h2>
                  <div className="property-detail-sidebar__map-container">
                    <MapContainer
                      center={displayProperty.coordinates}
                      zoom={15}
                      style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                      scrollWheelZoom={true}
                      zoomControl={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={displayProperty.coordinates} />
                    </MapContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertyDetailClassic


