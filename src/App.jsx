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
  FiMenu,
  FiUser,
  FiCheck,
  FiStar,
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
  { label: 'House', displayLabel: t.house, icon: PiHouseLine, image: '/house.png' },
  { label: 'Map', displayLabel: t.map, icon: FiMap, isMap: true, image: '/map.png' },
  { label: 'Apartment', displayLabel: t.apartment, icon: PiBuildingApartment, image: '/appartaments.png' },
  { label: 'Villa', displayLabel: t.villa, icon: PiBuildings, image: '/villa.png' },
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

const apartmentsData = [
  {
    id: 1,
    name: 'Тропарево Парк',
    location: 'Costa Adeje, Tenerife',
    price: 8500372,
    owner: { firstName: 'Иван', lastName: 'Петров' },
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
    hasSamolyot: false,
    beds: 2,
    baths: 1,
    sqft: 850,
  },
  {
    id: 2,
    name: 'Клубный город на реке Primavera',
    location: 'Playa de las Américas, Tenerife',
    price: 25748010,
    owner: { firstName: 'Мария', lastName: 'Сидорова' },
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    hasSamolyot: false,
    beds: 3,
    baths: 2,
    sqft: 1200,
  },
  {
    id: 3,
    name: 'Slava',
    location: 'Los Cristianos, Tenerife',
    price: 28078032,
    owner: { firstName: 'Алексей', lastName: 'Иванов' },
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    hasSamolyot: false,
    beds: 1,
    baths: 1,
    sqft: 650,
  },
  {
    id: 4,
    name: 'Пригород Лесное',
    location: 'Puerto de la Cruz, Tenerife',
    price: 4441729,
    owner: { firstName: 'Елена', lastName: 'Козлова' },
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80',
    hasSamolyot: false,
    beds: 2,
    baths: 1,
    sqft: 950,
  },
  {
    id: 5,
    name: 'LUZHNIKI COLLECTION',
    location: 'Santa Cruz de Tenerife, Tenerife',
    price: 71874000,
    owner: { firstName: 'Дмитрий', lastName: 'Смирнов' },
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
    hasSamolyot: false,
    beds: 4,
    baths: 3,
    sqft: 1800,
  },
  {
    id: 6,
    name: 'SHIFT',
    location: 'La Laguna, Tenerife',
    price: 40824208,
    owner: { firstName: 'Анна', lastName: 'Волкова' },
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    hasSamolyot: false,
    beds: 3,
    baths: 2,
    sqft: 1400,
  },
]

const villasData = [
  {
    id: 1,
    name: 'Villa Paradise',
    location: 'Costa Adeje, Tenerife',
    price: 12000000,
    owner: { firstName: 'Сергей', lastName: 'Новиков' },
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    hasSamolyot: false,
    beds: 4,
    baths: 3,
    sqft: 2500,
  },
  {
    id: 2,
    name: 'Luxury Beach Villa',
    location: 'Playa de las Américas, Tenerife',
    price: 18500000,
    owner: { firstName: 'Ольга', lastName: 'Морозова' },
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    hasSamolyot: false,
    beds: 5,
    baths: 4,
    sqft: 3200,
  },
  {
    id: 3,
    name: 'Ocean View Villa',
    location: 'Los Cristianos, Tenerife',
    price: 22000000,
    owner: { firstName: 'Павел', lastName: 'Соколов' },
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
    hasSamolyot: false,
    beds: 6,
    baths: 5,
    sqft: 4000,
  },
  {
    id: 4,
    name: 'Mountain Retreat',
    location: 'Puerto de la Cruz, Tenerife',
    price: 9500000,
    owner: { firstName: 'Татьяна', lastName: 'Лебедева' },
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80',
    hasSamolyot: false,
    beds: 3,
    baths: 2,
    sqft: 2000,
  },
  {
    id: 5,
    name: 'Elite Collection Villa',
    location: 'Santa Cruz de Tenerife, Tenerife',
    price: 35000000,
    owner: { firstName: 'Андрей', lastName: 'Кузнецов' },
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
    hasSamolyot: false,
    beds: 7,
    baths: 6,
    sqft: 5000,
  },
  {
    id: 6,
    name: 'Modern Villa Design',
    location: 'La Laguna, Tenerife',
    price: 28000000,
    owner: { firstName: 'Екатерина', lastName: 'Федорова' },
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    hasSamolyot: false,
    beds: 5,
    baths: 4,
    sqft: 3500,
  },
]

