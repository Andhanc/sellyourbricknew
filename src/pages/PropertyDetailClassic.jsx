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

  // Ровно 6 изображений для галереи: если меньше — дублируем, если больше — берём первые 6
  const galleryImages =
    images.length >= 6
      ? images.slice(0, 6)
      : Array.from({ length: 6 }, (_, index) => images[index % images.length])

  const currentImage = galleryImages[currentImageIndex] || galleryImages[0]

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))
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
              <img
                src={currentImage}
                alt={displayProperty.name}
                className="property-detail-gallery__main-image"
              />
              {galleryImages.length > 1 && (
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
                    {currentImageIndex + 1} / {galleryImages.length}
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

            {galleryImages.length > 0 && (
              <div className="property-detail-gallery__thumbnails-wrapper">
                <div className="property-detail-gallery__thumbnails" ref={thumbnailScrollRef}>
                  {galleryImages.map((img, index) => (
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
                      <img src={img} alt={`${displayProperty.name} ${index + 1}`} />
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

              <div className="property-detail-sidebar__features">
                <div className="property-detail-sidebar__feature">
                  <span className="property-detail-sidebar__feature-label">
                    {t('area') || 'Площадь'}
                  </span>
                  <span className="property-detail-sidebar__feature-value">
                    {displayProperty.sqft} м²
                  </span>
                </div>
                <div className="property-detail-sidebar__feature">
                  <span className="property-detail-sidebar__feature-label">
                    {t('roomsCount') || 'Комнат'}
                  </span>
                  <span className="property-detail-sidebar__feature-value">
                    {displayProperty.beds ?? 'Студия'}
                  </span>
                </div>
                <div className="property-detail-sidebar__feature">
                  <span className="property-detail-sidebar__feature-label">
                    {t('floorNumber') || 'Этаж'}
                  </span>
                  <span className="property-detail-sidebar__feature-value">
                    {displayProperty.floor}
                  </span>
                </div>
                <div className="property-detail-sidebar__feature">
                  <span className="property-detail-sidebar__feature-label">
                    {t('seller') || 'Продавец'}
                  </span>
                  <span className="property-detail-sidebar__feature-value">
                    {displayProperty.seller}
                  </span>
                </div>
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


