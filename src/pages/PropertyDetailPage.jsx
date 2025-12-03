import { useState, useRef, useEffect } from 'react'
import {
  FiArrowLeft,
  FiShare2,
  FiHeart,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi'
import {
  FaHeart as FaHeartSolid,
} from 'react-icons/fa'
import { IoLocationOutline } from 'react-icons/io5'
import { MdBed, MdOutlineBathtub } from 'react-icons/md'
import { BiArea } from 'react-icons/bi'
import '../App.css'
import './PropertyDetailPage.css'

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
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const thumbnailScrollRef = useRef(null)

  // Создаем массив изображений - если есть массив images, используем его, иначе создаем из одного изображения
  const images = property.images && property.images.length > 0 
    ? property.images 
    : property.image 
      ? [property.image]
      : ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80'] // Fallback изображение
  const currentImage = images[currentImageIndex] || images[0] || property.image

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
  const propertyInfo = `2-комн. квартира, ${property.sqft || 58} м², 9/10 этаж`

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
            <span>Назад</span>
          </button>
          <div className="property-detail-header__info">
            <span className="property-detail-header__path">Результаты поиска</span>
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
                alt={property.name}
                className="property-detail-gallery__main-image"
              />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="property-detail-gallery__nav property-detail-gallery__nav--prev"
                    onClick={handlePreviousImage}
                    aria-label="Предыдущее изображение"
                  >
                    <FiChevronLeft size={24} />
                  </button>
                  <button
                    type="button"
                    className="property-detail-gallery__nav property-detail-gallery__nav--next"
                    onClick={handleNextImage}
                    aria-label="Следующее изображение"
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
                  aria-label="Поделиться"
                >
                  <FiShare2 size={20} />
                </button>
                <button
                  type="button"
                  className={`property-detail-gallery__action-btn ${
                    isFavorite ? 'property-detail-gallery__action-btn--active' : ''
                  }`}
                  onClick={onToggleFavorite}
                  aria-label="Добавить в избранное"
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
                      <img src={img} alt={`${property.name} ${index + 1}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                <span>{property.location || 'Новгородская область, Великий Новгород, Большая Московская улица, 128/10'}</span>
              </div>

              {/* Характеристики */}
              <div className="property-detail-sidebar__features">
                <div className="property-detail-sidebar__feature">
                  <span className="property-detail-sidebar__feature-label">Площадь</span>
                  <span className="property-detail-sidebar__feature-value">{property.sqft || 58} м²</span>
                </div>
                <div className="property-detail-sidebar__feature">
                  <span className="property-detail-sidebar__feature-label">Комнат</span>
                  <span className="property-detail-sidebar__feature-value">{property.beds || 2}</span>
                </div>
                <div className="property-detail-sidebar__feature">
                  <span className="property-detail-sidebar__feature-label">Этаж</span>
                  <span className="property-detail-sidebar__feature-value">9/10</span>
                </div>
                <div className="property-detail-sidebar__feature">
                  <span className="property-detail-sidebar__feature-label">Продавец</span>
                  <span className="property-detail-sidebar__feature-value">РИЕЛТОР</span>
                </div>
                <div className="property-detail-sidebar__feature">
                  <span className="property-detail-sidebar__feature-label">ID</span>
                  <span className="property-detail-sidebar__feature-value">{property.id || '124809292'}</span>
                </div>
              </div>

              {/* Описание */}
              <div className="property-detail-sidebar__description">
                <h2 className="property-detail-sidebar__description-title">Описание</h2>
                <p className="property-detail-sidebar__description-text">
                  {property.description || 'Предлагается в аренду 2 комнатная светлая квартира в районе Ивушки на Большой Московской, д. 128/10. рядом с магазином Осень. (это плюс). Квартира с косметическим ремонтом, теплая. Из мебели и техники есть всё необходимое для проживания. Двухспальная тахта, двухспальный диван, стенка, прихожая, комод, кондиционер, стильная машина, холодильник, кухонный гарнитур.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Футер */}
      <footer className="footer">
        <div className="footer__container">
          <div className="footer__menu">
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link">Карта</button>
              <button type="button" className="footer__menu-link">Тарифы и цены</button>
              <button type="button" className="footer__menu-link">Аукцион</button>
            </div>
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link">Юридические документы</button>
              <button type="button" className="footer__menu-link">Реклама на сайте</button>
              <button type="button" className="footer__menu-link">Карьера в Sellyourbrick</button>
            </div>
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link">Поиск на карте</button>
              <button type="button" className="footer__menu-link">Продвижение</button>
              <button type="button" className="footer__menu-link">Сайт для инвесторов</button>
            </div>
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link">Аукцион</button>
              <button type="button" className="footer__menu-link">Вакансии агентов</button>
            </div>
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link">Реклама Sellyourbrick на ТВ</button>
              <button type="button" className="footer__menu-link">Помощь</button>
            </div>
            <div className="footer__menu-column">
              <button type="button" className="footer__menu-link">Программа «Суперагенты»</button>
              <button type="button" className="footer__menu-link">Ипотечный калькулятор</button>
            </div>
          </div>

          <div className="footer__description">
            <p className="footer__description-text">
              Sellyourbrick – база проверенных объявлений о продаже и аренде жилой, загородной и коммерческой недвижимости. Онлайн‑сервис №1 в России в категории «Недвижимость», по данным Similarweb на сентябрь 2023 г. Используя сервис, вы соглашаетесь с{' '}
              <button type="button" className="footer__description-link">Пользовательским соглашением</button>{' '}
              и{' '}
              <button type="button" className="footer__description-link">Политикой конфиденциальности</button>{' '}
              Sellyourbrick. Оплачивая услуги, вы принимаете{' '}
              <button type="button" className="footer__description-link">Лицензионное соглашение</button>.
            </p>
            <p className="footer__description-text">
              На информационном ресурсе применяются{' '}
              <button type="button" className="footer__description-link">Рекомендательные технологии</button>.
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
              <button type="button" className="footer__bottom-link">Мобильная версия сайта</button>
              <button type="button" className="footer__bottom-link">О приложении</button>
            </div>

            <div className="footer__store-buttons">
              <button
                type="button"
                className="footer__store-btn"
                aria-label="Скачать из Google Play"
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
                  <span className="footer__store-label">Скачать из</span>
                  <span className="footer__store-name">Google Play</span>
                </div>
              </button>

              <button
                type="button"
                className="footer__store-btn"
                aria-label="Загрузите в App Store"
              >
                <div className="footer__store-icon footer__store-icon--ios">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                </div>
                <div className="footer__store-text">
                  <span className="footer__store-label">Загрузите в</span>
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
                aria-label="Загрузите в AppGallery"
              >
                <div className="footer__store-icon footer__store-icon--appgallery">
                  <span>Huawei</span>
                </div>
                <div className="footer__store-text">
                  <span className="footer__store-label">Загрузите в</span>
                  <span className="footer__store-name">AppGallery</span>
                </div>
              </button>
            </div>

            <div className="footer__age-badge">0+</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PropertyDetailPage
