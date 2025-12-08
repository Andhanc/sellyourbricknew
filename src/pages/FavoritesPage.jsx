import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FaHeart as FaHeartSolid } from 'react-icons/fa'
import { FiHeart, FiArrowLeft, FiHome } from 'react-icons/fi'
import { MdBed, MdOutlineBathtub } from 'react-icons/md'
import { BiArea } from 'react-icons/bi'
import { IoLocationOutline } from 'react-icons/io5'
import './FavoritesPage.css'
import '../App.css'

function FavoritesPage({
  favoriteProperties,
  onToggleFavorite,
  onPropertyClick,
  navigationItems,
  activeNav,
  onNavChange,
  recommendedProperties,
  nearbyProperties,
  apartmentsData,
  villasData,
  propertyMode,
}) {
  const handleBackToHome = () => {
    onNavChange('home')
  }
  const { t, i18n } = useTranslation()

  // Собираем все избранные объявления
  const favoriteItems = useMemo(() => {
    const allProperties = [
      ...recommendedProperties.map((p) => ({ ...p, category: 'recommended' })),
      ...nearbyProperties.map((p) => ({ ...p, category: 'nearby' })),
      ...apartmentsData.map((p) => ({ ...p, category: 'apartment' })),
      ...villasData.map((p) => ({ ...p, category: 'villa' })),
    ]

    return allProperties.filter((property) => {
      const key = `${property.category}-${property.id}`
      return favoriteProperties.get(key) === true
    })
  }, [favoriteProperties, recommendedProperties, nearbyProperties, apartmentsData, villasData])


  return (
    <div className="favorites-page">
      {/* Заголовок страницы */}
      <div className="favorites-page__header">
        <div className="favorites-page__header-content">
          <button
            type="button"
            className="favorites-page__back-btn"
            onClick={handleBackToHome}
            aria-label={t('back') || 'Назад'}
          >
            <FiArrowLeft size={20} />
            <span>{t('back') || 'Назад'}</span>
          </button>
          <div className="favorites-page__title-section">
            <h1 className="favorites-page__title">
              <FaHeartSolid className="favorites-page__title-icon" />
              {t('favorites') || 'Понравившиеся'}
            </h1>
            <p className="favorites-page__subtitle">
              {favoriteItems.length === 0
                ? t('noFavorites') || 'У вас пока нет избранных объявлений'
                : `${favoriteItems.length} ${favoriteItems.length === 1 ? t('property') || 'объявление' : t('properties') || 'объявлений'}`}
            </p>
          </div>
        </div>
      </div>

      {/* Контент страницы */}
      <div className="favorites-page__content">
        {favoriteItems.length === 0 ? (
          <div className="favorites-page__empty">
            <div className="favorites-page__empty-icon">
              <FiHeart size={64} />
            </div>
            <h2 className="favorites-page__empty-title">
              {t('noFavoritesTitle') || 'Список избранного пуст'}
            </h2>
            <p className="favorites-page__empty-text">
              {t('noFavoritesText') ||
                'Добавляйте объявления в избранное, нажимая на иконку сердца'}
            </p>
          </div>
        ) : (
          <div className="favorites-page__grid">
            {favoriteItems.map((property) => {
              const key = `${property.category}-${property.id}`
              const isFavorite = favoriteProperties.get(key)

              return (
                <article
                  key={key}
                  className="favorites-page__card"
                  onClick={() => onPropertyClick(property.category, property.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="favorites-page__card-image">
                    <img
                      src={property.image}
                      alt={property.name}
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'
                      }}
                    />
                    <button
                      type="button"
                      className={`favorites-page__card-favorite ${
                        isFavorite ? 'favorites-page__card-favorite--active' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleFavorite(property.category, property.id)
                      }}
                      aria-pressed={isFavorite}
                    >
                      {isFavorite ? <FaHeartSolid size={20} /> : <FiHeart size={20} />}
                    </button>
                    {property.isAuction && (
                      <div className="favorites-page__card-auction-badge">
                        {t('auction') || 'Аукцион'}
                      </div>
                    )}
                  </div>

                  <div className="favorites-page__card-content">
                    <div className="favorites-page__card-header">
                      <span className="favorites-page__card-badge">
                        {property.tag || property.category}
                      </span>
                      <div className="favorites-page__card-price">
                        <span className="favorites-page__card-price-amount">
                          {propertyMode === 'rent'
                            ? `$${property.price.toLocaleString('ru-RU')}`
                            : `$${(property.price * 240).toLocaleString('ru-RU')}`}
                        </span>
                        {propertyMode === 'rent' && (
                          <span className="favorites-page__card-price-period">/Month</span>
                        )}
                      </div>
                    </div>

                    <h3 className="favorites-page__card-title">{property.name}</h3>

                    <div className="favorites-page__card-location">
                      <IoLocationOutline size={16} />
                      <span>{property.location}</span>
                    </div>

                    <div className="favorites-page__card-info">
                      <div className="favorites-page__card-info-item">
                        <MdBed size={18} />
                        <span>{property.beds || 0}</span>
                      </div>
                      <div className="favorites-page__card-info-item">
                        <MdOutlineBathtub size={18} />
                        <span>{property.baths || 0}</span>
                      </div>
                      <div className="favorites-page__card-info-item">
                        <BiArea size={18} />
                        <span>{property.sqft || 0} м²</span>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {navigationItems.map((item, index) => {
          const IconComponent = item.icon
          const isCenter = index === 2
          const isActive = activeNav === item.id

          if (isCenter) {
            return (
              <button
                type="button"
                className={`bottom-nav__center ${isActive ? 'bottom-nav__center--active' : ''}`}
                key={`${item.id}-${i18n.language}`}
                onClick={() => onNavChange(item.id)}
                aria-label={item.label}
              >
                <IconComponent size={28} />
              </button>
            )
          }

          return (
            <button
              type="button"
              className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
              key={`${item.id}-${i18n.language}`}
              onClick={() => onNavChange(item.id)}
              aria-label={item.label}
            >
              <IconComponent size={26} />
            </button>
          )
        })}
      </nav>

      {/* Футер */}
      <footer className="footer">
        <div className="footer__container">
          <div className="footer__menu">
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link">
                {t('mapLink')}
              </button>
              <button type="button" className="footer__menu-link">
                {t('tariffs')}
              </button>
              <button type="button" className="footer__menu-link">
                {t('auction')}
              </button>
            </div>
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link">
                {t('legalDocs')}
              </button>
              <button type="button" className="footer__menu-link">
                {t('advertising')}
              </button>
              <button type="button" className="footer__menu-link">
                {t('career')}
              </button>
            </div>
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link">
                {t('mapSearch')}
              </button>
              <button type="button" className="footer__menu-link">
                {t('promotion')}
              </button>
              <button type="button" className="footer__menu-link">
                {t('investors')}
              </button>
            </div>
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link">
                {t('auction')}
              </button>
              <button type="button" className="footer__menu-link">
                {t('vacancies')}
              </button>
            </div>
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link">
                {t('tvAdvertising')}
              </button>
              <button type="button" className="footer__menu-link">
                {t('help')}
              </button>
            </div>
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link">
                {t('superAgents')}
              </button>
              <button type="button" className="footer__menu-link">
                {t('mortgage')}
              </button>
            </div>
          </div>

          <div className="footer__description">
            <p className="footer__description-text">
              {t('footerDescription')}{' '}
              <button type="button" className="footer__description-link">
                {t('userAgreementLink')}
              </button>{' '}
              {t('and')}{' '}
              <button type="button" className="footer__description-link">
                {t('privacyPolicyLink')}
              </button>{' '}
              Sellyourbrick. {t('payingForServices')}{' '}
              <button type="button" className="footer__description-link">
                {t('licenseAgreement')}
              </button>
              .
            </p>
            <p className="footer__description-text">
              {t('recommendationTechDescription')}{' '}
              <button type="button" className="footer__description-link">
                {t('recommendationTech')}
              </button>
              .
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
              <button type="button" className="footer__bottom-link">
                {t('mobileVersion')}
              </button>
              <button type="button" className="footer__bottom-link">
                {t('aboutApp')}
              </button>
            </div>

            <div className="footer__store-buttons">
              <button
                type="button"
                className="footer__store-btn"
                aria-label={`${t('downloadFrom')} Google Play`}
              >
                <div className="footer__store-icon footer__store-icon--google">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12Z"
                      fill="#EA4335"
                    />
                    <path d="M6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" fill="#FBBC04" />
                    <path
                      d="M16.81 8.88L20.16 6.51C20.66 6.26 21 5.75 21 5.16V18.84C21 18.25 20.66 17.74 20.16 17.49L16.81 15.12L14.54 12.85L16.81 8.88Z"
                      fill="#34A853"
                    />
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
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                </div>
                <div className="footer__store-text">
                  <span className="footer__store-label">{t('downloadIn')}</span>
                  <span className="footer__store-name">App Store</span>
                </div>
              </button>

              <button type="button" className="footer__store-btn" aria-label="RuStore">
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
          </div>
        </div>
      </footer>
    </div>
  )
}

export default FavoritesPage

