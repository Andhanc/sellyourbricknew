import { useEffect, useRef, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import './MainPage.css'
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
  FiMail,
  FiShoppingCart,
} from 'react-icons/fi'
import {
  FaHome,
  FaHeart,
  FaHeart as FaHeartSolid,
  FaGavel,
  FaComment,
  FaUser,
  FaAndroid,
  FaApple,
  FaYoutube,
  FaCar,
} from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { IoLocationOutline } from 'react-icons/io5'
import { MdBed, MdOutlineBathtub, MdDirectionsCar } from 'react-icons/md'
import { BiArea } from 'react-icons/bi'
import {
  PiHouseLine,
  PiBuildings,
  PiBuildingApartment,
  PiBuilding,
  PiWarehouse,
} from 'react-icons/pi'
import PropertyTimer from '../components/PropertyTimer'
import { showToast } from '../components/ToastContainer'
import LoginModal from '../components/LoginModal'
import VerificationSuccessNotification from '../components/VerificationSuccessNotification'
import '../components/PropertyList.css'
import { askPropertyAssistant, filterPropertiesByLocation } from '../services/aiService'
import { getUserData, clearUserData, isAuthenticated } from '../services/authService'

import { getApiBaseUrl, getApiBaseUrlSync } from '../utils/apiConfig'

// Используем синхронную версию для инициализации, затем обновим при загрузке
let API_BASE_URL = getApiBaseUrlSync()

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
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    ],
    beds: 2,
    baths: 2,
    sqft: 2000,
    isAuction: true,
    currentBid: 750000,
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    description:
      'Роскошная недвижимость в самом сердце Манхэттена. Современная квартира с панорамными видами на город. Рядом находятся лучшие рестораны, магазины и культурные достопримечательности. Идеальное расположение для тех, кто ценит комфорт и престиж.',
    owner: { firstName: 'Джон', lastName: 'Смит' },
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
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    ],
    beds: 2,
    baths: 1,
    sqft: 1500,
    isAuction: true,
    currentBid: 1100,
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    description:
      'Прекрасная вилла в элитном районе Коста-Адехе. Современный дизайн, просторные террасы с видом на океан. Рядом находятся лучшие пляжи, гольф-клубы и рестораны. Идеальное место для отдыха и жизни на Тенерифе.',
    owner: { firstName: 'Карлос', lastName: 'Родригес' },
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
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    ],
    beds: 2,
    baths: 2,
    sqft: 1800,
    isAuction: true,
    currentBid: 950,
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    description:
      'Уютный дом в Лос-Кристианос, одном из самых популярных курортов Тенерифе. Близость к пляжу, магазинам и ресторанам. Тихое место с прекрасным климатом круглый год. Отличный вариант для постоянного проживания или отдыха.',
    owner: { firstName: 'Мария', lastName: 'Гонсалес' },
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
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    ],
    beds: 1,
    baths: 1,
    sqft: 1200,
    isAuction: true,
    currentBid: 920,
    endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    description:
      'Светлая квартира в историческом Пуэрто-де-ла-Крус. Уникальное расположение на севере острова с мягким климатом. Рядом ботанический сад, пляжи с черным песком и множество достопримечательностей. Идеально для тех, кто любит спокойствие и природу.',
    owner: { firstName: 'Антонио', lastName: 'Мартинес' },
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
    coordinates: [28.2916, -16.6291],
    owner: { firstName: 'Хосе', lastName: 'Мендес' },
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    ],
    hasSamolyot: false,
    isAuction: true,
    currentBid: 8000000,
    endTime: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(), // 100 дней (зеленый - от 3 месяцев)
    beds: 2,
    baths: 1,
    sqft: 850,
    description:
      'Современная квартира в престижном районе Коста-Адехе. Элитный комплекс с бассейном и инфраструктурой. Рядом лучшие пляжи острова, гольф-поля и рестораны высокой кухни. Идеальное место для инвестиций и отдыха.',
  },
]

const villasData = [
  {
    id: 1,
    name: 'Villa Paradise',
    location: 'Costa Adeje, Tenerife',
    price: 12000000,
    coordinates: [28.2916, -16.6291],
    owner: { firstName: 'Франсиско', lastName: 'Гарсия' },
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    ],
    hasSamolyot: false,
    isAuction: true,
    currentBid: 11000000,
    endTime: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(), // 70 дней (оранжевый - от 2 до 3 месяцев)
    beds: 4,
    baths: 3,
    sqft: 2500,
    description:
      'Роскошная вилла в элитном районе Коста-Адехе с панорамным видом на океан. Частный бассейн, террасы, современная кухня. Рядом лучшие пляжи, гольф-клубы и рестораны. Идеальное место для роскошного отдыха и жизни.',
  },
]

const flatsData = [
  {
    id: 1,
    name: 'Современная квартира в центре',
    location: 'Москва, ул. Тверская, 15',
    price: 12500000,
    coordinates: [55.7558, 37.6173],
    owner: { firstName: 'Александр', lastName: 'Иванов' },
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    ],
    hasSamolyot: false,
    isAuction: true,
    currentBid: 11800000,
    endTime: new Date(Date.now() + 92 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(), // 92 дня (зеленый - от 3 месяцев)
    beds: 2,
    baths: 1,
    sqft: 65,
    description:
      'Просторная двухкомнатная квартира в самом центре Москвы. Евроремонт, панорамные окна, вид на парк. Большая гостиная, современная кухня. Вся мебель и техника в отличном состоянии. Парковка во дворе.',
  },
]

const townhousesData = [
  {
    id: 1,
    name: 'Таунхаус в элитном поселке',
    location: 'Московская область, Одинцово, ул. Садовая, 15',
    price: 24500000,
    coordinates: [55.6759, 37.2784],
    owner: { firstName: 'Владимир', lastName: 'Новиков' },
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
    ],
    hasSamolyot: false,
    isAuction: true,
    currentBid: 23500000,
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    beds: 5,
    baths: 3,
    sqft: 180,
    description:
      'Современный таунхаус в элитном поселке. Два этажа, гараж, участок 6 соток. Камин, терраса, современная техника. Охраняемая территория, детская площадка.',
  },
]

function MainPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const { user, isLoaded: userLoaded } = useUser()
  const [selectedLocation, setSelectedLocation] = useState(resortLocations[0])
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [propertyMode, setPropertyMode] = useState('buy') // 'rent' для аренды, 'buy' для покупки
  const [favoriteProperties, setFavoriteProperties] = useState(() => {
    // Загружаем из localStorage
    const savedFavorites = localStorage.getItem('favoriteProperties')
    let initialFavorites = new Map()
    
    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites)
        initialFavorites = new Map(Object.entries(parsed))
      } catch (e) {
        console.error('Ошибка при загрузке избранного:', e)
      }
    }
    
    // Инициализируем все свойства, если их еще нет
    recommendedProperties.forEach((property) => {
      if (!initialFavorites.has(`recommended-${property.id}`)) {
        initialFavorites.set(`recommended-${property.id}`, false)
      }
    })
    nearbyProperties.forEach((property) => {
      if (!initialFavorites.has(`nearby-${property.id}`)) {
        initialFavorites.set(`nearby-${property.id}`, false)
      }
    })
    apartmentsData.forEach((property) => {
      if (!initialFavorites.has(`apartment-${property.id}`)) {
        initialFavorites.set(`apartment-${property.id}`, false)
      }
    })
    villasData.forEach((property) => {
      if (!initialFavorites.has(`villa-${property.id}`)) {
        initialFavorites.set(`villa-${property.id}`, false)
      }
    })
    flatsData.forEach((property) => {
      if (!initialFavorites.has(`flat-${property.id}`)) {
        initialFavorites.set(`flat-${property.id}`, false)
      }
    })
    townhousesData.forEach((property) => {
      if (!initialFavorites.has(`townhouse-${property.id}`)) {
        initialFavorites.set(`townhouse-${property.id}`, false)
      }
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
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const chatHistoryLoadedRef = useRef(false) // Флаг для отслеживания загрузки истории
  const [userPhoto, setUserPhoto] = useState(null) // Фотография пользователя
  const [isLoggedIn, setIsLoggedIn] = useState(false) // Статус авторизации
  const [hasIncompleteProfile, setHasIncompleteProfile] = useState(false) // Есть незаполненные поля профиля
  const [userPreferences, setUserPreferences] = useState({
    purpose: null, // 'для себя', 'под сдачу', 'инвестиции'
    budget: null,
    location: null, // 'Испания', 'Дубай'
    propertyType: null, // 'квартира', 'вилла', 'апартаменты', 'дом'
    rooms: null,
    area: null,
    other: null
  })
  
  // Объединяем все данные недвижимости
  const allProperties = useMemo(() => {
    const combined = [
      ...recommendedProperties.map(p => ({ ...p, source: 'recommended' })),
      ...nearbyProperties.map(p => ({ ...p, source: 'nearby' })),
      ...apartmentsData.map(p => ({ ...p, source: 'apartment' })),
      ...villasData.map(p => ({ ...p, source: 'villa' })),
      ...flatsData.map(p => ({ ...p, source: 'flat' })),
      ...townhousesData.map(p => ({ ...p, source: 'townhouse' }))
    ]
    // Фильтруем по Испании и Дубаю
    return filterPropertiesByLocation(combined)
  }, [])
  
  // Загружаем историю чата из localStorage для авторизованных пользователей
  useEffect(() => {
    // Если пользователь авторизован и история еще не загружена
    if (isLoggedIn && !chatHistoryLoadedRef.current) {
      const savedChatHistory = localStorage.getItem('aiChatHistory')
      if (savedChatHistory) {
        try {
          const parsed = JSON.parse(savedChatHistory)
          // Преобразуем timestamp из строк в Date объекты
          const messagesWithDates = parsed.map(msg => ({
            ...msg,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
          }))
          setChatMessages(messagesWithDates)
          chatHistoryLoadedRef.current = true
          return // Не показываем приветственное сообщение, если есть сохраненная история
        } catch (error) {
          console.error('Ошибка при загрузке истории чата:', error)
        }
      }
      // Если нет сохраненной истории, но пользователь авторизован - показываем приветствие
      if (chatMessages.length === 0) {
        setChatMessages([{
          id: 1,
          text: 'Здравствуйте! Я ваш AI-консультант по недвижимости. Помогу подобрать идеальный вариант в Испании или Дубае. Для начала, скажите, для какой цели вы ищете недвижимость?',
          sender: 'bot',
          timestamp: new Date(),
          buttons: ['Для себя', 'Под сдачу', 'Инвестиции'],
        }])
      }
      chatHistoryLoadedRef.current = true
    }
    
    // Если пользователь не авторизован - сбрасываем флаг
    if (!isLoggedIn) {
      chatHistoryLoadedRef.current = false
      // Показываем приветствие только если история пустая (для неавторизованных)
      if (chatMessages.length === 0) {
        setChatMessages([{
          id: 1,
          text: 'Здравствуйте! Я ваш AI-консультант по недвижимости. Помогу подобрать идеальный вариант в Испании или Дубае. Для начала, скажите, для какой цели вы ищете недвижимость?',
          sender: 'bot',
          timestamp: new Date(),
          buttons: ['Для себя', 'Под сдачу', 'Инвестиции'],
        }])
      }
    }
  }, [isLoggedIn]) // Загружаем только при изменении статуса авторизации

  // Сохраняем историю чата в localStorage для авторизованных пользователей
  useEffect(() => {
    if (isLoggedIn && chatMessages.length > 0) {
      try {
        // Сохраняем историю в localStorage
        localStorage.setItem('aiChatHistory', JSON.stringify(chatMessages))
      } catch (error) {
        console.error('Ошибка при сохранении истории чата:', error)
      }
    }
    // История не очищается при выходе из аккаунта - остается в localStorage
  }, [chatMessages, isLoggedIn])
  
  // Отладочная информация о состоянии i18n
  useEffect(() => {
    console.log('🌐 i18n initialized:', i18n.isInitialized)
    console.log('🌐 Current language:', i18n.language)
    console.log('🌐 Available languages:', i18n.languages)
    console.log('🌐 Test translation (home):', t('home'))
  }, [i18n.language, i18n.isInitialized, t])

  // Функция для проверки заполненности профиля
  const checkProfileCompleteness = (userData) => {
    if (!userData) return false
    
    // Проверяем важные поля
    const hasFirstName = userData.first_name && userData.first_name.trim() !== ''
    const hasLastName = userData.last_name && userData.last_name.trim() !== ''
    const hasEmail = userData.email && userData.email.trim() !== '' && userData.is_verified === 1
    const hasPhone = userData.phone_number && userData.phone_number.trim() !== ''
    const hasAddress = userData.address && userData.address.trim() !== ''
    const hasPassportSeries = userData.passport_series && userData.passport_series.trim() !== ''
    const hasPassportNumber = userData.passport_number && userData.passport_number.trim() !== ''
    
    // Профиль считается неполным, если:
    // 1. Нет имени (обязательное поле)
    // 2. Нет фамилии (важное поле)
    // 3. Нет подтвержденного email или телефона (хотя бы один контакт)
    // 4. Нет адреса (желательно, но не критично)
    // 5. Нет паспортных данных (серия или номер) (желательно, но не критично)
    
    // Базовые обязательные поля
    const missingBasicFields = !hasFirstName || !hasLastName || (!hasEmail && !hasPhone)
    
    // Дополнительные желательные поля (если хотя бы одно не заполнено, показываем индикатор)
    const missingOptionalFields = !hasAddress || (!hasPassportSeries && !hasPassportNumber)
    
    // Профиль неполный, если отсутствуют базовые поля ИЛИ дополнительные поля
    const isIncomplete = missingBasicFields || missingOptionalFields
    
    return isIncomplete
  }

  // Загружаем фотографию пользователя и проверяем заполненность профиля
  useEffect(() => {
    const loadUserPhotoAndCheckProfile = async () => {
      // Проверяем авторизацию через Clerk
      if (userLoaded && user) {
        // Пользователь авторизован через Clerk
        const clerkPhoto = user.imageUrl || user.profileImageUrl || null
        setUserPhoto(clerkPhoto)
        setIsLoggedIn(true)
        
        // Пытаемся загрузить данные из БД для полной проверки
        const userData = getUserData()
        let profileIncomplete = false
        
        // Используем числовой ID из БД (из localStorage), а не Clerk ID
        const dbUserId = localStorage.getItem('userId')
        if (userData && dbUserId && /^\d+$/.test(dbUserId)) {
          try {
            const response = await fetch(`${API_BASE_URL}/users/${dbUserId}`)
            if (response.ok) {
              const result = await response.json()
              if (result.success && result.data) {
                // Проверяем заполненность профиля из БД
                profileIncomplete = checkProfileCompleteness(result.data)
                setHasIncompleteProfile(profileIncomplete)
              } else {
                // Если данных в БД нет, проверяем базовые поля Clerk
                profileIncomplete = !user.firstName || !user.lastName || (!user.primaryEmailAddress?.emailAddress && !user.primaryPhoneNumber?.phoneNumber)
                setHasIncompleteProfile(profileIncomplete)
              }
            } else {
              // Если запрос не удался, проверяем базовые поля Clerk
              profileIncomplete = !user.firstName || !user.lastName || (!user.primaryEmailAddress?.emailAddress && !user.primaryPhoneNumber?.phoneNumber)
              setHasIncompleteProfile(profileIncomplete)
            }
          } catch (error) {
            console.warn('⚠️ Не удалось загрузить данные из БД для Clerk пользователя:', error)
            // Если ошибка, проверяем базовые поля Clerk
            profileIncomplete = !user.firstName || !user.lastName || (!user.primaryEmailAddress?.emailAddress && !user.primaryPhoneNumber?.phoneNumber)
            setHasIncompleteProfile(profileIncomplete)
          }
        } else {
          // Если нет ID в localStorage, проверяем базовые поля Clerk
          profileIncomplete = !user.firstName || !user.lastName || (!user.primaryEmailAddress?.emailAddress && !user.primaryPhoneNumber?.phoneNumber)
          setHasIncompleteProfile(profileIncomplete)
        }
      } else {
        // Проверяем старую систему авторизации
        const userData = getUserData()
        if (userData.isLoggedIn) {
          setIsLoggedIn(true)
          
          // Сначала пытаемся получить фотографию из localStorage
          let photo = userData.picture || null
          let profileIncomplete = false
          
          // Загружаем данные из БД для проверки заполненности
          // Используем числовой ID из БД (из localStorage), а не Clerk ID
          const dbUserId = localStorage.getItem('userId')
          if (dbUserId && /^\d+$/.test(dbUserId)) {
            try {
              const response = await fetch(`${API_BASE_URL}/users/${dbUserId}`)
              
              // Если пользователь не найден в БД (404) — сессия устарела, очищаем её
              if (response.status === 404) {
                console.warn('⚠️ Локальная сессия устарела: пользователь не найден в БД. Очищаем данные.')
                clearUserData()
                setIsLoggedIn(false)
                setUserPhoto(null)
                setHasIncompleteProfile(false)
                return
              }
              
              if (response.ok) {
                const result = await response.json()
                if (result.success && result.data) {
                  const dbUser = result.data
                  
                  // Проверяем заполненность профиля
                  profileIncomplete = checkProfileCompleteness(dbUser)
                  setHasIncompleteProfile(profileIncomplete)
                  
                  // Если user_photo есть, используем его
                  if (dbUser.user_photo && !photo) {
                    const photoPath = dbUser.user_photo
                    photo = photoPath.startsWith('http') 
                      ? photoPath 
                      : `${API_BASE_URL.replace('/api', '')}${photoPath}`
                    
                    // Обновляем localStorage с фотографией
                    const updatedUserData = {
                      ...userData,
                      picture: photo
                    }
                    localStorage.setItem('userData', JSON.stringify(updatedUserData))
                  }
                }
              }
            } catch (error) {
              console.warn('⚠️ Не удалось загрузить данные из БД:', error)
              // Если не удалось загрузить из БД, проверяем localStorage
              profileIncomplete = !userData.name || (!userData.email && !userData.phone)
              setHasIncompleteProfile(profileIncomplete)
            }
          } else {
            // Если нет ID, проверяем только localStorage
            profileIncomplete = !userData.name || (!userData.email && !userData.phone)
            setHasIncompleteProfile(profileIncomplete)
          }
          
          setUserPhoto(photo)
        } else {
          setIsLoggedIn(false)
          setUserPhoto(null)
          setHasIncompleteProfile(false)
        }
      }
    }
    
    loadUserPhotoAndCheckProfile()
    
    // Обновляем данные при фокусе окна (когда пользователь возвращается на страницу)
    const handleFocus = () => {
      loadUserPhotoAndCheckProfile()
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [user, userLoaded, location.pathname]) // Обновляем при изменении маршрута

  // Загрузка уведомлений
  useEffect(() => {
    const loadNotifications = async () => {
      const userData = getUserData()
      if (!userData) {
        console.log('📭 Нет данных пользователя для загрузки уведомлений');
        return
      }

      // Пытаемся найти ID пользователя в БД
      let dbUserId = userData.id;
      
      // Если ID не найден, пробуем найти пользователя по email или phone
      if (!dbUserId && (userData.email || userData.phone)) {
        try {
          const searchUrl = userData.email 
            ? `${API_BASE_URL}/users/email/${encodeURIComponent(userData.email)}`
            : `${API_BASE_URL}/users/phone/${encodeURIComponent(userData.phone)}`;
          const userResponse = await fetch(searchUrl);
          if (userResponse.ok) {
            const userResult = await userResponse.json();
            if (userResult.success && userResult.data) {
              dbUserId = userResult.data.id;
              console.log('✅ Найден пользователь в БД по email/phone, ID:', dbUserId);
            }
          }
        } catch (error) {
          console.warn('⚠️ Не удалось найти пользователя в БД:', error);
        }
      }

      if (!dbUserId) {
        console.log('📭 Нет ID пользователя в БД для загрузки уведомлений');
        return
      }

      console.log('📥 Загрузка уведомлений для пользователя:', dbUserId);
      setNotificationsLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/notifications/user/${dbUserId}`)
        console.log('📥 Ответ API уведомлений:', response.status, response.statusText);
        if (response.ok) {
          const data = await response.json()
          console.log('📦 Получены уведомления:', data);
          if (data.success) {
            console.log('✅ Найдено уведомлений:', data.data?.length || 0);
            const notificationsList = data.data || [];
            
            // Проверяем, есть ли уведомление о верификации, которое еще не показывали
            const verificationNotif = notificationsList.find(
              n => n.type === 'verification_success' && n.view_count === 0
            );
            
            if (verificationNotif && !showVerificationSuccess) {
              console.log('🎉 Найдено уведомление о верификации, показываем модальное окно');
              setVerificationNotification(verificationNotif);
              setShowVerificationSuccess(true);
            }
            
            // Проверяем новые уведомления о перебитой ставке
            const currentNotificationIds = new Set(notificationsList.map(n => n.id));
            const newBidOutbidNotifications = notificationsList.filter(
              n => n.type === 'bid_outbid' && 
                   !previousNotificationIds.current.has(n.id) &&
                   n.view_count === 0
            );
            
            if (newBidOutbidNotifications.length > 0) {
              newBidOutbidNotifications.forEach(notif => {
                const message = notif.message || notif.title || 'Вашу ставку перебили!';
                showToast(message, 'warning', 5000);
                console.log('🔔 Показано toast-уведомление о перебитой ставке:', notif.id);
              });
            }
            
            // Обновляем множество ID предыдущих уведомлений
            previousNotificationIds.current = currentNotificationIds;
            
            if (notificationsList && notificationsList.length > 0) {
              console.log('📄 Первое уведомление:', notificationsList[0]);
            }
            setNotifications(notificationsList)
          } else {
            console.warn('⚠️ API вернул success: false');
            setNotifications([])
          }
        } else {
          const errorText = await response.text()
          console.error('❌ Ошибка загрузки уведомлений:', response.status, errorText);
          setNotifications([])
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки уведомлений:', error)
        setNotifications([])
      } finally {
        setNotificationsLoading(false)
      }
    }

    if (isLoggedIn) {
      loadNotifications()
      
      // Обновляем уведомления при фокусе окна (когда пользователь возвращается на страницу)
      const handleFocus = () => {
        loadNotifications()
      }
      
      window.addEventListener('focus', handleFocus)
      
      // Обновляем уведомления каждые 60 секунд (1 минута) вместо каждых 5 секунд
      const interval = setInterval(loadNotifications, 60000)
      
      return () => {
        clearInterval(interval)
        window.removeEventListener('focus', handleFocus)
      }
    }
  }, [user, userLoaded, isLoggedIn])

  // Обработчик просмотра уведомления
  const handleNotificationView = async (notificationId) => {
    try {
      console.log('👁️ Просмотр уведомления:', notificationId);
      await fetch(`${API_BASE_URL}/notifications/${notificationId}/view`, {
        method: 'PUT'
      })
      // Обновляем список уведомлений
      // Используем числовой ID из БД (из localStorage), а не Clerk ID
      const dbUserId = localStorage.getItem('userId')
      if (dbUserId && /^\d+$/.test(dbUserId)) {
        const response = await fetch(`${API_BASE_URL}/notifications/user/${dbUserId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setNotifications(data.data || [])
          }
        }
      }
    } catch (error) {
      console.error('Ошибка при просмотре уведомления:', error)
    }
  }

  // Обработчик закрытия уведомления о верификации
  const handleVerificationClose = async () => {
    if (verificationNotification) {
      // Отмечаем уведомление как просмотренное (удаляется после первого просмотра)
      await handleNotificationView(verificationNotification.id);
      setShowVerificationSuccess(false);
      setVerificationNotification(null);
    }
  }
  
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [selectedChat, setSelectedChat] = useState(null)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false)
  const [verificationNotification, setVerificationNotification] = useState(null)
  const previousNotificationIds = useRef(new Set())
  const [activeCategory, setActiveCategory] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [filteredProperties, setFilteredProperties] = useState(null)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024)
  const [activeFilter, setActiveFilter] = useState(t('forAll'))
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMenuClosing, setIsMenuClosing] = useState(false)
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const locationRef = useRef(null)
  const searchInputRef = useRef(null)
  const chatMessagesRef = useRef(null)
  const notificationRef = useRef(null)
  const menuRef = useRef(null)
  const languageDropdownRef = useRef(null)

  const heroImages = {
    rent: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    buy: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
  }
  
  const heroImage = heroImages[propertyMode]
  
  // Функция фильтрации по поисковому запросу
  const filterBySearch = (properties) => {
    if (!searchQuery) return properties
    const query = searchQuery.toLowerCase()
    return properties.filter(property => 
      (property.name && property.name.toLowerCase().includes(query)) ||
      (property.location && property.location.toLowerCase().includes(query))
    )
  }

  // Фильтрованные данные
  // Состояние для одобренных объявлений из API
  const [approvedProperties, setApprovedProperties] = useState({
    apartments: [],
    villas: [],
    flats: [],
    houses: []
  })

  // Загрузка одобренных объявлений без аукциона из API
  useEffect(() => {
    const loadApprovedProperties = async () => {
      try {
        // Загружаем объявления по типам
        const types = [
          { apiType: 'commercial', stateKey: 'apartments' },
          { apiType: 'villa', stateKey: 'villas' },
          { apiType: 'apartment', stateKey: 'flats' },
          { apiType: 'house', stateKey: 'houses' }
        ]

        const loadedProperties = {
          apartments: [],
          villas: [],
          flats: [],
          houses: []
        }

        for (const { apiType, stateKey } of types) {
          try {
            const url = `${API_BASE_URL}/properties/approved?type=${apiType}`
            const response = await fetch(url)
            if (response.ok) {
              const data = await response.json()
              if (data.success && data.data) {
                loadedProperties[stateKey] = data.data
              }
            }
          } catch (error) {
            // Тихо игнорируем ошибки загрузки
          }
        }
        setApprovedProperties(loadedProperties)
      } catch (error) {
        console.error('❌ Ошибка загрузки одобренных объявлений:', error)
      }
    }

    loadApprovedProperties()
    
    // Обновляем каждые 5 минут для получения новых одобренных объявлений
    const interval = setInterval(loadApprovedProperties, 300000)
    return () => clearInterval(interval)
  }, [])

  // Объединяем статические данные с данными из API
  const combinedApartments = useMemo(() => {
<<<<<<< HEAD
    return [...apartmentsData, ...approvedProperties.apartments]
  }, [approvedProperties.apartments])

  const combinedVillas = useMemo(() => {
    return [...villasData, ...approvedProperties.villas]
  }, [approvedProperties.villas])

  const combinedFlats = useMemo(() => {
    return [...flatsData, ...approvedProperties.flats]
  }, [approvedProperties.flats])

  const combinedTownhouses = useMemo(() => {
    return [...townhousesData, ...approvedProperties.houses]
=======
    // Убираем дубликаты по ID, приоритет у данных из API
    const apiIds = new Set(approvedProperties.apartments.map(p => p.id))
    const uniqueStaticApartments = apartmentsData.filter(p => !apiIds.has(p.id))
    return [...uniqueStaticApartments, ...approvedProperties.apartments]
  }, [approvedProperties.apartments])

  const combinedVillas = useMemo(() => {
    // Убираем дубликаты по ID, приоритет у данных из API
    const apiIds = new Set(approvedProperties.villas.map(p => p.id))
    const uniqueStaticVillas = villasData.filter(p => !apiIds.has(p.id))
    return [...uniqueStaticVillas, ...approvedProperties.villas]
  }, [approvedProperties.villas])

  const combinedFlats = useMemo(() => {
    // Убираем дубликаты по ID, приоритет у данных из API
    const apiIds = new Set(approvedProperties.flats.map(p => p.id))
    const uniqueStaticFlats = flatsData.filter(p => !apiIds.has(p.id))
    return [...uniqueStaticFlats, ...approvedProperties.flats]
  }, [approvedProperties.flats])

  const combinedTownhouses = useMemo(() => {
    // Убираем дубликаты по ID, приоритет у данных из API
    const apiIds = new Set(approvedProperties.houses.map(p => p.id))
    const uniqueStaticHouses = townhousesData.filter(p => !apiIds.has(p.id))
    return [...uniqueStaticHouses, ...approvedProperties.houses]
>>>>>>> 9834624ce85afa7fe9aa397716cd67d8da737a39
  }, [approvedProperties.houses])

  const filteredApartments = useMemo(() => filterBySearch(combinedApartments), [searchQuery, combinedApartments])
  const filteredVillas = useMemo(() => filterBySearch(combinedVillas), [searchQuery, combinedVillas])
  const filteredFlats = useMemo(() => filterBySearch(combinedFlats), [searchQuery, combinedFlats])
  const filteredTownhouses = useMemo(() => filterBySearch(combinedTownhouses), [searchQuery, combinedTownhouses])
  const filteredRecommended = useMemo(() => filterBySearch(recommendedProperties), [searchQuery])
  const filteredNearby = useMemo(() => filterBySearch(nearbyProperties), [searchQuery])

  // Чтение URL параметров и применение фильтров
  useEffect(() => {
    try {
      if (!location) {
        return
      }

      const searchParams = new URLSearchParams(location.search)
      const category = searchParams.get('category')
      const filter = searchParams.get('filter')

      if (category) {
        setIsLoading(true)
        setActiveCategory(category)

        const timeoutId = setTimeout(() => {
          try {
            let filteredRecommended = recommendedProperties
            let filteredNearby = nearbyProperties

            if (category === 'House') {
              filteredRecommended = recommendedProperties.filter((p) => 
                p && p.tag && p.tag.toLowerCase() === 'house'
              )
              filteredNearby = nearbyProperties.filter((p) => 
                p && p.tag && p.tag.toLowerCase() === 'house'
              )
            } else if (category === 'Apartment') {
              filteredRecommended = recommendedProperties.filter((p) => 
                p && p.tag && p.tag.toLowerCase() === 'apartment'
              )
              filteredNearby = nearbyProperties.filter((p) => 
                p && p.tag && p.tag.toLowerCase() === 'apartment'
              )
            } else if (category === 'Villa') {
              filteredRecommended = recommendedProperties.filter((p) => 
                p && p.tag && p.tag.toLowerCase() === 'villa'
              )
              filteredNearby = nearbyProperties.filter((p) => 
                p && p.tag && p.tag.toLowerCase() === 'villa'
              )
            }

            // Если есть фильтр аукциона, применяем его
            if (filter === 'auction') {
              filteredRecommended = filteredRecommended.filter((p) => p && p.isAuction === true)
              filteredNearby = filteredNearby.filter((p) => p && p.isAuction === true)
            }

            setFilteredProperties({
              recommended: filteredRecommended,
              nearby: filteredNearby,
            })
            setIsLoading(false)
          } catch (error) {
            console.error('Error filtering properties:', error)
            setIsLoading(false)
          }
        }, 500)

        return () => {
          clearTimeout(timeoutId)
        }
      } else {
        // Если нет параметров, сбрасываем фильтры
        setFilteredProperties(null)
        setActiveCategory(null)
      }
    } catch (error) {
      console.error('Error reading URL parameters:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search])

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  useEffect(() => {
    function handleClickOutside(event) {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setIsLocationOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false)
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

  // Закрытие меню обрабатывается через backdrop onClick

  // Изменяем overflow body когда меню открыто (но не фон, чтобы не было белого экрана)
  useEffect(() => {
    if (isMenuOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isMenuOpen])


  const handleLocationSelect = (location) => {
    setSelectedLocation(location)
    setIsLocationOpen(false)
  }

  const toggleFavorite = (category, id) => {
    // Проверяем авторизацию через Clerk или старую систему
    const isClerkAuth = user && userLoaded
    const isOldAuth = isAuthenticated()
    
    if (!isClerkAuth && !isOldAuth) {
      alert('Пожалуйста, войдите в систему, чтобы добавлять объявления в избранное')
      return
    }
    
    const key = `${category}-${id}`
    setFavoriteProperties((prev) => {
      const updated = new Map(prev)
      updated.set(key, !prev.get(key))
      
      // Сохраняем в localStorage
      const obj = Object.fromEntries(updated)
      localStorage.setItem('favoriteProperties', JSON.stringify(obj))
      
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
    alert(t('thankYouMessage'))
  }

  const toggleChat = () => {
    setIsChatOpen((prev) => !prev)
  }

  const handleChatInputChange = (e) => {
    setChatInput(e.target.value)
  }

  const handleButtonClick = async (buttonText) => {
    // Отправляем текст кнопки как сообщение пользователя
    await handleChatSubmit(null, buttonText)
  }

  const handleChatSubmit = async (e, buttonText = null) => {
    if (e) e.preventDefault()
    
    const userMessage = buttonText || chatInput.trim()
    if (!userMessage) return

    if (!buttonText) {
      setChatInput('')
    }

    // Добавляем сообщение пользователя
    const userMessageObj = {
      id: Date.now(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessageObj])

    // Обновляем предпочтения на основе сообщения
    const lowerMessage = userMessage.toLowerCase()
    
    // Определяем цель
    if (lowerMessage.includes('для себя') || lowerMessage === 'для себя' || lowerMessage.includes('сам') || lowerMessage.includes('личн')) {
      setUserPreferences(prev => ({ ...prev, purpose: 'для себя' }))
    } else if (lowerMessage.includes('под сдачу') || lowerMessage === 'под сдачу' || lowerMessage.includes('сдачу') || lowerMessage.includes('аренд')) {
      setUserPreferences(prev => ({ ...prev, purpose: 'под сдачу' }))
    } else if (lowerMessage.includes('инвестиц') || lowerMessage === 'инвестиции' || lowerMessage.includes('инвест')) {
      setUserPreferences(prev => ({ ...prev, purpose: 'инвестиции' }))
    }
    
    // Определяем локацию
    if (lowerMessage.includes('испания') || lowerMessage.includes('spain') || lowerMessage.includes('españa') || 
        lowerMessage.includes('tenerife') || lowerMessage.includes('тенерифе') || lowerMessage.includes('коста') ||
        lowerMessage.includes('barcelona') || lowerMessage.includes('madrid')) {
      setUserPreferences(prev => ({ ...prev, location: 'Испания' }))
    } else if (lowerMessage.includes('дубай') || lowerMessage.includes('dubai') || lowerMessage.includes('uae') || 
               lowerMessage.includes('оаэ') || lowerMessage.includes('emirates')) {
      setUserPreferences(prev => ({ ...prev, location: 'Дубай' }))
    }

    // Извлекаем бюджет из сообщения (конвертируем рубли в евро, если указаны)
    const budgetMatch = userMessage.match(/(\d+[\s,.]?\d*)\s*(тыс|млн|k|m|€|\$|eur|usd|евро|доллар|рубл|₽|rub)/i)
    if (budgetMatch) {
      let budget = parseFloat(budgetMatch[1].replace(/\s/g, '').replace(',', '.'))
      const unit = budgetMatch[2].toLowerCase()
      
      // Конвертируем в евро (примерный курс: 1 EUR = 100 RUB)
      const eurToRubRate = 100
      
      if (unit.includes('млн') || unit === 'm') {
        budget = budget * 1000000
      } else if (unit.includes('тыс') || unit === 'k') {
        budget = budget * 1000
      }
      
      // Если указаны рубли, конвертируем в евро
      if (unit.includes('рубл') || unit.includes('₽') || unit.includes('rub')) {
        budget = budget / eurToRubRate
      }
      
      setUserPreferences(prev => ({ ...prev, budget }))
    }
    
    // Определяем тип недвижимости
    if (lowerMessage.includes('квартир') || lowerMessage.includes('апартамент') || lowerMessage.includes('apartment')) {
      setUserPreferences(prev => ({ ...prev, propertyType: 'квартира' }))
    } else if (lowerMessage.includes('вилл') || lowerMessage.includes('villa')) {
      setUserPreferences(prev => ({ ...prev, propertyType: 'вилла' }))
    } else if (lowerMessage.includes('дом') || lowerMessage.includes('таунхаус') || lowerMessage.includes('townhouse') || lowerMessage.includes('house')) {
      setUserPreferences(prev => ({ ...prev, propertyType: 'дом' }))
    }
    
    // Извлекаем количество комнат
    const roomsMatch = userMessage.match(/(\d+)\s*(комнат|room|bed)/i)
    if (roomsMatch) {
      setUserPreferences(prev => ({ ...prev, rooms: parseInt(roomsMatch[1]) }))
    }

    setIsLoadingAI(true)

    try {
      // Получаем ответ от AI
      const response = await askPropertyAssistant(
        [...chatMessages, userMessageObj],
        userPreferences,
        allProperties
      )

      // Добавляем ответ бота
      const botMessage = {
        id: Date.now() + 1,
        text: response.text,
        sender: 'bot',
        timestamp: new Date(),
        buttons: response.buttons,
        recommendations: response.recommendations
      }

      setChatMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error('Ошибка при обращении к AI:', error)
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Извините, произошла ошибка. Попробуйте еще раз.',
        sender: 'bot',
        timestamp: new Date(),
        buttons: null,
        recommendations: null
      }
      setChatMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoadingAI(false)
    }
  }

  useEffect(() => {
    if (chatMessagesRef.current && isChatOpen) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [chatMessages, isChatOpen])

  const languages = [
    { code: 'ru', name: 'Русский', flagClass: 'footer__flag--ru' },
    { code: 'en', name: 'English', flagClass: 'footer__flag--gb' },
    { code: 'de', name: 'Deutsch', flagClass: 'footer__flag--de' },
    { code: 'es', name: 'Español', flagClass: 'footer__flag--es' },
    { code: 'fr', name: 'Français', flagClass: 'footer__flag--fr' },
    { code: 'sv', name: 'Svenska', flagClass: 'footer__flag--sv' },
  ]

  const handleLanguageChange = async (langCode) => {
    try {
      console.log('🔄 Changing language to:', langCode)
      console.log('📊 Current i18n language before change:', i18n.language)
      console.log('📊 i18n ready:', i18n.isInitialized)
      
      // Меняем язык в i18n - это обновит весь статический контент
      await i18n.changeLanguage(langCode)
      
      console.log('✅ Language changed to:', i18n.language)
      console.log('📝 Test translation (home):', t('home'))
      console.log('📝 Test translation (recommended):', t('recommended'))
      
      setIsLanguageDropdownOpen(false)
    } catch (error) {
      console.error('❌ Error changing language:', error)
    }
  }

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]
  
  // Функции для получения переведенных элементов (обновляются при смене языка)
  const getPropertyTypes = useMemo(() => {
    console.log('🔄 Updating getPropertyTypes, language:', i18n.language)
    return [
      { label: 'House', displayLabel: t('house'), icon: PiHouseLine, image: '/house.png' },
      { label: 'Map', displayLabel: t('map'), icon: FiMap, isMap: true, image: '/map.png' },
      { label: 'Apartment', displayLabel: t('apartment'), icon: PiBuildingApartment, image: '/appartaments.png' },
      { label: 'Villa', displayLabel: t('villa'), icon: PiBuildings, image: '/villa.png' },
    ]
  }, [t, i18n.language])
  
  const navigationItems = useMemo(() => {
    console.log('🔄 Updating navigationItems, language:', i18n.language)
    return [
      { id: 'home', label: t('home'), icon: FaHome },
      { id: 'favourite', label: t('favorites'), icon: FaHeartSolid },
      { id: 'auction', label: t('auction'), icon: FaGavel },
      { id: 'chat', label: t('chat'), icon: FaComment },
      { id: 'profile', label: t('profile'), icon: FaUser },
    ]
  }, [t, i18n.language])
  
  // Автоматический перевод пользовательского контента отключен из-за лимитов API
  // Статический контент переводится через i18next

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

  const handleCategoryClick = (categoryLabel) => {
    if (categoryLabel === 'Map') {
      navigate('/map')
      return
    }

    setIsLoading(true)
    setActiveCategory(categoryLabel)
    
    // Обновляем URL с параметрами фильтра
    navigate(`/auction?category=${categoryLabel}`, { replace: true })

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

  const handlePropertyClick = (category, propertyId, isClassic = false, hasTimer = false, property = null) => {
    // Если объект не передан, пытаемся найти его в массивах
    let propertyToNavigate = property
    
    if (!propertyToNavigate) {
      // Ищем объект в recommendedProperties и nearbyProperties
      const allProperties = [...recommendedProperties, ...nearbyProperties]
      propertyToNavigate = allProperties.find(p => p.id === propertyId)
    }
    
    // Все объекты переходят на страницу объекта
    // PropertyDetailPage сама определит, какую страницу показывать (аукционную или классическую)
    const search = isClassic ? '?classic=1' : ''
    if (propertyToNavigate) {
      navigate(`/property/${propertyId}${search}`, { state: { property: propertyToNavigate } })
    } else {
      navigate(`/property/${propertyId}${search}`)
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

  // Проверка на ошибки рендеринга
  if (!recommendedProperties || !nearbyProperties) {
    return <div className="app">Загрузка...</div>
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
                <span className="header__location-label">{t('location')}</span>
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
                        {notificationsLoading ? (
                          <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>
                        ) : notifications.length === 0 ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Нет уведомлений</div>
                        ) : (
                          notifications.map((notification) => {
                            let notificationClass = 'notification-item--property';
                            if (notification.type === 'verification_success') {
                              notificationClass = 'notification-item--success';
                            } else if (notification.type === 'verification_rejected') {
                              notificationClass = 'notification-item--error';
                            } else if (notification.type === 'bid_outbid') {
                              notificationClass = 'notification-item--warning';
                            }
                            
                            return (
                            <div 
                              key={notification.id} 
                              className={`notification-item ${notificationClass}`}
                              onClick={() => handleNotificationView(notification.id)}
                            >
                              <div className="notification-item__content">
                                <h4 className="notification-item__title">{notification.title}</h4>
                                {notification.message && (
                                  <p className="notification-item__message">{notification.message}</p>
                                )}
                                {notification.data && notification.data.property_id && (
                                  <div className="notification-item__property">
                                    <div className="notification-item__image">
                                      <img 
                                        src={recommendedProperties[0]?.image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80'}
                                        alt={recommendedProperties[0]?.name || 'Property'}
                                        onError={(e) => {
                                          e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80'
                                        }}
                                      />
                                    </div>
                                    <div className="notification-item__info">
                                      <p className="notification-item__property-name">{recommendedProperties[0]?.name || 'Property'}</p>
                                      <p className="notification-item__property-location">{recommendedProperties[0]?.location || 'Location'}</p>
                                      <button 
                                        type="button" 
                                        className="notification-item__button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setIsNotificationOpen(false)
                                          navigate(`/property/${notification.data.property_id}`)
                                        }}
                                      >
                                        {t('goTo')}
                                        <FiArrowRight size={18} />
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {!notification.data && (
                                  <button 
                                    type="button" 
                                    className="notification-item__button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setIsNotificationOpen(false)
                                    }}
                                  >
                                    Закрыть
                                  </button>
                                )}
                              </div>
                            </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
              <button 
                type="button" 
                className={`header__action-btn ${isLoggedIn ? 'header__action-btn--avatar' : ''}`}
                onClick={() => {
                  // Всегда сначала проверяем локальные данные (роль, флаги)
                  const userData = getUserData()
                  const localRole = localStorage.getItem('userRole')
                  const storedRole = userData.role || localRole
                  const isOwnerFlag = localStorage.getItem('isOwnerLoggedIn') === 'true'
                  const isOwner =
                    storedRole === 'seller' ||
                    storedRole === 'owner' ||
                    isOwnerFlag

                  // Продавца ведем в кабинет продавца
                  if (isOwner) {
                    navigate('/owner')
                    return
                  }

                  // Дальше обычная логика профиля покупателя
                  if (userLoaded && user) {
                    navigate('/profile')
                  } else if (userData.isLoggedIn) {
                    navigate('/profile')
                  } else {
                    setIsLoginModalOpen(true)
                  }
                }}
                aria-label={t('profile')}
              >
                {isLoggedIn ? (
                  <div className="header__avatar-wrapper">
                    {userPhoto ? (
                      <img 
                        src={userPhoto} 
                        alt="Profile" 
                        className="header__avatar-img"
                        onError={(e) => {
                          // Если фото не загрузилось, показываем placeholder
                          setUserPhoto(null)
                        }}
                      />
                    ) : (
                      <div className="header__avatar-placeholder">
                        <FiUser size={18} />
                      </div>
                    )}
                  </div>
                ) : (
                  <FiUser size={18} />
                )}
                {isLoggedIn && hasIncompleteProfile && (
                  <span className="header__profile-indicator" />
                )}
              </button>
            </div>
          </header>

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
                e.stopPropagation() // Останавливаем всплытие события
                e.preventDefault() // Предотвращаем стандартное поведение
                if (isMenuOpen) {
                  setIsMenuClosing(true)
                  setTimeout(() => {
                    setIsMenuOpen(false)
                    setIsMenuClosing(false)
                  }, 300)
                } else {
                  setIsMenuOpen(true)
                }
              }}
              aria-label="Меню"
              aria-expanded={isMenuOpen}
            >
              <FiMenu size={20} className="new-header__menu-icon" />
              <span>Меню</span>
            </button>
          </div>
          
          {/* Модальное окно меню рендерится вне menu-wrapper */}
          {(isMenuOpen || isMenuClosing) && (
            <>
              <div 
                className={`menu-backdrop ${isMenuClosing ? 'menu-backdrop--closing' : ''}`}
                onClick={(e) => {
                  // Закрываем меню при клике на backdrop
                  // Проверяем, что клик не по кнопке меню или самому меню
                  const menuBtn = menuRef.current?.querySelector('.new-header__menu-btn')
                  const menuDropdown = document.querySelector('.menu-dropdown')
                  
                  if (menuBtn && menuBtn.contains(e.target)) {
                    // Клик по кнопке меню - не закрываем, кнопка сама переключит состояние
                    return
                  }
                  
                  if (menuDropdown && menuDropdown.contains(e.target)) {
                    // Клик по меню - не закрываем
                    return
                  }
                  
                  // Клик по backdrop - закрываем меню с анимацией
                  setIsMenuClosing(true)
                  setTimeout(() => {
                    setIsMenuOpen(false)
                    setIsMenuClosing(false)
                  }, 300)
                }}
              />
              <div 
                className={`menu-dropdown ${isMenuClosing ? 'menu-dropdown--closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="menu-dropdown__content">
                  <div className="menu-dropdown__columns">
                    <div className="menu-dropdown__column">
                      <h3 className="menu-dropdown__column-title">Навигация по сайту</h3>
                      <div className="menu-dropdown__column-items">
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
                            const userData = getUserData()
                            const localRole = localStorage.getItem('userRole')
                            const storedRole = userData.role || localRole
                            const isOwnerFlag = localStorage.getItem('isOwnerLoggedIn') === 'true'
                            const isOwner =
                              storedRole === 'seller' ||
                              storedRole === 'owner' ||
                              isOwnerFlag

                            if (isOwner) {
                              navigate('/owner')
                            } else {
                              navigate('/profile')
                            }
                            setIsMenuOpen(false)
                          }}
                        >
                          <span>Профиль</span>
                        </button>
                      </div>
                    </div>
                    <div className="menu-dropdown__column">
                      <h3 className="menu-dropdown__column-title">Дополнительно</h3>
                      <div className="menu-dropdown__column-items">
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
                          <span>Переводы</span>
                        </button>
                      </div>
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
                className={`new-header__filter-btn new-header__filter-btn--hide-4 ${location.pathname === '/chat' ? 'new-header__filter-btn--active' : ''}`}
                onClick={() => navigate('/chat')}
              >
                <span>{t('chat')}</span>
              </button>
              <button
                type="button"
                className={`new-header__filter-btn new-header__filter-btn--hide-3 ${location.pathname === '/history' ? 'new-header__filter-btn--active' : ''}`}
                onClick={() => navigate('/history')}
              >
                <span>{t('favorites')}</span>
              </button>
              <button
                type="button"
                className={`new-header__filter-btn new-header__filter-btn--hide-2 ${isChatOpen ? 'new-header__filter-btn--active' : ''}`}
                onClick={toggleChat}
              >
                <span>{t('aiAssistant') || 'Умный помощник'}</span>
              </button>
              <button
                type="button"
                className={`new-header__filter-btn new-header__filter-btn--hide-1 ${location.pathname === '/map' ? 'new-header__filter-btn--active' : ''}`}
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
            onClick={() => navigate('/auction')}
          >
            {t('auction')}
          </button>
          <button 
            className={`new-header__user-btn ${isLoggedIn ? 'new-header__user-btn--avatar' : ''}`}
            onClick={() => {
              // Всегда сначала проверяем локальные данные (роль, флаги)
              const userData = getUserData()
              const localRole = localStorage.getItem('userRole')
              const storedRole = userData.role || localRole
              const isOwnerFlag = localStorage.getItem('isOwnerLoggedIn') === 'true'
              const isOwner =
                storedRole === 'seller' ||
                storedRole === 'owner' ||
                isOwnerFlag

              // Продавца ведем в кабинет продавца
              if (isOwner) {
                navigate('/owner')
                return
              }

              // Дальше обычная логика профиля покупателя
              if (userLoaded && user) {
                navigate('/profile')
              } else if (userData.isLoggedIn) {
                navigate('/profile')
              } else {
                setIsLoginModalOpen(true)
              }
            }}
            aria-label={t('profile')}
          >
            {isLoggedIn ? (
              <div className="new-header__avatar-wrapper">
                {userPhoto ? (
                  <img 
                    src={userPhoto} 
                    alt="Profile" 
                    className="new-header__avatar-img"
                    onError={(e) => {
                      // Если фото не загрузилось, показываем placeholder
                      setUserPhoto(null)
                    }}
                  />
                ) : (
                  <div className="new-header__avatar-placeholder">
                    <FiUser size={20} />
                  </div>
                )}
              </div>
            ) : (
              <FiUser size={20} />
            )}
            {isLoggedIn && hasIncompleteProfile && (
              <span className="new-header__profile-indicator" />
            )}
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
                  {notificationsLoading ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>
                  ) : notifications.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Нет уведомлений</div>
                  ) : (
                    notifications.map((notification) => {
                      let notificationClass = 'notification-item--property';
                      if (notification.type === 'verification_success') {
                        notificationClass = 'notification-item--success';
                      } else if (notification.type === 'verification_rejected') {
                        notificationClass = 'notification-item--error';
                      } else if (notification.type === 'bid_outbid') {
                        notificationClass = 'notification-item--warning';
                      }
                      
                      return (
                      <div 
                        key={notification.id} 
                        className={`notification-item ${notificationClass}`}
                        onClick={() => handleNotificationView(notification.id)}
                      >
                        <div className="notification-item__content">
                          <h4 className="notification-item__title">{notification.title}</h4>
                          {notification.message && (
                            <p className="notification-item__message">{notification.message}</p>
                          )}
                          {notification.data && notification.data.property_id && (
                            <div className="notification-item__property">
                              <div className="notification-item__image">
                                <img 
                                  src={recommendedProperties[0]?.image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80'}
                                  alt={recommendedProperties[0]?.name || 'Property'}
                                  onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80'
                                  }}
                                />
                              </div>
                              <div className="notification-item__info">
                                <p className="notification-item__property-name">{recommendedProperties[0]?.name || 'Property'}</p>
                                <p className="notification-item__property-location">{recommendedProperties[0]?.location || 'Location'}</p>
                                <button 
                                  type="button" 
                                  className="notification-item__button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setIsNotificationOpen(false)
                                    handlePropertyClick('recommended', notification.data.property_id, false)
                                  }}
                                >
                                  Перейти
                                  <FiArrowRight size={18} />
                                </button>
                              </div>
                            </div>
                          )}
                          {!notification.data && (
                            <button 
                              type="button" 
                              className="notification-item__button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setIsNotificationOpen(false)
                              }}
                            >
                              Закрыть
                            </button>
                          )}
                        </div>
                      </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            </>
          )}
            </>
          )}
        </div>
        </div>
      </header>
        </div>

      <section className="search">
        <div className="search__field">
          <FiSearch size={18} className="search__icon" />
          <input
            type="text"
            placeholder={t('search') || 'Поиск по названию или адресу...'}
            className="search__input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              type="button"
              className="search__clear"
              onClick={() => setSearchQuery('')}
              aria-label="Очистить поиск"
            >
              <FiX size={18} />
            </button>
          )}
          <button type="button" className="search__filter">
            <FiSliders size={18} />
          </button>
        </div>
      </section>
      </section>


      {/* Блок "Аппартаменты" */}
      <section className="apartments-section">
        <div className="apartments-section__container">
          <div 
            className="apartments-section__header"
            onClick={() => {
              // Принудительный переход на страницу с фильтром
              window.location.href = '/auction?category=Apartment&filter=auction'
            }}
            style={{ cursor: 'pointer' }}
          >
            <h2 className="apartments-section__title">{t('apartmentsSection')}</h2>
            <FiArrowRight size={24} className="apartments-section__arrow" />
          </div>
          
          <div className="apartments-section__content">
            <div className="properties-grid">
              {filteredApartments.map((apartment, index) => {
                const formatPrice = (price) => {
                  if (price >= 1000000) {
                    return `$${(price / 1000000).toFixed(1)}M`
                  }
                  return `$${price.toLocaleString('en-US')}`
                }
                
                return (
                  <div key={apartment.id} className="property-card">
                    <div 
                      className="property-link"
                      onClick={() => {
                        // hasTimer определяется только по данным объекта, не зависит от индекса
                        const hasTimer = apartment.isAuction === true && apartment.endTime != null && apartment.endTime !== ''
                        // showTimer используется только для визуального отображения таймера
                        const showTimer = index % 2 === 1 && hasTimer
                        handlePropertyClick('apartment', apartment.id, !showTimer, hasTimer, apartment)
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="property-image-container">
                        <img 
                          src={apartment.image} 
                          alt={apartment.name}
                          className="property-image"
                        />
                        <div className="property-image-icons">
                          <button
                            type="button"
                            className="property-icon-button property-icon-buy"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handlePropertyClick('apartment', apartment.id, !showTimer, hasTimer, apartment)
                            }}
                            title="Купить сейчас"
                          >
                            <FiShoppingCart size={20} />
                          </button>
                          {(apartment.test_drive === 1 || apartment.testDrive === true || apartment.test_drive === true) && (
                            <button
                              type="button"
                              className="property-icon-button property-icon-testdrive"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handlePropertyClick('apartment', apartment.id, !showTimer, hasTimer, apartment)
                              }}
                              title="Тест-Драйв"
                            >
                              <MdDirectionsCar size={20} />
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          className={`property-favorite ${
                            favoriteProperties.get(`apartment-${apartment.id}`) ? 'active' : ''
                          }`}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleFavorite('apartment', apartment.id)
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path 
                              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              fill={favoriteProperties.get(`apartment-${apartment.id}`) ? "currentColor" : "none"}
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="property-content">
                        {index % 2 === 1 && apartment.isAuction && apartment.endTime && (
                          <PropertyTimer endTime={apartment.endTime} compact={true} />
                        )}
                        <h3 className="property-title">{apartment.name}</h3>
                        {!(index % 2 === 1 && apartment.isAuction && apartment.endTime) && apartment.description && (
                          <p className="property-description">{apartment.description}</p>
                        )}
                        <p className="property-location">{apartment.location}</p>
                        {index % 2 === 1 && apartment.isAuction && apartment.endTime ? (
                          apartment.currentBid && (
                            <div className="property-bid-info">
                              <span className="bid-label">Текущая ставка:</span>
                              <span className="bid-value">{formatPrice(apartment.currentBid)}</span>
                            </div>
                          )
                        ) : (
                          <>
                            <div className="property-price">{formatPrice(apartment.price)}</div>
                            <div className="property-specs">
                            {apartment.beds && (
                              <div className="spec-item">
                                <MdBed size={18} />
                                <span>{apartment.beds}</span>
                              </div>
                            )}
                            {apartment.baths && (
                              <div className="spec-item">
                                <MdOutlineBathtub size={18} />
                                <span>{apartment.baths}</span>
                              </div>
                            )}
                            {apartment.sqft && (
                              <div className="spec-item">
                                <BiArea size={18} />
                                <span>{apartment.sqft} м²</span>
                              </div>
                            )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
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
                      <span>{t('quickSelection')}</span>
                    </div>
                    <div className="personal-selection__feature">
                      <FiCheck className="personal-selection__feature-icon" size={18} />
                      <span>{t('bestOptions')}</span>
                    </div>
                  </div>
                  <p className="personal-selection__text">{t('fromYou')}</p>
                  <p className="personal-selection__text">{t('fromUs')}</p>
                  <button 
                    className="personal-selection__button"
                    onClick={() => setIsChatOpen(true)}
                  >
                    <span>{t('learnMore')}</span>
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
          <div 
            className="apartments-section__header"
            onClick={() => {
              window.location.href = '/auction?category=Villa&filter=auction'
            }}
            style={{ cursor: 'pointer' }}
          >
            <h2 className="apartments-section__title">{t('villasSection')}</h2>
            <FiArrowRight size={24} className="apartments-section__arrow" />
          </div>
          
          <div className="apartments-section__content">
            <div className="properties-grid">
              {filteredVillas.map((villa, index) => {
                const formatPrice = (price) => {
                  if (price >= 1000000) {
                    return `$${(price / 1000000).toFixed(1)}M`
                  }
                  return `$${price.toLocaleString('en-US')}`
                }
                
                return (
                  <div key={villa.id} className="property-card">
                    <div 
                      className="property-link"
                      onClick={() => {
                        // hasTimer определяется только по данным объекта, не зависит от индекса
                        const hasTimer = villa.isAuction === true && villa.endTime != null && villa.endTime !== ''
                        // showTimer используется только для визуального отображения таймера
                        const showTimer = index % 2 === 1 && hasTimer
                        handlePropertyClick('villa', villa.id, !showTimer, hasTimer, villa)
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="property-image-container">
                        <img 
                          src={villa.image} 
                          alt={villa.name}
                          className="property-image"
                        />
                        <div className="property-image-icons">
                          <button
                            type="button"
                            className="property-icon-button property-icon-buy"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              const hasTimer = villa.isAuction === true && villa.endTime != null && villa.endTime !== ''
                              const showTimer = index % 2 === 1 && hasTimer
                              handlePropertyClick('villa', villa.id, !showTimer, hasTimer, villa)
                            }}
                            title="Купить сейчас"
                          >
                            <FiShoppingCart size={20} />
                          </button>
                          {(villa.test_drive === 1 || villa.testDrive === true || villa.test_drive === true) && (
                            <button
                              type="button"
                              className="property-icon-button property-icon-testdrive"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const hasTimer = villa.isAuction === true && villa.endTime != null && villa.endTime !== ''
                                const showTimer = index % 2 === 1 && hasTimer
                                handlePropertyClick('villa', villa.id, !showTimer, hasTimer, villa)
                              }}
                              title="Тест-Драйв"
                            >
                              <MdDirectionsCar size={20} />
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          className={`property-favorite ${
                            favoriteProperties.get(`villa-${villa.id}`) ? 'active' : ''
                          }`}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleFavorite('villa', villa.id)
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path 
                              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              fill={favoriteProperties.get(`villa-${villa.id}`) ? "currentColor" : "none"}
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="property-content">
                        {index % 2 === 1 && villa.isAuction && villa.endTime && (
                          <PropertyTimer endTime={villa.endTime} compact={true} />
                        )}
                        <h3 className="property-title">{villa.name}</h3>
                        {!(index % 2 === 1 && villa.isAuction && villa.endTime) && villa.description && (
                          <p className="property-description">{villa.description}</p>
                        )}
                        <p className="property-location">{villa.location}</p>
                        {index % 2 === 1 && villa.isAuction && villa.endTime ? (
                          villa.currentBid && (
                            <div className="property-bid-info">
                              <span className="bid-label">Текущая ставка:</span>
                              <span className="bid-value">{formatPrice(villa.currentBid)}</span>
                            </div>
                          )
                        ) : (
                          <>
                            <div className="property-price">{formatPrice(villa.price)}</div>
                            <div className="property-specs">
                            {villa.beds && (
                              <div className="spec-item">
                                <MdBed size={18} />
                                <span>{villa.beds}</span>
                              </div>
                            )}
                            {villa.baths && (
                              <div className="spec-item">
                                <MdOutlineBathtub size={18} />
                                <span>{villa.baths}</span>
                              </div>
                            )}
                            {villa.sqft && (
                              <div className="spec-item">
                                <BiArea size={18} />
                                <span>{villa.sqft} м²</span>
                              </div>
                            )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
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
                      <span>{t('quickSelection')}</span>
                    </div>
                    <div className="personal-selection__feature">
                      <FiCheck className="personal-selection__feature-icon" size={18} />
                      <span>{t('bestOptions')}</span>
                    </div>
                  </div>
                  <p className="personal-selection__text">{t('fromYou')}</p>
                  <p className="personal-selection__text">{t('fromUs')}</p>
                  <button 
                    className="personal-selection__button"
                    onClick={() => setIsChatOpen(true)}
                  >
                    <span>{t('learnMore')}</span>
                    <FiArrowRight className="personal-selection__button-icon" size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Блок "Квартиры" */}
      <section className="apartments-section">
        <div className="apartments-section__container">
          <div 
            className="apartments-section__header"
            onClick={() => {
              window.location.href = '/auction?category=Flat&filter=auction'
            }}
            style={{ cursor: 'pointer' }}
          >
            <h2 className="apartments-section__title">Квартиры</h2>
            <FiArrowRight size={24} className="apartments-section__arrow" />
          </div>
          
          <div className="apartments-section__content">
            <div className="properties-grid">
              {filteredFlats.map((flat, index) => {
                const formatPrice = (price) => {
                  if (price >= 1000000) {
                    return `$${(price / 1000000).toFixed(1)}M`
                  }
                  return `$${price.toLocaleString('en-US')}`
                }
                
                return (
                  <div key={flat.id} className="property-card">
                    <div 
                      className="property-link"
                      onClick={() => {
                        // hasTimer определяется только по данным объекта, не зависит от индекса
                        const hasTimer = flat.isAuction === true && flat.endTime != null && flat.endTime !== ''
                        // showTimer используется только для визуального отображения таймера
                        const showTimer = index % 2 === 1 && hasTimer
                        handlePropertyClick('flat', flat.id, !showTimer, hasTimer, flat)
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="property-image-container">
                        <img 
                          src={flat.image} 
                          alt={flat.name}
                          className="property-image"
                        />
                        <div className="property-image-icons">
                          <button
                            type="button"
                            className="property-icon-button property-icon-buy"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              const hasTimer = flat.isAuction === true && flat.endTime != null && flat.endTime !== ''
                              const showTimer = index % 2 === 1 && hasTimer
                              handlePropertyClick('flat', flat.id, !showTimer, hasTimer, flat)
                            }}
                            title="Купить сейчас"
                          >
                            <FiShoppingCart size={20} />
                          </button>
                          {(flat.test_drive === 1 || flat.testDrive === true || flat.test_drive === true) && (
                            <button
                              type="button"
                              className="property-icon-button property-icon-testdrive"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const hasTimer = flat.isAuction === true && flat.endTime != null && flat.endTime !== ''
                                const showTimer = index % 2 === 1 && hasTimer
                                handlePropertyClick('flat', flat.id, !showTimer, hasTimer, flat)
                              }}
                              title="Тест-Драйв"
                            >
                              <MdDirectionsCar size={20} />
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          className={`property-favorite ${
                            favoriteProperties.get(`flat-${flat.id}`) ? 'active' : ''
                          }`}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleFavorite('flat', flat.id)
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path 
                              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              fill={favoriteProperties.get(`flat-${flat.id}`) ? "currentColor" : "none"}
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="property-content">
                        {index % 2 === 1 && flat.isAuction && flat.endTime && (
                          <PropertyTimer endTime={flat.endTime} compact={true} />
                        )}
                        <h3 className="property-title">{flat.name}</h3>
                        {!(index % 2 === 1 && flat.isAuction && flat.endTime) && flat.description && (
                          <p className="property-description">{flat.description}</p>
                        )}
                        <p className="property-location">{flat.location}</p>
                        {index % 2 === 1 && flat.isAuction && flat.endTime ? (
                          flat.currentBid && (
                            <div className="property-bid-info">
                              <span className="bid-label">Текущая ставка:</span>
                              <span className="bid-value">{formatPrice(flat.currentBid)}</span>
                            </div>
                          )
                        ) : (
                          <>
                            <div className="property-price">{formatPrice(flat.price)}</div>
                            <div className="property-specs">
                            {flat.beds && (
                              <div className="spec-item">
                                <MdBed size={18} />
                                <span>{flat.beds}</span>
                              </div>
                            )}
                            {flat.baths && (
                              <div className="spec-item">
                                <MdOutlineBathtub size={18} />
                                <span>{flat.baths}</span>
                              </div>
                            )}
                            {flat.sqft && (
                              <div className="spec-item">
                                <BiArea size={18} />
                                <span>{flat.sqft} м²</span>
                              </div>
                            )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
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
                  <h3 className="personal-selection__title">КВАРТИР</h3>
                  <div className="personal-selection__features">
                    <div className="personal-selection__feature">
                      <FiCheck className="personal-selection__feature-icon" size={18} />
                      <span>Индивидуальный подход</span>
                    </div>
                    <div className="personal-selection__feature">
                      <FiCheck className="personal-selection__feature-icon" size={18} />
                      <span>{t('quickSelection')}</span>
                    </div>
                    <div className="personal-selection__feature">
                      <FiCheck className="personal-selection__feature-icon" size={18} />
                      <span>{t('bestOptions')}</span>
                    </div>
                  </div>
                  <p className="personal-selection__text">{t('fromYou')}</p>
                  <p className="personal-selection__text">{t('fromUs')}</p>
                  <button 
                    className="personal-selection__button"
                    onClick={() => setIsChatOpen(true)}
                  >
                    <span>{t('learnMore')}</span>
                    <FiArrowRight className="personal-selection__button-icon" size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Блок "Дома" */}
      <section className="apartments-section">
        <div className="apartments-section__container">
          <div 
            className="apartments-section__header"
            onClick={() => {
              window.location.href = '/auction?category=House&filter=auction'
            }}
            style={{ cursor: 'pointer' }}
          >
            <h2 className="apartments-section__title">Дома</h2>
            <FiArrowRight size={24} className="apartments-section__arrow" />
          </div>
          
          <div className="apartments-section__content">
            <div className="properties-grid">
              {filteredTownhouses.map((townhouse, index) => {
                const formatPrice = (price) => {
                  if (price >= 1000000) {
                    return `$${(price / 1000000).toFixed(1)}M`
                  }
                  return `$${price.toLocaleString('en-US')}`
                }
                
                return (
                  <div key={townhouse.id} className="property-card">
                    <div 
                      className="property-link"
                      onClick={() => {
                        // hasTimer определяется только по данным объекта, не зависит от индекса
                        const hasTimer = townhouse.isAuction === true && townhouse.endTime != null && townhouse.endTime !== ''
                        // showTimer используется только для визуального отображения таймера
                        const showTimer = index % 2 === 1 && hasTimer
                        handlePropertyClick('townhouse', townhouse.id, !showTimer, hasTimer, townhouse)
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="property-image-container">
                        <img 
                          src={townhouse.image} 
                          alt={townhouse.name}
                          className="property-image"
                        />
                        <div className="property-image-icons">
                          <button
                            type="button"
                            className="property-icon-button property-icon-buy"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              const hasTimer = townhouse.isAuction === true && townhouse.endTime != null && townhouse.endTime !== ''
                              const showTimer = index % 2 === 1 && hasTimer
                              handlePropertyClick('townhouse', townhouse.id, !showTimer, hasTimer, townhouse)
                            }}
                            title="Купить сейчас"
                          >
                            <FiShoppingCart size={20} />
                          </button>
                          {(townhouse.test_drive === 1 || townhouse.testDrive === true || townhouse.test_drive === true) && (
                            <button
                              type="button"
                              className="property-icon-button property-icon-testdrive"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const hasTimer = townhouse.isAuction === true && townhouse.endTime != null && townhouse.endTime !== ''
                                const showTimer = index % 2 === 1 && hasTimer
                                handlePropertyClick('townhouse', townhouse.id, !showTimer, hasTimer, townhouse)
                              }}
                              title="Тест-Драйв"
                            >
                              <MdDirectionsCar size={20} />
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          className={`property-favorite ${
                            favoriteProperties.get(`townhouse-${townhouse.id}`) ? 'active' : ''
                          }`}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleFavorite('townhouse', townhouse.id)
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path 
                              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              fill={favoriteProperties.get(`townhouse-${townhouse.id}`) ? "currentColor" : "none"}
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="property-content">
                        {index % 2 === 1 && townhouse.isAuction && townhouse.endTime && (
                          <PropertyTimer endTime={townhouse.endTime} compact={true} />
                        )}
                        <h3 className="property-title">{townhouse.name}</h3>
                        {!(index % 2 === 1 && townhouse.isAuction && townhouse.endTime) && townhouse.description && (
                          <p className="property-description">{townhouse.description}</p>
                        )}
                        <p className="property-location">{townhouse.location}</p>
                        {index % 2 === 1 && townhouse.isAuction && townhouse.endTime ? (
                          townhouse.currentBid && (
                            <div className="property-bid-info">
                              <span className="bid-label">Текущая ставка:</span>
                              <span className="bid-value">{formatPrice(townhouse.currentBid)}</span>
                            </div>
                          )
                        ) : (
                          <>
                            <div className="property-price">{formatPrice(townhouse.price)}</div>
                            <div className="property-specs">
                            {townhouse.beds && (
                              <div className="spec-item">
                                <MdBed size={18} />
                                <span>{townhouse.beds}</span>
                              </div>
                            )}
                            {townhouse.baths && (
                              <div className="spec-item">
                                <MdOutlineBathtub size={18} />
                                <span>{townhouse.baths}</span>
                              </div>
                            )}
                            {townhouse.sqft && (
                              <div className="spec-item">
                                <BiArea size={18} />
                                <span>{townhouse.sqft} м²</span>
                              </div>
                            )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
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
                      <PiHouseLine size={32} />
                    </div>
                    <div className="personal-selection__icon personal-selection__icon--2">
                      <FiHeart size={24} />
                    </div>
                    <div className="personal-selection__icon personal-selection__icon--3">
                      <FiCheck size={20} />
                    </div>
                  </div>
                  <h3 className="personal-selection__title">ПОДБОРКА</h3>
                  <h3 className="personal-selection__title">ДОМОВ</h3>
                  <div className="personal-selection__features">
                    <div className="personal-selection__feature">
                      <FiCheck className="personal-selection__feature-icon" size={18} />
                      <span>Индивидуальный подход</span>
                    </div>
                    <div className="personal-selection__feature">
                      <FiCheck className="personal-selection__feature-icon" size={18} />
                      <span>{t('quickSelection')}</span>
                    </div>
                    <div className="personal-selection__feature">
                      <FiCheck className="personal-selection__feature-icon" size={18} />
                      <span>{t('bestOptions')}</span>
                    </div>
                  </div>
                  <p className="personal-selection__text">{t('fromYou')}</p>
                  <p className="personal-selection__text">{t('fromUs')}</p>
                  <button 
                    className="personal-selection__button"
                    onClick={() => setIsChatOpen(true)}
                  >
                    <span>{t('learnMore')}</span>
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
              <h2 className="contact-form__image-title">{t('haveQuestions')}</h2>
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
                <span className="contact-form__title-accent">{t('writeToUs')}</span>
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
                  {t('fullName')}
                </label>
                <input
                  type="text"
                  id="fullName-contact"
                  name="fullName"
                  value={contactForm.fullName}
                  onChange={handleContactFormChange}
                  className="contact-form__input"
                  placeholder={t('fullNamePlaceholder')}
                  required
                />
              </div>
            </div>
            <div className="contact-form__field">
              <label htmlFor="message-contact" className="contact-form__label">
                {t('questionDescription')}
              </label>
              <textarea
                id="message-contact"
                name="message"
                value={contactForm.message}
                onChange={handleContactFormChange}
                className="contact-form__textarea"
                  placeholder={t('questionPlaceholder')}
                rows="5"
                required
              />
            </div>
            <button type="submit" className="contact-form__submit">
              <span>{t('send')}</span>
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
        {getPropertyTypes.map((type) => {
          const IconComponent = type.icon
          const isActive = activeCategory === type.label
          return (
            <button
              type="button"
              className={`categories__item ${isActive ? 'categories__item--active' : ''}`}
              key={`${type.label}-${i18n.language}`}
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
          <h2 className="section__title">{t('recommended')} Property</h2>
        </div>

        <div className="properties-grid">
          {(filteredProperties?.recommended || filteredRecommended).map((property, index) => {
            const formatPrice = (price) => {
              if (price >= 1000000) {
                return `$${(price / 1000000).toFixed(1)}M`
              }
              return `$${price.toLocaleString('en-US')}`
            }
            
            return (
              <div key={property.id} className="property-card">
                <div 
                  className="property-link"
                  onClick={() => {
                    // hasTimer определяется только по данным объекта, не зависит от индекса
                    const hasTimer = property.isAuction === true && property.endTime != null && property.endTime !== ''
                    // showTimer используется только для визуального отображения таймера
                    const showTimer = index % 2 === 1 && hasTimer
                    handlePropertyClick('recommended', property.id, !showTimer, hasTimer, property)
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="property-image-container">
                    <img 
                      src={property.image} 
                      alt={property.name}
                      className="property-image"
                    />
                    <div className="property-image-icons">
                      <button
                        type="button"
                        className="property-icon-button property-icon-buy"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const hasTimer = property.isAuction === true && property.endTime != null && property.endTime !== ''
                          const showTimer = index % 2 === 1 && hasTimer
                          handlePropertyClick('recommended', property.id, !showTimer, hasTimer, property)
                        }}
                        title="Купить сейчас"
                      >
                        <FiShoppingCart size={20} />
                      </button>
                      {(property.test_drive === 1 || property.testDrive === true || property.test_drive === true) && (
                        <button
                          type="button"
                          className="property-icon-button property-icon-testdrive"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            const hasTimer = property.isAuction === true && property.endTime != null && property.endTime !== ''
                            const showTimer = index % 2 === 1 && hasTimer
                            handlePropertyClick('recommended', property.id, !showTimer, hasTimer, property)
                          }}
                          title="Тест-Драйв"
                        >
                          <MdDirectionsCar size={20} />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      className={`property-favorite ${
                        favoriteProperties.get(`recommended-${property.id}`) ? 'active' : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleFavorite('recommended', property.id)
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path 
                          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          fill={favoriteProperties.get(`recommended-${property.id}`) ? "currentColor" : "none"}
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="property-content">
                    {index % 2 === 1 && property.isAuction && property.endTime && (
                      <PropertyTimer endTime={property.endTime} compact={true} />
                    )}
                    <h3 className="property-title">{property.name}</h3>
                    <p className="property-location">{property.location}</p>
                    {index % 2 === 1 && property.isAuction && property.endTime ? (
                      property.currentBid && (
                        <div className="property-bid-info">
                          <span className="bid-label">Текущая ставка:</span>
                          <span className="bid-value">{formatPrice(property.currentBid)}</span>
                        </div>
                      )
                    ) : (
                      <>
                        <div className="property-price">{formatPrice(propertyMode === 'rent' ? property.price : property.price * 240)}</div>
                        <div className="property-specs">
                          {property.beds && (
                            <div className="spec-item">
                              <MdBed size={18} />
                              <span>{property.beds}</span>
                            </div>
                          )}
                          {property.baths && (
                            <div className="spec-item">
                              <MdOutlineBathtub size={18} />
                              <span>{property.baths}</span>
                            </div>
                          )}
                          {property.sqft && (
                            <div className="spec-item">
                              <BiArea size={18} />
                              <span>{property.sqft} м²</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="section section--spaced">
        <div className="section__header">
          <h2 className="section__title">{t('nearby')} Property</h2>
        </div>

        <div className="properties-grid">
          {(filteredProperties?.nearby || filteredNearby).map((property, index) => {
            const formatPrice = (price) => {
              if (price >= 1000000) {
                return `$${(price / 1000000).toFixed(1)}M`
              }
              return `$${price.toLocaleString('en-US')}`
            }
            
            return (
              <div key={property.id} className="property-card">
                <div 
                  className="property-link"
                  onClick={() => {
                    // hasTimer определяется только по данным объекта, не зависит от индекса
                    const hasTimer = property.isAuction === true && property.endTime != null && property.endTime !== ''
                    // showTimer используется только для визуального отображения таймера
                    const showTimer = index % 2 === 1 && hasTimer
                    handlePropertyClick('nearby', property.id, !showTimer, hasTimer, property)
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="property-image-container">
                    <img 
                      src={property.image} 
                      alt={property.name}
                      className="property-image"
                    />
                    <div className="property-image-icons">
                      <button
                        type="button"
                        className="property-icon-button property-icon-buy"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const hasTimer = property.isAuction === true && property.endTime != null && property.endTime !== ''
                          const showTimer = index % 2 === 1 && hasTimer
                          handlePropertyClick('nearby', property.id, !showTimer, hasTimer, property)
                        }}
                        title="Купить сейчас"
                      >
                        <FiShoppingCart size={20} />
                      </button>
                      {(property.test_drive === 1 || property.testDrive === true || property.test_drive === true) && (
                        <button
                          type="button"
                          className="property-icon-button property-icon-testdrive"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            const hasTimer = property.isAuction === true && property.endTime != null && property.endTime !== ''
                            const showTimer = index % 2 === 1 && hasTimer
                            handlePropertyClick('nearby', property.id, !showTimer, hasTimer, property)
                          }}
                          title="Тест-Драйв"
                        >
                          <MdDirectionsCar size={20} />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      className={`property-favorite ${
                        favoriteProperties.get(`nearby-${property.id}`) ? 'active' : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleFavorite('nearby', property.id)
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path 
                          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          fill={favoriteProperties.get(`nearby-${property.id}`) ? "currentColor" : "none"}
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="property-content">
                    {index % 2 === 1 && property.isAuction && property.endTime && (
                      <PropertyTimer endTime={property.endTime} compact={true} />
                    )}
                    <h3 className="property-title">{property.name}</h3>
                    {!(index % 2 === 1 && property.isAuction && property.endTime) && property.description && (
                      <p className="property-description">{property.description}</p>
                    )}
                    <p className="property-location">{property.location}</p>
                    {index % 2 === 1 && property.isAuction && property.endTime ? (
                      property.currentBid && (
                        <div className="property-bid-info">
                          <span className="bid-label">Текущая ставка:</span>
                          <span className="bid-value">{formatPrice(property.currentBid)}</span>
                        </div>
                      )
                    ) : (
                      <>
                        <div className="property-price">{formatPrice(propertyMode === 'rent' ? property.price : property.price * 240)}</div>
                        <div className="property-specs">
                          {property.beds && (
                            <div className="spec-item">
                              <MdBed size={18} />
                              <span>{property.beds}</span>
                            </div>
                          )}
                          {property.baths && (
                            <div className="spec-item">
                              <MdOutlineBathtub size={18} />
                              <span>{property.baths}</span>
                            </div>
                          )}
                          {property.sqft && (
                            <div className="spec-item">
                              <BiArea size={18} />
                              <span>{property.sqft} м²</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
      </div>

      <nav className="bottom-nav">
        {navigationItems.map((item, index) => {
          const IconComponent = item.icon
          const isCenter = index === 2
          const getRoute = (id) => {
            if (id === 'home') return '/'
            if (id === 'favourite') return '/history'
            if (id === 'auction') return '/auction'
            if (id === 'chat') return '/chat'
            if (id === 'profile') return '/profile'
            return '/'
          }
          const route = getRoute(item.id)
          const isActive = location.pathname === route

          if (isCenter) {
            return (
              <button
                type="button"
                className={`bottom-nav__center ${isActive ? 'bottom-nav__center--active' : ''}`}
                key={`${item.id}-${i18n.language}`}
                onClick={() => navigate(route)}
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
              onClick={() => navigate(route)}
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
                  {message.recommendations && message.recommendations.length > 0 && (
                    <div className="chat-widget__recommendations">
                      <div className="chat-widget__recommendations-title">Рекомендуемые объявления:</div>
                      {message.recommendations.map((recId) => {
                        const property = allProperties.find(p => p.id === recId)
                        if (!property) return null
                        const propertyName = property.name || property.title || 'Объявление'
                        const propertyPrice = property.price ? `${property.price.toLocaleString('ru-RU')} €` : 'Цена не указана'
                        const propertyArea = property.area || property.sqft
                        const propertyRooms = property.rooms || property.beds
                        
                        return (
                          <a
                            key={recId}
                            href={`/property/${recId}`}
                            className="chat-widget__recommendation-link"
                            onClick={(e) => {
                              e.preventDefault()
                              navigate(`/property/${recId}`, { 
                                state: { property: property }
                              })
                              setIsChatOpen(false)
                            }}
                          >
                            <div className="chat-widget__recommendation-item">
                              <div className="chat-widget__recommendation-title">{propertyName}</div>
                              <div className="chat-widget__recommendation-location">{property.location}</div>
                              <div className="chat-widget__recommendation-details">
                                {propertyRooms && <span>{propertyRooms} {propertyRooms === 1 ? 'комната' : propertyRooms < 5 ? 'комнаты' : 'комнат'}</span>}
                                {propertyArea && <span>{propertyArea} м²</span>}
                              </div>
                              <div className="chat-widget__recommendation-price">{propertyPrice}</div>
                            </div>
                          </a>
                        )
                      })}
                    </div>
                  )}
                </div>
                {message.buttons && message.buttons.length > 0 && (
                  <div className="chat-widget__buttons">
                    {message.buttons.map((button, index) => (
                      <button
                        key={index}
                        className="chat-widget__button"
                        onClick={() => !isLoadingAI && handleButtonClick(button)}
                        disabled={isLoadingAI}
                      >
                        {button}
                      </button>
                    ))}
                  </div>
                )}
                <div className="chat-widget__message-time">
                  {message.timestamp.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
            {isLoadingAI && (
              <div className="chat-widget__message chat-widget__message--bot">
                <div className="chat-widget__message-content">
                  <div className="chat-widget__typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form className="chat-widget__input-form" onSubmit={handleChatSubmit}>
            <input
              type="text"
              className="chat-widget__input"
              placeholder={isLoadingAI ? "AI думает..." : "Введите ваше сообщение..."}
              value={chatInput}
              onChange={handleChatInputChange}
              disabled={isLoadingAI}
              autoFocus
            />
            <button
              type="submit"
              className="chat-widget__send"
              aria-label={t('sendMessage')}
              disabled={isLoadingAI}
            >
              <FiSend size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Модальное окно успешной верификации */}
      {showVerificationSuccess && verificationNotification && (
        <VerificationSuccessNotification
          notification={verificationNotification}
          onClose={handleVerificationClose}
          onView={handleNotificationView}
        />
      )}

      {/* Модальное окно входа/регистрации */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
  )
}

export default MainPage
