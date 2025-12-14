import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  FiBell,
  FiSearch,
  FiChevronDown,
  FiX,
  FiMenu,
  FiUser,
  FiPhone,
  FiMail,
} from 'react-icons/fi'
import { FaInstagram, FaWhatsapp } from 'react-icons/fa'
import { IoLocationOutline } from 'react-icons/io5'
import { properties } from '../data/properties'
import LoginModal from './LoginModal'
import '../pages/MainPage.css'

const resortLocations = [
  'Costa Adeje, Tenerife',
  'Playa de las Américas, Tenerife',
  'Los Cristianos, Tenerife',
  'Puerto de la Cruz, Tenerife',
  'Santa Cruz de Tenerife, Tenerife',
  'La Laguna, Tenerife',
  'San Cristóbal de La Laguna, Tenerife',
  'Golf del Sur, Tenerife',
  'Callao Salvaje, Tenerife',
  'El Médano, Tenerife',
]

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const [selectedLocation, setSelectedLocation] = useState(resortLocations[0])
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const locationRef = useRef(null)
  const notificationRef = useRef(null)
  const menuRef = useRef(null)
  const searchInputRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setIsLocationOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (isMenuOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isMenuOpen])

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  const handleLocationSelect = (location) => {
    setSelectedLocation(location)
    setIsLocationOpen(false)
  }

  const handleProfileClick = () => {
    // Если мы на главной странице, открываем модальное окно входа
    if (location.pathname === '/') {
      setIsLoginModalOpen(true)
    } else {
      // Иначе переходим на страницу профиля
      navigate('/profile')
    }
  }

  const firstProperty = properties[0] || {
    id: 1,
    title: 'Квартира',
    location: 'Москва',
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80']
  }

  return (
    <>
      {/* Новый хедер для десктопной версии */}
      <header className={`new-header ${isMenuOpen ? 'new-header--menu-open' : ''}`}>
        <div className={`new-header__container ${isMenuOpen ? 'new-header__container--menu-open' : ''}`}>
          <div className="new-header__left">
            <div className="new-header__location">
              <span className="new-header__location-icon">
                <IoLocationOutline size={20} />
              </span>
              <div className="new-header__location-info" ref={locationRef}>
                <span className="new-header__location-label">{t('location')}</span>
                <button
                  type="button"
                  className="new-header__location-select"
                  onClick={() => setIsLocationOpen((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={isLocationOpen}
                >
                  <span className="new-header__location-value">{selectedLocation}</span>
                  <FiChevronDown
                    size={16}
                    className={`new-header__location-select-icon ${
                      isLocationOpen ? 'new-header__location-select-icon--open' : ''
                    }`}
                  />
                </button>
                {isLocationOpen && (
                  <div className="new-header__location-dropdown">
                    {resortLocations.map((location) => (
                      <button
                        type="button"
                        className={`new-header__location-option ${
                          location === selectedLocation ? 'new-header__location-option--active' : ''
                        }`}
                        key={location}
                        onClick={() => handleLocationSelect(location)}
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className={`new-header__menu-wrapper ${isMenuOpen ? 'new-header__menu-wrapper--active' : ''}`} ref={menuRef}>
              <button 
                className={`new-header__menu-btn ${isMenuOpen ? 'new-header__menu-btn--active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setIsMenuOpen((prev) => !prev)
                }}
                aria-label="Меню"
                aria-expanded={isMenuOpen}
              >
                <FiMenu size={20} className="new-header__menu-icon" />
                <span>Меню</span>
              </button>
            </div>
            
            {/* Модальное окно меню */}
            {isMenuOpen && (
              <>
                <div 
                  className="menu-backdrop"
                  onClick={(e) => {
                    const menuBtn = menuRef.current?.querySelector('.new-header__menu-btn')
                    const menuDropdown = document.querySelector('.menu-dropdown')
                    
                    if (menuBtn && menuBtn.contains(e.target)) {
                      return
                    }
                    
                    if (menuDropdown && menuDropdown.contains(e.target)) {
                      return
                    }
                    
                    setIsMenuOpen(false)
                  }}
                />
                <div 
                  className="menu-dropdown" 
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="menu-dropdown__content">
                    <div className="menu-dropdown__columns">
                      <div className="menu-dropdown__column">
                        <button className="menu-dropdown__item">
                          <span>Недвижимость</span>
                        </button>
                        <button className="menu-dropdown__item">
                          <span>Покупка</span>
                        </button>
                        <button className="menu-dropdown__item">
                          <span>Аренда</span>
                        </button>
                        <button className="menu-dropdown__item">
                          <span>Продажа</span>
                        </button>
                        <button 
                          className="menu-dropdown__item"
                          onClick={() => {
                            navigate('/profile')
                            setIsMenuOpen(false)
                          }}
                        >
                          <span>Профиль</span>
                        </button>
                        <button className="menu-dropdown__item">
                          <span>Карты</span>
                        </button>
                        <button className="menu-dropdown__item">
                          <span>Вклады</span>
                        </button>
                        <button className="menu-dropdown__item">
                          <span>Инвестиции</span>
                        </button>
                        <button className="menu-dropdown__item">
                          <span>Платежи</span>
                        </button>
                      </div>
                      <div className="menu-dropdown__column">
                        <button className="menu-dropdown__item">
                          <span>Премиум</span>
                        </button>
                        <button className="menu-dropdown__item">
                          <span>Бонусы</span>
                        </button>
                        <button className="menu-dropdown__item">
                          <span>Поддержка</span>
                        </button>
                        <button className="menu-dropdown__item">
                          <span>Приложения</span>
                        </button>
                        <button className="menu-dropdown__item">
                          <span>Автолюбителям</span>
                        </button>
                        <button className="menu-dropdown__item">
                          <span>Страхование</span>
                        </button>
                        <button className="menu-dropdown__item">
                          <span>Курсы валют</span>
                        </button>
                        <button className="menu-dropdown__item">
                          <span>Офисы и банкоматы</span>
                        </button>
                        <button className="menu-dropdown__item">
                          <span>Переводы</span>
                        </button>
                      </div>
                    </div>
                    <div className="menu-dropdown__right">
                      <div className="menu-dropdown__icons">
                        <a 
                          href="https://instagram.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="menu-dropdown__icon-item"
                        >
                          <div className="menu-dropdown__icon-box menu-dropdown__icon-box--instagram">
                            <FaInstagram size={24} />
                          </div>
                          <span className="menu-dropdown__icon-label">Instagram</span>
                        </a>
                        <a 
                          href="https://wa.me" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="menu-dropdown__icon-item"
                        >
                          <div className="menu-dropdown__icon-box menu-dropdown__icon-box--whatsapp">
                            <FaWhatsapp size={24} />
                          </div>
                          <span className="menu-dropdown__icon-label">WhatsApp</span>
                        </a>
                        <a 
                          href="mailto:info@example.com" 
                          className="menu-dropdown__icon-item"
                        >
                          <div className="menu-dropdown__icon-box menu-dropdown__icon-box--gmail">
                            <FiMail size={24} />
                          </div>
                          <span className="menu-dropdown__icon-label">Email</span>
                        </a>
                        <a 
                          href="tel:+1234567890" 
                          className="menu-dropdown__icon-item"
                        >
                          <div className="menu-dropdown__icon-box menu-dropdown__icon-box--phone">
                            <FiPhone size={24} />
                          </div>
                          <span className="menu-dropdown__icon-label">Позвонить</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="new-header__filters">
            <button
              type="button"
              className={`new-header__filter-btn ${location.pathname === '/main' ? 'new-header__filter-btn--active' : ''}`}
              onClick={() => navigate('/main')}
            >
              <span>Главная</span>
            </button>
            <button
              type="button"
              className={`new-header__filter-btn ${location.pathname === '/chat' ? 'new-header__filter-btn--active' : ''}`}
              onClick={() => navigate('/chat')}
            >
              <span>{t('chat')}</span>
            </button>
            <button
              type="button"
              className={`new-header__filter-btn ${location.pathname === '/favorites' ? 'new-header__filter-btn--active' : ''}`}
              onClick={() => navigate('/favorites')}
            >
              <span>{t('favorites')}</span>
            </button>
            <button
              type="button"
              className={`new-header__filter-btn ${location.pathname === '/map' ? 'new-header__filter-btn--active' : ''}`}
              onClick={() => navigate('/map')}
            >
              <span>{t('map')}</span>
            </button>
          </div>

          <div className="new-header__right" ref={notificationRef}>
            {isSearchOpen ? (
              <div className="new-header__search-field">
                <FiSearch size={18} className="new-header__search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t('search') || 'Поиск...'}
                  className="new-header__search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsSearchOpen(false)
                      setSearchQuery('')
                    }
                  }}
                />
                <button
                  type="button"
                  className="new-header__search-close"
                  onClick={() => {
                    setIsSearchOpen(false)
                    setSearchQuery('')
                  }}
                  aria-label="Закрыть поиск"
                >
                  <FiX size={18} />
                </button>
              </div>
            ) : (
              <>
                <button 
                  className="new-header__search-btn"
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Открыть поиск"
                >
                  <FiSearch size={20} />
                </button>
                <button 
                  type="button"
                  className="new-header__auction-btn"
                  onClick={() => navigate('/')}
                >
                  {t('auction')}
                </button>
                <button 
                  className="new-header__user-btn"
                  onClick={handleProfileClick}
                >
                  <FiUser size={20} />
                </button>
                <button 
                  type="button" 
                  className="new-header__notification-btn"
                  onClick={() => setIsNotificationOpen((prev) => !prev)}
                  aria-expanded={isNotificationOpen}
                >
                  <FiBell size={20} />
                  <span className="new-header__notification-indicator" />
                </button>
              </>
            )}
            {isNotificationOpen && (
              <>
                <div 
                  className="notification-backdrop"
                  onClick={() => setIsNotificationOpen(false)}
                />
                <div className="notification-panel">
                  <div className="notification-panel__content">
                    <div className="notification-panel__header">
                      <h3 className="notification-panel__title">Уведомления</h3>
                      <button 
                        type="button" 
                        className="notification-panel__close"
                        onClick={() => setIsNotificationOpen(false)}
                        aria-label="Закрыть уведомления"
                      >
                        <FiX size={20} />
                      </button>
                    </div>
                    <div className="notification-panel__list">
                      <div className="notification-item notification-item--property">
                        <div className="notification-item__content">
                          <h4 className="notification-item__title">{t('foundProperty') || 'Нашли для вас объявление!'}</h4>
                          <div className="notification-item__property">
                            <div className="notification-item__image">
                              <img 
                                src={firstProperty.images[0]}
                                alt={firstProperty.title}
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80'
                                }}
                              />
                            </div>
                            <div className="notification-item__info">
                              <p className="notification-item__property-name">{firstProperty.title}</p>
                              <p className="notification-item__property-location">{firstProperty.location}</p>
                              <button 
                                type="button" 
                                className="notification-item__button"
                                onClick={() => {
                                  setIsNotificationOpen(false)
                                  navigate(`/property/${firstProperty.id}`)
                                }}
                              >
                                {t('goTo') || 'Перейти'}
                                <FiChevronDown size={18} style={{ transform: 'rotate(-90deg)' }} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      
      {/* Модальное окно входа/регистрации */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </>
  )
}

export default Header

