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
} from 'react-icons/fi'
import { FaHeart as FaHeartSolid } from 'react-icons/fa'
import { IoLocationOutline } from 'react-icons/io5'
import { isAuthenticated, getUserData } from '../services/authService'
import PropertyTimer from '../components/PropertyTimer'
import BiddingHistoryModal from '../components/BiddingHistoryModal'
import BuyNowModal from '../components/BuyNowModal'
import BuySharesModal from '../components/BuySharesModal'
import LocationMap from '../components/LocationMap'
import ReservationStatus from '../components/ReservationStatus'
import './PropertyDetailClassic.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// Классическая страница объекта.
// Для аукционных объектов дополнительно отображает таймер и историю ставок.
function PropertyDetailClassic({ property, onBack, showDocuments = false }) {
  const { t } = useTranslation()
  const { user, isLoaded: userLoaded } = useUser()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const thumbnailScrollRef = useRef(null)
  const [isBidHistoryOpen, setIsBidHistoryOpen] = useState(false)
  const [isBuyNowModalOpen, setIsBuyNowModalOpen] = useState(false)
  const [isBuySharesModalOpen, setIsBuySharesModalOpen] = useState(false)
  const [mapCoordinates, setMapCoordinates] = useState(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [bidAmount, setBidAmount] = useState('')
  const [isSubmittingBid, setIsSubmittingBid] = useState(false)
  const [isReserved, setIsReserved] = useState(false)
  const [isOwnReservation, setIsOwnReservation] = useState(false)
  const [reservationKey, setReservationKey] = useState(0)
  const [sharesStats, setSharesStats] = useState(null)

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
  console.log('🔍 PropertyDetailClassic - ВСЕ ДАННЫЕ ОБЪЕКТА (property):', property)
  console.log('🔍 PropertyDetailClassic - КРИТИЧЕСКИЕ ПОЛЯ из property:', {
    id: property?.id,
    title: property?.title,
    name: property?.name,
    price: property?.price,
    auction_starting_price: property?.auction_starting_price,
    area: property?.area,
    sqft: property?.sqft,
    rooms: property?.rooms,
    bedrooms: property?.bedrooms,
    bathrooms: property?.bathrooms,
    floor: property?.floor,
    total_floors: property?.total_floors,
    year_built: property?.year_built,
    building_type: property?.building_type,
    living_area: property?.living_area,
    is_auction: property?.is_auction,
    isAuction: property?.isAuction,
  })
  console.log('🔍 PropertyDetailClassic - Координаты (raw):', property?.coordinates)
  console.log('🔍 PropertyDetailClassic - Удобства (raw):', {
    balcony: property?.balcony,
    parking: property?.parking,
    elevator: property?.elevator,
    garage: property?.garage,
    pool: property?.pool,
    garden: property?.garden,
    electricity: property?.electricity,
    internet: property?.internet,
    security: property?.security,
    furniture: property?.furniture,
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

  // Используем геокодированные координаты или исходные
  const finalCoordinates = mapCoordinates || coordinates

  // Нормализуем данные под формат детальной страницы (используем данные как есть, как в админке)
  // ВАЖНО: Сохраняем все значения, включая 0, null и undefined
  const displayProperty = {
    ...property,
    name: property.title || property.name || '',
    // Площадь - сохраняем даже если 0
    sqft: (property.area !== undefined && property.area !== null && property.area !== '') 
      ? Number(property.area) 
      : ((property.sqft !== undefined && property.sqft !== null && property.sqft !== '') ? Number(property.sqft) : 0),
    area: (property.area !== undefined && property.area !== null && property.area !== '') 
      ? Number(property.area) 
      : ((property.sqft !== undefined && property.sqft !== null && property.sqft !== '') ? Number(property.sqft) : 0),
    living_area: (property.living_area !== undefined && property.living_area !== null && property.living_area !== '') 
      ? property.living_area 
      : ((property.livingArea !== undefined && property.livingArea !== null && property.livingArea !== '') ? property.livingArea : null),
    // Комнаты - сохраняем даже если 0
    beds: (property.rooms !== undefined && property.rooms !== null && property.rooms !== '') 
      ? Number(property.rooms) 
      : ((property.beds !== undefined && property.beds !== null && property.beds !== '') ? Number(property.beds) : 0),
    rooms: (property.rooms !== undefined && property.rooms !== null && property.rooms !== '') 
      ? Number(property.rooms) 
      : ((property.beds !== undefined && property.beds !== null && property.beds !== '') ? Number(property.beds) : 0),
    bedrooms: (() => {
      // Для домов и вилл используем только bedrooms, без fallback на rooms
      const isHouseOrVilla = property.property_type === 'house' || property.property_type === 'villa'
      if (isHouseOrVilla) {
        // Для домов/вилл используем только bedrooms, не используем rooms как fallback
        return (property.bedrooms !== undefined && property.bedrooms !== null && property.bedrooms !== '' && property.bedrooms !== 0) 
          ? Number(property.bedrooms) 
          : null
      } else {
        // Для квартир/апартаментов можно использовать rooms как fallback (если bedrooms не указано)
        return (property.bedrooms !== undefined && property.bedrooms !== null && property.bedrooms !== '' && property.bedrooms !== 0) 
          ? Number(property.bedrooms) 
          : ((property.rooms !== undefined && property.rooms !== null && property.rooms !== '' && property.rooms !== 0) ? Number(property.rooms) : null)
      }
    })(),
    // Ванные - сохраняем даже если 0
    bathrooms: (property.bathrooms !== undefined && property.bathrooms !== null && property.bathrooms !== '') 
      ? Number(property.bathrooms) 
      : ((property.baths !== undefined && property.baths !== null && property.baths !== '') ? Number(property.baths) : 0),
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
    additional_amenities: (property.additional_amenities !== undefined && property.additional_amenities !== null && property.additional_amenities !== '') 
      ? property.additional_amenities 
      : ((property.additionalAmenities !== undefined && property.additionalAmenities !== null && property.additionalAmenities !== '') 
          ? property.additionalAmenities 
          : null),
    // Удобства - нормализуем булевы значения
    // ВАЖНО: Проверяем все возможные форматы, включая undefined и null
    balcony: property.balcony === true || property.balcony === 1 || property.balcony === '1' || property.balcony === 'true',
    parking: property.parking === true || property.parking === 1 || property.parking === '1' || property.parking === 'true',
    elevator: property.elevator === true || property.elevator === 1 || property.elevator === '1' || property.elevator === 'true',
    garage: property.garage === true || property.garage === 1 || property.garage === '1' || property.garage === 'true',
    pool: property.pool === true || property.pool === 1 || property.pool === '1' || property.pool === 'true',
    garden: property.garden === true || property.garden === 1 || property.garden === '1' || property.garden === 'true',
    electricity: property.electricity === true || property.electricity === 1 || property.electricity === '1' || property.electricity === 'true',
    internet: property.internet === true || property.internet === 1 || property.internet === '1' || property.internet === 'true',
    security: property.security === true || property.security === 1 || property.security === '1' || property.security === 'true',
    furniture: property.furniture === true || property.furniture === 1 || property.furniture === '1' || property.furniture === 'true',
    // Feature поля (feature1-26)
    feature1: property.feature1 === true || property.feature1 === 1 || property.feature1 === '1' || property.feature1 === 'true',
    feature2: property.feature2 === true || property.feature2 === 1 || property.feature2 === '1' || property.feature2 === 'true',
    feature3: property.feature3 === true || property.feature3 === 1 || property.feature3 === '1' || property.feature3 === 'true',
    feature4: property.feature4 === true || property.feature4 === 1 || property.feature4 === '1' || property.feature4 === 'true',
    feature5: property.feature5 === true || property.feature5 === 1 || property.feature5 === '1' || property.feature5 === 'true',
    feature6: property.feature6 === true || property.feature6 === 1 || property.feature6 === '1' || property.feature6 === 'true',
    feature7: property.feature7 === true || property.feature7 === 1 || property.feature7 === '1' || property.feature7 === 'true',
    feature8: property.feature8 === true || property.feature8 === 1 || property.feature8 === '1' || property.feature8 === 'true',
    feature9: property.feature9 === true || property.feature9 === 1 || property.feature9 === '1' || property.feature9 === 'true',
    feature10: property.feature10 === true || property.feature10 === 1 || property.feature10 === '1' || property.feature10 === 'true',
    feature11: property.feature11 === true || property.feature11 === 1 || property.feature11 === '1' || property.feature11 === 'true',
    feature12: property.feature12 === true || property.feature12 === 1 || property.feature12 === '1' || property.feature12 === 'true',
    feature13: property.feature13 === true || property.feature13 === 1 || property.feature13 === '1' || property.feature13 === 'true',
    feature14: property.feature14 === true || property.feature14 === 1 || property.feature14 === '1' || property.feature14 === 'true',
    feature15: property.feature15 === true || property.feature15 === 1 || property.feature15 === '1' || property.feature15 === 'true',
    feature16: property.feature16 === true || property.feature16 === 1 || property.feature16 === '1' || property.feature16 === 'true',
    feature17: property.feature17 === true || property.feature17 === 1 || property.feature17 === '1' || property.feature17 === 'true',
    feature18: property.feature18 === true || property.feature18 === 1 || property.feature18 === '1' || property.feature18 === 'true',
    feature19: property.feature19 === true || property.feature19 === 1 || property.feature19 === '1' || property.feature19 === 'true',
    feature20: property.feature20 === true || property.feature20 === 1 || property.feature20 === '1' || property.feature20 === 'true',
    feature21: property.feature21 === true || property.feature21 === 1 || property.feature21 === '1' || property.feature21 === 'true',
    feature22: property.feature22 === true || property.feature22 === 1 || property.feature22 === '1' || property.feature22 === 'true',
    feature23: property.feature23 === true || property.feature23 === 1 || property.feature23 === '1' || property.feature23 === 'true',
    feature24: property.feature24 === true || property.feature24 === 1 || property.feature24 === '1' || property.feature24 === 'true',
    feature25: property.feature25 === true || property.feature25 === 1 || property.feature25 === '1' || property.feature25 === 'true',
    feature26: property.feature26 === true || property.feature26 === 1 || property.feature26 === '1' || property.feature26 === 'true',
    // Цена - минимальная цена продажи для аукционных объектов (price) - НЕ смешивать с auction_starting_price
    // ВАЖНО: price может быть 0, поэтому проверяем !== undefined && !== null, а не truthy
    price: (property.price !== undefined && property.price !== null && property.price !== '') 
      ? Number(property.price) 
      : null,
    currentBid: property.currentBid,
    auction_starting_price: (property.auction_starting_price !== undefined && property.auction_starting_price !== null && property.auction_starting_price !== '' && property.auction_starting_price !== 0)
      ? Number(property.auction_starting_price)
      : ((property.auctionStartingPrice !== undefined && property.auctionStartingPrice !== null && property.auctionStartingPrice !== '' && property.auctionStartingPrice !== 0)
          ? Number(property.auctionStartingPrice)
          : null),
    currency: property.currency || 'USD',
    // Документы
    ownership_document: property.ownership_document || property.ownershipDocument,
    no_debts_document: property.no_debts_document || property.noDebtsDocument,
    additional_documents: property.additional_documents || property.additionalDocuments,
    // Тест-драйв - сохраняем значение как есть из property
    test_drive: property.test_drive !== undefined 
      ? (property.test_drive === 1 || property.test_drive === true || property.test_drive === '1' || property.test_drive === 'true')
      : false,
    testDrive: property.testDrive !== undefined 
      ? property.testDrive 
      : (property.test_drive !== undefined 
          ? (property.test_drive === 1 || property.test_drive === true || property.test_drive === '1' || property.test_drive === 'true') 
          : false),
  }

  console.log('🔍 PropertyDetailClassic - displayProperty (после нормализации):', displayProperty)
  console.log('🔍 PropertyDetailClassic - КРИТИЧЕСКИЕ ПОЛЯ displayProperty:', {
    id: displayProperty.id,
    title: displayProperty.title,
    name: displayProperty.name,
    price: displayProperty.price,
    price_type: typeof displayProperty.price,
    auction_starting_price: displayProperty.auction_starting_price,
    auction_starting_price_type: typeof displayProperty.auction_starting_price,
    area: displayProperty.area,
    area_type: typeof displayProperty.area,
    sqft: displayProperty.sqft,
    rooms: displayProperty.rooms,
    rooms_type: typeof displayProperty.rooms,
    bedrooms: displayProperty.bedrooms,
    bathrooms: displayProperty.bathrooms,
    bathrooms_type: typeof displayProperty.bathrooms,
    floor: displayProperty.floor,
    total_floors: displayProperty.total_floors,
    year_built: displayProperty.year_built,
    building_type: displayProperty.building_type,
    living_area: displayProperty.living_area,
    is_auction: displayProperty.is_auction,
    isAuction: displayProperty.isAuction,
    balcony: displayProperty.balcony,
    parking: displayProperty.parking,
    elevator: displayProperty.elevator,
  })
  console.log('💰 ЦЕНЫ - ИСХОДНЫЕ из property:', {
    property_price: property.price,
    property_auction_starting_price: property.auction_starting_price,
    property_auctionStartingPrice: property.auctionStartingPrice,
  })
  console.log('💰 ЦЕНЫ - ПОСЛЕ НОРМАЛИЗАЦИИ displayProperty:', {
    displayProperty_price: displayProperty.price,
    displayProperty_auction_starting_price: displayProperty.auction_starting_price,
    равны: displayProperty.price === displayProperty.auction_starting_price,
  })
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

  const isSharedOwnership =
    displayProperty.is_shared_ownership === true ||
    displayProperty.is_shared_ownership === 1 ||
    displayProperty.is_shared_ownership === '1' ||
    property?.is_shared_ownership === true ||
    property?.is_shared_ownership === 1 ||
    property?.is_shared_ownership === '1'
  
  // Отладочная информация
  console.log('🔍 Долевая продажа - проверка:', {
    displayProperty_is_shared_ownership: displayProperty.is_shared_ownership,
    property_is_shared_ownership: property?.is_shared_ownership,
    isSharedOwnership,
    total_shares: displayProperty.total_shares || property?.total_shares,
    price: displayProperty.price || property?.price
  })

  const auctionEndTime =
    displayProperty.endTime ||
    displayProperty.auction_end_date ||
    null

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
    // Проверяем, не забронирован ли объект кем-то другим
    if (isReserved && !isOwnReservation) {
      alert('Этот объект уже забронирован другим пользователем')
      return
    }
    
    // Проверяем авторизацию
    const isClerkAuth = user && userLoaded
    const isOldAuth = isAuthenticated()
    
    if (!isClerkAuth && !isOldAuth) {
      alert('Пожалуйста, войдите в систему, чтобы купить объект')
      return
    }
    
    // Открываем модальное окно с инструкциями
    setIsBuyNowModalOpen(true)
  }
  
  // Получаем ID текущего пользователя
  const getCurrentUserId = () => {
    if (user && userLoaded) {
      return user.id
    }
    const userData = getUserData()
    return userData?.id || null
  }
  
  const currentUserId = getCurrentUserId()
  
  // Проверяем статус бронирования
  useEffect(() => {
    const checkReservation = async () => {
      if (!displayProperty.id || !displayProperty.property_type) return
      
      try {
        const response = await fetch(
          `${API_BASE_URL}/properties/${displayProperty.property_type}/${displayProperty.id}/reservation`
        )
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.isReserved) {
            setIsReserved(true)
            setIsOwnReservation(
              currentUserId && String(data.reservedBy) === String(currentUserId)
            )
          } else {
            setIsReserved(false)
            setIsOwnReservation(false)
          }
        }
      } catch (error) {
        console.error('Ошибка проверки бронирования:', error)
      }
    }
    
    checkReservation()
    // Проверяем каждые 30 секунд
    const interval = setInterval(checkReservation, 30000)
    
    return () => clearInterval(interval)
  }, [displayProperty.id, displayProperty.property_type, currentUserId])

  // Загружаем статистику долей для долевых объектов
  useEffect(() => {
    if (isSharedOwnership && displayProperty.id && displayProperty.property_type) {
      const fetchSharesStats = async () => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/property-shares/${displayProperty.property_type}/${displayProperty.id}/stats`
          );
          const data = await response.json();
          if (data.success) {
            setSharesStats(data.data);
          }
        } catch (err) {
          console.error('Ошибка при загрузке статистики долей:', err);
        }
      };
      fetchSharesStats();
    }
  }, [isSharedOwnership, displayProperty.id, displayProperty.property_type]);
  
  // Обработчик истечения брони
  const handleReservationExpired = () => {
    setIsReserved(false)
    setIsOwnReservation(false)
    setReservationKey(prev => prev + 1) // Обновляем ключ для перерендера
  }

  const handleQuickBid = (amount) => {
    const startingPrice = displayProperty.auction_starting_price || 0
    const currentBid = displayProperty.currentBid || startingPrice
    
    // Если пользователь уже ввел сумму, добавляем к ней, иначе к текущей ставке
    const currentInput = parseFloat(bidAmount) || 0
    const baseAmount = currentInput > currentBid ? currentInput : currentBid
    const quickBidAmount = baseAmount + amount
    setBidAmount(quickBidAmount.toString())
  }

  const handleBidSubmit = async () => {
    // Проверяем авторизацию
    const isClerkAuth = user && userLoaded
    const isOldAuth = isAuthenticated()
    
    if (!isClerkAuth && !isOldAuth) {
      alert('Пожалуйста, войдите в систему, чтобы сделать ставку')
      return
    }

    const amount = parseFloat(bidAmount)
    if (!amount || isNaN(amount) || amount <= 0) {
      alert('Пожалуйста, введите корректную сумму ставки')
      return
    }

    const startingPrice = displayProperty.auction_starting_price || 0
    const currentBid = displayProperty.currentBid || startingPrice
    
    if (amount <= currentBid) {
      alert(`Ваша ставка должна быть выше текущей ставки (${currentBid.toLocaleString('ru-RU')})`)
      return
    }

    setIsSubmittingBid(true)
    try {
      // Здесь будет API запрос для отправки ставки
      // const response = await fetch(`${API_BASE_URL}/bids`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     propertyId: displayProperty.id,
      //     amount: amount
      //   })
      // })
      
      // Пока что просто показываем сообщение
      alert(`Ставка ${amount.toLocaleString('ru-RU')} ${displayProperty.currency || 'USD'} успешно отправлена!`)
      setBidAmount('')
    } catch (error) {
      console.error('Ошибка при отправке ставки:', error)
      alert('Произошла ошибка при отправке ставки. Попробуйте позже.')
    } finally {
      setIsSubmittingBid(false)
    }
  }

  const handleBidAmountChange = (e) => {
    const value = e.target.value.replace(/[^\d.]/g, '')
    setBidAmount(value)
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
              {/* Подробная информация - разная для домов/вилл и остальных */}
              {(displayProperty.property_type === 'house' || displayProperty.property_type === 'villa') ? (
                /* Подробная информация для дома и виллы */
                <div className="property-detail-info-block">
                  <h3 className="property-detail-info-block__title">Подробная информация</h3>
                  <div className="property-detail-info-block__content property-detail-info-block__content--horizontal">
                    {displayProperty.land_area && Number(displayProperty.land_area) > 0 && (
                      <div className="property-detail-info-item property-detail-info-item--horizontal">
                        <span className="property-detail-info-label">Площадь участка:</span>
                        <span className="property-detail-info-value">
                          {displayProperty.land_area} м²
                        </span>
                      </div>
                    )}
                    <div className="property-detail-info-item property-detail-info-item--horizontal">
                      <span className="property-detail-info-label">Площадь дома (общая):</span>
                      <span className="property-detail-info-value">
                        {((displayProperty.area !== undefined && displayProperty.area !== null) || (displayProperty.sqft !== undefined && displayProperty.sqft !== null)) 
                          ? `${displayProperty.area || displayProperty.sqft || 0} м²` 
                          : '—'}
                      </span>
                    </div>
                    {(displayProperty.living_area !== null && displayProperty.living_area !== undefined && displayProperty.living_area !== '' && Number(displayProperty.living_area) > 0) && (
                      <div className="property-detail-info-item property-detail-info-item--horizontal">
                        <span className="property-detail-info-label">Площадь дома (жилая):</span>
                        <span className="property-detail-info-value">
                          {displayProperty.living_area} м²
                        </span>
                      </div>
                    )}
                    <div className="property-detail-info-item property-detail-info-item--horizontal">
                      <span className="property-detail-info-label">Количество этажей:</span>
                      <span className="property-detail-info-value">
                        {(displayProperty.total_floors !== undefined && displayProperty.total_floors !== null) ? displayProperty.total_floors : '—'}
                      </span>
                    </div>
                    <div className="property-detail-info-item property-detail-info-item--horizontal">
                      <span className="property-detail-info-label">Количество спален:</span>
                      <span className="property-detail-info-value">
                        {(() => {
                          // Для домов и вилл используем только bedrooms, без fallback на rooms
                          const isHouseOrVilla = property.property_type === 'house' || property.property_type === 'villa'
                          
                          if (property.bedrooms !== undefined && property.bedrooms !== null && property.bedrooms !== '' && property.bedrooms !== 0) {
                            return property.bedrooms;
                          }
                          
                          // Для домов/вилл не используем rooms как fallback
                          if (isHouseOrVilla) {
                            return '—';
                          }
                          
                          // Для квартир/апартаментов можно использовать rooms как fallback
                          if (property.rooms !== undefined && property.rooms !== null && property.rooms !== '' && property.rooms !== 0) {
                            return property.rooms;
                          }
                          
                          return '—';
                        })()}
                      </span>
                    </div>
                    <div className="property-detail-info-item property-detail-info-item--horizontal">
                      <span className="property-detail-info-label">Количество ванных:</span>
                      <span className="property-detail-info-value">
                        {(displayProperty.bathrooms !== undefined && displayProperty.bathrooms !== null) ? displayProperty.bathrooms : '—'}
                      </span>
                    </div>
                    <div className="property-detail-info-item property-detail-info-item--horizontal">
                      <span className="property-detail-info-label">Год постройки:</span>
                      <span className="property-detail-info-value">
                        {(displayProperty.year_built !== undefined && displayProperty.year_built !== null) ? displayProperty.year_built : '—'}
                      </span>
                    </div>
                    <div className="property-detail-info-item property-detail-info-item--horizontal">
                      <span className="property-detail-info-label">Материал постройки:</span>
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
                      <span className="property-detail-info-label">Есть тест-драйв:</span>
                      <span className="property-detail-info-value">
                        {(() => {
                          const testDriveValue = displayProperty.test_drive;
                          const isTestDrive = testDriveValue === 1 || testDriveValue === true || displayProperty.testDrive === true;
                          return isTestDrive ? 'Да' : 'Нет';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Подробная информация для квартир и апартаментов */
                <div className="property-detail-info-block">
                  <h3 className="property-detail-info-block__title">Подробная информация</h3>
                  <div className="property-detail-info-block__content property-detail-info-block__content--horizontal">
                    <div className="property-detail-info-item property-detail-info-item--horizontal">
                      <span className="property-detail-info-label">Комнаты:</span>
                      <span className="property-detail-info-value">
                        {(displayProperty.rooms !== undefined && displayProperty.rooms !== null) ? displayProperty.rooms : 
                         ((displayProperty.beds !== undefined && displayProperty.beds !== null) ? displayProperty.beds : 
                          ((displayProperty.bedrooms !== undefined && displayProperty.bedrooms !== null) ? displayProperty.bedrooms : '—'))}
                      </span>
                    </div>
                    <div className="property-detail-info-item property-detail-info-item--horizontal">
                      <span className="property-detail-info-label">Площадь общая:</span>
                      <span className="property-detail-info-value">
                        {((displayProperty.area !== undefined && displayProperty.area !== null) || (displayProperty.sqft !== undefined && displayProperty.sqft !== null)) 
                          ? `${displayProperty.area || displayProperty.sqft || 0} м²` 
                          : '—'}
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
                      <span className="property-detail-info-value">
                        {(displayProperty.bathrooms !== undefined && displayProperty.bathrooms !== null) ? displayProperty.bathrooms : '—'}
                      </span>
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
              )}

              {/* Дополнительная информация - показываем только для квартир и апартаментов (не для домов/вилл) */}
              {((displayProperty.property_type !== 'house' && displayProperty.property_type !== 'villa') &&
                ((displayProperty.renovation !== undefined && displayProperty.renovation !== null && displayProperty.renovation !== '') || 
                (displayProperty.condition !== undefined && displayProperty.condition !== null && displayProperty.condition !== '') || 
                (displayProperty.heating !== undefined && displayProperty.heating !== null && displayProperty.heating !== '') || 
                (displayProperty.water_supply !== undefined && displayProperty.water_supply !== null && displayProperty.water_supply !== '') || 
                (displayProperty.sewerage !== undefined && displayProperty.sewerage !== null && displayProperty.sewerage !== '') || 
                (displayProperty.commercial_type !== undefined && displayProperty.commercial_type !== null && displayProperty.commercial_type !== '') || 
                (displayProperty.business_hours !== undefined && displayProperty.business_hours !== null && displayProperty.business_hours !== ''))) && (
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

              {/* Удобства - простой список для всех типов */}
              <div className="property-detail-info-block">
                <h3 className="property-detail-info-block__title">Удобства</h3>
                <div className="property-detail-info-block__content property-detail-info-block__content--amenities">
                  {(() => {
                    const hasAmenity = (value) => {
                      return value === 1 || value === true || value === '1' || value === 'true'
                    }
                    
                    // Функция для проверки удобства с fallback на property
                    const checkAmenity = (displayValue, propertyValue) => {
                      return hasAmenity(displayValue) || hasAmenity(propertyValue);
                    }
                    
                    const amenities = []
                    
                    // Для домов и вилл - все удобства из формы
                    if (displayProperty.property_type === 'house' || displayProperty.property_type === 'villa') {
                      // Парковка
                      if (checkAmenity(displayProperty.feature1, property.feature1)) amenities.push('Гараж')
                      if (checkAmenity(displayProperty.feature2, property.feature2)) amenities.push('Навес для машины')
                      if (checkAmenity(displayProperty.parking, property.parking)) amenities.push('Парковочное место')
                      
                      // Безопасность
                      if (checkAmenity(displayProperty.feature3, property.feature3)) amenities.push('Сигнализация')
                      if (checkAmenity(displayProperty.feature6, property.feature6)) amenities.push('Видеонаблюдение')
                      if (checkAmenity(displayProperty.feature4, property.feature4)) amenities.push('"Умный дом"')
                      
                      // Инфраструктура участка
                      if (checkAmenity(displayProperty.feature5, property.feature5)) amenities.push('Баня/Сауна')
                      if (checkAmenity(displayProperty.pool, property.pool)) amenities.push('Бассейн')
                      if (checkAmenity(displayProperty.feature7, property.feature7)) amenities.push('Освещение участка')
                      if (checkAmenity(displayProperty.feature8, property.feature8)) amenities.push('Спортивная площадка')
                      if (checkAmenity(displayProperty.feature9, property.feature9)) amenities.push('Беседка')
                      if (checkAmenity(displayProperty.feature10, property.feature10)) amenities.push('Кладовая')
                      
                      // Удобства и коммуникации
                      if (checkAmenity(displayProperty.electricity, property.electricity)) amenities.push('Электричество')
                      if ((displayProperty.water_supply && displayProperty.water_supply !== '' && displayProperty.water_supply !== null) || 
                          (property.water_supply && property.water_supply !== '' && property.water_supply !== null)) amenities.push('Водоснабжение')
                      if ((displayProperty.sewerage && displayProperty.sewerage !== '' && displayProperty.sewerage !== null) || 
                          (property.sewerage && property.sewerage !== '' && property.sewerage !== null)) amenities.push('Канализация')
                      if (checkAmenity(displayProperty.feature11, property.feature11)) amenities.push('Газ')
                      if ((displayProperty.heating && displayProperty.heating !== '' && displayProperty.heating !== null) || 
                          (property.heating && property.heating !== '' && property.heating !== null)) amenities.push('Отопление')
                      if (checkAmenity(displayProperty.internet, property.internet)) amenities.push('Интернет')
                      if (checkAmenity(displayProperty.feature12, property.feature12)) amenities.push('Камин')
                      if (checkAmenity(displayProperty.balcony, property.balcony)) amenities.push('Балкон')
                      if (checkAmenity(displayProperty.feature13, property.feature13)) amenities.push('Терасса')
                      
                      // Мебель и техника
                      if (checkAmenity(displayProperty.furniture, property.furniture)) amenities.push('Встроенная мебель')
                      if (checkAmenity(displayProperty.feature14, property.feature14)) amenities.push('Холодильник')
                      if (checkAmenity(displayProperty.feature15, property.feature15)) amenities.push('Стиральная машина')
                      if (checkAmenity(displayProperty.feature16, property.feature16)) amenities.push('Посудомоечная машина')
                      if (checkAmenity(displayProperty.feature17, property.feature17)) amenities.push('Микроволновка')
                      if (checkAmenity(displayProperty.feature18, property.feature18)) amenities.push('Духовка')
                      if (checkAmenity(displayProperty.feature19, property.feature19)) amenities.push('Телевизор')
                      if (checkAmenity(displayProperty.feature20, property.feature20)) amenities.push('Кондиционер')
                      
                      // Дополнительные удобства feature21-26
                      if (checkAmenity(displayProperty.feature21, property.feature21)) amenities.push('Джакузи')
                      if (checkAmenity(displayProperty.feature22, property.feature22)) amenities.push('Камин')
                      if (checkAmenity(displayProperty.feature23, property.feature23)) amenities.push('Теплый пол')
                      if (checkAmenity(displayProperty.feature24, property.feature24)) amenities.push('Винный погреб')
                      if (checkAmenity(displayProperty.feature25, property.feature25)) amenities.push('Кинотеатр')
                      if (checkAmenity(displayProperty.feature26, property.feature26)) amenities.push('Тренажерный зал')
                    } else {
                      // Для квартир и апартаментов - только их удобства (без feature полей и полей домов/вилл)
                      if (hasAmenity(property.balcony) || hasAmenity(displayProperty.balcony)) {
                        amenities.push('Балкон')
                      }
                      if (hasAmenity(property.parking) || hasAmenity(displayProperty.parking)) {
                        amenities.push('Парковка')
                      }
                      if (hasAmenity(property.elevator) || hasAmenity(displayProperty.elevator)) {
                        amenities.push('Лифт')
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
                      // НЕ показываем для квартир/апартаментов: garage, pool, garden (это для домов/вилл)
                      // НЕ показываем feature поля (feature1-feature26) - они только для домов/вилл
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
                
                // Проверяем, что это валидный текст, а не JSON с изображениями
                let isValidText = false
                let textToDisplay = null
                
                if (additionalInfo && typeof additionalInfo === 'string' && additionalInfo.trim() !== '') {
                  const trimmed = additionalInfo.trim()
                  
                  // Проверяем, не является ли это JSON массивом с изображениями
                  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                    // Пытаемся распарсить JSON
                    try {
                      const parsed = JSON.parse(trimmed)
                      // Если это массив и первый элемент - изображение, то это не текст
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        const firstItem = parsed[0]
                        if (typeof firstItem === 'string' && (firstItem.startsWith('data:image') || firstItem.includes('base64'))) {
                          isValidText = false // Это изображения, не текст
                        } else {
                          isValidText = true // Это массив текстовых значений
                          textToDisplay = parsed.join(', ')
                        }
                      } else if (typeof parsed === 'object') {
                        isValidText = false // Это объект, не текст
                      } else {
                        isValidText = true
                        textToDisplay = String(parsed)
                      }
                    } catch (e) {
                      // Не валидный JSON, проверяем дальше
                      if (!trimmed.includes('data:image') && !trimmed.includes('base64')) {
                        isValidText = true
                        textToDisplay = trimmed
                      }
                    }
                  } else if (!trimmed.includes('data:image') && !trimmed.includes('base64')) {
                    // Обычный текст без изображений
                    isValidText = true
                    textToDisplay = trimmed
                  }
                }
                
                console.log('🔍 Дополнительная информация:', {
                  displayProperty_additional_amenities: displayProperty.additional_amenities,
                  property_additional_amenities: property.additional_amenities,
                  property_additionalAmenities: property.additionalAmenities,
                  additionalInfo,
                  isValidText,
                  textToDisplay
                })
                
                return isValidText && textToDisplay ? (
                  <div className="property-detail-info-block">
                    <h3 className="property-detail-info-block__title">Дополнительная информация</h3>
                    <div className="property-detail-info-block__content property-detail-info-block__content--text">
                      <p>{textToDisplay}</p>
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

              {/* Статус бронирования */}
              <ReservationStatus
                key={reservationKey}
                propertyId={displayProperty.id}
                propertyType={displayProperty.property_type}
                currentUserId={currentUserId}
                onReservationExpired={handleReservationExpired}
              />

              {/* Минимальная цена продажи для аукционных объектов */}
              {isAuctionProperty && displayProperty.price && displayProperty.price > 0 && (
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
                    disabled={isReserved && !isOwnReservation}
                    style={{
                      opacity: (isReserved && !isOwnReservation) ? 0.5 : 1,
                      cursor: (isReserved && !isOwnReservation) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isReserved && !isOwnReservation ? 'Объект забронирован' : 'Купить сейчас'}
                  </button>
                </>
              )}

              {/* Цена для неаукционных объектов */}
              {!isAuctionProperty && displayProperty.price && !isSharedOwnership && (
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
                    disabled={isReserved && !isOwnReservation}
                    style={{
                      opacity: (isReserved && !isOwnReservation) ? 0.5 : 1,
                      cursor: (isReserved && !isOwnReservation) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isReserved && !isOwnReservation ? 'Объект забронирован' : 'Купить сейчас'}
                  </button>
                </>
              )}

              {/* Информация о долевой продаже */}
              {isSharedOwnership && (displayProperty.price || property?.price) && (displayProperty.total_shares || property?.total_shares) && (
                <>
                  <div className="property-detail-sidebar__shared-ownership">
                    <div className="shared-ownership-badge">
                      <span>Долевая продажа</span>
                    </div>
                    
                    {/* Основная цена - цена за долю */}
                    <div className="property-detail-sidebar__price-block" style={{ marginTop: '16px' }}>
                      <span className="price-label">Стоимость доли:</span>
                      <span className="price-value" style={{ color: '#0ea5e9' }}>
                        {(displayProperty.currency || property?.currency || 'USD') === 'USD' ? '$' : 
                         (displayProperty.currency || property?.currency) === 'EUR' ? '€' : 
                         (displayProperty.currency || property?.currency) === 'RUB' ? '₽' : 
                         (displayProperty.currency || property?.currency) === 'GBP' ? '£' : '$'}
                        {Math.ceil((displayProperty.price || property?.price || 0) / (displayProperty.total_shares || property?.total_shares || 1)).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    
                    <div className="shared-ownership-info">
                      <div className="shared-ownership-stat">
                        <span className="stat-label">Всего долей</span>
                        <span className="stat-value">{displayProperty.total_shares || property?.total_shares || 0}</span>
                      </div>
                      
                      <div className="shared-ownership-stat">
                        <span className="stat-label">Доступно долей</span>
                        <span className="stat-value stat-value--highlight">
                          {sharesStats ? sharesStats.shares_available : 
                           ((displayProperty.total_shares || property?.total_shares || 0) - (displayProperty.shares_sold || property?.shares_sold || 0))}
                        </span>
                      </div>
                      
                      <div className="shared-ownership-stat" style={{ gridColumn: '1 / -1' }}>
                        <span className="stat-label">Общая стоимость объекта</span>
                        <span className="stat-value" style={{ fontSize: '16px', color: '#6b7280' }}>
                          {(displayProperty.currency || property?.currency || 'USD') === 'USD' ? '$' : 
                           (displayProperty.currency || property?.currency) === 'EUR' ? '€' : 
                           (displayProperty.currency || property?.currency) === 'RUB' ? '₽' : 
                           (displayProperty.currency || property?.currency) === 'GBP' ? '£' : '$'}
                          {(displayProperty.price || property?.price || 0).toLocaleString('ru-RU')}
                        </span>
                      </div>
                    </div>

                    <div className="shared-ownership-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${(((displayProperty.shares_sold || property?.shares_sold || 0) / (displayProperty.total_shares || property?.total_shares || 1)) * 100)}%` 
                          }}
                        />
                      </div>
                      <span className="progress-text">
                        Продано {displayProperty.shares_sold || property?.shares_sold || 0} из {displayProperty.total_shares || property?.total_shares || 0} долей
                      </span>
                    </div>

                    <button
                      type="button"
                      className="property-detail-sidebar__buy-shares-btn"
                      onClick={() => setIsBuySharesModalOpen(true)}
                      disabled={(sharesStats ? sharesStats.shares_available : 
                        ((displayProperty.total_shares || property?.total_shares || 0) - (displayProperty.shares_sold || property?.shares_sold || 0))) === 0}
                    >
                      {(sharesStats ? sharesStats.shares_available : 
                        ((displayProperty.total_shares || property?.total_shares || 0) - (displayProperty.shares_sold || property?.shares_sold || 0))) === 0 
                        ? 'Все доли проданы' 
                        : 'Купить доли'}
                    </button>
                  </div>
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
                  <PropertyTimer endTime={auctionEndTime} />
                  <div className="property-detail-sidebar__current-bid">
                    <span className="current-bid-label">Стартовая сумма ставки:</span>
                    <span className="current-bid-value">
                      {displayProperty.currency === 'USD' ? '$' : displayProperty.currency === 'EUR' ? '€' : displayProperty.currency === 'BYN' ? 'Br' : ''}
                      {(displayProperty.auction_starting_price || 0).toLocaleString('ru-RU')}
                    </span>
                  </div>

                  {/* Функционал ставки */}
                  <div className="property-detail-sidebar__bidding-section">
                    <div className="bidding-section__quick-buttons">
                      <button
                        type="button"
                        className="bidding-section__quick-btn"
                        onClick={() => handleQuickBid(1000)}
                        disabled={isSubmittingBid}
                      >
                        +<span className="bidding-section__quick-btn-number">1 000</span>
                      </button>
                      <button
                        type="button"
                        className="bidding-section__quick-btn"
                        onClick={() => handleQuickBid(2000)}
                        disabled={isSubmittingBid}
                      >
                        +<span className="bidding-section__quick-btn-number">2 000</span>
                      </button>
                      <button
                        type="button"
                        className="bidding-section__quick-btn"
                        onClick={() => handleQuickBid(3000)}
                        disabled={isSubmittingBid}
                      >
                        +<span className="bidding-section__quick-btn-number">3 000</span>
                      </button>
                    </div>
                    
                    <div className="bidding-section__input-wrapper">
                      <span className="bidding-section__currency">
                        {displayProperty.currency === 'USD' ? '$' : displayProperty.currency === 'EUR' ? '€' : displayProperty.currency === 'BYN' ? 'Br' : '$'}
                      </span>
                      <input
                        type="text"
                        className="bidding-section__input"
                        placeholder="Введите сумму ставки"
                        value={bidAmount}
                        onChange={handleBidAmountChange}
                        disabled={isSubmittingBid}
                      />
                    </div>

                    <button
                      type="button"
                      className="bidding-section__submit-btn"
                      onClick={handleBidSubmit}
                      disabled={isSubmittingBid || !bidAmount}
                    >
                      {isSubmittingBid ? 'Отправка...' : 'Сделать ставку'}
                    </button>
                  </div>

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
          // Базовые данные
          id: displayProperty.id,
          title: propertyInfo,
          name: propertyInfo,
          description: displayProperty.description || property.description || '',
          price: displayProperty.price,
          currency: displayProperty.currency,
          location: displayProperty.location || property.location,
          type: displayProperty.property_type || property.property_type,
          area: displayProperty.area || displayProperty.sqft,
          
          // Характеристики объекта
          rooms: displayProperty.rooms || property.rooms || null,
          bedrooms: displayProperty.bedrooms || property.bedrooms || null,
          bathrooms: displayProperty.bathrooms || property.bathrooms || null,
          floor: displayProperty.floor !== undefined && displayProperty.floor !== null ? displayProperty.floor : (property.floor !== undefined && property.floor !== null ? property.floor : null),
          total_floors: displayProperty.total_floors !== undefined && displayProperty.total_floors !== null ? displayProperty.total_floors : (property.total_floors !== undefined && property.total_floors !== null ? property.total_floors : null),
          year_built: displayProperty.year_built !== undefined && displayProperty.year_built !== null ? displayProperty.year_built : (property.year_built !== undefined && property.year_built !== null ? property.year_built : null),
          living_area: displayProperty.living_area || property.living_area || null,
          land_area: displayProperty.land_area || property.land_area || null,
          building_type: displayProperty.building_type || property.building_type || null,
          
          // Дополнительные характеристики
          renovation: displayProperty.renovation || property.renovation || null,
          condition: displayProperty.condition || property.condition || null,
          heating: displayProperty.heating || property.heating || null,
          water_supply: displayProperty.water_supply || property.water_supply || null,
          sewerage: displayProperty.sewerage || property.sewerage || null,
          
          // Удобства
          balcony: displayProperty.balcony || property.balcony || false,
          parking: displayProperty.parking || property.parking || false,
          elevator: displayProperty.elevator || property.elevator || false,
          garage: displayProperty.garage || property.garage || false,
          pool: displayProperty.pool || property.pool || false,
          garden: displayProperty.garden || property.garden || false,
          electricity: displayProperty.electricity || property.electricity || false,
          internet: displayProperty.internet || property.internet || false,
          security: displayProperty.security || property.security || false,
          furniture: displayProperty.furniture || property.furniture || false,
          
          // Коммерческая недвижимость
          commercial_type: displayProperty.commercial_type || property.commercial_type || null,
          business_hours: displayProperty.business_hours || property.business_hours || null,
          
          // Данные владельца (из property, так как они приходят с сервера)
          user_id: property.user_id || property.userId || null,
          sellerId: property.user_id || property.userId || null,
          seller: property.seller || (property.first_name && property.last_name 
            ? `${property.first_name} ${property.last_name}` 
            : (property.first_name || property.last_name 
              ? `${property.first_name || ''} ${property.last_name || ''}`.trim()
              : null)),
          sellerName: property.seller || (property.first_name && property.last_name 
            ? `${property.first_name} ${property.last_name}` 
            : (property.first_name || property.last_name 
              ? `${property.first_name || ''} ${property.last_name || ''}`.trim()
              : null)),
          sellerEmail: property.sellerEmail || property.email || null,
          sellerPhone: property.sellerPhone || property.phone_number || null,
          first_name: property.first_name || null,
          last_name: property.last_name || null,
          email: property.email || null,
          phone_number: property.phone_number || null
        }}
      />

      {/* Модальное окно покупки долей */}
      {isSharedOwnership && (
        <BuySharesModal
          isOpen={isBuySharesModalOpen}
          onClose={() => setIsBuySharesModalOpen(false)}
          property={{
            id: displayProperty.id || property?.id,
            property_type: displayProperty.property_type || property?.property_type,
            title: propertyInfo,
            location: displayProperty.location || property?.location,
            price: displayProperty.price || property?.price,
            currency: displayProperty.currency || property?.currency || 'USD',
            total_shares: displayProperty.total_shares || property?.total_shares,
            shares_sold: displayProperty.shares_sold || property?.shares_sold || 0
          }}
          currentUserId={currentUserId}
        />
      )}
    </div>
  )
}

export default PropertyDetailClassic


