import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FiArrowLeft,
  FiShare2,
  FiHeart,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiCheck,
} from 'react-icons/fi'
import {
  FaHeart as FaHeartSolid,
} from 'react-icons/fa'
import { IoLocationOutline } from 'react-icons/io5'
import { MdBed, MdOutlineBathtub } from 'react-icons/md'
import { BiArea } from 'react-icons/bi'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '../App.css'
import './PropertyDetailPage.css'

// Фикс для иконок Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Компонент для центрирования карты
function CenterMap({ position, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.setView(position, zoom || 15)
    }
  }, [position, zoom, map])
  return null
}

function PropertyDetailPage({
  property,
  isFavorite,
  onBack,
  onToggleFavorite,
  onShare,
  onBookNow,
  onCallBroker,
  onChatBroker,
  navigationItems,
  activeNav,
  onNavChange,
  language = 'ru',
  onLanguageChange,
}) {
  const { t, i18n } = useTranslation()
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false)
  const languageDropdownRef = useRef(null)
  
  // Автоматический перевод пользовательского контента отключен из-за лимитов API
  // Используем исходное свойство
  const displayProperty = property

  const languages = [
    { code: 'ru', name: 'Русский', flagClass: 'footer__flag--ru' },
    { code: 'en', name: 'English', flagClass: 'footer__flag--gb' },
    { code: 'de', name: 'Deutsch', flagClass: 'footer__flag--de' },
    { code: 'es', name: 'Español', flagClass: 'footer__flag--es' },
    { code: 'fr', name: 'Français', flagClass: 'footer__flag--fr' },
    { code: 'sv', name: 'Svenska', flagClass: 'footer__flag--sv' },
  ]

  const handleLanguageSelect = async (langCode) => {
    await i18n.changeLanguage(langCode)
    if (onLanguageChange) {
      onLanguageChange(langCode)
    }
    setIsLanguageDropdownOpen(false)
  }

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  // Закрытие выпадающего списка при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setIsLanguageDropdownOpen(false)
      }
    }

    if (isLanguageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isLanguageDropdownOpen])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const thumbnailScrollRef = useRef(null)

  // Создаем массив изображений - если есть массив images, используем его, иначе создаем из одного изображения
  const images = displayProperty.images && displayProperty.images.length > 0 
    ? displayProperty.images 
    : displayProperty.image 
      ? [displayProperty.image]
      : ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80'] // Fallback изображение
  const currentImage = images[currentImageIndex] || images[0] || displayProperty.image

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }

  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index)
    // Прокручиваем к активной миниатюре
    if (thumbnailScrollRef.current) {
      const thumbnail = thumbnailScrollRef.current.children[index]
      if (thumbnail) {
        thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }


  // Автоматическая прокрутка к активной миниатюре при изменении через стрелки
  useEffect(() => {
    if (thumbnailScrollRef.current) {
      const thumbnail = thumbnailScrollRef.current.children[currentImageIndex]
      if (thumbnail) {
        thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [currentImageIndex])

  // Формируем информацию о квартире для заголовка
  const propertyInfo = `2${t('rooms')} квартира, ${displayProperty.sqft || 58} ${t('squareMeters')}, 9/10 ${t('floor')}`

  return (
    <div className="property-detail-page-new">
      {/* Заголовок */}
      <div className="property-detail-header">
        <div className="property-detail-header__container">
          <button
            type="button"
            className="property-detail-header__back"
            onClick={onBack}
          >
            <FiArrowLeft size={20} />
            <span>{t('back')}</span>
          </button>
          <div className="property-detail-header__info">
            <span className="property-detail-header__path">{t('searchResults')}</span>
            <span className="property-detail-header__separator">/</span>
            <span className="property-detail-header__property">{propertyInfo}</span>
          </div>
        </div>
      </div>

      {/* Основной контент - две колонки */}
      <div className="property-detail-main">
        <div className="property-detail-main__container">
          {/* Левая колонка - Галерея */}
          <div className="property-detail-gallery">
            <div className="property-detail-gallery__main">
              <img
                src={currentImage}
                alt={displayProperty.name}
                className="property-detail-gallery__main-image"
              />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="property-detail-gallery__nav property-detail-gallery__nav--prev"
                    onClick={handlePreviousImage}
                    aria-label={t('previousImage')}
                  >
                    <FiChevronLeft size={24} />
                  </button>
                  <button
                    type="button"
                    className="property-detail-gallery__nav property-detail-gallery__nav--next"
                    onClick={handleNextImage}
                    aria-label={t('nextImage')}
                  >
                    <FiChevronRight size={24} />
                  </button>
                  <div className="property-detail-gallery__counter">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
              <div className="property-detail-gallery__actions">
                <button
                  type="button"
                  className="property-detail-gallery__action-btn"
                  onClick={onShare}
                  aria-label={t('share')}
                >
                  <FiShare2 size={20} />
                </button>
                <button
                  type="button"
                  className={`property-detail-gallery__action-btn ${
                    isFavorite ? 'property-detail-gallery__action-btn--active' : ''
                  }`}
                  onClick={onToggleFavorite}
                  aria-label={t('addToFavorites')}
                >
                  {isFavorite ? <FaHeartSolid size={20} /> : <FiHeart size={20} />}
                </button>
              </div>
            </div>

            {/* Миниатюры */}
            {images.length > 1 && (
              <div className="property-detail-gallery__thumbnails-wrapper">
                <div 
                  className="property-detail-gallery__thumbnails"
                  ref={thumbnailScrollRef}
                >
                  {images.map((img, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`property-detail-gallery__thumbnail ${
                        currentImageIndex === index ? 'property-detail-gallery__thumbnail--active' : ''
                      }`}
                      onClick={() => handleThumbnailClick(index)}
                    >
                      <img src={img} alt={`${displayProperty.name} ${index + 1}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Кнопки действий */}
            <div className="property-detail-gallery__action-buttons">
              <button
                type="button"
                className="property-detail-gallery__buy-btn"
                onClick={onBookNow}
              >
                {t('buyNow')}
              </button>
              {property.isAuction && (
                <button
                  type="button"
                  className="property-detail-gallery__test-drive-btn"
                  onClick={() => alert(t('testDriveAvailable'))}
                >
                  {t('testDrive')}
                </button>
              )}
            </div>
          </div>

          {/* Правая колонка - Информация */}
          <div className="property-detail-sidebar">
            {/* Основная информация */}
            <div className="property-detail-sidebar__content">
              <h1 className="property-detail-sidebar__title">
                {propertyInfo}
              </h1>
              
              <div className="property-detail-sidebar__location">
                <IoLocationOutline size={18} />
                <span>{displayProperty.location || 'Новгородская область, Великий Новгород, Большая Московская улица, 128/10'}</span>
              </div>

              {/* Характеристики */}
              <div className="property-detail-sidebar__features">
                <div className="property-detail-sidebar__feature">
                  <span className="property-detail-sidebar__feature-label">{t('area')}</span>
                  <span className="property-detail-sidebar__feature-value">{displayProperty.sqft || 58} {t('squareMeters')}</span>
                </div>
                <div className="property-detail-sidebar__feature">
                  <span className="property-detail-sidebar__feature-label">{t('roomsCount')}</span>
                  <span className="property-detail-sidebar__feature-value">{displayProperty.beds || 2}</span>
                </div>
                <div className="property-detail-sidebar__feature">
                  <span className="property-detail-sidebar__feature-label">{t('floorNumber')}</span>
                  <span className="property-detail-sidebar__feature-value">9/10</span>
                </div>
                <div className="property-detail-sidebar__feature">
                  <span className="property-detail-sidebar__feature-label">{t('seller')}</span>
                  <span className="property-detail-sidebar__feature-value">
                    {displayProperty.owner?.firstName && displayProperty.owner?.lastName
                      ? `${displayProperty.owner.firstName} ${displayProperty.owner.lastName}`
                      : displayProperty.broker?.name || t('defaultSeller') || 'Александр Иванов'}
                  </span>
                </div>
              </div>

              {/* Описание */}
              <div className="property-detail-sidebar__description">
                <h2 className="property-detail-sidebar__description-title">{t('description')}</h2>
                <p className="property-detail-sidebar__description-text">
                  {displayProperty.description || 'Предлагается в аренду 2 комнатная светлая квартира в районе Ивушки на Большой Московской, д. 128/10. рядом с магазином Осень. (это плюс). Квартира с косметическим ремонтом, теплая. Из мебели и техники есть всё необходимое для проживания. Двухспальная тахта, двухспальный диван, стенка, прихожая, комод, кондиционер, стильная машина, холодильник, кухонный гарнитур.'}
                </p>
              </div>

              {/* Карта */}
              {property.coordinates && (
                <div className="property-detail-sidebar__map">
                  <h2 className="property-detail-sidebar__map-title">{t('locationTitle')}</h2>
                  <div className="property-detail-sidebar__map-container">
                    <MapContainer
                      center={property.coordinates}
                      zoom={15}
                      style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                      scrollWheelZoom={true}
                      zoomControl={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <CenterMap position={property.coordinates} zoom={15} />
                      <Marker position={property.coordinates} />
                    </MapContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Футер */}
      <footer className="footer">
        <div className="footer__container">
          <div className="footer__menu">
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link">{t('mapLink')}</button>
              <button type="button" className="footer__menu-link">{t('tariffs')}</button>
              <button type="button" className="footer__menu-link">{t('auction')}</button>
            </div>
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link">{t('legalDocs')}</button>
              <button type="button" className="footer__menu-link">{t('advertising')}</button>
              <button type="button" className="footer__menu-link">{t('career')}</button>
            </div>
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link">{t('mapSearch')}</button>
              <button type="button" className="footer__menu-link">{t('promotion')}</button>
              <button type="button" className="footer__menu-link">{t('investors')}</button>
            </div>
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link">{t('auction')}</button>
              <button type="button" className="footer__menu-link">{t('vacancies')}</button>
            </div>
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link">{t('tvAdvertising')}</button>
              <button type="button" className="footer__menu-link">{t('help')}</button>
            </div>
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link">{t('superAgents')}</button>
              <button type="button" className="footer__menu-link">{t('mortgage')}</button>
            </div>
          </div>

          <div className="footer__description">
            <p className="footer__description-text">
              {t('footerDescription')}{' '}
              <button type="button" className="footer__description-link">{t('userAgreementLink')}</button>{' '}
              {t('and')}{' '}
              <button type="button" className="footer__description-link">{t('privacyPolicyLink')}</button>{' '}
              Sellyourbrick. {t('payingForServices')}{' '}
              <button type="button" className="footer__description-link">{t('licenseAgreement')}</button>.
            </p>
            <p className="footer__description-text">
              {t('recommendationTechDescription')}{' '}
              <button type="button" className="footer__description-link">{t('recommendationTech')}</button>.
            </p>
          </div>

          <div className="footer__bottom">
            <div className="footer__brand">
              <div className="footer__brand-icon">
                <span className="footer__brand-house" />
              </div>
              <span className="footer__brand-text">Sellyourbrick</span>
            </div>

            <div className="footer__bottom-links">
              <button type="button" className="footer__bottom-link">{t('mobileVersion')}</button>
              <button type="button" className="footer__bottom-link">{t('aboutApp')}</button>
            </div>

            <div className="footer__store-buttons">
              <button
                type="button"
                className="footer__store-btn"
                aria-label={`${t('downloadFrom')} Google Play`}
              >
                <div className="footer__store-icon footer__store-icon--google">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5Z" fill="#4285F4"/>
                    <path d="M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12Z" fill="#EA4335"/>
                    <path d="M6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" fill="#FBBC04"/>
                    <path d="M16.81 8.88L20.16 6.51C20.66 6.26 21 5.75 21 5.16V18.84C21 18.25 20.66 17.74 20.16 17.49L16.81 15.12L14.54 12.85L16.81 8.88Z" fill="#34A853"/>
                  </svg>
                </div>
                <div className="footer__store-text">
                  <span className="footer__store-label">{t('downloadFrom')}</span>
                  <span className="footer__store-name">Google Play</span>
                </div>
              </button>

              <button
                type="button"
                className="footer__store-btn"
                aria-label={`${t('downloadIn')} App Store`}
              >
                <div className="footer__store-icon footer__store-icon--ios">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                </div>
                <div className="footer__store-text">
                  <span className="footer__store-label">{t('downloadIn')}</span>
                  <span className="footer__store-name">App Store</span>
                </div>
              </button>

              <button
                type="button"
                className="footer__store-btn"
                aria-label="RuStore"
              >
                <div className="footer__store-icon footer__store-icon--rustore">
                  <span>Ru</span>
                </div>
                <div className="footer__store-text">
                  <span className="footer__store-name">RuStore</span>
                </div>
              </button>

              <button
                type="button"
                className="footer__store-btn"
                aria-label={`${t('downloadIn')} AppGallery`}
              >
                <div className="footer__store-icon footer__store-icon--appgallery">
                  <span>Huawei</span>
                </div>
                <div className="footer__store-text">
                  <span className="footer__store-label">{t('downloadIn')}</span>
                  <span className="footer__store-name">AppGallery</span>
                </div>
              </button>
            </div>

            <div className="footer__language-selector" ref={languageDropdownRef}>
              <button
                type="button"
                className="footer__language-selector-btn"
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                aria-label={t('selectLanguage')}
              >
                <span className={`footer__language-flag ${currentLanguage.flagClass}`}></span>
                <span className="footer__language-name">{currentLanguage.name}</span>
                <FiChevronDown 
                  size={16} 
                  className={`footer__language-chevron ${isLanguageDropdownOpen ? 'footer__language-chevron--open' : ''}`}
                />
              </button>
              {isLanguageDropdownOpen && (
                <div className="footer__language-dropdown">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      className={`footer__language-option ${i18n.language === lang.code ? 'footer__language-option--active' : ''}`}
                      onClick={() => handleLanguageSelect(lang.code)}
                    >
                      <span className={`footer__language-flag ${lang.flagClass}`}></span>
                      <span className="footer__language-name">{lang.name}</span>
                      {i18n.language === lang.code && <FiCheck size={16} className="footer__language-check" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PropertyDetailPage
