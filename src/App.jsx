import { useEffect, useRef, useState } from 'react'
import './App.css'
import PropertyDetailPage from './pages/PropertyDetailPage'
import MapPage from './pages/MapPage'
import ProfilePage from './pages/ProfilePage'
import ChatListPage from './pages/ChatListPage'
import ChatPage from './pages/ChatPage'
import {
  FiBell,
  FiSearch,
  FiSliders,
  FiHeart,
  FiChevronDown,
  FiArrowRight,
  FiArrowLeft,
  FiShare2,
  FiX,
  FiSend,
  FiGlobe,
  FiPhone,
  FiMap,
} from 'react-icons/fi'
import {
  FaHome,
  FaHeart as FaHeartSolid,
  FaGavel,
  FaComment,
  FaUser,
  FaAndroid,
  FaApple,
  FaWhatsapp,
  FaInstagram,
  FaYoutube,
} from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { IoLocationOutline } from 'react-icons/io5'
import { MdBed, MdOutlineBathtub } from 'react-icons/md'
import { BiArea } from 'react-icons/bi'
import {
  PiHouseLine,
  PiBuildings,
  PiBuildingApartment,
  PiBuilding,
  PiWarehouse,
} from 'react-icons/pi'

const getPropertyTypes = (t) => [
  { label: 'House', displayLabel: t.house, icon: PiHouseLine },
  { label: 'Map', displayLabel: t.map, icon: FiMap, isMap: true },
  { label: 'Apartment', displayLabel: t.apartment, icon: PiBuildingApartment, image: '/apartment-icon.jpg' },
  { label: 'Villa', displayLabel: t.villa, icon: PiBuildings },
]

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

const getNavigationItems = (t) => [
  { id: 'home', label: t.home, icon: FaHome },
  { id: 'favourite', label: t.favorites, icon: FaHeartSolid },
  { id: 'auction', label: t.auction, icon: FaGavel },
  { id: 'chat', label: t.chat, icon: FaComment },
  { id: 'profile', label: t.profile, icon: FaUser },
]

const recommendedProperties = [
  {
    id: 1,
    tag: 'House',
    name: 'Lakeshore Blvd West',
    location: '70 Washington Square South, New York, NY 10012, United States',
    price: 797500,
    coordinates: [28.2916, -16.6291], // Costa Adeje, Tenerife
    image:
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
    ],
    beds: 2,
    baths: 2,
    sqft: 2000,
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    broker: {
      name: 'Muhammad Farhan',
      phone: '18392719103',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    },
  },
  {
    id: 2,
    tag: 'House',
    name: 'Eleanor Pena Property',
    location: 'Costa Adeje, Tenerife, Spain',
    price: 1200,
    coordinates: [28.1000, -16.7200], // Playa de las Américas, Tenerife
    image:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
    ],
    beds: 2,
    baths: 1,
    sqft: 1500,
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    broker: {
      name: 'Muhammad Farhan',
      phone: '18392719103',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    },
  },
]

const nearbyProperties = [
  {
    id: 1,
    tag: 'House',
    name: 'Bessie Cooper Property',
    location: 'Los Cristianos, Tenerife, Spain',
    price: 1000,
    coordinates: [28.0500, -16.7167], // Los Cristianos, Tenerife
    image:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
    ],
    beds: 2,
    baths: 2,
    sqft: 1800,
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    broker: {
      name: 'Muhammad Farhan',
      phone: '18392719103',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    },
  },
  {
    id: 2,
    tag: 'Apartment',
    name: 'Darrell Steward Property',
    location: 'Puerto de la Cruz, Tenerife, Spain',
    price: 980,
    coordinates: [28.4167, -16.5500], // Puerto de la Cruz, Tenerife
    image:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
    ],
    beds: 1,
    baths: 1,
    sqft: 1200,
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    broker: {
      name: 'Muhammad Farhan',
      phone: '18392719103',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    },
  },
]