function App() {
  const [selectedLocation, setSelectedLocation] = useState(resortLocations[0])
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [propertyMode, setPropertyMode] = useState('buy') // 'rent' для аренды, 'buy' для покупки
  const [favoriteProperties, setFavoriteProperties] = useState(() => {
    const initialFavorites = new Map()
    recommendedProperties.forEach((property) => {
      initialFavorites.set(`recommended-${property.id}`, false)
    })
    nearbyProperties.forEach((property) => {
      initialFavorites.set(`nearby-${property.id}`, false)
    })
    apartmentsData.forEach((property) => {
      initialFavorites.set(`apartment-${property.id}`, false)
    })
    villasData.forEach((property) => {
      initialFavorites.set(`villa-${property.id}`, false)
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
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)
  const [activeFilter, setActiveFilter] = useState('Для всех')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const locationRef = useRef(null)
  const chatMessagesRef = useRef(null)
  const notificationRef = useRef(null)
  const menuRef = useRef(null)

  const heroImages = {
    rent: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    buy: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
  }
  
  const heroImage = heroImages[propertyMode]

  const translations = {
    ru: {
      rent: 'Тест-Драйв',
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
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    // Проверяем ширину экрана для десктопа
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    checkDesktop()
    window.addEventListener('resize', checkDesktop)

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', checkDesktop)
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
      ...apartmentsData.map((p) => ({ ...p, category: 'apartment' })),
      ...villasData.map((p) => ({ ...p, category: 'villa' })),
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
          {/* Старый хедер для мобильной версии */}
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
              <button 
                type="button" 
                className="header__action-btn"
                onClick={() => setActiveNav('profile')}
                aria-label="Профиль"
              >
                <FiUser size={18} />
              </button>
            </div>
          </header>

          {/* Новый хедер для десктопной версии */}
          <header className="new-header">
        <div className="new-header__container">
        <div className="new-header__left">
          <div className="new-header__location">
            <span className="new-header__location-icon">
              <IoLocationOutline size={20} />
            </span>
            <div className="new-header__location-info" ref={locationRef}>
              <span className="new-header__location-label">{t.location}</span>
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
          <div className="new-header__menu-wrapper" ref={menuRef}>
            <button 
              className="new-header__menu-btn"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Меню"
              aria-expanded={isMenuOpen}
            >
              <FiMenu size={20} />
              <span>Меню</span>
            </button>
            {isMenuOpen && (
              <>
                <div 
                  className="menu-backdrop"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
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
                        <button className="menu-dropdown__item">
                          <span>Ипотека</span>
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
                        <button className="menu-dropdown__icon-item">
                          <div className="menu-dropdown__icon-box menu-dropdown__icon-box--blue">
                            <FaHeart size={24} />
                          </div>
                          <span className="menu-dropdown__icon-label">Близкие</span>
                        </button>
                        <button className="menu-dropdown__icon-item">
                          <div className="menu-dropdown__icon-box menu-dropdown__icon-box--silver">
                            <FiMap size={24} />
                          </div>
                          <span className="menu-dropdown__icon-label">Авто</span>
                        </button>
                        <button className="menu-dropdown__icon-item">
                          <div className="menu-dropdown__icon-box menu-dropdown__icon-box--green">
                            <FaHome size={24} />
                          </div>
                          <span className="menu-dropdown__icon-label">Дом</span>
                        </button>
                      </div>
                      <div className="menu-dropdown__filter">
                        <button className="menu-dropdown__filter-btn">
                          <FiCheck size={16} />
                          <span>Для всех</span>
                          <FiChevronDown size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

            <div className="new-header__filters">
              <button
                type="button"
                className={`new-header__filter-btn ${activeNav === 'chat' ? 'new-header__filter-btn--active' : ''}`}
                onClick={() => setActiveNav('chat')}
              >
                <span>Чат</span>
              </button>
              <button
                type="button"
                className={`new-header__filter-btn ${activeNav === 'favourite' ? 'new-header__filter-btn--active' : ''}`}
                onClick={() => setActiveNav('favourite')}
              >
                <span>Понравившиеся</span>
              </button>
              <button
                type="button"
                className={`new-header__filter-btn ${isChatOpen ? 'new-header__filter-btn--active' : ''}`}
                onClick={toggleChat}
              >
                <span>Умный помощник</span>
              </button>
              <button
                type="button"
                className={`new-header__filter-btn ${showMap ? 'new-header__filter-btn--active' : ''}`}
                onClick={() => setShowMap(true)}
              >
                <span>Карта</span>
              </button>
            </div>

        <div className="new-header__right">
          <button className="new-header__search-btn">
            <FiSearch size={20} />
          </button>
          <button 
            type="button"
            className="new-header__auction-btn"
            onClick={() => setActiveNav('auction')}
          >
            Аукцион
          </button>
          <button className="new-header__user-btn">
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
        </div>
      </header>

      {/* Блок Аренда/Покупка сдвинут вниз */}
      <section className="mode-switcher">
        <div className="mode-switcher__container">
          <button
            type="button"
            className={`mode-switcher__option ${propertyMode === 'buy' ? 'mode-switcher__option--active' : ''}`}
            onClick={() => setPropertyMode('buy')}
          >
            <span className="mode-switcher__label">{t.buy}</span>
          </button>
          <button
            type="button"
            className={`mode-switcher__option ${propertyMode === 'rent' ? 'mode-switcher__option--active' : ''}`}
            onClick={() => setPropertyMode('rent')}
          >
            <span className="mode-switcher__label">{t.rent}</span>
          </button>
          <div className={`mode-switcher__indicator ${propertyMode === 'rent' ? 'mode-switcher__indicator--right' : ''}`} />
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

      {/* Блок "Что расскажем про ваш дом" */}
      <section className="info-section">
        <div className="info-section__container">
          <h2 className="info-section__title">Что расскажем про ваш дом</h2>
          
          <div className="info-section__cards">
            {/* Левая карточка - Стоимость и доход от аренды */}
            <div className="info-card info-card--left" style={{ backgroundColor: '#f3f4f6' }}>
              <h3 className="info-card__title">Стоимость и доход от аренды</h3>
              <p className="info-card__description">
                Оценим и учтём всё: ремонт, этаж и даже баню на участке
              </p>
              
              <div className="info-card__content-wrapper">
                <div className="info-card__inner-cards">
                  <div className="info-card__inner-card info-card__inner-card--small">
                    <div className="info-card__inner-card-content">
                      <p className="info-card__inner-card-label">Доход от посуточной аренды</p>
                    </div>
                  </div>
                  
                  <div className="info-card__inner-card">
                    <div className="info-card__inner-card-content">
                      <p className="info-card__inner-card-label">Доход от долгосрочной аренды</p>
                      <div className="info-card__inner-card-value">
                        <span className="info-card__value-amount">38 000 Р/мес</span>
                        <span className="info-card__value-tag info-card__value-tag--green">+3% за полгода</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="info-card__chart">
                  <div className="info-card__chart-header">
                    <h4 className="info-card__chart-title">Оценка стоимости</h4>
                    <div className="info-card__chart-value-header">
                      <span className="info-card__value-amount">9,5 млн Р</span>
                      <span className="info-card__value-tag info-card__value-tag--green">+3% за полгода</span>
                    </div>
                  </div>
                 
                </div>
              </div>
            </div>
            
            {/* Правая карточка - Мечтайте по-новому */}
            <div className="info-card info-card--right">
              <div className="info-card__header">
                <span className="info-card__badge info-card__badge--red">
                  <span className="info-card__badge-icon" role="img" aria-label="fire">🔥</span>
                  Популярное
                </span>
                <button className="info-card__arrow">
                  <FiArrowRight size={20} />
                </button>
              </div>
              <h3 className="info-card__title">Мечтайте по-новому</h3>
              <p className="info-card__description">
                Например, как переехать в новостройку или загород
              </p>
              
              <div className="info-card__properties">
                <div className="info-card__property">
                  <div className="info-card__property-image">
                    <img 
                      src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=400&q=80" 
                      alt="Дом с гаражом"
                    />
                  </div>
                  <div className="info-card__property-info">
                    <p className="info-card__property-details">160 м² · 2 эт. шоссе</p>
                    <p className="info-card__property-price">000 P</p>
                  </div>
                </div>
                
                <div className="info-card__property">
                  <div className="info-card__property-image">
                    <img 
                      src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80" 
                      alt="Новостройка"
                    />
                  </div>
                  <div className="info-card__property-info">
                    <p className="info-card__property-details">2-к. кв. · 40,87 м² · 17/25...</p>
                    <p className="info-card__property-location">м. Варшавская</p>
                    <p className="info-card__property-price">15 700 000 Р</p>
                  </div>
                </div>
                
                <div className="info-card__property">
                  <div className="info-card__property-image">
                    <img 
                      src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80" 
                      alt="Квартира"
                    />
                  </div>
                  <div className="info-card__property-info">
                    <p className="info-card__property-details">2-к. кв. · 43,14 м² · 5/9 эт.</p>
                    <p className="info-card__property-location">м. Каширская</p>
                    <p className="info-card__property-price">10 500 000 Р</p>
                  </div>
                </div>
                
                <div className="info-card__property">
                  <div className="info-card__property-image">
                    <img 
                      src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80" 
                      alt="Дом"
                    />
                  </div>
                  <div className="info-card__property-info">
                    <p className="info-card__property-details">Дом · 130 м² · 2 эт.</p>
                    <p className="info-card__property-location">м. Бунинская аллея</p>
                    <p className="info-card__property-price">9 800 000 Р</p>
                  </div>
                </div>
                
                <div className="info-card__property">
                  <div className="info-card__property-image">
                    <img 
                      src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80" 
                      alt="Коттедж"
                    />
                  </div>
                  <div className="info-card__property-info">
                    <p className="info-card__property-details">Коттедж · 160 м² · 2 эт.</p>
                    <p className="info-card__property-location">Каширское шоссе</p>
                    <p className="info-card__property-price">13 999 000 Р</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Блок "Аппартаменты" */}
      <section className="apartments-section">
        <div className="apartments-section__container">
          <div className="apartments-section__header">
            <h2 className="apartments-section__title">Аппартаменты</h2>
            <FiArrowRight size={24} className="apartments-section__arrow" />
          </div>
          
          <div className="apartments-section__content">
            <div className="apartments-section__grid">
              {apartmentsData.map((apartment) => (
                <article
                  key={apartment.id}
                  className="apartment-card"
                  onClick={() => handlePropertyClick('apartment', apartment.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="apartment-card__image">
                    {apartment.hasSamolyot && (
                      <span className="apartment-card__samolyot">самолет</span>
                    )}
                    <img src={apartment.image} alt={apartment.name} />
                    <button
                      type="button"
                      className={`apartment-card__favorite ${
                        favoriteProperties.get(`apartment-${apartment.id}`)
                          ? 'apartment-card__favorite--active'
                          : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite('apartment', apartment.id)
                      }}
                      aria-pressed={favoriteProperties.get(`apartment-${apartment.id}`)}
                    >
                      {favoriteProperties.get(`apartment-${apartment.id}`) ? (
                        <FaHeartSolid size={16} />
                      ) : (
                        <FiHeart size={16} />
                      )}
                    </button>
                  </div>
                  
                  <div className="apartment-card__content">
                    <div className="apartment-card__price">
                      от {apartment.price.toLocaleString('ru-RU')} $
                    </div>
                    <div className="apartment-card__info">
                      <div className="apartment-card__info-item">
                        <MdBed size={16} />
                        <span>{apartment.beds || 0}</span>
                      </div>
                      <div className="apartment-card__info-item">
                        <MdOutlineBathtub size={16} />
                        <span>{apartment.baths || 0}</span>
                      </div>
                      <div className="apartment-card__info-item">
                        <BiArea size={16} />
                        <span>{apartment.sqft || 0} м²</span>
                      </div>
                    </div>
                    <p className="apartment-card__location">{apartment.location}</p>
                  </div>
                </article>
              ))}
            </div>
            
            <div className="apartments-section__personal">
              <div className="personal-selection">
                <div className="personal-selection__banner">
                  <FiStar className="personal-selection__banner-icon" size={14} />
                  ПЕРСОНАЛЬНАЯ
                </div>
                <div className="personal-selection__content">
                  <div className="personal-selection__decorative">
                    <div className="personal-selection__icon personal-selection__icon--1">
                      <PiBuildingApartment size={32} />
                    </div>
                    <div className="personal-selection__icon personal-selection__icon--2">
                      <FiHeart size={24} />
                    </div>
                    <div className="personal-selection__icon personal-selection__icon--3">
                      <FiCheck size={20} />
                    </div>
                  </div>
                  <h3 className="personal-selection__title">ПОДБОРКА</h3>
                  <h3 className="personal-selection__title">АППАРТАМЕНТОВ</h3>
                  <div className="personal-selection__features">
                    <div className="personal-selection__feature">
                      <FiCheck className="personal-selection__feature-icon" size={18} />
                      <span>Индивидуальный подход</span>
                    </div>
                    <div className="personal-selection__feature">
                      <FiCheck className="personal-selection__feature-icon" size={18} />
                      <span>Быстрый подбор</span>
                    </div>
                    <div className="personal-selection__feature">
                      <FiCheck className="personal-selection__feature-icon" size={18} />
                      <span>Только лучшие варианты</span>
                    </div>
                  </div>
                  <p className="personal-selection__text">С вас - пожелания,</p>
                  <p className="personal-selection__text">с нас - подходящие варианты</p>
                  <button 
                    className="personal-selection__button"
                    onClick={() => setIsChatOpen(true)}
                  >
                    <span>Подробнее</span>
                    <FiArrowRight className="personal-selection__button-icon" size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Блок "Виллы" */}
      <section className="apartments-section">
        <div className="apartments-section__container">
          <div className="apartments-section__header">
            <h2 className="apartments-section__title">Виллы</h2>
            <FiArrowRight size={24} className="apartments-section__arrow" />
          </div>
          
          <div className="apartments-section__content">
            <div className="apartments-section__grid">
              {villasData.map((villa) => (
                <article
                  key={villa.id}
                  className="apartment-card"
                  onClick={() => handlePropertyClick('villa', villa.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="apartment-card__image">
                    {villa.hasSamolyot && (
                      <span className="apartment-card__samolyot">самолет</span>
                    )}
                    <img src={villa.image} alt={villa.name} />
                    <button
                      type="button"
                      className={`apartment-card__favorite ${
                        favoriteProperties.get(`villa-${villa.id}`)
                          ? 'apartment-card__favorite--active'
                          : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite('villa', villa.id)
                      }}
                      aria-pressed={favoriteProperties.get(`villa-${villa.id}`)}
                    >
                      {favoriteProperties.get(`villa-${villa.id}`) ? (
                        <FaHeartSolid size={16} />
                      ) : (
                        <FiHeart size={16} />
                      )}
                    </button>
                  </div>
                  
                  <div className="apartment-card__content">
                    <div className="apartment-card__price">
                      от {villa.price.toLocaleString('ru-RU')} $
                    </div>
                    <div className="apartment-card__info">
                      <div className="apartment-card__info-item">
                        <MdBed size={16} />
                        <span>{villa.beds || 0}</span>
                      </div>
                      <div className="apartment-card__info-item">
                        <MdOutlineBathtub size={16} />
                        <span>{villa.baths || 0}</span>
                      </div>
                      <div className="apartment-card__info-item">
                        <BiArea size={16} />
                        <span>{villa.sqft || 0} м²</span>
                      </div>
                    </div>
                    <p className="apartment-card__location">{villa.location}</p>
                  </div>
                </article>
              ))}
            </div>
            
            <div className="apartments-section__personal">
              <div className="personal-selection">
                <div className="personal-selection__banner">
                  <FiStar className="personal-selection__banner-icon" size={14} />
                  ПЕРСОНАЛЬНАЯ
                </div>
                <div className="personal-selection__content">
                  <div className="personal-selection__decorative">
                    <div className="personal-selection__icon personal-selection__icon--1">
                      <PiBuildings size={32} />
                    </div>
                    <div className="personal-selection__icon personal-selection__icon--2">
                      <FiHeart size={24} />
                    </div>
                    <div className="personal-selection__icon personal-selection__icon--3">
                      <FiCheck size={20} />
                    </div>
                  </div>
                  <h3 className="personal-selection__title">ПОДБОРКА</h3>
                  <h3 className="personal-selection__title">ВИЛЛ</h3>
                  <div className="personal-selection__features">
                    <div className="personal-selection__feature">
                      <FiCheck className="personal-selection__feature-icon" size={18} />
                      <span>Индивидуальный подход</span>
                    </div>
                    <div className="personal-selection__feature">
                      <FiCheck className="personal-selection__feature-icon" size={18} />
                      <span>Быстрый подбор</span>
                    </div>
                    <div className="personal-selection__feature">
                      <FiCheck className="personal-selection__feature-icon" size={18} />
                      <span>Только лучшие варианты</span>
                    </div>
                  </div>
                  <p className="personal-selection__text">С вас - пожелания,</p>
                  <p className="personal-selection__text">с нас - подходящие варианты</p>
                  <button 
                    className="personal-selection__button"
                    onClick={() => setIsChatOpen(true)}
                  >
                    <span>Подробнее</span>
                    <FiArrowRight className="personal-selection__button-icon" size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Форма обратной связи */}
      <section className="contact-form-section">
        <div className="contact-form-container">
          <div className="contact-form-wrapper">
            <div className="contact-form__image-wrapper">
              <h2 className="contact-form__image-title">Остались вопросы?</h2>
              <div className="contact-form__image">
                <img 
                  src="https://static.cdn-cian.ru/frontend/valuation-my-home-page-frontend/card_6_1.9222208e0e2f6d4d.svg" 
                  alt="Contact illustration" 
                />
              </div>
            </div>
            <form className="contact-form" onSubmit={handleContactFormSubmit}>
            <div className="contact-form__header">
              <h2 className="contact-form__title">
                <span className="contact-form__title-accent">Напишите нам</span>
                <FiArrowRight className="contact-form__arrow" size={24} />
              </h2>
            </div>
            <div className="contact-form__row">
              <div className="contact-form__field">
                <label htmlFor="email-contact" className="contact-form__label">
                  Email
                </label>
                <input
                  type="email"
                  id="email-contact"
                  name="email"
                  value={contactForm.email}
                  onChange={handleContactFormChange}
                  className="contact-form__input"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="contact-form__field">
                <label htmlFor="fullName-contact" className="contact-form__label">
                  ФИО
                </label>
                <input
                  type="text"
                  id="fullName-contact"
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
              <label htmlFor="message-contact" className="contact-form__label">
                Описание вопроса
              </label>
              <textarea
                id="message-contact"
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
        </div>
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

      <section className="section section--recommended">
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
                <div className="property-card__info">
                  <div className="property-card__info-item">
                    <MdBed size={16} />
                    <span>{property.beds || 0}</span>
                  </div>
                  <div className="property-card__info-item">
                    <MdOutlineBathtub size={16} />
                    <span>{property.baths || 0}</span>
                  </div>
                  <div className="property-card__info-item">
                    <BiArea size={16} />
                    <span>{property.sqft || 0} м²</span>
                  </div>
                </div>
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
                <div className="property-card__info">
                  <div className="property-card__info-item">
                    <MdBed size={16} />
                    <span>{property.beds || 0}</span>
                  </div>
                  <div className="property-card__info-item">
                    <MdOutlineBathtub size={16} />
                    <span>{property.baths || 0}</span>
                  </div>
                  <div className="property-card__info-item">
                    <BiArea size={16} />
                    <span>{property.sqft || 0} м²</span>
                  </div>
                </div>
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
          {/* Верхний блок ссылок, как на ЦИАН — по колонкам */}
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

          {/* Текстовый блок описания сервиса */}
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

          {/* Нижняя полоса с логотипом и кнопками, как на скрине */}
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
                onClick={() => handleDownloadApp('android')}
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
                onClick={() => handleDownloadApp('ios')}
                aria-label="Загрузите в App Store"
              >
                <div className="footer__store-icon">
                  <FaApple size={18} />
                </div>
                <div className="footer__store-text">
                  <span className="footer__store-label">Загрузите в</span>
                  <span className="footer__store-name">App Store</span>
                </div>
              </button>

              <button
                type="button"
                className="footer__store-btn"
                aria-label="Загрузите в RuStore"
              >
                <div className="footer__store-icon footer__store-icon--rustore">
                  <span className="footer__store-icon-text">Ru</span>
                </div>
                <div className="footer__store-text">
                  <span className="footer__store-label">Загрузите в</span>
                  <span className="footer__store-name">RuStore</span>
                </div>
              </button>

              <button
                type="button"
                className="footer__store-btn"
                aria-label="Загрузите в AppGallery"
              >
                <div className="footer__store-icon footer__store-icon--appgallery">
                  <span className="footer__store-icon-text">AG</span>
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

export default App
