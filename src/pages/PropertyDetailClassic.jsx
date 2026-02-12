import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useUser } from '@clerk/clerk-react'
import {
  FiArrowLeft,
  FiShare2,
  FiHeart,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiUser,
  FiClock,
  FiArrowUp,
} from 'react-icons/fi'
import { FaHeart as FaHeartSolid } from 'react-icons/fa'
import { IoLocationOutline } from 'react-icons/io5'
import { isAuthenticated } from '../services/authService'
import PropertyTimer from '../components/PropertyTimer'
import CircularTimer from '../components/CircularTimer'
import BiddingHistoryModal from '../components/BiddingHistoryModal'
import BuyNowModal from '../components/BuyNowModal'
import LocationMap from '../components/LocationMap'
import { showToast } from '../components/ToastContainer'
import BidOutbidNotification from '../components/BidOutbidNotification'
import Confetti from 'react-confetti'
import './PropertyDetailClassic.css'

import { getApiBaseUrl, getApiBaseUrlSync } from '../utils/apiConfig'

// Используем синхронную версию для инициализации, затем обновим при загрузке
let API_BASE_URL = getApiBaseUrlSync()

// Классическая страница объекта.
// Для аукционных объектов дополнительно отображает таймер и историю ставок.
function PropertyDetailClassic({ property: initialProperty, onBack, showDocuments = false }) {
  const { t } = useTranslation()
  const { user, isLoaded: userLoaded } = useUser()
  const [property, setProperty] = useState(initialProperty)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const thumbnailScrollRef = useRef(null)
  const [isBidHistoryOpen, setIsBidHistoryOpen] = useState(false)
  const [isBuyNowModalOpen, setIsBuyNowModalOpen] = useState(false)
  const [mapCoordinates, setMapCoordinates] = useState(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [bidAmount, setBidAmount] = useState('')
  const [isSubmittingBid, setIsSubmittingBid] = useState(false)
  const [currentBid, setCurrentBid] = useState(null)
  const [recentBids, setRecentBids] = useState([])
  const [userLastBid, setUserLastBid] = useState(null) // Последняя ставка пользователя
  const [bidOutbidShown, setBidOutbidShown] = useState(false) // Флаг, что уведомление о перебитии уже показано
  const [previousLeaderId, setPreviousLeaderId] = useState(null) // ID предыдущего лидера (кто делал максимальную ставку)
  const wasUserLeaderRef = useRef(false) // Ref для отслеживания, был ли пользователь лидером в предыдущем цикле
  const isInitialLoadRef = useRef(true) // Ref для отслеживания первой загрузки
  const [priceAnimation, setPriceAnimation] = useState(false) // Флаг для анимации изменения цены
  const [prevBid, setPrevBid] = useState(null) // Предыдущая ставка для сравнения
  const [outbidNotification, setOutbidNotification] = useState(null) // Уведомление о перебитой ставке
  const shownNotificationIdsRef = useRef(new Set()) // ID показанных уведомлений
  const [isUserLeader, setIsUserLeader] = useState(false) // Флаг, что пользователь является лидером
  const [currentLeaderId, setCurrentLeaderId] = useState(null) // ID текущего лидера
  const [currentLeader, setCurrentLeader] = useState(null) // Информация о текущем лидере (игрок с наивысшей ставкой)
  const [previousLeader, setPreviousLeader] = useState(null) // Предыдущий лидер для анимации
  const [isLeaderChanging, setIsLeaderChanging] = useState(false) // Флаг анимации смены лидера
  const [originalTestTimer, setOriginalTestTimer] = useState(null) // Исходное значение тестового таймера (дата окончания)
  const [originalTestTimerDuration, setOriginalTestTimerDuration] = useState(null) // Исходная длительность таймера в миллисекундах
  const [timerExpired, setTimerExpired] = useState(false) // Флаг окончания таймера
  const [showConfetti, setShowConfetti] = useState(false) // Флаг показа конфетти для победителя
  const confettiShownRef = useRef(false) // Ref для отслеживания, было ли показано конфетти
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })
  
  // Отслеживаем изменения currentBid и запускаем анимацию при росте
  useEffect(() => {
    if (currentBid !== null && prevBid !== null && currentBid > prevBid) {
      console.log('🎬 Запуск анимации цены:', { prevBid, currentBid })
      setPriceAnimation(true)
      const timer = setTimeout(() => {
        setPriceAnimation(false)
      }, 2000) // Анимация длится 2 секунды
      return () => clearTimeout(timer)
    }
  }, [currentBid, prevBid])

  // Отслеживаем размер окна для конфетти
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Отслеживаем истечение таймера и показываем конфетти для победителя
  useEffect(() => {
    if (timerExpired && isUserLeader && !confettiShownRef.current) {
      setShowConfetti(true);
      confettiShownRef.current = true;
      // Скрываем конфетти через 7 секунд
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [timerExpired, isUserLeader])


  // Функция для обработки URL документа
  const processDocumentUrl = (docUrl) => {
    if (!docUrl) return null
    
    // Data URL (base64) - используем как есть
    if (docUrl.startsWith('data:')) {
      return docUrl
    }
    
    // Полный HTTP/HTTPS URL - используем как есть
    if (docUrl.startsWith('http://') || docUrl.startsWith('https://')) {
      return docUrl
    }
    
    // Получаем базовый URL без /api
    const baseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '')
    
    // Путь начинается с /uploads/ - добавляем базовый URL
    if (docUrl.startsWith('/uploads/')) {
      return `${baseUrl}${docUrl}`
    }
    
    // Путь начинается с uploads/ без слеша - добавляем / и базовый URL
    if (docUrl.startsWith('uploads/')) {
      return `${baseUrl}/${docUrl}`
    }
    
    // Относительный путь - добавляем /uploads/
    return `${baseUrl}/uploads/${docUrl}`
  }

  // Функция для определения типа документа
  const getDocumentType = (docUrl, docName) => {
    if (!docUrl) return 'image'
    
    // Проверяем имя файла
    if (docName && (docName.toLowerCase().endsWith('.pdf') || docName.toLowerCase().includes('.pdf'))) {
      return 'pdf'
    }
    
    // Проверяем URL на .pdf
    if (typeof docUrl === 'string') {
      if (docUrl.toLowerCase().endsWith('.pdf') || docUrl.toLowerCase().includes('.pdf')) {
        return 'pdf'
      }
      // Проверяем MIME тип в base64
      if (docUrl.startsWith('data:application/pdf') || docUrl.startsWith('data:application/octet-stream')) {
        return 'pdf'
      }
    }
    
    return 'image'
  }

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

  // Инициализируем API URL при монтировании компонента
  useEffect(() => {
    const initApiUrl = async () => {
      const url = await getApiBaseUrl()
      API_BASE_URL = url
    }
    initApiUrl()
  }, [])

  // Используем геокодированные координаты или исходные
  const finalCoordinates = mapCoordinates || coordinates

  // Нормализуем данные под формат детальной страницы (используем данные как есть, как в админке)
  const displayProperty = {
    ...property,
    name: property.title || property.name,
    sqft: property.area || property.sqft,
    area: property.area || property.sqft,
    living_area: property.living_area || property.livingArea || null,
    beds: property.rooms ?? property.beds,
    rooms: property.rooms ?? property.beds,
    bedrooms: property.bedrooms || property.rooms,
    bathrooms: property.bathrooms || property.baths || 0,
    coordinates: coordinates,
    // Убеждаемся, что все поля передаются (сохраняем null если есть, но не перезаписываем 0)
    floor: property.floor !== undefined && property.floor !== null ? property.floor : null,
    total_floors: property.total_floors !== undefined && property.total_floors !== null ? property.total_floors : null,
    year_built: property.year_built !== undefined && property.year_built !== null ? property.year_built : null,
    property_type: property.property_type || property.propertyType,
    building_type: property.building_type || property.buildingType,
    land_area: property.land_area,
    renovation: property.renovation,
    condition: property.condition,
    heating: property.heating,
    water_supply: property.water_supply,
    sewerage: property.sewerage,
    commercial_type: property.commercial_type,
    business_hours: property.business_hours,
    additional_amenities: property.additional_amenities || property.additionalAmenities || null,
    // Удобства - нормализуем булевы значения
    balcony: property.balcony === true || property.balcony === 1 || property.balcony === '1',
    parking: property.parking === true || property.parking === 1 || property.parking === '1',
    elevator: property.elevator === true || property.elevator === 1 || property.elevator === '1',
    garage: property.garage === true || property.garage === 1 || property.garage === '1',
    pool: property.pool === true || property.pool === 1 || property.pool === '1',
    garden: property.garden === true || property.garden === 1 || property.garden === '1',
    electricity: property.electricity === true || property.electricity === 1 || property.electricity === '1',
    internet: property.internet === true || property.internet === 1 || property.internet === '1',
    security: property.security === true || property.security === 1 || property.security === '1',
    furniture: property.furniture === true || property.furniture === 1 || property.furniture === '1',
    // Цена - используем обычную стоимость объекта (минимальная цена продажи), а не начальную ставку
    price: property.price,
    currentBid: property.currentBid,
    auction_starting_price: property.auction_starting_price || property.auctionStartingPrice,
    currency: property.currency || 'USD',
    // Документы
    ownership_document: property.ownership_document || property.ownershipDocument,
    no_debts_document: property.no_debts_document || property.noDebtsDocument,
    additional_documents: property.additional_documents || property.additionalDocuments,
    // Тест-драйв - сохраняем значение как есть из property
    test_drive: property.test_drive,
    testDrive: property.testDrive !== undefined ? property.testDrive : (property.test_drive !== undefined ? (property.test_drive === 1 || property.test_drive === true) : false),
    // Тестовый таймер
    test_timer_end_date: property.test_timer_end_date || null,
    test_timer_duration: property.test_timer_duration || null, // Исходная длительность таймера в миллисекундах
    endTime: property.test_timer_end_date || property.endTime || null,
  }

  console.log('🔍 PropertyDetailClassic - displayProperty:', displayProperty)
  console.log('🔍 PropertyDetailClassic - test_drive:', {
    property_test_drive: property.test_drive,
    property_test_drive_type: typeof property.test_drive,
    property_testDrive: property.testDrive,
    displayProperty_test_drive: displayProperty.test_drive,
    displayProperty_test_drive_type: typeof displayProperty.test_drive,
    displayProperty_testDrive: displayProperty.testDrive,
    check1: displayProperty.test_drive === 1,
    check2: displayProperty.test_drive === true,
    check3: displayProperty.testDrive === true,
    willShow: (displayProperty.test_drive === 1 || displayProperty.test_drive === true || displayProperty.testDrive === true)
  })
  console.log('🔍 PropertyDetailClassic - Жилая площадь:', {
    living_area: displayProperty.living_area,
    property_living_area: property.living_area,
    property_livingArea: property.livingArea,
    type: typeof displayProperty.living_area,
    isNull: displayProperty.living_area === null,
    isUndefined: displayProperty.living_area === undefined,
    isEmpty: displayProperty.living_area === ''
  })
  console.log('🔍 PropertyDetailClassic - building_type:', {
    building_type: displayProperty.building_type,
    property_building_type: property.building_type,
    property_buildingType: property.buildingType
  })
  console.log('🔍 PropertyDetailClassic - Дополнительные удобства:', {
    additional_amenities: displayProperty.additional_amenities,
    property_additional_amenities: property.additional_amenities,
    property_additionalAmenities: property.additionalAmenities
  })

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
    displayProperty.test_timer_end_date ||
    displayProperty.endTime ||
    displayProperty.auction_end_date ||
    null

  // Сохраняем исходное значение тестового таймера и его длительность при первой загрузке
  useEffect(() => {
    if (displayProperty.test_timer_end_date) {
      if (!originalTestTimer) {
        setOriginalTestTimer(displayProperty.test_timer_end_date);
      }
      // Используем сохраненную длительность из базы данных, если она есть
      if (displayProperty.test_timer_duration && !originalTestTimerDuration) {
        setOriginalTestTimerDuration(displayProperty.test_timer_duration);
        console.log('💾 Сохранена исходная длительность таймера из БД:', displayProperty.test_timer_duration, 'мс (', Math.floor(displayProperty.test_timer_duration / 60000), 'мин', Math.floor((displayProperty.test_timer_duration % 60000) / 1000), 'сек)');
      } else if (!displayProperty.test_timer_duration && !originalTestTimerDuration) {
        // Fallback: вычисляем длительность как разницу между датой окончания и текущим временем
        const endDate = new Date(displayProperty.test_timer_end_date);
        const now = new Date();
        const duration = Math.max(0, endDate.getTime() - now.getTime());
        
        if (duration > 0) {
          setOriginalTestTimerDuration(duration);
          console.log('💾 Вычислена исходная длительность таймера:', duration, 'мс (', Math.floor(duration / 60000), 'мин', Math.floor((duration % 60000) / 1000), 'сек)');
        } else {
          // Если таймер истек и длительность не сохранена, используем значение по умолчанию
          const defaultDuration = 10 * 60 * 1000; // 10 минут по умолчанию
          setOriginalTestTimerDuration(defaultDuration);
          console.log('⚠️ Таймер истек, используем длительность по умолчанию:', defaultDuration, 'мс');
        }
      }
    }
  }, [displayProperty.test_timer_end_date, displayProperty.test_timer_duration]);

  // Загружаем ставки для аукционных объектов и обновляем текущую ставку
  useEffect(() => {
    if (!isAuctionProperty || !displayProperty.id) return

    const loadBids = async () => {
      try {
        // Получаем userId для проверки ставок пользователя
        const isClerkAuth = user && userLoaded
        const isOldAuth = isAuthenticated()
        
        let userId = null
        if (isClerkAuth && user) {
          const savedUserId = localStorage.getItem('userId')
          if (savedUserId && /^\d+$/.test(savedUserId)) {
            userId = parseInt(savedUserId)
          } else {
            // Пытаемся получить из БД по email
            try {
              const userEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress
              if (userEmail) {
                const userResponse = await fetch(`${API_BASE_URL}/users/email/${encodeURIComponent(userEmail)}`)
                if (userResponse.ok) {
                  const userData = await userResponse.json()
                  if (userData.success && userData.data && userData.data.id) {
                    userId = userData.data.id
                    localStorage.setItem('userId', String(userId))
                  }
                }
              }
            } catch (e) {
              console.warn('Не удалось получить userId:', e)
            }
          }
        } else if (isOldAuth) {
          const { getUserData } = await import('../services/authService')
          const userData = getUserData()
          userId = userData?.id
        }

        const response = await fetch(`${API_BASE_URL}/bids/property/${displayProperty.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data && data.data.length > 0) {
            // Сортируем ставки по убыванию суммы и дате
            const sortedBids = [...data.data].sort((a, b) => {
              if (b.bid_amount !== a.bid_amount) {
                return b.bid_amount - a.bid_amount
              }
              return new Date(b.created_at) - new Date(a.created_at)
            })
            
            // Если есть ставки - показываем максимальную ставку
            const maxBid = sortedBids[0].bid_amount
            const leaderBid = sortedBids[0] // Полная информация о лидере
            const newCurrentLeaderId = leaderBid.user_id // ID текущего лидера (кто сделал максимальную ставку)
            const prevMaxBid = currentBid
            
            // Проверяем, изменился ли лидер перед обновлением
            const leaderChanged = currentLeaderId !== null && currentLeaderId !== newCurrentLeaderId
            
            // Если лидер изменился, сохраняем предыдущего лидера для анимации
            if (leaderChanged && currentLeader) {
              setPreviousLeader(currentLeader)
              setIsLeaderChanging(true)
              // После завершения анимации падения старой карточки, убираем её
              setTimeout(() => {
                setPreviousLeader(null)
                setIsLeaderChanging(false)
              }, 600) // Время анимации падения
            }
            
            // Сохраняем информацию о лидере
            setCurrentLeader({
              id: leaderBid.user_id,
              firstName: leaderBid.first_name || '',
              lastName: leaderBid.last_name || '',
              email: leaderBid.email || '',
              bidAmount: maxBid,
              bidDate: leaderBid.created_at
            })
            
            // Обновляем ID текущего лидера
            setCurrentLeaderId(newCurrentLeaderId)
            
            // Проверяем, является ли текущий пользователь лидером
            const isUserCurrentlyLeader = userId && newCurrentLeaderId === userId
            if (isUserCurrentlyLeader) {
              setIsUserLeader(true)
              console.log('🏆 Пользователь является лидером!', { userId, newCurrentLeaderId, maxBid })
            } else {
              setIsUserLeader(false)
            }
            
            // Проверяем, изменился ли лидер (только если это не первая загрузка)
            // Если пользователь был лидером в предыдущем цикле, а теперь не лидер - значит ставку перебили
            if (!isInitialLoadRef.current && userId && wasUserLeaderRef.current && !isUserCurrentlyLeader && !bidOutbidShown) {
              // Пользователь был лидером, а теперь не лидер - значит ставку перебили
              console.log('🚨 Ставка перебита!', {
                wasUserLeader: wasUserLeaderRef.current,
                isUserCurrentlyLeader,
                userId,
                newCurrentLeaderId,
                maxBid,
                prevMaxBid
              })
              showToast(`Вашу ставку перебили! Текущая максимальная ставка: ${maxBid.toLocaleString('ru-RU')}`, 'warning', 5000)
              setBidOutbidShown(true)
            }
            
            // Обновляем ref для следующего цикла
            wasUserLeaderRef.current = isUserCurrentlyLeader
            
            // После первой загрузки сбрасываем флаг
            if (isInitialLoadRef.current) {
              isInitialLoadRef.current = false
            }
            
            // Обновляем ID предыдущего лидера (после проверки перебития)
            setPreviousLeaderId(newCurrentLeaderId)
            
            setCurrentBid(prev => {
              if (prev !== maxBid) {
                setPrevBid(prev !== null ? prev : maxBid)
                return maxBid
              }
              return prev
            })
            
            // Обновляем userLastBid для отслеживания ставок пользователя
            if (userId) {
              const userBids = data.data.filter(b => b.user_id === userId)
              if (userBids.length > 0) {
                const userMaxBid = Math.max(...userBids.map(b => b.bid_amount))
                // Если пользователь сделал новую ставку (стал лидером), сбрасываем флаг
                if (newCurrentLeaderId === userId) {
                  setBidOutbidShown(false)
                  wasUserLeaderRef.current = true
                }
                setUserLastBid(userMaxBid)
              } else {
                if (userLastBid !== null) {
                  setUserLastBid(null)
                  setBidOutbidShown(false)
                }
              }
            }
            
            // Сохраняем последние две ставки (сортируем по дате для отображения последних)
            const sortedByDate = [...data.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            const newRecentBids = sortedByDate.slice(0, 2)
            setRecentBids(prev => {
              const prevStr = JSON.stringify(prev)
              const newStr = JSON.stringify(newRecentBids)
              if (prevStr !== newStr) {
                return newRecentBids
              }
              return prev
            })
          } else {
            // Если ставок нет - показываем стартовую цену
            const startingPrice = displayProperty.auction_starting_price || 0
            setCurrentBid(prev => {
              if (prev !== startingPrice) {
                return startingPrice
              }
              return prev
            })
            setRecentBids(prev => {
              if (prev.length > 0) {
                return []
              }
              return prev
            })
            // Сбрасываем лидера когда нет ставок
            setCurrentLeader(null)
            setCurrentLeaderId(null)
          }
        }
      } catch (error) {
        console.warn('Ошибка загрузки ставок:', error)
        // В случае ошибки показываем стартовую цену
        const startingPrice = displayProperty.auction_starting_price || 0
        setCurrentBid(prev => {
          if (prev !== startingPrice) {
            return startingPrice
          }
          return prev
        })
        setRecentBids(prev => {
          if (prev.length > 0) {
            return []
          }
          return prev
        })
      }
    }

    loadBids() 
    // Обновляем каждые 3 секунды
    const interval = setInterval(loadBids, 3000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayProperty.id, isAuctionProperty])

  // Периодически обновляем данные объекта с сервера для синхронизации таймера
  useEffect(() => {
    if (!displayProperty.id || !displayProperty.test_timer_end_date) return;

    const updatePropertyData = async () => {
      try {
        const propResponse = await fetch(`${API_BASE_URL}/properties/${displayProperty.id}`);
        if (propResponse.ok) {
          const propData = await propResponse.json();
          if (propData.success && propData.data) {
            const updatedProp = propData.data;
            // Обновляем только таймер, если он изменился
            if (updatedProp.test_timer_end_date !== property.test_timer_end_date) {
              setProperty(prev => ({
                ...prev,
                test_timer_end_date: updatedProp.test_timer_end_date,
                test_timer_duration: updatedProp.test_timer_duration
              }));
              console.log('🔄 Таймер обновлен с сервера:', updatedProp.test_timer_end_date);
            }
          }
        }
      } catch (error) {
        console.warn('Ошибка обновления данных объекта:', error);
      }
    };

    // Обновляем каждые 2 секунды для синхронизации таймера
    const interval = setInterval(updatePropertyData, 2000);
    return () => clearInterval(interval);
  }, [displayProperty.id, displayProperty.test_timer_end_date, property.test_timer_end_date]);

  // Проверяем, закончился ли таймер
  // Используем только значение из базы данных для синхронизации между всеми пользователями
  useEffect(() => {
    if (!auctionEndTime) return;
    
    const checkTimer = () => {
      const now = new Date().getTime();
      const end = new Date(auctionEndTime).getTime();
      if (end <= now) {
        setTimerExpired(true);
      } else {
        setTimerExpired(false);
      }
    };
    
    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [auctionEndTime]);

  // Проверяем уведомления о перебитой ставке для текущего объекта
  useEffect(() => {
    if (!isAuctionProperty || !displayProperty.id) return

    const checkNotifications = async () => {
      try {
        // Получаем userId
        const isClerkAuth = user && userLoaded
        const isOldAuth = isAuthenticated()
        
        let userId = null
        if (isClerkAuth && user) {
          const savedUserId = localStorage.getItem('userId')
          if (savedUserId && /^\d+$/.test(savedUserId)) {
            userId = parseInt(savedUserId)
          } else {
            try {
              const userEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress
              if (userEmail) {
                const userResponse = await fetch(`${API_BASE_URL}/users/email/${encodeURIComponent(userEmail)}`)
                if (userResponse.ok) {
                  const userData = await userResponse.json()
                  if (userData.success && userData.data && userData.data.id) {
                    userId = userData.data.id
                    localStorage.setItem('userId', String(userId))
                  }
                }
              }
            } catch (e) {
              console.warn('Не удалось получить userId:', e)
            }
          }
        } else if (isOldAuth) {
          const { getUserData } = await import('../services/authService')
          const userData = getUserData()
          userId = userData?.id
        }

        if (!userId) return

        // Загружаем уведомления пользователя
        const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            console.log('🔍 Проверка уведомлений для объекта:', displayProperty.id)
            console.log('🔍 Все уведомления:', data.data)
            console.log('🔍 Уведомления bid_outbid:', data.data.filter(n => n.type === 'bid_outbid'))
            
            // Ищем уведомления о перебитой ставке для текущего объекта
            const outbidNotifs = data.data.filter(n => {
              if (n.type !== 'bid_outbid') return false
              if (shownNotificationIdsRef.current.has(n.id)) return false
              if (n.view_count !== 0) return false
              
              // Парсим data, если это строка
              let notificationData = n.data
              if (typeof notificationData === 'string') {
                try {
                  notificationData = JSON.parse(notificationData)
                } catch (e) {
                  console.warn('Ошибка парсинга data уведомления:', e)
                  return false
                }
              }
              
              // Сравниваем property_id (может быть число или строка)
              const notifPropertyId = notificationData?.property_id
              const currentPropertyId = displayProperty.id
              
              console.log('🔍 Сравнение property_id:', {
                notifPropertyId,
                currentPropertyId,
                notifPropertyIdType: typeof notifPropertyId,
                currentPropertyIdType: typeof currentPropertyId,
                match: notifPropertyId == currentPropertyId || parseInt(notifPropertyId) === parseInt(currentPropertyId)
              })
              
              return notifPropertyId && (
                notifPropertyId == currentPropertyId || 
                parseInt(notifPropertyId) === parseInt(currentPropertyId)
              )
            })

            if (outbidNotifs.length > 0) {
              // Берем самое свежее уведомление
              const latestNotif = outbidNotifs.sort((a, b) => 
                new Date(b.created_at) - new Date(a.created_at)
              )[0]
              
              setOutbidNotification(latestNotif)
              shownNotificationIdsRef.current.add(latestNotif.id)
              console.log('🔔 Показано уведомление о перебитой ставке на странице объекта:', latestNotif.id)
            }
          }
        }
      } catch (error) {
        console.warn('Ошибка проверки уведомлений:', error)
      }
    }

    checkNotifications()
    // Проверяем каждые 5 секунд
    const interval = setInterval(checkNotifications, 5000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayProperty.id, isAuctionProperty, user, userLoaded])

  const handleToggleFavorite = () => {
    // Проверяем авторизацию через Clerk или старую систему
    const isClerkAuth = user && userLoaded
    const isOldAuth = isAuthenticated()
    
    // Разрешаем удаление из избранного без авторизации, но добавление требует авторизации
    if (!isFavorite && !isClerkAuth && !isOldAuth) {
      showToast('Пожалуйста, войдите в систему, чтобы добавлять объявления в избранное', 'warning')
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
    // Проверяем авторизацию
    const isClerkAuth = user && userLoaded
    const isOldAuth = isAuthenticated()
    
    if (!isClerkAuth && !isOldAuth) {
      showToast('Пожалуйста, войдите в систему, чтобы купить объект', 'warning')
      return
    }
    
    // Открываем модальное окно с инструкциями
    setIsBuyNowModalOpen(true)
  }

  const handleQuickBid = (amount) => {
    // Используем текущую максимальную ставку (currentBid), которая обновляется динамически
    // Если currentBid еще не загружен, используем значение из displayProperty или стартовую цену
    const startingPrice = displayProperty.auction_starting_price || 0
    const effectiveCurrentBid = currentBid !== null ? currentBid : (displayProperty.currentBid || startingPrice)
    
    // Если пользователь уже ввел сумму в поле, используем её как базу только если она >= текущей ставки
    // Иначе используем текущую максимальную ставку
    const currentInput = parseFloat(bidAmount) || 0
    
    // Базой должна быть либо введенная пользователем сумма (если она >= текущей ставки),
    // либо текущая максимальная ставка
    let baseAmount = effectiveCurrentBid
    if (currentInput > 0 && currentInput >= effectiveCurrentBid) {
      baseAmount = currentInput
    }
    
    // Добавляем значение кнопки к базовой сумме
    const quickBidAmount = baseAmount + amount
    
    // Убеждаемся, что итоговая сумма не меньше минимальной ставки (текущая + 1000)
    const minBidStep = 1000
    const minimumBid = effectiveCurrentBid + minBidStep
    const finalBidAmount = Math.max(quickBidAmount, minimumBid)
    
    setBidAmount(finalBidAmount.toString())
    
    console.log('🔢 handleQuickBid:', {
      amount,
      currentInput,
      effectiveCurrentBid,
      baseAmount,
      quickBidAmount,
      minimumBid,
      finalBidAmount
    })
  }

  const handleBidSubmit = async () => {
    // Проверяем авторизацию
    const isClerkAuth = user && userLoaded
    const isOldAuth = isAuthenticated()
    
    if (!isClerkAuth && !isOldAuth) {
      showToast('Пожалуйста, войдите в систему, чтобы сделать ставку', 'warning')
      return
    }

    const amount = parseFloat(bidAmount)
    if (!amount || isNaN(amount) || amount <= 0) {
      showToast('Пожалуйста, введите корректную сумму ставки', 'error')
      return
    }

    // Используем текущую максимальную ставку для проверки
    const startingPrice = displayProperty.auction_starting_price || 0
    const effectiveCurrentBid = currentBid !== null ? currentBid : (displayProperty.currentBid || startingPrice)
    
    // Минимальный шаг ставки - самая низкая сумма из кнопок (1000)
    const minBidStep = 1000
    const minimumBid = effectiveCurrentBid + minBidStep
    
    console.log('📤 handleBidSubmit:', {
      bidAmount,
      amount,
      currentBid,
      effectiveCurrentBid,
      startingPrice,
      minBidStep,
      minimumBid
    })
    
    if (amount < minimumBid) {
      showToast(`Минимальная ставка: ${minimumBid.toLocaleString('ru-RU')} (текущая ставка + ${minBidStep.toLocaleString('ru-RU')})`, 'error')
      return
    }

    setIsSubmittingBid(true)
    
    try {
      // Получаем user_id
      let userId = null
      
      if (isClerkAuth && user) {
        // Для Clerk - получаем внутренний user_id из БД
        // Сначала проверяем localStorage
        const savedUserId = localStorage.getItem('userId')
        if (savedUserId && /^\d+$/.test(savedUserId)) {
          userId = parseInt(savedUserId)
          console.log('📋 Используем user_id из localStorage:', userId)
        } else {
          // Пытаемся получить из БД по email или phone
          try {
            const userEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress
            if (userEmail) {
              const userResponse = await fetch(`${API_BASE_URL}/users/email/${encodeURIComponent(userEmail)}`)
              if (userResponse.ok) {
                const userData = await userResponse.json()
                if (userData.success && userData.data && userData.data.id) {
                  userId = userData.data.id
                  localStorage.setItem('userId', String(userId))
                  console.log('✅ Найден user_id по email:', userId)
                }
              }
            }
            
            // Если не нашли по email, пробуем по телефону
            if (!userId) {
              const userPhone = user.primaryPhoneNumber?.phoneNumber || user.phoneNumbers?.[0]?.phoneNumber
              if (userPhone) {
                const phoneResponse = await fetch(`${API_BASE_URL}/users/phone/${encodeURIComponent(userPhone)}`)
                if (phoneResponse.ok) {
                  const phoneData = await phoneResponse.json()
                  if (phoneData.success && phoneData.data && phoneData.data.id) {
                    userId = phoneData.data.id
                    localStorage.setItem('userId', String(userId))
                    console.log('✅ Найден user_id по телефону:', userId)
                  }
                }
              }
            }
          } catch (e) {
            console.warn('⚠️ Не удалось получить user_id из БД:', e)
          }
        }
      } else if (isOldAuth) {
        // Для старой системы авторизации
        const { getUserData } = await import('../services/authService')
        const userData = getUserData()
        userId = userData?.id
        console.log('📋 Используем user_id из старой системы:', userId)
      }
      
      if (!userId) {
        console.error('❌ Не удалось определить user_id')
        showToast('Не удалось определить пользователя. Пожалуйста, войдите в систему.', 'error')
        setIsSubmittingBid(false)
        return
      }
      
      console.log('✅ Используем user_id:', userId)

      const requestBody = {
        user_id: parseInt(userId),
        property_id: parseInt(displayProperty.id),
        bid_amount: parseFloat(amount)
      }
      
      console.log('📤 Отправка ставки:', requestBody)
      console.log('📤 Типы данных:', {
        user_id: typeof requestBody.user_id,
        property_id: typeof requestBody.property_id,
        bid_amount: typeof requestBody.bid_amount
      })
      
      // Отправляем ставку на сервер
      const response = await fetch(`${API_BASE_URL}/bids`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('📥 Ответ сервера:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Ошибка HTTP:', response.status, errorText)
        let errorMessage = `Ошибка сервера: ${response.status}`
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          // Используем стандартное сообщение
        }
        showToast(errorMessage, 'error')
        setIsSubmittingBid(false)
        return
      }
      
      const data = await response.json()
      console.log('📥 Данные ответа:', data)
      
      if (data.success) {
        console.log('✅ Ставка успешно создана на сервере:', data)
        setBidAmount('')
        
        // Если это тестовый таймер - сбрасываем его до исходного значения
        if (displayProperty.test_timer_end_date && originalTestTimerDuration !== null) {
          console.log('🔄 Сброс тестового таймера до исходного значения');
          try {
            // Вычисляем новую дату окончания на основе текущего времени + исходная длительность
            const now = new Date();
            const newEndDate = new Date(now.getTime() + originalTestTimerDuration);
            
            console.log('🔄 Вычислена новая дата окончания:', {
              now: now.toISOString(),
              duration: originalTestTimerDuration,
              newEndDate: newEndDate.toISOString()
            });
            
            const resetResponse = await fetch(`${API_BASE_URL}/properties/${displayProperty.id}/test-timer`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                test_timer_end_date: newEndDate.toISOString(),
                test_timer_duration: originalTestTimerDuration // Сохраняем исходную длительность
              })
            });
            
            if (resetResponse.ok) {
              const resetData = await resetResponse.json();
              if (resetData.success) {
                console.log('✅ Тестовый таймер сброшен на сервере до исходного значения');
                setTimerExpired(false);
                // Обновляем данные объекта с сервера для синхронизации таймера со всеми пользователями
                try {
                  const propResponse = await fetch(`${API_BASE_URL}/properties/${displayProperty.id}`);
                  if (propResponse.ok) {
                    const propData = await propResponse.json();
                    if (propData.success && propData.data) {
                      const updatedProp = propData.data;
                      // Обновляем свойство для синхронизации таймера
                      setProperty(prev => ({
                        ...prev,
                        test_timer_end_date: updatedProp.test_timer_end_date,
                        test_timer_duration: updatedProp.test_timer_duration
                      }));
                      console.log('✅ Данные объекта обновлены с сервера:', updatedProp.test_timer_end_date);
                    }
                  }
                } catch (propError) {
                  console.error('❌ Ошибка при обновлении данных объекта:', propError);
                }
              }
            } else {
              const errorData = await resetResponse.json().catch(() => ({}));
              console.error('❌ Ошибка при сбросе таймера на сервере:', errorData);
            }
          } catch (resetError) {
            console.error('❌ Ошибка при сбросе таймера:', resetError);
          }
        }
        
        // Сохраняем ставку пользователя для проверки перебития
        setUserLastBid(amount)
        setBidOutbidShown(false) // Сбрасываем флаг при новой ставке
        // После новой ставки пользователь становится лидером
        wasUserLeaderRef.current = true
        // После успешной ставки пользователь становится лидером
        setPreviousLeaderId(userId)
        
        // Обновляем текущую ставку сразу после успешной ставки
        setCurrentBid(prev => {
          setPrevBid(prev !== null ? prev : amount)
          return amount
        })
        console.log(`✅ Обновлена текущая ставка на: ${amount}`)
        
        // Перезагружаем данные через небольшую задержку для синхронизации с сервером
        setTimeout(async () => {
          try {
            const bidsResponse = await fetch(`${API_BASE_URL}/bids/property/${displayProperty.id}`)
            if (bidsResponse.ok) {
              const bidsData = await bidsResponse.json()
              if (bidsData.success && bidsData.data && bidsData.data.length > 0) {
                // Сортируем по дате для получения последних ставок
                const sortedByDate = [...bidsData.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                setRecentBids(sortedByDate.slice(0, 2))
                
                // Сортируем ставки для определения лидера
                const sortedBids = [...bidsData.data].sort((a, b) => {
                  if (b.bid_amount !== a.bid_amount) {
                    return b.bid_amount - a.bid_amount
                  }
                  return new Date(b.created_at) - new Date(a.created_at)
                })
                
                const maxBid = sortedBids[0].bid_amount
                const leaderBid = sortedBids[0]
                const newCurrentLeaderId = leaderBid.user_id
                
                // Проверяем, изменился ли лидер перед обновлением
                const leaderChanged = currentLeaderId !== null && currentLeaderId !== newCurrentLeaderId
                
                // Если лидер изменился, сохраняем предыдущего лидера для анимации
                if (leaderChanged && currentLeader) {
                  setPreviousLeader(currentLeader)
                  setIsLeaderChanging(true)
                  // После завершения анимации падения старой карточки, убираем её
                  setTimeout(() => {
                    setPreviousLeader(null)
                    setIsLeaderChanging(false)
                  }, 600) // Время анимации падения
                }
                
                // Обновляем информацию о лидере
                setCurrentLeader({
                  id: leaderBid.user_id,
                  firstName: leaderBid.first_name || '',
                  lastName: leaderBid.last_name || '',
                  email: leaderBid.email || '',
                  bidAmount: maxBid,
                  bidDate: leaderBid.created_at
                })
                setCurrentLeaderId(newCurrentLeaderId)
                
                setCurrentBid(prev => {
                  if (prev !== maxBid) {
                    setPrevBid(prev !== null ? prev : maxBid)
                    return maxBid
                  }
                  return prev
                })
                console.log(`✅ Обновлена текущая ставка после синхронизации: ${maxBid}`)
                
                // Обновляем userLastBid, если пользователь сделал ставку
                if (userId) {
                  const userBids = bidsData.data.filter(b => b.user_id === userId)
                  if (userBids.length > 0) {
                    const userMaxBid = Math.max(...userBids.map(b => b.bid_amount))
                    setUserLastBid(userMaxBid)
                    setBidOutbidShown(false)
                    const isUserLeaderNow = leaderBid.user_id === userId
                    setIsUserLeader(isUserLeaderNow)
                    wasUserLeaderRef.current = isUserLeaderNow
                    console.log('✅ Обновлена userLastBid после синхронизации:', userMaxBid)
                  }
                }
              }
            }
          } catch (err) {
            console.warn('Ошибка обновления ставок после создания:', err)
          }
        }, 1000)
        
        showToast(`Ставка ${amount.toLocaleString('ru-RU')} ${displayProperty.currency || 'USD'} успешно отправлена!`, 'success', 4000)
      } else {
        console.error('❌ Ошибка создания ставки:', data)
        showToast(data.error || 'Ошибка при создании ставки', 'error')
      }
    } catch (error) {
      console.error('❌ Ошибка при отправке ставки:', error)
      showToast(`Ошибка сети: ${error.message}`, 'error')
    } finally {
      setIsSubmittingBid(false)
    }
  }

  const handleBidAmountChange = (e) => {
    const value = e.target.value.replace(/[^\d.]/g, '')
    setBidAmount(value)
  }

  const handleCloseOutbidNotification = () => {
    setOutbidNotification(null)
  }

  const handleGoToPropertyFromNotification = (propertyId) => {
    // Если мы уже на странице этого объекта, просто прокручиваем к форме ставки
    if (propertyId === displayProperty.id) {
      const bidForm = document.querySelector('.property-detail-sidebar__bid-form')
      if (bidForm) {
        bidForm.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  return (
    <div className="property-detail-page-new">
      {showConfetti && (
        <>
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={400}
            gravity={0.3}
            wind={0.05}
            colors={['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#fbbf24']}
            confettiSource={{
              x: windowSize.width / 2,
              y: windowSize.height / 2,
              w: 0,
              h: 0
            }}
            initialVelocityX={15}
            initialVelocityY={30}
            tweenDuration={7000}
          />
          <div className="winner-celebration">
            <div className="winner-celebration__balloons">
              <div className="balloon balloon--1">🎈</div>
              <div className="balloon balloon--2">🎈</div>
              <div className="balloon balloon--3">🎈</div>
              <div className="balloon balloon--4">🎈</div>
              <div className="balloon balloon--5">🎈</div>
              <div className="balloon balloon--6">🎈</div>
            </div>
            <div className="winner-celebration__emojis">
              <div className="celebration-emoji celebration-emoji--1">🎉</div>
              <div className="celebration-emoji celebration-emoji--2">🏆</div>
              <div className="celebration-emoji celebration-emoji--3">✨</div>
              <div className="celebration-emoji celebration-emoji--4">🎊</div>
              <div className="celebration-emoji celebration-emoji--5">🌟</div>
              <div className="celebration-emoji celebration-emoji--6">💫</div>
              <div className="celebration-emoji celebration-emoji--7">🎁</div>
              <div className="celebration-emoji celebration-emoji--8">🥳</div>
            </div>
            <div className="winner-celebration__message">
              <h2 className="winner-celebration__title">Объект Ваш!</h2>
              <p className="winner-celebration__subtitle">Вы выиграли аукцион! 🎉</p>
            </div>
          </div>
        </>
      )}
      {outbidNotification && (
        <BidOutbidNotification
          notification={outbidNotification}
          onClose={handleCloseOutbidNotification}
          onGoToProperty={handleGoToPropertyFromNotification}
        />
      )}
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
                {/* Анимация изменения цены поверх изображения */}
                {priceAnimation && currentBid !== null && isAuctionProperty && (
                  <div className="property-detail-gallery__price-overlay">
                    <div className="price-overlay__content">
                      <div className="price-overlay__label">Новая ставка</div>
                      <div className="price-overlay__value-wrapper">
                        <span className="price-overlay__value">
                          {displayProperty.currency === 'USD' ? '$' : displayProperty.currency === 'EUR' ? '€' : displayProperty.currency === 'BYN' ? 'Br' : ''}
                          {currentBid.toLocaleString('ru-RU')}
                        </span>
                        <FiArrowUp className="price-overlay__arrow" size={24} />
                      </div>
                    </div>
                  </div>
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
              {/* Подробная информация - показываем всегда */}
              <div className="property-detail-info-block">
                <h3 className="property-detail-info-block__title">Подробная информация</h3>
                <div className="property-detail-info-block__content property-detail-info-block__content--horizontal">
                    <div className="property-detail-info-item property-detail-info-item--horizontal">
                      <span className="property-detail-info-label">Комнаты:</span>
                      <span className="property-detail-info-value">
                        {displayProperty.rooms || displayProperty.beds || displayProperty.bedrooms || '—'}
                      </span>
                    </div>
                    <div className="property-detail-info-item property-detail-info-item--horizontal">
                      <span className="property-detail-info-label">Площадь общая:</span>
                      <span className="property-detail-info-value">
                        {(displayProperty.area || displayProperty.sqft) ? `${displayProperty.area || displayProperty.sqft} м²` : '—'}
                      </span>
                    </div>
                    {(displayProperty.living_area !== null && displayProperty.living_area !== undefined && displayProperty.living_area !== '' && Number(displayProperty.living_area) > 0) && (
                      <div className="property-detail-info-item property-detail-info-item--horizontal">
                        <span className="property-detail-info-label">Площадь жилая:</span>
                        <span className="property-detail-info-value">
                          {displayProperty.living_area} м²
                        </span>
                      </div>
                    )}
                    <div className="property-detail-info-item property-detail-info-item--horizontal">
                      <span className="property-detail-info-label">Ванны:</span>
                      <span className="property-detail-info-value">{displayProperty.bathrooms || '—'}</span>
                    </div>
                    <div className="property-detail-info-item property-detail-info-item--horizontal">
                      <span className="property-detail-info-label">Этаж:</span>
                      <span className="property-detail-info-value">
                        {(displayProperty.floor !== undefined && displayProperty.floor !== null) ? displayProperty.floor : '—'}
                      </span>
                    </div>
                    <div className="property-detail-info-item property-detail-info-item--horizontal">
                      <span className="property-detail-info-label">Этажность:</span>
                      <span className="property-detail-info-value">
                        {(displayProperty.total_floors !== undefined && displayProperty.total_floors !== null) ? displayProperty.total_floors : '—'}
                      </span>
                    </div>
                    <div className="property-detail-info-item property-detail-info-item--horizontal">
                      <span className="property-detail-info-label">Тип дома:</span>
                      <span className="property-detail-info-value">
                        {displayProperty.building_type ? (
                          displayProperty.building_type === 'monolithic' ? 'Монолитный' :
                          displayProperty.building_type === 'brick' ? 'Кирпичный' :
                          displayProperty.building_type === 'panel' ? 'Панельный' :
                          displayProperty.building_type === 'block' ? 'Блочный' :
                          displayProperty.building_type === 'wood' ? 'Деревянный' :
                          displayProperty.building_type === 'frame' ? 'Каркасный' :
                          displayProperty.building_type === 'aerated_concrete' ? 'Газобетонный' :
                          displayProperty.building_type === 'foam_concrete' ? 'Пенобетонный' :
                          displayProperty.building_type === 'other' ? 'Другой' :
                          displayProperty.building_type
                        ) : '—'}
                      </span>
                    </div>
                    <div className="property-detail-info-item property-detail-info-item--horizontal">
                      <span className="property-detail-info-label">Год постройки:</span>
                      <span className="property-detail-info-value">
                        {(displayProperty.year_built !== undefined && displayProperty.year_built !== null) ? displayProperty.year_built : '—'}
                      </span>
                    </div>
                    <div className="property-detail-info-item property-detail-info-item--horizontal">
                      <span className="property-detail-info-label">Есть тест-драйв:</span>
                      <span className="property-detail-info-value">
                        {(() => {
                          const testDriveValue = displayProperty.test_drive;
                          const isTestDrive = testDriveValue === 1 || testDriveValue === true || displayProperty.testDrive === true;
                          console.log('🔍 PropertyDetailClassic - Отображение test_drive:', {
                            testDriveValue,
                            testDriveValue_type: typeof testDriveValue,
                            displayProperty_testDrive: displayProperty.testDrive,
                            isTestDrive,
                            result: isTestDrive ? 'Да' : 'Нет'
                          });
                          return isTestDrive ? 'Да' : 'Нет';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

              {/* Дополнительная информация - показываем если есть данные */}
              {((displayProperty.renovation !== undefined && displayProperty.renovation !== null && displayProperty.renovation !== '') || 
                (displayProperty.condition !== undefined && displayProperty.condition !== null && displayProperty.condition !== '') || 
                (displayProperty.heating !== undefined && displayProperty.heating !== null && displayProperty.heating !== '') || 
                (displayProperty.water_supply !== undefined && displayProperty.water_supply !== null && displayProperty.water_supply !== '') || 
                (displayProperty.sewerage !== undefined && displayProperty.sewerage !== null && displayProperty.sewerage !== '') || 
                (displayProperty.commercial_type !== undefined && displayProperty.commercial_type !== null && displayProperty.commercial_type !== '') || 
                (displayProperty.business_hours !== undefined && displayProperty.business_hours !== null && displayProperty.business_hours !== '')) && (
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

              {/* Удобства - красивый горизонтальный блок */}
              <div className="property-detail-info-block">
                <h3 className="property-detail-info-block__title">Удобства</h3>
                <div className="property-detail-info-block__content property-detail-info-block__content--amenities">
                  {(() => {
                    // Функция для проверки удобства (работает с разными форматами)
                    const hasAmenity = (value) => {
                      return value === 1 || value === true || value === '1' || value === 'true'
                    }
                    
                    const amenities = []
                    
                    if (hasAmenity(property.balcony) || hasAmenity(displayProperty.balcony)) {
                      amenities.push('Балкон')
                    }
                    if (hasAmenity(property.parking) || hasAmenity(displayProperty.parking)) {
                      amenities.push('Парковка')
                    }
                    if (hasAmenity(property.elevator) || hasAmenity(displayProperty.elevator)) {
                      amenities.push('Лифт')
                    }
                    if (hasAmenity(property.garage) || hasAmenity(displayProperty.garage)) {
                      amenities.push('Гараж')
                    }
                    if (hasAmenity(property.pool) || hasAmenity(displayProperty.pool)) {
                      amenities.push('Бассейн')
                    }
                    if (hasAmenity(property.garden) || hasAmenity(displayProperty.garden)) {
                      amenities.push('Сад')
                    }
                    if (hasAmenity(property.electricity) || hasAmenity(displayProperty.electricity)) {
                      amenities.push('Электричество')
                    }
                    if (hasAmenity(property.internet) || hasAmenity(displayProperty.internet)) {
                      amenities.push('Интернет')
                    }
                    if (hasAmenity(property.security) || hasAmenity(displayProperty.security)) {
                      amenities.push('Охрана')
                    }
                    if (hasAmenity(property.furniture) || hasAmenity(displayProperty.furniture)) {
                      amenities.push('Мебель')
                    }
                    
                    if (amenities.length === 0) {
                      return <span className="amenity-item">Удобства не указаны</span>
                    }
                    
                    return amenities.map((amenity, index) => (
                      <span key={index} className="amenity-item">{amenity}</span>
                    ))
                  })()}
                </div>
              </div>

              {/* Дополнительная информация (текст, который пользователь написал сам) */}
              {(() => {
                const additionalInfo = displayProperty.additional_amenities || property.additional_amenities || property.additionalAmenities
                const hasAdditionalInfo = additionalInfo && typeof additionalInfo === 'string' && additionalInfo.trim() !== ''
                console.log('🔍 Дополнительная информация:', {
                  displayProperty_additional_amenities: displayProperty.additional_amenities,
                  property_additional_amenities: property.additional_amenities,
                  property_additionalAmenities: property.additionalAmenities,
                  additionalInfo,
                  hasAdditionalInfo
                })
                return hasAdditionalInfo ? (
                  <div className="property-detail-info-block">
                    <h3 className="property-detail-info-block__title">Дополнительная информация</h3>
                    <div className="property-detail-info-block__content property-detail-info-block__content--text">
                      <p>{additionalInfo}</p>
                    </div>
                  </div>
                ) : null
              })()}
            </div>
          </div>

          {/* Правая колонка */}
          <div className="property-detail-sidebar">
            <div className="property-detail-sidebar__content">
              {/* Название */}
              <h1 className="property-detail-sidebar__title">{propertyInfo}</h1>

              {/* Минимальная цена продажи для аукционных объектов */}
              {isAuctionProperty && displayProperty.price && !timerExpired && (
                <>
                  <div className="property-detail-sidebar__current-bid">
                    <span className="current-bid-label">Минимальная цена продажи:</span>
                    <span className="current-bid-value">
                      {displayProperty.currency === 'USD' ? '$' : displayProperty.currency === 'EUR' ? '€' : displayProperty.currency === 'BYN' ? 'Br' : ''}
                      {displayProperty.price.toLocaleString('ru-RU')}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="property-detail-sidebar__buy-now-btn"
                    onClick={handleBookNow}
                  >
                    Купить сейчас
                  </button>
                </>
              )}
              {/* Кнопка для победителя аукциона */}
              {isAuctionProperty && timerExpired && isUserLeader && (
                <button
                  className="property-detail-sidebar__buy-btn property-detail-sidebar__buy-btn--winner"
                  onClick={handleBookNow}
                >
                  Перейти к покупке
                </button>
              )}

              {/* Цена для неаукционных объектов */}
              {!isAuctionProperty && displayProperty.price && (
                <>
                  <div className="property-detail-sidebar__price-block">
                    <span className="price-label">Стоимость:</span>
                    <span className="price-value">
                      {displayProperty.currency === 'USD' ? '$' : displayProperty.currency === 'EUR' ? '€' : displayProperty.currency === 'BYN' ? 'Br' : ''}
                      {displayProperty.price.toLocaleString('ru-RU')}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="property-detail-sidebar__buy-now-btn"
                    onClick={handleBookNow}
                  >
                    Купить сейчас
                  </button>
                </>
              )}

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
                  {displayProperty.test_timer_end_date ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
                      {!timerExpired && (
                        <CircularTimer 
                          endTime={displayProperty.test_timer_end_date} 
                          size={150} 
                          strokeWidth={8}
                          originalDuration={displayProperty.test_timer_duration || originalTestTimerDuration}
                          isUserLeader={isUserLeader}
                        />
                      )}
                      {/* Отображение лидера под таймером */}
                      {/* Старая карточка лидера (уходит вниз) */}
                      {previousLeader && !timerExpired && isLeaderChanging && (
                        <div className="auction-leader-card auction-leader-card--exiting">
                          <div className="auction-leader-label">Лидер аукциона</div>
                          <div className="auction-leader-name">
                            {previousLeader.firstName && previousLeader.lastName 
                              ? `${previousLeader.firstName} ${previousLeader.lastName}`
                              : previousLeader.email || 'Игрок'}
                          </div>
                          <div className="auction-leader-bid">
                            Ставка: {displayProperty.currency === 'USD' ? '$' : displayProperty.currency === 'EUR' ? '€' : displayProperty.currency === 'BYN' ? 'Br' : ''}
                            {previousLeader.bidAmount.toLocaleString('ru-RU')}
                          </div>
                        </div>
                      )}
                      {/* Новая карточка лидера (поднимается вверх) */}
                      {currentLeader && !timerExpired && (
                        <div className={`auction-leader-card ${isLeaderChanging ? 'auction-leader-card--entering' : ''}`}>
                          <div className="auction-leader-label">Лидер аукциона</div>
                          <div className="auction-leader-name">
                            {currentLeader.firstName && currentLeader.lastName 
                              ? `${currentLeader.firstName} ${currentLeader.lastName}`
                              : currentLeader.email || 'Игрок'}
                          </div>
                          <div className="auction-leader-bid">
                            Ставка: {displayProperty.currency === 'USD' ? '$' : displayProperty.currency === 'EUR' ? '€' : displayProperty.currency === 'BYN' ? 'Br' : ''}
                            {currentLeader.bidAmount.toLocaleString('ru-RU')}
                          </div>
                        </div>
                      )}
                      {/* Победитель когда таймер закончился */}
                      {timerExpired && currentLeader && (
                        <div className="auction-winner-card">
                          <div className="auction-winner-label">🏆 Победитель аукциона</div>
                          <div className="auction-winner-name">
                            {currentLeader.firstName && currentLeader.lastName 
                              ? `${currentLeader.firstName} ${currentLeader.lastName}`
                              : currentLeader.email || 'Игрок'}
                          </div>
                          <div className="auction-winner-bid">
                            Выигрышная ставка: {displayProperty.currency === 'USD' ? '$' : displayProperty.currency === 'EUR' ? '€' : displayProperty.currency === 'BYN' ? 'Br' : ''}
                            {currentLeader.bidAmount.toLocaleString('ru-RU')}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <PropertyTimer endTime={auctionEndTime} />
                      {/* Отображение лидера для обычных аукционов */}
                      {/* Старая карточка лидера (уходит вниз) */}
                      {previousLeader && !timerExpired && isLeaderChanging && (
                        <div className="auction-leader-card auction-leader-card--exiting">
                          <div className="auction-leader-label">Лидер аукциона</div>
                          <div className="auction-leader-name">
                            {previousLeader.firstName && previousLeader.lastName 
                              ? `${previousLeader.firstName} ${previousLeader.lastName}`
                              : previousLeader.email || 'Игрок'}
                          </div>
                          <div className="auction-leader-bid">
                            Ставка: {displayProperty.currency === 'USD' ? '$' : displayProperty.currency === 'EUR' ? '€' : displayProperty.currency === 'BYN' ? 'Br' : ''}
                            {previousLeader.bidAmount.toLocaleString('ru-RU')}
                          </div>
                        </div>
                      )}
                      {/* Новая карточка лидера (поднимается вверх) */}
                      {currentLeader && !timerExpired && (
                        <div className={`auction-leader-card ${isLeaderChanging ? 'auction-leader-card--entering' : ''}`}>
                          <div className="auction-leader-label">Лидер аукциона</div>
                          <div className="auction-leader-name">
                            {currentLeader.firstName && currentLeader.lastName 
                              ? `${currentLeader.firstName} ${currentLeader.lastName}`
                              : currentLeader.email || 'Игрок'}
                          </div>
                          <div className="auction-leader-bid">
                            Ставка: {displayProperty.currency === 'USD' ? '$' : displayProperty.currency === 'EUR' ? '€' : displayProperty.currency === 'BYN' ? 'Br' : ''}
                            {currentLeader.bidAmount.toLocaleString('ru-RU')}
                          </div>
                        </div>
                      )}
                      {/* Победитель когда таймер закончился */}
                      {timerExpired && currentLeader && (
                        <div className="auction-winner-card">
                          <div className="auction-winner-label">🏆 Победитель аукциона</div>
                          <div className="auction-winner-name">
                            {currentLeader.firstName && currentLeader.lastName 
                              ? `${currentLeader.firstName} ${currentLeader.lastName}`
                              : currentLeader.email || 'Игрок'}
                          </div>
                          <div className="auction-winner-bid">
                            Выигрышная ставка: {displayProperty.currency === 'USD' ? '$' : displayProperty.currency === 'EUR' ? '€' : displayProperty.currency === 'BYN' ? 'Br' : ''}
                            {currentLeader.bidAmount.toLocaleString('ru-RU')}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div className="property-detail-sidebar__current-bid">
                    <span className="current-bid-label">
                      {currentBid !== null && currentBid !== displayProperty.auction_starting_price
                        ? 'Текущая максимальная ставка:'
                        : 'Стартовая сумма ставки:'}
                    </span>
                    <div className={`current-bid-value-wrapper ${priceAnimation ? 'current-bid-value-wrapper--animated' : ''}`}>
                      <span className="current-bid-value">
                        {displayProperty.currency === 'USD' ? '$' : displayProperty.currency === 'EUR' ? '€' : displayProperty.currency === 'BYN' ? 'Br' : ''}
                        {(currentBid !== null ? currentBid : (displayProperty.auction_starting_price || 0)).toLocaleString('ru-RU')}
                      </span>
                      {priceAnimation && (
                        <span className="current-bid-arrow">
                          <FiArrowUp size={20} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Функционал ставки - скрываем когда таймер истек */}
                  {!timerExpired && (
                  <div className="property-detail-sidebar__bidding-section">
                    <div className="bidding-section__quick-buttons">
                      <button
                        type="button"
                        className="bidding-section__quick-btn"
                        onClick={() => handleQuickBid(1000)}
                        disabled={isSubmittingBid || isUserLeader}
                      >
                        +1 000
                      </button>
                      <button
                        type="button"
                        className="bidding-section__quick-btn"
                        onClick={() => handleQuickBid(2000)}
                        disabled={isSubmittingBid || isUserLeader}
                      >
                        +2 000
                      </button>
                      <button
                        type="button"
                        className="bidding-section__quick-btn"
                        onClick={() => handleQuickBid(3000)}
                        disabled={isSubmittingBid || isUserLeader}
                      >
                        +3 000
                      </button>
                    </div>
                    
                    <div className="bidding-section__input-wrapper">
                      <span className="bidding-section__currency">
                        {displayProperty.currency === 'USD' ? '$' : displayProperty.currency === 'EUR' ? '€' : displayProperty.currency === 'BYN' ? 'Br' : '$'}
                      </span>
                      <input
                        type="text"
                        className="bidding-section__input"
                        placeholder={isUserLeader ? 'Вы лидируете в аукционе' : 'Введите сумму ставки'}
                        value={bidAmount}
                        onChange={handleBidAmountChange}
                        disabled={isSubmittingBid || isUserLeader}
                      />
                    </div>

                    <button
                      type="button"
                      className={`bidding-section__submit-btn ${isUserLeader ? 'bidding-section__submit-btn--winner' : ''}`}
                      onClick={handleBidSubmit}
                      disabled={isSubmittingBid || !bidAmount || isUserLeader}
                    >
                      {isSubmittingBid ? 'Отправка...' : isUserLeader ? 'Вы выигрываете' : 'Сделать ставку'}
                    </button>
                  </div>
                  )}

                  {/* Последние две ставки */}
                  {recentBids.length > 0 && (() => {
                    // Находим максимальную ставку для определения лидера
                    const maxBidAmount = Math.max(...recentBids.map(b => b.bid_amount))
                    return (
                      <div className="property-detail-sidebar__recent-bids">
                        <div className="recent-bids__title">Последние ставки</div>
                        <div className="recent-bids__list">
                          {recentBids.map((bid, index) => {
                            const isHighest = bid.bid_amount === maxBidAmount
                            return (
                              <div key={bid.id || index} className={`recent-bid-item ${isHighest ? 'recent-bid-item--highest' : ''}`}>
                                <div className="recent-bid-item__user">
                                  <FiUser size={14} />
                                  <span className="recent-bid-item__user-name">
                                    {bid.first_name && bid.last_name
                                      ? `${bid.first_name} ${bid.last_name}`
                                      : bid.email || bid.phone_number || 'Анонимный пользователь'}
                                  </span>
                                  {isHighest && (
                                    <span className="recent-bid-item__badge">Лидер</span>
                                  )}
                                </div>
                                <div className="recent-bid-item__info">
                                  <div className="recent-bid-item__amount">
                                    {displayProperty.currency === 'USD' ? '$' : displayProperty.currency === 'EUR' ? '€' : displayProperty.currency === 'BYN' ? 'Br' : '$'}
                                    {bid.bid_amount.toLocaleString('ru-RU')}
                                  </div>
                                  <div className="recent-bid-item__time">
                                    <FiClock size={12} />
                                    {new Date(bid.created_at).toLocaleString('ru-RU', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}

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
                        zoom={finalCoordinates && finalCoordinates[0] !== 53.9045 && finalCoordinates[1] !== 27.5615 ? 15 : undefined}
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

            {/* Документы - отдельный блок под property-detail-sidebar__content (только в кабинете продавца) */}
            {(onBack || showDocuments) ? (() => {
              const documents = []
              
              // Документ о праве собственности
              if (displayProperty.ownership_document || property.ownership_document || property.ownershipDocument) {
                const docUrl = displayProperty.ownership_document || property.ownership_document || property.ownershipDocument
                const processedUrl = processDocumentUrl(docUrl)
                documents.push({
                  name: 'Документ о праве собственности',
                  url: processedUrl,
                  type: getDocumentType(docUrl, 'Документ о праве собственности')
                })
              }
              
              // Справка об отсутствии долгов
              if (displayProperty.no_debts_document || property.no_debts_document || property.noDebtsDocument) {
                const docUrl = displayProperty.no_debts_document || property.no_debts_document || property.noDebtsDocument
                const processedUrl = processDocumentUrl(docUrl)
                documents.push({
                  name: 'Справка об отсутствии долгов',
                  url: processedUrl,
                  type: getDocumentType(docUrl, 'Справка об отсутствии долгов')
                })
              }
              
              // Дополнительные документы
              let additionalDocs = []
              const rawAdditionalDocs = displayProperty.additional_documents || property.additional_documents || property.additionalDocuments
              if (rawAdditionalDocs) {
                if (typeof rawAdditionalDocs === 'string') {
                  try {
                    additionalDocs = JSON.parse(rawAdditionalDocs)
                  } catch (e) {
                    console.warn('Ошибка парсинга additional_documents:', e)
                  }
                } else if (Array.isArray(rawAdditionalDocs)) {
                  additionalDocs = rawAdditionalDocs
                }
                
                additionalDocs.forEach((doc, index) => {
                  const docName = typeof doc === 'string' ? doc : (doc.name || `Документ ${index + 1}`)
                  const docUrl = typeof doc === 'object' && doc.url ? doc.url : (typeof doc === 'string' ? doc : null)
                  const processedUrl = processDocumentUrl(docUrl)
                  documents.push({
                    name: docName,
                    url: processedUrl,
                    type: typeof doc === 'object' && doc.type ? doc.type : getDocumentType(docUrl, docName)
                  })
                })
              }
              
              if (documents.length === 0) {
                return null
              }
              
              return (
                <div className="property-detail-sidebar__documents">
                  <h3 className="property-detail-sidebar__documents-title">Документы</h3>
                  <div className="property-detail-sidebar__documents-content">
                    {documents.map((doc, index) => (
                      <a
                        key={index}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="property-detail-sidebar__document-item"
                      >
                        <FiFileText size={20} className="property-detail-sidebar__document-icon" />
                        <span className="property-detail-sidebar__document-name">{doc.name}</span>
                        <span className="property-detail-sidebar__document-type">
                          {doc.type === 'pdf' ? 'PDF' : 'Изображение'}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )
            })() : null}
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

      {/* Модальное окно с инструкциями по покупке */}
      <BuyNowModal
        isOpen={isBuyNowModalOpen}
        onClose={() => setIsBuyNowModalOpen(false)}
        property={{
          id: displayProperty.id,
          title: propertyInfo,
          name: propertyInfo,
          price: displayProperty.price,
          currency: displayProperty.currency,
          isAuction: isAuctionProperty,
          currentBid: currentBid || displayProperty.currentBid || displayProperty.auction_starting_price || displayProperty.price
        }}
      />
    </div>
  )
}

export default PropertyDetailClassic