function App() {
  const [selectedLocation, setSelectedLocation] = useState(resortLocations[0])
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [propertyMode, setPropertyMode] = useState('rent') // 'rent' для аренды, 'buy' для покупки
  const [favoriteProperties, setFavoriteProperties] = useState(() => {
    const initialFavorites = new Map()
    recommendedProperties.forEach((property) => {
      initialFavorites.set(`recommended-${property.id}`, false)
    })
    nearbyProperties.forEach((property) => {
      initialFavorites.set(`nearby-${property.id}`, false)
    })
    return initialFavorites
  })
  const [activeNav, setActiveNav] = useState('home')
  const [contactForm, setContactForm] = useState({
    email: '',
    fullName: '',
    message: '',
  })
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      text: 'Здравствуйте! Я ваш AI-консультант. Чем могу помочь?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [language, setLanguage] = useState('ru')
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [selectedChat, setSelectedChat] = useState(null)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [filteredProperties, setFilteredProperties] = useState(null)
  const locationRef = useRef(null)
  const chatMessagesRef = useRef(null)
  const notificationRef = useRef(null)

  const heroImages = {
    rent: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    buy: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
  }
  
  const heroImage = heroImages[propertyMode]

  const translations = {
    ru: {
      rent: 'Аренда',
      buy: 'Покупка',
      house: 'Дом',
      map: 'Карта',
      apartment: 'Апартаменты',
      villa: 'Вилла',
      home: 'Главная',
      favorites: 'Понравились',
      auction: 'Аукцион',
      chat: 'Чат',
      profile: 'Профиль',
      location: 'Локация',
      search: 'Поиск',
      recommended: 'Рекомендуемые',
      nearby: 'Поблизости',
      whatsapp: 'Перейти в WhatsApp',
      contactManager: 'Связаться с менеджером',
      downloadAndroid: 'Загрузите на',
      downloadIOS: 'Загрузите на',
      englishVersion: 'English version',
      russianVersion: 'Русская версия',
    },
    en: {
      rent: 'Rent',
      buy: 'Buy',
      house: 'House',
      map: 'Map',
      apartment: 'Apartment',
      villa: 'Villa',
      home: 'Home',
      favorites: 'Favorites',
      auction: 'Auction',
      chat: 'Chat',
      profile: 'Profile',
      location: 'Location',
      search: 'Search',
      recommended: 'Recommended',
      nearby: 'Nearby',
      whatsapp: 'Go to WhatsApp',
      contactManager: 'Contact Manager',
      downloadAndroid: 'Download on',
      downloadIOS: 'Download on',
      englishVersion: 'English version',
      russianVersion: 'Русская версия',
    },
  }

  const t = translations[language]

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


  const handleLocationSelect = (location) => {
    setSelectedLocation(location)
    setIsLocationOpen(false)
  }

  const toggleFavorite = (category, id) => {
    const key = `${category}-${id}`
    setFavoriteProperties((prev) => {
      const updated = new Map(prev)
      updated.set(key, !prev.get(key))
      return updated
    })
  }

  const handleContactFormChange = (e) => {
    const { name, value } = e.target
    setContactForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleContactFormSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', contactForm)
    setContactForm({
      email: '',
      fullName: '',
      message: '',
    })
    alert('Спасибо за обращение! Мы свяжемся с вами в ближайшее время.')
  }

  const toggleChat = () => {
    setIsChatOpen((prev) => !prev)
  }

  const handleChatInputChange = (e) => {
    setChatInput(e.target.value)
  }

  const handleChatSubmit = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMessage = chatInput.trim()
    setChatInput('')

    setChatMessages((prev) => {
      const newMessage = {
        id: prev.length + 1,
        text: userMessage,
        sender: 'user',
        timestamp: new Date(),
      }

      // Имитация ответа бота
      setTimeout(() => {
        setChatMessages((current) => {
          const botResponse = {
            id: current.length + 1,
            text: 'Спасибо за ваш вопрос! Я постараюсь помочь вам. Можете задать более подробный вопрос?',
            sender: 'bot',
            timestamp: new Date(),
          }
          return [...current, botResponse]
        })
      }, 1000)

      return [...prev, newMessage]
    })
  }

  useEffect(() => {
    if (chatMessagesRef.current && isChatOpen) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [chatMessages, isChatOpen])

  const handleLanguageChange = () => {
    setLanguage((prev) => (prev === 'ru' ? 'en' : 'ru'))
  }

  const handleCategoryClick = (categoryLabel) => {
    if (categoryLabel === 'Map') {
      setShowMap(true)
      setFilteredProperties(null)
      setActiveCategory(null)
      return
    }

    setIsLoading(true)
    setActiveCategory(categoryLabel)

    setTimeout(() => {
      // Фильтруем объявления по типу
      let filteredRecommended = recommendedProperties
      let filteredNearby = nearbyProperties

      if (categoryLabel === 'House') {
        // Фильтруем только дома
        filteredRecommended = recommendedProperties.filter((p) => 
          p.tag.toLowerCase() === 'house'
        )
        filteredNearby = nearbyProperties.filter((p) => 
          p.tag.toLowerCase() === 'house'
        )
      } else if (categoryLabel === 'Apartment') {
        filteredRecommended = recommendedProperties.filter((p) => 
          p.tag.toLowerCase() === 'apartment'
        )
        filteredNearby = nearbyProperties.filter((p) => 
          p.tag.toLowerCase() === 'apartment'
        )
      } else if (categoryLabel === 'Villa') {
        filteredRecommended = recommendedProperties.filter((p) => 
          p.tag.toLowerCase() === 'villa'
        )
        filteredNearby = nearbyProperties.filter((p) => 
          p.tag.toLowerCase() === 'villa'
        )
      }

      setFilteredProperties({
        recommended: filteredRecommended,
        nearby: filteredNearby,
      })
      setIsLoading(false)
    }, 2000)
  }

  const handleSocialLink = (platform) => {
    const links = {
      instagram: 'https://instagram.com/',
      whatsapp: 'https://wa.me/79991234567',
      youtube: 'https://youtube.com/',
      twitter: 'https://twitter.com/',
    }
    if (links[platform]) {
      window.open(links[platform], '_blank')
    }
  }

  const handleDownloadApp = (platform) => {
    if (platform === 'android') {
      window.open('https://play.google.com/store/apps', '_blank')
    } else if (platform === 'ios') {
      window.open('https://apps.apple.com/', '_blank')
    }
  }

  const handleWhatsApp = () => {
    window.open('https://wa.me/79991234567', '_blank')
  }

  const handleCallManager = () => {
    window.location.href = 'tel:+79991234567'
  }

  const handlePropertyClick = (category, propertyId) => {
    const allProperties = [
      ...recommendedProperties.map((p) => ({ ...p, category: 'recommended' })),
      ...nearbyProperties.map((p) => ({ ...p, category: 'nearby' })),
    ]
    const property = allProperties.find(
      (p) => p.category === category && p.id === propertyId
    )
    if (property) {
      setSelectedProperty(property)
    }
  }

  const handleBackClick = () => {
    setSelectedProperty(null)
  }

  const togglePropertyFavorite = () => {
    if (selectedProperty) {
      const key = `${selectedProperty.category}-${selectedProperty.id}`
      setFavoriteProperties((prev) => {
        const updated = new Map(prev)
        updated.set(key, !prev.get(key))
        return updated
      })
    }
  }

  const handleShare = () => {
    if (navigator.share && selectedProperty) {
      navigator
        .share({
          title: selectedProperty.name,
          text: selectedProperty.description,
          url: window.location.href,
        })
        .catch(() => {
          // Fallback если share не поддерживается
        })
    }
  }

  const handleBookNow = () => {
    // Обработчик бронирования
    alert('Функция бронирования будет реализована позже')
  }

  const handleCallBroker = () => {
    if (selectedProperty?.broker?.phone) {
      window.location.href = `tel:${selectedProperty.broker.phone}`
    }
  }

  const handleChatBroker = () => {
    // Обработчик чата с брокером
    alert('Чат с брокером будет реализован позже')
  }

  // Получаем все свойства для карты
  const allPropertiesForMap = [
    ...recommendedProperties.map((p) => ({ ...p, category: 'recommended' })),
    ...nearbyProperties.map((p) => ({ ...p, category: 'nearby' })),
  ]

  // Если показываем карту
  if (showMap) {
    return (
      <MapPage
        properties={allPropertiesForMap}
        onPropertyClick={handlePropertyClick}
        onBack={() => setShowMap(false)}
      />
    )
  }

  const navigationItems = getNavigationItems(t)

  // Если выбран чат, показываем страницу чата
  if (selectedChat) {
    return (
      <ChatPage
        chat={selectedChat}
        onBack={() => setSelectedChat(null)}
        navigationItems={navigationItems}
        activeNav={activeNav}
        onNavChange={setActiveNav}
      />
    )
  }

  // Если выбрана страница чата, показываем список чатов
  if (activeNav === 'chat') {
    return (
      <ChatListPage
        navigationItems={navigationItems}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        onChatSelect={setSelectedChat}
      />
    )
  }

  // Если выбрана страница профиля
  if (activeNav === 'profile') {
    return (
      <ProfilePage
        navigationItems={navigationItems}
        activeNav={activeNav}
        onNavChange={setActiveNav}
      />
    )
  }

  // Если выбрана страница деталей, отображаем её
  if (selectedProperty) {
    const isFavorite = favoriteProperties.get(
      `${selectedProperty.category}-${selectedProperty.id}`
    )

    return (
      <PropertyDetailPage
        property={selectedProperty}
        isFavorite={isFavorite}
        onBack={handleBackClick}
        onToggleFavorite={togglePropertyFavorite}
        onShare={handleShare}
        onBookNow={handleBookNow}
        onCallBroker={handleCallBroker}
        onChatBroker={handleChatBroker}
        navigationItems={navigationItems}
        activeNav={activeNav}
        onNavChange={setActiveNav}
      />
    )
  }

  return (
    <div className="app">
      <section className="hero-section">
        <div className={`hero-section__image hero-section__image--rent ${propertyMode === 'rent' ? 'hero-section__image--active' : ''}`} style={{ backgroundImage: `url(${heroImages.rent})` }}></div>
        <div className={`hero-section__image hero-section__image--buy ${propertyMode === 'buy' ? 'hero-section__image--active' : ''}`} style={{ backgroundImage: `url(${heroImages.buy})` }}></div>
        <div className="hero-section__overlay"></div>
        <div className="hero-section__content">
          <header className="header">
        <div className="header__location">
          <span className="header__location-icon">
            <IoLocationOutline size={20} />
          </span>
          <div className="header__location-info" ref={locationRef}>
            <span className="header__location-label">{t.location}</span>
            <button
              type="button"
              className="header__location-select"
              onClick={() => setIsLocationOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isLocationOpen}
            >
              <span className="header__location-value">{selectedLocation}</span>
              <FiChevronDown
                size={16}
                className={`header__location-select-icon ${
                  isLocationOpen ? 'header__location-select-icon--open' : ''
                }`}
              />
            </button>
            {isLocationOpen && (
              <div className="header__location-dropdown">
                {resortLocations.map((location) => (
                  <button
                    type="button"
                    className={`header__location-option ${
                      location === selectedLocation ? 'header__location-option--active' : ''
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

        <div className="header__actions" ref={notificationRef}>
          <button 
            type="button" 
            className="header__action-btn"
            onClick={() => setIsNotificationOpen((prev) => !prev)}
            aria-expanded={isNotificationOpen}
          >
            <FiBell size={18} />
            <span className="header__action-indicator" />
          </button>
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
                      <h4 className="notification-item__title">Нашли для вас объявление!</h4>
                      <div className="notification-item__property">
                        <div className="notification-item__image">
                          <img 
                            src={recommendedProperties[0].image}
                            alt={recommendedProperties[0].name}
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80'
                            }}
                          />
                        </div>
                        <div className="notification-item__info">
                          <p className="notification-item__property-name">{recommendedProperties[0].name}</p>
                          <p className="notification-item__property-location">{recommendedProperties[0].location}</p>
                          <button 
                            type="button" 
                            className="notification-item__button"
                            onClick={() => {
                              setIsNotificationOpen(false)
                              handlePropertyClick('recommended', recommendedProperties[0].id)
                            }}
                          >
                            Перейти
                            <FiArrowRight size={18} />
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
      </header>

      <section className="mode-switcher">
        <div className="mode-switcher__container">
          <button
            type="button"
            className={`mode-switcher__option ${propertyMode === 'rent' ? 'mode-switcher__option--active' : ''}`}
            onClick={() => setPropertyMode('rent')}
          >
            <span className="mode-switcher__label">{t.rent}</span>
          </button>
          <button
            type="button"
            className={`mode-switcher__option ${propertyMode === 'buy' ? 'mode-switcher__option--active' : ''}`}
            onClick={() => setPropertyMode('buy')}
          >
            <span className="mode-switcher__label">{t.buy}</span>
          </button>
          <div className={`mode-switcher__indicator ${propertyMode === 'buy' ? 'mode-switcher__indicator--right' : ''}`} />
        </div>
      </section>
        </div>

      <section className="search">
        <div className="search__field">
          <FiSearch size={18} className="search__icon" />
          <input
            type="text"
            placeholder={t.search}
            className="search__input"
          />
          <button type="button" className="search__filter">
            <FiSliders size={18} />
          </button>
        </div>
      </section>
      </section>

      <div className="app__content">
      {isLoading && (
        <div className="loader-overlay">
          <div className="loader">
            <div className="loader__circle loader__circle--1"></div>
            <div className="loader__circle loader__circle--2"></div>
          </div>
        </div>
      )}
      <nav className="categories">
        {getPropertyTypes(t).map((type) => {
          const IconComponent = type.icon
          const isActive = activeCategory === type.label
          return (
            <button
              type="button"
              className={`categories__item ${isActive ? 'categories__item--active' : ''}`}
              key={type.label}
              onClick={() => handleCategoryClick(type.label)}
            >
              <span className="categories__icon">
                {type.image ? (
                  <img 
                    src={type.image} 
                    alt={type.displayLabel}
                    className="categories__icon-image"
                  />
                ) : (
                  <IconComponent size={28} />
                )}
              </span>
              <span className="categories__label">{type.displayLabel}</span>
            </button>
          )
        })}
      </nav>

      <section className="section">
        <div className="section__header">
          <h2 className="section__title">{t.recommended} Property</h2>
        </div>

        <div className="property-list property-list--horizontal">
          {(filteredProperties?.recommended || recommendedProperties).map((property) => (
            <article
              className="property-card"
              key={property.id}
              onClick={() => handlePropertyClick('recommended', property.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="property-card__image">
                <img src={property.image} alt={property.name} />
                <button
                  type="button"
                  className={`property-card__favorite ${
                    favoriteProperties.get(`recommended-${property.id}`)
                      ? 'property-card__favorite--active'
                      : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite('recommended', property.id)
                  }}
                  aria-pressed={favoriteProperties.get(`recommended-${property.id}`)}
                >
                  {favoriteProperties.get(`recommended-${property.id}`) ? (
                    <FaHeartSolid size={16} />
                  ) : (
                    <FiHeart size={16} />
                  )}
                </button>
              </div>

              <div className="property-card__content">
                <span className="property-card__badge">{property.tag}</span>
                <h3 className="property-card__title">{property.name}</h3>
                <p className="property-card__location">{property.location}</p>
                <div className="property-card__price">
                  <span className="property-card__price-amount">
                    ${propertyMode === 'rent' ? property.price : property.price * 240}
                  </span>
                  <span className="property-card__price-period">
                    {propertyMode === 'rent' ? '/Month' : ''}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--spaced">
        <div className="section__header">
          <h2 className="section__title">{t.nearby} Property</h2>
        </div>

        <div className="property-list property-list--vertical">
          {(filteredProperties?.nearby || nearbyProperties).map((property) => (
            <article
              className="property-card property-card--horizontal"
              key={property.id}
              onClick={() => handlePropertyClick('nearby', property.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="property-card__image property-card__image--small">
                <img src={property.image} alt={property.name} />
                <button
                  type="button"
                  className={`property-card__favorite ${
                    favoriteProperties.get(`nearby-${property.id}`)
                      ? 'property-card__favorite--active'
                      : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite('nearby', property.id)
                  }}
                  aria-pressed={favoriteProperties.get(`nearby-${property.id}`)}
                >
                  {favoriteProperties.get(`nearby-${property.id}`) ? (
                    <FaHeartSolid size={16} />
                  ) : (
                    <FiHeart size={16} />
                  )}
                </button>
              </div>

              <div className="property-card__content">
                <span className="property-card__badge">{property.tag}</span>
                <h3 className="property-card__title">{property.name}</h3>
                <p className="property-card__location">{property.location}</p>
                <div className="property-card__price">
                  <span className="property-card__price-amount">
                    ${propertyMode === 'rent' ? property.price : property.price * 240}
                  </span>
                  <span className="property-card__price-period">
                    {propertyMode === 'rent' ? '/Month' : ''}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="contact-form-section">
        <div className="contact-form-container">
          <form className="contact-form" onSubmit={handleContactFormSubmit}>
            <div className="contact-form__header">
              <h2 className="contact-form__title">
                Есть вопросы?
                <span className="contact-form__title-accent">Напишите нам</span>
                <FiArrowRight className="contact-form__arrow" size={24} />
              </h2>
            </div>
            <div className="contact-form__row">
              <div className="contact-form__field">
                <label htmlFor="email" className="contact-form__label">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={contactForm.email}
                  onChange={handleContactFormChange}
                  className="contact-form__input"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="contact-form__field">
                <label htmlFor="fullName" className="contact-form__label">
                  ФИО
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={contactForm.fullName}
                  onChange={handleContactFormChange}
                  className="contact-form__input"
                  placeholder="Иванов Иван Иванович"
                  required
                />
              </div>
            </div>
            <div className="contact-form__field">
              <label htmlFor="message" className="contact-form__label">
                Описание вопроса
              </label>
              <textarea
                id="message"
                name="message"
                value={contactForm.message}
                onChange={handleContactFormChange}
                className="contact-form__textarea"
                placeholder="Опишите ваш вопрос подробно..."
                rows="5"
                required
              />
            </div>
            <button type="submit" className="contact-form__submit">
              <span>Отправить</span>
              <FiArrowRight size={18} />
            </button>
          </form>
        </div>
      </section>
      </div>

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
                key={item.id}
                onClick={() => setActiveNav(item.id)}
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
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              aria-label={item.label}
            >
              <IconComponent size={26} />
            </button>
          )
        })}
      </nav>

      <button
        type="button"
        className="ai-button"
        onClick={toggleChat}
        aria-label="AI Assistant"
        aria-expanded={isChatOpen}
      >
        AI
      </button>

      {isChatOpen && (
        <div className="chat-widget">
          <div className="chat-widget__header">
            <div className="chat-widget__header-info">
              <div className="chat-widget__avatar">AI</div>
              <div className="chat-widget__header-text">
                <h3 className="chat-widget__title">AI Консультант</h3>
                <span className="chat-widget__status">Онлайн</span>
              </div>
            </div>
            <button
              type="button"
              className="chat-widget__close"
              onClick={toggleChat}
              aria-label="Закрыть чат"
            >
              <FiX size={20} />
            </button>
          </div>

          <div className="chat-widget__messages" ref={chatMessagesRef}>
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`chat-widget__message ${
                  message.sender === 'user'
                    ? 'chat-widget__message--user'
                    : 'chat-widget__message--bot'
                }`}
              >
                <div className="chat-widget__message-content">
                  {message.text}
                </div>
                <div className="chat-widget__message-time">
                  {message.timestamp.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>

          <form className="chat-widget__input-form" onSubmit={handleChatSubmit}>
            <input
              type="text"
              className="chat-widget__input"
              placeholder="Введите ваше сообщение..."
              value={chatInput}
              onChange={handleChatInputChange}
              autoFocus
            />
            <button
              type="submit"
              className="chat-widget__send"
              aria-label="Отправить сообщение"
            >
              <FiSend size={18} />
            </button>
          </form>
        </div>
      )}

      <footer className="footer">
        <div className="footer__container">
          {/* Секция с кнопками загрузки и контактами */}
          <section className="footer__actions">
            {/* Текстовые ссылки сверху */}
            <div className="footer__contact-links">
              <button
                type="button"
                className="footer__contact-link"
                onClick={handleWhatsApp}
                aria-label={t.whatsapp}
              >
                <span className="footer__contact-link-text">{t.whatsapp}</span>
                <span className="footer__contact-link-arrow">→</span>
              </button>
              <button
                type="button"
                className="footer__contact-link"
                onClick={handleCallManager}
                aria-label={t.contactManager}
              >
                <span className="footer__contact-link-text">{t.contactManager}</span>
                <span className="footer__contact-link-arrow">→</span>
              </button>
            </div>

            {/* Кнопки загрузки приложений */}
            <div className="footer__download-grid">
              <button
                type="button"
                className="footer__download-btn"
                onClick={() => handleDownloadApp('android')}
                aria-label="Загрузить на Android"
              >
                <div className="footer__download-icon footer__download-icon--android">
                  <FaAndroid size={32} />
                </div>
                <div className="footer__download-text">
                  <span className="footer__download-label">{t.downloadAndroid}</span>
                  <span className="footer__download-platform">Android</span>
                </div>
              </button>

              <button
                type="button"
                className="footer__download-btn"
                onClick={() => handleDownloadApp('ios')}
                aria-label={t.downloadIOS + ' iOS'}
              >
                <div className="footer__download-icon footer__download-icon--ios">
                  <FaApple size={32} />
                </div>
                <div className="footer__download-text">
                  <span className="footer__download-label">{t.downloadIOS}</span>
                  <span className="footer__download-platform">iOS</span>
                </div>
              </button>
            </div>
          </section>

          <div className="footer__bottom">
            <div className="footer__social">
              <button
                type="button"
                className="footer__social-btn"
                onClick={() => handleSocialLink('instagram')}
                aria-label="Instagram"
              >
                <FaInstagram size={22} />
              </button>
              <button
                type="button"
                className="footer__social-btn"
                onClick={() => handleSocialLink('whatsapp')}
                aria-label="WhatsApp"
              >
                <FaWhatsapp size={22} />
              </button>
              <button
                type="button"
                className="footer__social-btn"
                onClick={() => handleSocialLink('youtube')}
                aria-label="YouTube"
              >
                <FaYoutube size={22} />
              </button>
              <button
                type="button"
                className="footer__social-btn"
                onClick={() => handleSocialLink('twitter')}
                aria-label="X (Twitter)"
              >
                <FaXTwitter size={22} />
              </button>
            </div>

            <button
              type="button"
              className="footer__language-btn"
              onClick={handleLanguageChange}
              aria-label={language === 'ru' ? 'Switch to English' : 'Переключить на русский'}
            >
              {language === 'ru' ? (
                <>
                  <span className="footer__flag footer__flag--gb"></span>
                  <span>{t.englishVersion}</span>
                </>
              ) : (
                <>
                  <span className="footer__flag footer__flag--ru"></span>
                  <span>{t.russianVersion}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
