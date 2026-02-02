import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FiUpload, 
  FiX, 
  FiChevronLeft, 
  FiChevronRight,
  FiEye,
  FiDollarSign,
  FiHome,
  FiMapPin,
  FiGlobe,
  FiLoader,
  FiChevronDown,
  FiLink,
  FiVideo,
  FiFileText,
  FiCheck,
  FiFile,
  FiThumbsUp,
  FiClock
} from 'react-icons/fi'
import { PiBuildingApartment, PiBuildings, PiWarehouse } from 'react-icons/pi'
import { MdBed, MdOutlineBathtub, MdLightbulb } from 'react-icons/md'
import { BiArea } from 'react-icons/bi'
import LocationMap from '../components/LocationMap'
import PropertyPreviewModal from '../components/PropertyPreviewModal'
import DateRangePicker from '../components/DateRangePicker'
import AuctionPeriodPicker from '../components/AuctionPeriodPicker'
import SellerVerificationModal from '../components/SellerVerificationModal'
import CardBindingModal from '../components/CardBindingModal'
import CountrySelect from '../components/CountrySelect'
import { getUserData } from '../services/authService'
import './AddProperty.css'

const AddProperty = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const documentInputRef = useRef(null)
  const ownershipInputRef = useRef(null)
  const noDebtsInputRef = useRef(null)
  
  const [photos, setPhotos] = useState([])
  const [videos, setVideos] = useState([])
  const [additionalDocuments, setAdditionalDocuments] = useState([])
  const [requiredDocuments, setRequiredDocuments] = useState({
    ownership: null,
    noDebts: null
  })
  const [uploadedDocuments, setUploadedDocuments] = useState({
    ownership: false,
    noDebts: false
  })
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [showCarousel, setShowCarousel] = useState(false)
  const [mediaItems, setMediaItems] = useState([]) // Объединенный массив фото и видео
  const [photosMediaIndex, setPhotosMediaIndex] = useState(0) // Индекс для карусели на странице загрузки фотографий
  const [showPreview, setShowPreview] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [showCardBindingModal, setShowCardBindingModal] = useState(false)
  const [userId, setUserId] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showVideoLinkModal, setShowVideoLinkModal] = useState(false)
  const [videoLink, setVideoLink] = useState('')
  const [showPhotoLinkModal, setShowPhotoLinkModal] = useState(false)
  const [photoLink, setPhotoLink] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [translations, setTranslations] = useState(null)
  const [showTranslations, setShowTranslations] = useState(false)
  const [currency, setCurrency] = useState('USD')
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(null) // 'price' или 'auction' или null
  const [currentStep, setCurrentStep] = useState('type-selection') // 'type-selection', 'test-drive-question', 'property-name', 'location', 'details', 'amenities', 'photos', 'documents', 'price', 'form'
  const [showHint1, setShowHint1] = useState(true)
  const [showHint2, setShowHint2] = useState(true)
  // Состояния для подсказок на каждом шаге
  const [showHints, setShowHints] = useState({
    'type-selection': true,
    'test-drive-question': true,
    'property-name': true, // уже используется showHint1 и showHint2
    'location': true,
    'details': true,
    'amenities': true,
    'photos': true,
    'documents': true,
    'price': true
  })
  const [addressSearch, setAddressSearch] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [bedrooms, setBedrooms] = useState([
    { id: 1, name: 'Спальня 1', beds: [] },
    { id: 2, name: 'Гостиная', beds: [] },
    { id: 3, name: 'Другие помещения', beds: [] }
  ])
  const [guests, setGuests] = useState(0)
  const [areaUnit, setAreaUnit] = useState('square_meters')
  const [selectedBedroom, setSelectedBedroom] = useState(null)
  const [showBedModal, setShowBedModal] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCoordinates, setSelectedCoordinates] = useState(null)
  const [mapCenter, setMapCenter] = useState([55.7558, 37.6173]) // Москва по умолчанию
  const [citySearch, setCitySearch] = useState('')
  const [citySuggestions, setCitySuggestions] = useState([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const citySearchRef = useRef(null)
  const citySearchTimeoutRef = useRef(null)
  const [houseSuggestions, setHouseSuggestions] = useState([])
  const [showHouseSuggestions, setShowHouseSuggestions] = useState(false)
  const houseSearchTimeoutRef = useRef(null)
  const [isCitySearching, setIsCitySearching] = useState(false)
  const [isAddressSearching, setIsAddressSearching] = useState(false)
  
  const currencies = [
    { code: 'USD', symbol: '$', name: 'Доллар США' },
    { code: 'EUR', symbol: '€', name: 'Евро' },
    { code: 'RUB', symbol: '₽', name: 'Российский рубль' },
    { code: 'GBP', symbol: '£', name: 'Фунт стерлингов' }
  ]
  
  const [formData, setFormData] = useState({
    propertyType: '', // Сначала выбираем тип
    testDrive: null, // null, true или false
    title: '',
    description: '',
    price: '',
    isAuction: false,
    auctionStartDate: '',
    auctionEndDate: '',
    auctionStartingPrice: '',
    // Общие поля
    area: '',
    rooms: '',
    bedrooms: '',
    bathrooms: '',
    floor: '',
    totalFloors: '',
    yearBuilt: '',
    location: '',
    address: '',
    apartment: '',
    country: '',
    city: '',
    coordinates: null, // [lat, lng]
    // Дополнительные поля для квартиры
    balcony: false,
    parking: false,
    elevator: false,
    // Дополнительные поля для дома/виллы
    landArea: '',
    garage: false,
    pool: false,
    garden: false,
    // Дополнительные поля для коммерческой
    commercialType: '',
    businessHours: '',
    // Общие дополнительные
    renovation: '',
    condition: '',
    heating: '',
    waterSupply: '',
    sewerage: '',
    electricity: false,
    internet: false,
    security: false,
    furniture: false,
    // 12 новых чекбоксов
    feature1: false,
    feature2: false,
    feature3: false,
    feature4: false,
    feature5: false,
    feature6: false,
    feature7: false,
    feature8: false,
    feature9: false,
    feature10: false,
    feature11: false,
    feature12: false
  })

  // Закрытие выпадающего списка валют при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCurrencyDropdown && !event.target.closest('.currency-selector')) {
        setShowCurrencyDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCurrencyDropdown])

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files)
    const remainingSlots = 10 - photos.length
    
    if (files.length > remainingSlots) {
      alert(`Можно загрузить максимум ${remainingSlots} фото`)
      return
    }

    files.forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPhotos(prev => [...prev, {
            id: Date.now() + Math.random() + index,
            url: reader.result,
            file: file
          }])
        }
        reader.readAsDataURL(file)
      }
    })
    e.target.value = ''
  }

  const handleRemovePhoto = (id) => {
    setPhotos(photos.filter(photo => photo.id !== id))
  }

  // Функция для получения YouTube ID из URL
  const getYouTubeVideoId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  // Функция для получения Google Drive ID из URL
  const getGoogleDriveVideoId = (url) => {
    const patterns = [
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  // Функция для проверки и обработки ссылки на видео
  const handleVideoLinkSubmit = () => {
    if (!videoLink.trim()) {
      alert('Пожалуйста, введите ссылку')
      return
    }

    const youtubeId = getYouTubeVideoId(videoLink)
    const googleDriveId = getGoogleDriveVideoId(videoLink)

    if (youtubeId) {
      const newVideo = {
        id: Date.now() + Math.random(),
        type: 'youtube',
        url: videoLink,
        videoId: youtubeId,
        thumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
      }
      setVideos(prev => [...prev, newVideo])
      setVideoLink('')
      setShowVideoLinkModal(false)
    } else if (googleDriveId) {
      const newVideo = {
        id: Date.now() + Math.random(),
        type: 'googledrive',
        url: videoLink,
        videoId: googleDriveId,
        embedUrl: `https://drive.google.com/file/d/${googleDriveId}/preview`
      }
      setVideos(prev => [...prev, newVideo])
      setVideoLink('')
      setShowVideoLinkModal(false)
    } else {
      alert('Пожалуйста, введите корректную ссылку на YouTube или Google Drive')
    }
  }

  // Обработчик загрузки видео с компьютера
  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files)
    const remainingSlots = 3 - videos.length
    
    if (files.length > remainingSlots) {
      alert(`Можно загрузить максимум ${remainingSlots} видео`)
      e.target.value = ''
      return
    }

    files.forEach((file, index) => {
      if (!file.type.startsWith('video/')) {
        alert(`Файл ${file.name} не является видео`)
        return
      }

      // Проверка длительности видео (максимум 1 минута = 60 секунд)
      const video = document.createElement('video')
      video.preload = 'metadata'
      const objectUrl = URL.createObjectURL(file)
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(objectUrl)
        const duration = video.duration
        
        if (duration > 60) {
          alert(`Видео "${file.name}" превышает максимальную длительность (1 минута). Текущая длительность: ${Math.round(duration)} секунд`)
          return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
          setVideos(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'file',
            url: reader.result,
            file: file,
            duration: duration
          }])
        }
        reader.onerror = () => {
          alert(`Ошибка при чтении файла "${file.name}"`)
        }
        reader.readAsDataURL(file)
      }

      video.onerror = () => {
        window.URL.revokeObjectURL(objectUrl)
        alert(`Ошибка при чтении видео "${file.name}"`)
      }

      video.src = objectUrl
    })
    
    e.target.value = ''
  }

  const handleRemoveVideo = (id) => {
    setVideos(videos.filter(video => video.id !== id))
  }

  // Обработчик загрузки дополнительных документов
  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files)
    
    files.forEach((file) => {
      // Проверяем, что файл - это PDF или изображение
      const isPDF = file.type === 'application/pdf'
      const isImage = file.type.startsWith('image/')
      
      if (!isPDF && !isImage) {
        alert(`Файл ${file.name} не поддерживается. Разрешены только PDF и изображения.`)
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setAdditionalDocuments(prev => [...prev, {
          id: Date.now() + Math.random(),
          name: file.name,
          url: reader.result,
          file: file,
          type: isPDF ? 'pdf' : 'image'
        }])
      }
      reader.onerror = () => {
        alert(`Ошибка при чтении файла "${file.name}"`)
      }
      reader.readAsDataURL(file)
    })
    
    e.target.value = ''
  }

  const handleRemoveDocument = (id) => {
    setAdditionalDocuments(additionalDocuments.filter(doc => doc.id !== id))
  }

  // Функция для форматирования числа с запятыми
  const formatNumberWithCommas = (value) => {
    // Убираем все нецифровые символы
    const numericValue = value.toString().replace(/\D/g, '')
    if (!numericValue) return ''
    // Форматируем с запятыми каждые 3 цифры
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  // Функция для удаления запятых из числа
  const removeCommas = (value) => {
    return value.toString().replace(/,/g, '')
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Обработчик для поля цены с форматированием
  const handlePriceChange = (e) => {
    const value = e.target.value
    // Сохраняем числовое значение без запятых
    const numericValue = removeCommas(value)
    setFormData(prev => ({
      ...prev,
      price: numericValue
    }))
  }

  // Обработчик для стартовой цены аукциона с форматированием
  const handleAuctionPriceChange = (e) => {
    const value = e.target.value
    // Сохраняем числовое значение без запятых
    const numericValue = removeCommas(value)
    setFormData(prev => ({
      ...prev,
      auctionStartingPrice: numericValue
    }))
  }

  const handleDetailChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePreview = () => {
    if (!formData.title || photos.length === 0) {
      alert('Пожалуйста, заполните заголовок и загрузите хотя бы одно фото')
      return
    }
    setShowPreview(true)
  }

  const handlePublish = async () => {
    if (!formData.title || photos.length === 0) {
      alert('Пожалуйста, заполните заголовок и загрузите хотя бы одно фото')
      return false
    }
    if (!uploadedDocuments.ownership || !uploadedDocuments.noDebts) {
      alert('Пожалуйста, загрузите все необходимые документы')
      return false
    }
    if (!userId) {
      alert('Ошибка: пользователь не авторизован. Пожалуйста, войдите в систему.')
      return false
    }

    setIsSubmitting(true)
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3000/api')
      
      // Загружаем данные пользователя из профиля
      let userProfileData = null
      try {
        const userResponse = await fetch(`${API_BASE_URL}/users/${userId}`)
        if (userResponse.ok) {
          const userData = await userResponse.json()
          if (userData.success && userData.data) {
            userProfileData = userData.data
            console.log('✅ Данные пользователя загружены из профиля:', userProfileData)
          }
        }
      } catch (userError) {
        console.warn('⚠️ Не удалось загрузить данные пользователя из профиля:', userError)
      }
      
      // Подготавливаем данные для отправки
      const formDataToSend = new FormData()
      
      // Основные данные
      formDataToSend.append('user_id', String(userId))
      formDataToSend.append('property_type', formData.propertyType)
      formDataToSend.append('title', formData.title)
      
      // Данные пользователя из профиля (если загружены)
      if (userProfileData) {
        if (userProfileData.first_name) formDataToSend.append('first_name', userProfileData.first_name)
        if (userProfileData.last_name) formDataToSend.append('last_name', userProfileData.last_name)
        if (userProfileData.email) formDataToSend.append('email', userProfileData.email)
        if (userProfileData.phone_number) formDataToSend.append('phone_number', userProfileData.phone_number)
        if (userProfileData.country) formDataToSend.append('country', userProfileData.country)
        if (userProfileData.address) formDataToSend.append('address', userProfileData.address)
        if (userProfileData.passport_series) formDataToSend.append('passport_series', userProfileData.passport_series)
        if (userProfileData.passport_number) formDataToSend.append('passport_number', userProfileData.passport_number)
        if (userProfileData.identification_number) formDataToSend.append('identification_number', userProfileData.identification_number)
      }
      formDataToSend.append('description', formData.description || '')
      if (formData.price) formDataToSend.append('price', String(formData.price))
      formDataToSend.append('currency', currency)
      formDataToSend.append('is_auction', formData.isAuction ? '1' : '0')
      if (formData.testDrive !== null) {
        formDataToSend.append('test_drive', formData.testDrive ? '1' : '0')
      }
      if (formData.auctionStartDate) formDataToSend.append('auction_start_date', formData.auctionStartDate)
      if (formData.auctionEndDate) formDataToSend.append('auction_end_date', formData.auctionEndDate)
      if (formData.auctionStartingPrice) formDataToSend.append('auction_starting_price', String(formData.auctionStartingPrice))
      
      // Общие характеристики
      if (formData.area) formDataToSend.append('area', String(formData.area))
      if (formData.rooms) formDataToSend.append('rooms', String(formData.rooms))
      if (formData.bedrooms) formDataToSend.append('bedrooms', String(formData.bedrooms))
      if (formData.bathrooms) formDataToSend.append('bathrooms', String(formData.bathrooms))
      if (formData.floor) formDataToSend.append('floor', String(formData.floor))
      if (formData.totalFloors) formDataToSend.append('total_floors', String(formData.totalFloors))
      if (formData.yearBuilt) formDataToSend.append('year_built', String(formData.yearBuilt))
      if (formData.location) formDataToSend.append('location', formData.location)
      if (formData.address) formDataToSend.append('address', formData.address)
      if (formData.apartment) formDataToSend.append('apartment', formData.apartment)
      if (formData.country) formDataToSend.append('country', formData.country)
      if (formData.city) formDataToSend.append('city', formData.city)
      if (formData.coordinates) {
        formDataToSend.append('coordinates', JSON.stringify(formData.coordinates))
      }
      
      // Дополнительные поля
      formDataToSend.append('balcony', formData.balcony ? '1' : '0')
      formDataToSend.append('parking', formData.parking ? '1' : '0')
      formDataToSend.append('elevator', formData.elevator ? '1' : '0')
      if (formData.landArea) formDataToSend.append('land_area', String(formData.landArea))
      formDataToSend.append('garage', formData.garage ? '1' : '0')
      formDataToSend.append('pool', formData.pool ? '1' : '0')
      formDataToSend.append('garden', formData.garden ? '1' : '0')
      if (formData.commercialType) formDataToSend.append('commercial_type', formData.commercialType)
      if (formData.businessHours) formDataToSend.append('business_hours', formData.businessHours)
      if (formData.renovation) formDataToSend.append('renovation', formData.renovation)
      if (formData.condition) formDataToSend.append('condition', formData.condition)
      if (formData.heating) formDataToSend.append('heating', formData.heating)
      if (formData.waterSupply) formDataToSend.append('water_supply', formData.waterSupply)
      if (formData.sewerage) formDataToSend.append('sewerage', formData.sewerage)
      formDataToSend.append('electricity', formData.electricity ? '1' : '0')
      formDataToSend.append('internet', formData.internet ? '1' : '0')
      formDataToSend.append('security', formData.security ? '1' : '0')
      formDataToSend.append('furniture', formData.furniture ? '1' : '0')
      
      // Медиа (JSON)
      formDataToSend.append('photos', JSON.stringify(photos.map(p => p.url)))
      formDataToSend.append('videos', JSON.stringify(videos))
      formDataToSend.append('additional_documents', JSON.stringify(additionalDocuments.map(doc => ({
        name: doc.name,
        url: doc.url,
        type: doc.type
      }))))
      
      // Документы
      if (requiredDocuments.ownership) {
        formDataToSend.append('ownership_document', requiredDocuments.ownership)
      }
      if (requiredDocuments.noDebts) {
        formDataToSend.append('no_debts_document', requiredDocuments.noDebts)
      }
      
      console.log('📤 Отправка объявления на сервер...')
      
      const response = await fetch(`${API_BASE_URL}/properties`, {
        method: 'POST',
        body: formDataToSend
      })
      
      console.log('📥 Ответ сервера:', response.status, response.statusText)
      
      if (!response.ok) {
        let errorText = 'Неизвестная ошибка'
        try {
          errorText = await response.text()
          console.error('❌ Ошибка сервера:', errorText)
        } catch (e) {
          console.error('❌ Не удалось прочитать ответ сервера')
        }
        throw new Error(`Ошибка сервера: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log('✅ Данные от сервера:', data)
      
      if (data.success) {
        // Данные успешно отправлены на сервер
        // НЕ сохраняем данные в localStorage, так как они уже на сервере
        // Это предотвращает ошибку QuotaExceededError из-за больших файлов (фото в base64)
        // Все данные уже сохранены на сервере через API
        
        // Закрываем модальное окно верификации
        setShowVerificationModal(false)
        
        // Показываем модальное окно об успешной отправке
        setIsSubmitting(false)
        setShowSuccessModal(true)
        
        return true
      } else {
        throw new Error(data.error || 'Ошибка при отправке объявления')
      }
    } catch (error) {
      console.error('❌ Ошибка при отправке объявления:', error)
      setIsSubmitting(false)
      // Показываем более детальное сообщение об ошибке
      if (error.message.includes('Field value too long')) {
        alert('Ошибка: Размер данных слишком большой. Попробуйте уменьшить количество фото или размер файлов.')
      } else if (error.message.includes('ERR_CONNECTION_RESET') || error.message.includes('Failed to fetch')) {
        alert('Ошибка соединения с сервером. Проверьте, что сервер запущен и попробуйте еще раз.')
      } else {
        alert(`Произошла ошибка при отправке объявления: ${error.message}`)
      }
      return false
    }
  }

  // Получаем userId при монтировании компонента
  useEffect(() => {
    const userData = getUserData()
    if (userData.isLoggedIn && userData.id) {
      setUserId(userData.id)
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    // Валидация основных полей
    if (!formData.title || photos.length === 0) {
      alert('Пожалуйста, заполните заголовок и загрузите хотя бы одно фото')
      return
    }
    // Проверяем документы перед публикацией
    if (!uploadedDocuments.ownership || !uploadedDocuments.noDebts) {
      alert('Пожалуйста, загрузите все необходимые документы')
      return
    }
    // Проверяем, что userId есть
    if (!userId) {
      alert('Ошибка: пользователь не авторизован. Пожалуйста, войдите в систему.')
      return
    }
    // Открываем модальное окно верификации
    setShowVerificationModal(true)
  }

  const handleVerificationComplete = async () => {
    // После завершения верификации сохраняем флаг в localStorage
    localStorage.setItem('verificationSubmitted', 'true')
    // Закрываем модальное окно верификации
    setShowVerificationModal(false)
    // Открываем модальное окно привязки карточки
    setShowCardBindingModal(true)
    return true
  }

  const handleCardBindingComplete = async () => {
    // После привязки карточки сохраняем флаг в localStorage (для совместимости)
    localStorage.setItem('cardBound', 'true')
    // Закрываем модальное окно привязки карточки
    setShowCardBindingModal(false)
    
    // Если верификация уже была пройдена, автоматически отправляем объявление на модерацию
    const verificationData = localStorage.getItem('verificationSubmitted')
    if (verificationData === 'true') {
      const success = await handlePublish()
      if (success) {
        // Очищаем только флаг верификации (cardBound остается, чтобы карта считалась привязанной навсегда)
        localStorage.removeItem('verificationSubmitted')
      }
    }
    
    return true
  }

  const translateText = async (text, targetLang) => {
    try {
      // Используем MyMemory API - бесплатный сервис перевода
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ru|${targetLang}`
      )
      const data = await response.json()
      if (data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText
      }
      return text
    } catch (error) {
      console.error(`Ошибка перевода на ${targetLang}:`, error)
      return text
    }
  }

  const handleTranslateAll = async () => {
    if (!formData.title && !formData.description) {
      alert('Пожалуйста, заполните заголовок или описание перед переводом')
      return
    }

    setIsTranslating(true)
    setShowTranslations(false)

    const textToTranslate = `${formData.title || ''} ${formData.description || ''}`.trim()

    if (!textToTranslate) {
      alert('Нет текста для перевода')
      setIsTranslating(false)
      return
    }

    try {
      const languages = {
        es: 'Испанский',
        it: 'Итальянский',
        en: 'Английский',
        de: 'Немецкий'
      }

      const translationsResult = {
        ru: {
          name: 'Русский (оригинал)',
          text: textToTranslate
        }
      }

      // Переводим на каждый язык
      for (const [code, name] of Object.entries(languages)) {
        const translated = await translateText(textToTranslate, code)
        translationsResult[code] = {
          name,
          text: translated
        }
        // Небольшая задержка между запросами, чтобы не перегружать API
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      setTranslations(translationsResult)
      setShowTranslations(true)
    } catch (error) {
      console.error('Ошибка перевода:', error)
      alert('Произошла ошибка при переводе. Попробуйте еще раз.')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleRequiredDocumentChange = (type, e) => {
    const file = e.target.files[0]
    if (file) {
      setRequiredDocuments(prev => ({
        ...prev,
        [type]: file
      }))
      setUploadedDocuments(prev => ({
        ...prev,
        [type]: true
      }))
    }
    e.target.value = ''
  }

  const handleRemoveRequiredDocument = (type) => {
    setRequiredDocuments(prev => ({
      ...prev,
      [type]: null
    }))
    setUploadedDocuments(prev => ({
      ...prev,
      [type]: false
    }))
  }

  // Обновляем объединенный массив медиа при изменении фото или видео
  useEffect(() => {
    const items = [
      ...photos.map(photo => ({ ...photo, mediaType: 'photo' })),
      ...videos.map(video => ({ ...video, mediaType: 'video' }))
    ]
    setMediaItems(items)
  }, [photos, videos])

  const nextMedia = () => {
    setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length)
  }

  const prevMedia = () => {
    setCurrentMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)
  }

  // Функция для получения иконки типа недвижимости
  const getPropertyTypeIcon = (type) => {
    switch (type) {
      case 'house':
        return <FiHome size={64} />
      case 'apartment':
        return <PiBuildingApartment size={64} />
      case 'villa':
        return <PiBuildings size={64} />
      case 'commercial':
        return <PiWarehouse size={64} />
      default:
        return <FiHome size={64} />
    }
  }

  // Функция для получения названия типа недвижимости
  const getPropertyTypeName = (type) => {
    switch (type) {
      case 'house':
        return 'Дом'
      case 'apartment':
        return 'Квартира'
      case 'villa':
        return 'Вилла'
      case 'commercial':
        return 'Апартаменты'
      default:
        return 'Недвижимость'
    }
  }

  // Обработчик выбора типа недвижимости
  const handlePropertyTypeSelect = (type) => {
    setFormData(prev => ({ ...prev, propertyType: type }))
    setCurrentStep('test-drive-question')
  }

  // Обработчик ответа на вопрос о тест-драйве
  const handleTestDriveAnswer = (answer) => {
    setFormData(prev => ({ ...prev, testDrive: answer }))
    setCurrentStep('property-name')
  }

  // Обработчик перехода к форме после заполнения названия
  const handlePropertyNameContinue = () => {
    if (!formData.title) {
      alert('Пожалуйста, введите название объекта')
      return
    }
    setCurrentStep('location')
  }

  // Поиск адреса через Nominatim API с учетом города
  // options.autoSelect = true — автоматически выбираем лучший результат и двигаем карту
  const searchAddress = async (query, { autoSelect = false } = {}) => {
    if (!query || query.length < 2) {
      setAddressSuggestions([])
      setShowSuggestions(false)
      setIsAddressSearching(false)
      return
    }

    setIsAddressSearching(true)
    try {
      let searchQuery = query.trim()
      
      // Если указан город, добавляем его в запрос
      if (formData.city) {
        const cityName = formData.city.split(',')[0].trim() // Берем только название города
        searchQuery = `${query.trim()}, ${cityName}`
        
        // Если также указана страна, добавляем и её
        if (formData.country) {
          searchQuery = `${query.trim()}, ${cityName}, ${formData.country}`
        }
      } else if (formData.country) {
        // Если указана только страна
        searchQuery = `${query.trim()}, ${formData.country}`
      }
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=10&accept-language=ru&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PropertyListingApp/1.0'
          }
        }
      )
      
      if (!response.ok) {
        console.error('Ошибка API:', response.status)
        return
      }
      
      const data = await response.json()
      
      // Фильтруем результаты по городу, если город указан
      let addresses = data
      if (formData.city) {
        const cityName = formData.city.split(',')[0].trim().toLowerCase()
        addresses = data.filter(item => {
          const address = item.address || {}
          const displayName = item.display_name || ''
          
          // Проверяем город в адресе или в display_name
          const itemCity = (address.city || address.town || address.village || '').toLowerCase()
          const itemCityInName = displayName.toLowerCase().includes(cityName)
          
          return itemCity === cityName || itemCityInName
        })
        
        // Если после фильтрации нет результатов, показываем все
        if (addresses.length === 0 && data.length > 0) {
          addresses = data
        }
      }
      
      // Сортируем по важности
      addresses.sort((a, b) => (b.importance || 0) - (a.importance || 0))
      
      // Ограничиваем до 10 результатов
      addresses = addresses.slice(0, 10)
      
      setAddressSuggestions(addresses)
      setShowSuggestions(addresses.length > 0)

      // При необходимости автоматически выбираем лучший результат
      if (autoSelect && addresses.length > 0) {
        const best = addresses[0]
        const address = best.display_name
        const lat = parseFloat(best.lat)
        const lng = parseFloat(best.lon)
        const coords = [lat, lng]

        const addressParts = best.address || {}
        const country = addressParts.country || ''
        const city = addressParts.city || addressParts.town || addressParts.village || ''

        setAddressSearch(address)
        setSelectedCoordinates(coords)
        setMapCenter(coords)

        setFormData(prev => ({
          ...prev,
          address,
          location: address,
          coordinates: coords,
          country: prev.country || country,
          city: prev.city || city
        }))
      }
      // Сбрасываем загрузку только после установки результатов
      setTimeout(() => {
        setIsAddressSearching(false)
      }, 100)
    } catch (error) {
      console.error('Ошибка поиска адреса:', error)
      setAddressSuggestions([])
      setShowSuggestions(false)
      setIsAddressSearching(false)
    }
  }

  // Debounce для поиска адреса
  useEffect(() => {
    if (addressSearch.length < 3 || !formData.city) {
      setAddressSuggestions([])
      setShowSuggestions(false)
      setIsAddressSearching(false)
      return
    }

    const timeoutId = setTimeout(() => {
      searchAddress(addressSearch)
    }, 700)

    return () => clearTimeout(timeoutId)
  }, [addressSearch, formData.city, formData.country])

  // Поиск городов через Nominatim API
  const searchCity = async (query, country = '') => {
    if (!query || query.length < 2) {
      setCitySuggestions([])
      setShowCitySuggestions(false)
      setIsCitySearching(false)
      return
    }

    setIsCitySearching(true)
    try {
      let searchQuery = query.trim()
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=20&accept-language=ru&addressdetails=1`
      
      // Если выбрана страна, добавляем её в запрос
      if (country) {
        searchQuery = `${query.trim()}, ${country}`
        url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=20&accept-language=ru&addressdetails=1`
      }
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'PropertyListingApp/1.0'
        }
      })
      
      if (!response.ok) {
        console.error('Ошибка API:', response.status)
        return
      }
      
      const data = await response.json()
      
      if (!data || data.length === 0) {
        setCitySuggestions([])
        setShowCitySuggestions(false)
        return
      }
      
      // Более мягкая фильтрация - принимаем все результаты, которые похожи на города
      let cities = data.filter(item => {
        const type = item.type || ''
        const classType = item.class || ''
        const importance = item.importance || 0
        
        // Проверяем, что это город или населенный пункт (более широкий список)
        const isCity = type === 'city' || 
                      type === 'town' || 
                      type === 'administrative' ||
                      classType === 'place' ||
                      type === 'village' ||
                      type === 'hamlet' ||
                      type === 'locality' ||
                      type === 'suburb'
        
        // Очень мягкий порог важности
        return isCity && importance > 0.05
      })
      
      // Если после фильтрации нет результатов, используем все данные
      if (cities.length === 0) {
        cities = data
      }
      
      // Если выбрана страна, дополнительно фильтруем по стране в адресе (более мягкая проверка)
      if (country && cities.length > 0) {
        const filteredByCountry = cities.filter(item => {
          const address = item.address || {}
          const itemCountry = address.country || ''
          const displayName = item.display_name || ''
          
          // Проверяем страну в адресе или в display_name
          return itemCountry.toLowerCase().includes(country.toLowerCase()) || 
                 country.toLowerCase().includes(itemCountry.toLowerCase()) ||
                 displayName.toLowerCase().includes(country.toLowerCase())
        })
        
        // Если есть результаты с фильтрацией по стране, используем их, иначе используем все
        if (filteredByCountry.length > 0) {
          cities = filteredByCountry
        }
      }
      
      // Сортируем по важности (более важные города первыми)
      cities.sort((a, b) => (b.importance || 0) - (a.importance || 0))
      
      // Ограничиваем до 10 результатов
      cities = cities.slice(0, 10)
      
      setCitySuggestions(cities)
      setShowCitySuggestions(cities.length > 0)
      // Сбрасываем загрузку только после установки результатов
      setTimeout(() => {
        setIsCitySearching(false)
      }, 100)
    } catch (error) {
      console.error('Ошибка поиска города:', error)
      setCitySuggestions([])
      setShowCitySuggestions(false)
      setIsCitySearching(false)
    }
  }

  // Обновление поиска при изменении страны (основной поиск в onChange)
  useEffect(() => {
    // Обновляем поиск только при изменении страны, если уже есть введенный текст
    if (citySearch && citySearch.length >= 2 && formData.country) {
      const timeoutId = setTimeout(() => {
        searchCity(citySearch, formData.country)
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [formData.country])

  // Обработчик выбора города
  const handleCitySelect = (city) => {
    // Заполняем поле полным адресом из подсказки
    const fullAddress = city.display_name
    setCitySearch(fullAddress)
    // Сохраняем только название города в formData.city
    const cityName = fullAddress.split(',')[0].trim()
    setFormData(prev => ({ ...prev, city: cityName }))
    setShowCitySuggestions(false)
    setIsCitySearching(false) // Сбрасываем состояние загрузки
    // Устанавливаем подсказки, чтобы показать галочку
    setCitySuggestions([city])
  }

  // Синхронизация citySearch с formData.city при изменении извне (только если citySearch пустой)
  useEffect(() => {
    if (!citySearch && formData.city) {
      setCitySearch(formData.city)
    }
  }, [])

  // Обработчик выбора адреса из предложений
  const handleAddressSelect = (suggestion) => {
    const address = suggestion.display_name
    const lat = parseFloat(suggestion.lat)
    const lng = parseFloat(suggestion.lon)
    const coords = [lat, lng]
    
    setAddressSearch(address)
    setSelectedCoordinates(coords)
    setMapCenter(coords)
    setShowSuggestions(false)
    setIsAddressSearching(false) // Сбрасываем состояние загрузки
    // Устанавливаем подсказки, чтобы показать галочку
    setAddressSuggestions([suggestion])
    
    // Извлекаем страну и город из адреса
    const addressParts = suggestion.address || {}
    const country = addressParts.country || ''
    const city = addressParts.city || addressParts.town || addressParts.village || ''
    
    setFormData(prev => ({
      ...prev,
      address: address,
      location: address,
      coordinates: coords,
      country: country,
      city: city
    }))
  }

  // Поиск домов (номер дома) на основе выбранной улицы
  const searchHouse = async (houseValue) => {
    if (!houseValue || !addressSearch || !formData.city) {
      setHouseSuggestions([])
      setShowHouseSuggestions(false)
      return
    }

    try {
      const streetPart = addressSearch.split(',')[0].trim()
      const searchQuery = `${streetPart} ${houseValue}, ${formData.city}, ${formData.country}`.trim()

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=10&accept-language=ru&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PropertyListingApp/1.0'
          }
        }
      )

      if (!response.ok) {
        console.error('Ошибка поиска дома:', response.status)
        setHouseSuggestions([])
        setShowHouseSuggestions(false)
        return
      }

      const data = await response.json()
      
      // Фильтруем результаты: оставляем только те, где есть конкретный номер дома
      const filteredHouses = data.filter(item => {
        const address = item.address || {}
        const houseNumber = address.house_number || ''
        const displayName = item.display_name || ''
        
        // Проверяем наличие номера дома в address.house_number
        if (houseNumber && houseNumber.toString().toLowerCase().includes(houseValue.toLowerCase())) {
          return true
        }
        
        // Проверяем наличие номера дома в начале display_name (формат: "66 к1, улица..." или "улица ... 66")
        const houseRegex = new RegExp(`\\b${houseValue}\\b`, 'i')
        if (houseRegex.test(displayName)) {
          // Убеждаемся, что это не просто индекс или часть другого адреса
          // Проверяем, что номер дома находится в начале или после названия улицы
          const streetPart = addressSearch.split(',')[0].trim().toLowerCase()
          const displayLower = displayName.toLowerCase()
          
          // Если номер дома в начале адреса (например "66 к1, улица...") или после названия улицы
          if (displayLower.startsWith(houseValue.toLowerCase()) || 
              (displayLower.includes(streetPart) && displayLower.includes(houseValue.toLowerCase()))) {
            return true
          }
        }
        
        return false
      })
      
      setHouseSuggestions(filteredHouses)
      setShowHouseSuggestions(filteredHouses.length > 0)
    } catch (error) {
      console.error('Ошибка поиска дома:', error)
      setHouseSuggestions([])
      setShowHouseSuggestions(false)
    }
  }

  // Обработчик выбора дома из подсказок
  const handleHouseSelect = (suggestion) => {
    const address = suggestion.display_name
    const lat = parseFloat(suggestion.lat)
    const lng = parseFloat(suggestion.lon)
    const coords = [lat, lng]

    const addressParts = suggestion.address || {}
    const country = addressParts.country || ''
    const city = addressParts.city || addressParts.town || addressParts.village || ''
    const houseNumber = addressParts.house_number || formData.apartment || ''

    setAddressSearch(address)
    setSelectedCoordinates(coords)
    setMapCenter(coords)
    setHouseSuggestions([])
    setShowHouseSuggestions(false)

    setFormData(prev => ({
      ...prev,
      address,
      location: address,
      coordinates: coords,
      country: prev.country || country,
      city: prev.city || city,
      apartment: houseNumber
    }))
  }

  // Компонент для обновления центра карты
  const MapUpdater = ({ center, zoom = 15 }) => {
    const map = useMap()
    useEffect(() => {
      if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
        map.setView(center, zoom, { animate: true, duration: 0.5 })
      }
    }, [center, zoom, map])
    return null
  }

  // Обработчик перехода к подробной информации после заполнения местоположения
  const handleLocationContinue = () => {
    if (!formData.address) {
      alert('Пожалуйста, введите адрес')
      return
    }
    setCurrentStep('details')
  }

  // Обработчик перехода к удобствам после заполнения подробной информации
  const handleDetailsContinue = () => {
    // Сохраняем данные о спальнях в formData
    setFormData(prev => ({
      ...prev,
      bedrooms: bedrooms.filter(b => getTotalBedsCount(b.beds) > 0).length
    }))
    setCurrentStep('amenities')
  }

  // Обработчик перехода к загрузке фотографий после заполнения удобств
  const handleAmenitiesContinue = () => {
    setCurrentStep('photos')
    // Обновляем объединенный массив медиа при переходе на страницу фотографий
    updateMediaItems()
  }

  // Функция для обновления объединенного массива медиа
  const updateMediaItems = () => {
    const allMedia = [
      ...photos.map(photo => ({ ...photo, mediaType: 'photo' })),
      ...videos.map(video => ({ ...video, mediaType: 'video' }))
    ]
    setMediaItems(allMedia)
    if (allMedia.length > 0 && photosMediaIndex >= allMedia.length) {
      setPhotosMediaIndex(0)
    }
  }

  // Обновляем mediaItems при изменении photos или videos
  useEffect(() => {
    if (currentStep === 'photos') {
      const allMedia = [
        ...photos.map(photo => ({ ...photo, mediaType: 'photo' })),
        ...videos.map(video => ({ ...video, mediaType: 'video' }))
      ]
      setMediaItems(allMedia)
      // Корректируем индекс, если он выходит за границы
      if (allMedia.length > 0) {
        setPhotosMediaIndex(prev => {
          if (prev >= allMedia.length) {
            return allMedia.length - 1
          }
          // Если индекс валидный, оставляем его, иначе переходим на последний элемент
          return prev < 0 ? 0 : prev
        })
      } else {
        setPhotosMediaIndex(0)
      }
    }
  }, [photos, videos, currentStep])

  // Навигация по карусели на странице фотографий
  const handleNextMedia = () => {
    const allMedia = [
      ...photos.map(photo => ({ ...photo, mediaType: 'photo' })),
      ...videos.map(video => ({ ...video, mediaType: 'video' }))
    ]
    if (allMedia.length > 0) {
      setPhotosMediaIndex((prev) => (prev + 1) % allMedia.length)
    }
  }

  const handlePrevMedia = () => {
    const allMedia = [
      ...photos.map(photo => ({ ...photo, mediaType: 'photo' })),
      ...videos.map(video => ({ ...video, mediaType: 'video' }))
    ]
    if (allMedia.length > 0) {
      setPhotosMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length)
    }
  }

  // Обработчик перехода к форме после загрузки фотографий
  const handlePhotosContinue = () => {
    if (photos.length === 0) {
      alert('Пожалуйста, загрузите хотя бы одно фото')
      return
    }
    setCurrentStep('documents')
  }

  // Обработчик перехода к цене после загрузки документов
  const handleDocumentsContinue = () => {
    setCurrentStep('price')
  }

  // Обработчик перехода к форме после указания цены
  const handlePriceContinue = async () => {
    if (!formData.price || formData.price <= 0) {
      alert('Пожалуйста, укажите минимальную цену продажи')
      return
    }
    if (formData.isAuction) {
      if (!formData.auctionStartDate || !formData.auctionEndDate) {
        alert('Пожалуйста, укажите период проведения аукциона')
        return
      }
      if (!formData.auctionStartingPrice || formData.auctionStartingPrice <= 0) {
        alert('Пожалуйста, укажите стартовую цену аукциона')
        return
      }
    }
    
    // Проверяем статус верификации и привязки карты пользователя
    let isUserVerified = false
    let isCardBound = false
    if (userId) {
      try {
        // Используем относительный путь через proxy для лучшей совместимости
        // Если VITE_API_BASE_URL не установлен, используем '/api' который работает через vite proxy
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
        
        // Создаем AbortController для таймаута (совместимость с браузерами)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 секунд таймаут
        
        const verificationResponse = await fetch(`${API_BASE_URL}/users/${userId}/verification-status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (verificationResponse.ok) {
          const verificationData = await verificationResponse.json()
          if (verificationData.success && verificationData.data) {
            isUserVerified = verificationData.data.isVerified === true
            isCardBound = verificationData.data.cardBound === true
            console.log('✅ Статус верификации получен:', isUserVerified, 'Статус привязки карты:', isCardBound)
          }
        } else {
          console.warn('⚠️ Не удалось получить статус верификации, статус ответа:', verificationResponse.status)
        }
      } catch (error) {
        // Если ошибка подключения, логируем но продолжаем работу
        if (error.name === 'AbortError') {
          console.warn('⚠️ Таймаут при проверке статуса верификации. Продолжаем с проверкой localStorage.')
        } else if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('CONNECTION_REFUSED') || error.message.includes('NetworkError'))) {
          console.warn('⚠️ Сервер недоступен при проверке статуса верификации. Продолжаем с проверкой localStorage.')
        } else {
          console.error('❌ Ошибка при проверке статуса верификации:', error)
        }
        // При ошибке считаем что пользователь не верифицирован (безопаснее)
        // Продолжаем проверку флага verificationSubmitted в localStorage
      }
    }
    
    // Если пользователь уже верифицирован и карта привязана, отправляем объявление
    if (isUserVerified && isCardBound) {
      await handlePublish()
      // Модальное окно покажется из handlePublish, навигация произойдет при закрытии модального окна
      return
    }
    
    // Если пользователь верифицирован, но карта не привязана, проверяем localStorage
    if (isUserVerified && !isCardBound) {
      const cardBoundLocal = localStorage.getItem('cardBound')
      if (cardBoundLocal === 'true') {
        // Если в localStorage есть флаг, но в БД нет, синхронизируем
        // Отправляем объявление
        await handlePublish()
        return
      } else {
        // Если карточка не привязана, открываем модальное окно привязки карточки
        setShowCardBindingModal(true)
        return
      }
    }
    
    // Проверяем, была ли верификация отправлена (для первого раза)
    const verificationData = localStorage.getItem('verificationSubmitted')
    if (verificationData === 'true') {
      // Проверяем, была ли привязана карточка
      const cardBound = localStorage.getItem('cardBound')
      if (cardBound === 'true') {
        // Если верификация и привязка карточки завершены, отправляем форму объекта на модерацию
        const success = await handlePublish()
        if (success) {
          // Очищаем флаг верификации (но НЕ очищаем cardBound, чтобы карта считалась привязанной навсегда)
          localStorage.removeItem('verificationSubmitted')
          // Модальное окно покажется из handlePublish, навигация произойдет при закрытии модального окна
        }
      } else {
        // Если карточка не привязана, открываем модальное окно привязки карточки
        setShowCardBindingModal(true)
      }
    } else {
      // Если верификация еще не отправлена, открываем модальное окно верификации
      setShowVerificationModal(true)
    }
  }

  // Обработчик drag and drop для фотографий
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    if (imageFiles.length > 0) {
      const remainingSlots = 10 - photos.length
      if (imageFiles.length > remainingSlots) {
        alert(`Можно загрузить максимум ${remainingSlots} фото`)
        return
      }
      imageFiles.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPhotos(prev => [...prev, {
            id: Date.now() + Math.random(),
            url: reader.result,
            file: file
          }])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  // Функция для получения текста типа кровати
  const getBedTypeLabel = (bedType) => {
    const labels = {
      'twin': 'односпальная кровать',
      'full': 'двуспальная кровать',
      'queen': 'кровать размера queen',
      'king': 'кровать размера king',
      'sofa': 'диван',
      'none': 'кроватей'
    }
    return labels[bedType] || 'кровать'
  }

  // Функция для получения размера кровати
  const getBedSize = (bedType) => {
    const sizes = {
      'twin': '35-51 дюймов шириной',
      'full': '52-59 дюймов шириной',
      'queen': '60-70 дюймов шириной',
      'king': '71-81 дюймов шириной'
    }
    return sizes[bedType] || ''
  }

  // Подсчет общего количества кроватей в спальне
  const getTotalBedsCount = (beds) => {
    return beds.reduce((total, bed) => total + bed.count, 0)
  }

  // Получение текста для отображения кроватей
  const getBedsDisplayText = (beds) => {
    const total = getTotalBedsCount(beds)
    if (total === 0) return '0 кроватей'
    
    const bedTypes = beds.filter(b => b.count > 0)
    if (bedTypes.length === 1) {
      const bed = bedTypes[0]
      return `${bed.count} ${getBedTypeLabel(bed.type)}`
    }
    return `${total} кроватей`
  }

  // Открытие модального окна для редактирования кроватей
  const handleEditBedroom = (bedroom) => {
    setSelectedBedroom(bedroom)
    setShowBedModal(true)
  }

  // Сохранение изменений кроватей
  const handleSaveBeds = (bedroomId, beds) => {
    setBedrooms(bedrooms.map(b => 
      b.id === bedroomId ? { ...b, beds: beds } : b
    ))
    setShowBedModal(false)
    setSelectedBedroom(null)
  }

  // Изменение количества кроватей определенного типа
  const handleBedCountChange = (bedType, delta) => {
    if (!selectedBedroom) return
    
    const currentBeds = [...selectedBedroom.beds]
    const bedIndex = currentBeds.findIndex(b => b.type === bedType)
    
    if (bedIndex >= 0) {
      const newCount = Math.max(0, currentBeds[bedIndex].count + delta)
      if (newCount === 0) {
        currentBeds.splice(bedIndex, 1)
      } else {
        currentBeds[bedIndex].count = newCount
      }
    } else if (delta > 0) {
      currentBeds.push({ type: bedType, count: 1 })
    }
    
    setSelectedBedroom({ ...selectedBedroom, beds: currentBeds })
  }

  // Получение количества кроватей определенного типа
  const getBedCount = (bedType) => {
    if (!selectedBedroom) return 0
    const bed = selectedBedroom.beds.find(b => b.type === bedType)
    return bed ? bed.count : 0
  }

  // Добавление новой спальни
  const handleAddBedroom = () => {
    const bedroomNumber = bedrooms.filter(b => b.name.startsWith('Спальня')).length + 1
    const newBedroom = {
      id: Date.now(),
      name: `Спальня ${bedroomNumber}`,
      beds: []
    }
    setBedrooms([...bedrooms, newBedroom])
  }

  // Удаление спальни
  const handleRemoveBedroom = (id) => {
    setBedrooms(bedrooms.filter(b => b.id !== id))
  }

  // Компонент для отображения подсказок
  const HintCard = ({ icon: Icon, iconColor, title, content, onClose, show }) => {
    if (!show) return null;
    
    return (
      <div className="property-name-hint-card">
        <div className="property-name-hint-header">
          <div className={`property-name-hint-icon ${iconColor || 'property-name-hint-icon--thumbs'}`}>
            {Icon && <Icon size={20} />}
          </div>
          <h3 className="property-name-hint-title">{title}</h3>
          <button
            type="button"
            className="property-name-hint-close"
            onClick={onClose}
          >
            <FiX size={18} />
          </button>
        </div>
        {Array.isArray(content) ? (
          <ul className="property-name-hint-list">
            {content.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="property-name-hint-text">{content}</p>
        )}
      </div>
    );
  };

  return (
    <div className="add-property-page">
      <div className="add-property-container">
        <div className="add-property-header">
          <button 
            className="back-btn"
            onClick={() => {
              if (currentStep === 'test-drive-question') {
                setCurrentStep('type-selection')
                setFormData(prev => ({ ...prev, propertyType: '' }))
              } else if (currentStep === 'property-name') {
                setCurrentStep('test-drive-question')
                setFormData(prev => ({ ...prev, testDrive: null }))
              } else if (currentStep === 'location') {
                setCurrentStep('property-name')
              } else if (currentStep === 'form') {
                setCurrentStep('price')
              } else if (currentStep === 'price') {
                setCurrentStep('documents')
              } else if (currentStep === 'documents') {
                setCurrentStep('photos')
              } else {
                navigate('/owner')
              }
            }}
          >
            <FiChevronLeft size={20} />
            Назад
          </button>
          <h1 className="page-title">Добавить объявление</h1>
        </div>

        {currentStep === 'type-selection' ? (
          /* Экран выбора типа недвижимости */
          <div className="property-type-selection-screen">
            <div className="property-type-selection-header">
              <h2 className="property-type-selection-title">
                Разместите вашу недвижимость на платформе и начните принимать гостей в кратчайшие сроки!
              </h2>
              <p className="property-type-selection-subtitle">
                Для начала выберите тип недвижимости, которую вы хотите разместить
              </p>
            </div>
            
            <div className="property-type-cards-container">
              <div 
                className="property-type-card-large"
                onClick={() => handlePropertyTypeSelect('house')}
              >
                <div className="property-type-card-icon">
                  <FiHome size={48} />
                </div>
                <h3 className="property-type-card-title">Дом</h3>
                <p className="property-type-card-description">
                  Недвижимость, такая как дома, коттеджи, загородные дома и т.д.
                </p>
                <button 
                  type="button"
                  className="property-type-card-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePropertyTypeSelect('house')
                  }}
                >
                  Опишите ваш объект
                </button>
              </div>

              <div 
                className="property-type-card-large"
                onClick={() => handlePropertyTypeSelect('apartment')}
              >
                <div className="property-type-card-icon">
                  <PiBuildingApartment size={48} />
                </div>
                <h3 className="property-type-card-title">Квартира</h3>
                <p className="property-type-card-description">
                  Меблированные и самообслуживаемые помещения, где гости арендуют всю площадь.
                </p>
                <button 
                  type="button"
                  className="property-type-card-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePropertyTypeSelect('apartment')
                  }}
                >
                  Опишите ваш объект
                </button>
              </div>

              <div 
                className="property-type-card-large"
                onClick={() => handlePropertyTypeSelect('villa')}
              >
                <div className="property-type-card-icon">
                  <PiBuildings size={48} />
                </div>
                <h3 className="property-type-card-title">Вилла</h3>
                <p className="property-type-card-description">
                  Роскошные загородные дома с большими участками и современными удобствами.
                </p>
                <button 
                  type="button"
                  className="property-type-card-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePropertyTypeSelect('villa')
                  }}
                >
                  Опишите ваш объект
                </button>
              </div>

              <div 
                className="property-type-card-large"
                onClick={() => handlePropertyTypeSelect('commercial')}
              >
                <div className="property-type-card-icon">
                  <PiWarehouse size={48} />
                </div>
                <h3 className="property-type-card-title">Апартаменты</h3>
                <p className="property-type-card-description">
                  Современные апартаменты с полным набором удобств для комфортного проживания.
                </p>
                <button 
                  type="button"
                  className="property-type-card-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePropertyTypeSelect('commercial')
                  }}
                >
                  Опишите ваш объект
                </button>
              </div>
            </div>

     
          </div>
        ) : currentStep === 'test-drive-question' ? (
          /* Экран вопроса о тест-драйве */
          <div className="test-drive-question-screen">
            <div className="test-drive-question-content">
              <div className="test-drive-property-icon">
                {getPropertyTypeIcon(formData.propertyType)}
              </div>
              <h2 className="test-drive-question-title">
                Планируете ли вы проводить тест-драйв вашей недвижимости?
              </h2>
              <p className="test-drive-question-description">
                Покупатель может снять недвижимость на некоторое время с последующим правом покупки
              </p>
              <div className="test-drive-buttons">
                <button
                  type="button"
                  className="test-drive-button test-drive-button--yes"
                  onClick={() => handleTestDriveAnswer(true)}
                >
                  Да, планирую
                </button>
                <button
                  type="button"
                  className="test-drive-button test-drive-button--no"
                  onClick={() => handleTestDriveAnswer(false)}
                >
                  Нет, не планирую
                </button>
              </div>
            </div>


          </div>
        ) : currentStep === 'property-name' ? (
          /* Экран ввода названия и описания */
          <div className="property-name-screen">
            <div className="property-name-main">
              <h2 className="property-name-title">
                Какое название у вашего объекта?
              </h2>
              
              <div className="property-name-input-group">
                <label className="property-name-label">Название объекта</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="property-name-input"
                  placeholder="Новая квартира"
                />
              </div>

              <div className="property-name-input-group">
                <label className="property-name-label">Описание</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="property-name-textarea"
                  placeholder="Опишите ваш объект недвижимости"
                  rows="6"
                />
              </div>

              <div className="property-name-actions">
                <button
                  type="button"
                  className="property-name-back-btn"
                  onClick={() => setCurrentStep('test-drive-question')}
                >
                  <FiChevronLeft size={16} />
                  Назад
                </button>
                <button
                  type="button"
                  className="property-name-continue-btn"
                  onClick={handlePropertyNameContinue}
                >
                  Продолжить
                </button>
              </div>
            </div>

            <div className="property-name-hints">
              {showHint1 && (
                <div className="property-name-hint-card">
                  <div className="property-name-hint-header">
                    <div className="property-name-hint-icon property-name-hint-icon--thumbs">
                      <FiThumbsUp size={20} />
                    </div>
                    <h3 className="property-name-hint-title">
                      Что следует учитывать при выборе названия?
                    </h3>
                    <button
                      type="button"
                      className="property-name-hint-close"
                      onClick={() => setShowHint1(false)}
                    >
                      <FiX size={18} />
                    </button>
                  </div>
                  <ul className="property-name-hint-list">
                    <li>Сделайте его коротким и запоминающимся</li>
                    <li>Избегайте аббревиатур</li>
                    <li>Придерживайтесь фактов</li>
                  </ul>
                </div>
              )}

              {showHint2 && (
                <div className="property-name-hint-card">
                  <div className="property-name-hint-header">
                    <div className="property-name-hint-icon property-name-hint-icon--bulb">
                      <MdLightbulb size={20} />
                    </div>
                    <h3 className="property-name-hint-title">
                      Зачем нужно называть недвижимость?
                    </h3>
                    <button
                      type="button"
                      className="property-name-hint-close"
                      onClick={() => setShowHint2(false)}
                    >
                      <FiX size={18} />
                    </button>
                  </div>
                  <p className="property-name-hint-text">
                    Название будет заголовком вашего объявления. Оно должно быть конкретным, 
                    видимым для всех и не должно содержать адрес.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : currentStep === 'location' ? (
          /* Экран ввода местоположения */
          <div className="property-location-screen">
            <div className="property-location-main">
              <h2 className="property-location-title">
                Где находится ваша недвижимость?
              </h2>
              
              <div className="property-location-input-group">
                <label className="property-location-label">Страна</label>
                <CountrySelect
                  value={formData.country}
                  onChange={(countryName) => {
                    setFormData(prev => ({ ...prev, country: countryName }))
                    // Обновляем поиск города при изменении страны
                    if (citySearch) {
                      searchCity(citySearch, countryName)
                    }
                  }}
                  placeholder="Выберите страну"
                  className="property-location-country-select"
                />
              </div>

              <div className="property-location-input-group">
                <label className="property-location-label">Город</label>
                <div className="property-location-search-wrapper">
                  <input
                    type="text"
                    ref={citySearchRef}
                    value={citySearch}
                    onChange={(e) => {
                      const value = e.target.value
                      setCitySearch(value)
                      // Сохраняем только название города в formData.city
                      const cityName = value.split(',')[0].trim()
                      setFormData(prev => ({ ...prev, city: cityName }))
                      
                      // Очищаем предыдущий timeout
                      if (citySearchTimeoutRef.current) {
                        clearTimeout(citySearchTimeoutRef.current)
                      }
                      
                      // Если введено 2+ символа, запускаем поиск после паузы
                      if (value.length >= 2) {
                        citySearchTimeoutRef.current = setTimeout(() => {
                          searchCity(value, formData.country)
                        }, 700)
                      } else {
                        setCitySuggestions([])
                        setShowCitySuggestions(false)
                        setIsCitySearching(false)
                      }
                    }}
                    onFocus={() => {
                      // Всегда показываем подсказки, если они есть
                      if (citySuggestions.length > 0) {
                        setShowCitySuggestions(true)
                      }
                      // Если есть текст, но нет подсказок, запускаем поиск
                      if (citySearch && citySearch.length >= 2 && citySuggestions.length === 0) {
                        searchCity(citySearch, formData.country)
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowCitySuggestions(false), 200)
                    }}
                    className="property-location-input property-location-input--with-icon"
                    placeholder="Введите город"
                  />
                  <div className="property-location-input-icon">
                    {isCitySearching ? (
                      <FiLoader className="spinner" size={18} />
                    ) : (citySearch.length >= 2 && (citySuggestions.length > 0 || citySearch.includes(','))) ? (
                      <FiCheck size={18} />
                    ) : (citySearch.length >= 2 && citySuggestions.length === 0 && !citySearch.includes(',')) ? (
                      <FiLoader className="spinner" size={18} />
                    ) : null}
                  </div>
                  {showCitySuggestions && citySuggestions.length > 0 && (
                    <div className="property-location-suggestions">
                      {citySuggestions.map((city, index) => (
                        <div
                          key={index}
                          className="property-location-suggestion-item"
                          onClick={() => handleCitySelect(city)}
                        >
                          <FiMapPin size={16} />
                          <span>{city.display_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="property-location-input-group">
                <label className="property-location-label">Название улицы</label>
                <div className="property-location-search-wrapper">
                  <input
                    type="text"
                    value={addressSearch}
                    onChange={(e) => {
                      const value = e.target.value
                      setAddressSearch(value)
                      // Если адрес очистили — очищаем номер дома и связанные данные
                      if (!value.trim()) {
                        setAddressSuggestions([])
                        setShowSuggestions(false)
                        setIsAddressSearching(false)
                        setHouseSuggestions([])
                        setShowHouseSuggestions(false)
                        setFormData(prev => ({
                          ...prev,
                          address: '',
                          location: '',
                          coordinates: null,
                          apartment: ''
                        }))
                        return
                      }

                      // Пока введено меньше 3 символов или не выбран город — не ищем
                      if (value.length < 3 || !formData.city) {
                        setAddressSuggestions([])
                        setShowSuggestions(false)
                        setIsAddressSearching(false)
                      }
                    }}
                    onFocus={() => {
                      if (addressSuggestions.length > 0) {
                        setShowSuggestions(true)
                      } else if (addressSearch && addressSearch.length >= 2 && formData.city) {
                        // Если есть текст, но нет подсказок, запускаем поиск
                        searchAddress(addressSearch)
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 200)
                    }}
                    className="property-location-input property-location-input--with-icon"
                    placeholder={formData.city ? "Введите адрес" : "Сначала выберите город"}
                    disabled={!formData.city}
                  />
                  {formData.city && (
                    <div className="property-location-input-icon">
                      {isAddressSearching ? (
                        <FiLoader className="spinner" size={18} />
                      ) : (addressSearch.length >= 2 && (addressSuggestions.length > 0 || addressSearch.includes(','))) ? (
                        <FiCheck size={18} />
                      ) : (addressSearch.length >= 2 && addressSuggestions.length === 0 && !addressSearch.includes(',')) ? (
                        <FiLoader className="spinner" size={18} />
                      ) : null}
                    </div>
                  )}
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="property-location-suggestions">
                      {addressSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="property-location-suggestion-item"
                          onClick={() => handleAddressSelect(suggestion)}
                        >
                          <FiMapPin size={16} />
                          <span>{suggestion.display_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="property-location-input-group">
                <label className="property-location-label">Номер дома</label>
                <div className="property-location-search-wrapper">
                  <input
                    type="text"
                    name="apartment"
                    value={formData.apartment}
                    onChange={(e) => {
                      handleInputChange(e)
                      const value = e.target.value

                      if (houseSearchTimeoutRef.current) {
                        clearTimeout(houseSearchTimeoutRef.current)
                      }

                      if (value && addressSearch && formData.city) {
                        houseSearchTimeoutRef.current = setTimeout(() => {
                          searchHouse(value)
                        }, 600)
                      } else {
                        setHouseSuggestions([])
                        setShowHouseSuggestions(false)
                      }
                    }}
                    onFocus={() => {
                      if (houseSuggestions.length > 0) {
                        setShowHouseSuggestions(true)
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowHouseSuggestions(false), 200)
                    }}
                    className="property-location-input"
                    placeholder="Номер дома"
                  />
                  {showHouseSuggestions && houseSuggestions.length > 0 && (
                    <div className="property-location-suggestions">
                      {houseSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="property-location-suggestion-item"
                          onClick={() => handleHouseSelect(suggestion)}
                        >
                          <FiMapPin size={16} />
                          <span>{suggestion.display_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="property-location-actions">
                <button
                  type="button"
                  className="property-location-back-btn"
                  onClick={() => setCurrentStep('property-name')}
                >
                  <FiChevronLeft size={16} />
                  Назад
                </button>
                <button
                  type="button"
                  className="property-location-continue-btn"
                  onClick={handleLocationContinue}
                >
                  Продолжить
                </button>
              </div>
            </div>

            <div className="property-location-map">
              {typeof window !== 'undefined' && (
                <LocationMap
                  center={selectedCoordinates || mapCenter}
                  zoom={selectedCoordinates ? 15 : 10}
                  marker={selectedCoordinates}
                />
              )}
            </div>

     
          </div>
        ) : currentStep === 'details' ? (
          /* Экран подробной информации */
          <div className="property-details-screen">
            <div className="property-details-main">
              <h2 className="property-details-title">
                Подробная информация
              </h2>
              
              <div className="property-details-content-scrollable">
                {/* Блок "Where can people sleep?" */}
                <div className="sleep-areas-section">
                  <h3 className="sleep-areas-title">Где могут спать люди?</h3>
                  <div className="sleep-areas-list">
                    {bedrooms.map((bedroom, index) => (
                      <div 
                        key={bedroom.id} 
                        className="sleep-area-item"
                        onClick={() => handleEditBedroom(bedroom)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="sleep-area-content">
                          <div className="sleep-area-name">{bedroom.name}</div>
                          <div className="sleep-area-beds">
                            {getBedsDisplayText(bedroom.beds)}
                          </div>
                        </div>
                        {bedroom.name.startsWith('Спальня') && (
                          <button
                            type="button"
                            className="sleep-area-remove-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveBedroom(bedroom.id)
                            }}
                          >
                            <FiX size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="add-bedroom-btn"
                    onClick={handleAddBedroom}
                  >
                    <span className="add-bedroom-icon">+</span>
                    Добавить спальню
                  </button>
                </div>

                {/* Блок "Количество этажей" */}
                <div className="floors-section">
                  <h3 className="floors-title">Количество этажей</h3>
                  <div className="number-input-control">
                    <button
                      type="button"
                      className="number-input-btn number-input-btn--minus"
                      onClick={() => handleDetailChange('totalFloors', Math.max(0, (formData.totalFloors || 0) - 1))}
                      disabled={(formData.totalFloors || 0) === 0}
                    >
                      <span className="number-input-icon">−</span>
                    </button>
                    <span className="number-input-value">{formData.totalFloors || 0}</span>
                    <button
                      type="button"
                      className="number-input-btn number-input-btn--plus"
                      onClick={() => handleDetailChange('totalFloors', (formData.totalFloors || 0) + 1)}
                    >
                      <span className="number-input-icon">+</span>
                    </button>
                  </div>
                </div>

                {/* Блок "How many bathrooms are there?" */}
                <div className="bathrooms-section">
                  <h3 className="bathrooms-title">Сколько ванных комнат?</h3>
                  <div className="number-input-control">
                    <button
                      type="button"
                      className="number-input-btn number-input-btn--minus"
                      onClick={() => handleDetailChange('bathrooms', Math.max(0, (formData.bathrooms || 0) - 1))}
                      disabled={(formData.bathrooms || 0) === 0}
                    >
                      <span className="number-input-icon">−</span>
                    </button>
                    <span className="number-input-value">{formData.bathrooms || 0}</span>
                    <button
                      type="button"
                      className="number-input-btn number-input-btn--plus"
                      onClick={() => handleDetailChange('bathrooms', (formData.bathrooms || 0) + 1)}
                    >
                      <span className="number-input-icon">+</span>
                    </button>
                  </div>
                </div>

                {/* Блок "How big is this apartment?" */}
                <div className="apartment-size-section">
                  <h3 className="apartment-size-title">Какой размер у этой квартиры?</h3>
                  <label className="apartment-size-label">Размер квартиры – необязательно</label>
                  <div className="apartment-size-input-group">
                    <input
                      type="number"
                      value={formData.area}
                      onChange={(e) => handleDetailChange('area', e.target.value)}
                      className="apartment-size-input"
                      placeholder="0"
                      min="0"
                    />
                    <select
                      value={areaUnit}
                      onChange={(e) => setAreaUnit(e.target.value)}
                      className="apartment-size-unit"
                    >
                      <option value="square_meters">квадратные метры</option>
                      <option value="square_feet">квадратные футы</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="property-details-actions">
                <button
                  type="button"
                  className="property-details-back-btn"
                  onClick={() => setCurrentStep('location')}
                >
                  <FiChevronLeft size={16} />
                  Назад
                </button>
                <button
                  type="button"
                  className="property-details-continue-btn"
                  onClick={handleDetailsContinue}
                >
                  Продолжить
                </button>
              </div>
            </div>

            {/* Модальное окно для редактирования кроватей */}
            {showBedModal && selectedBedroom && (
              <div className="bed-modal-overlay" onClick={() => setShowBedModal(false)}>
                <div className="bed-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="bed-modal-header">
                    <h3 className="bed-modal-title">Какие кровати есть в этом помещении?</h3>
                    <button
                      type="button"
                      className="bed-modal-close"
                      onClick={() => setShowBedModal(false)}
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                  
                  <div className="bed-types-list">
                    {['twin', 'full', 'queen', 'king'].map((bedType) => (
                      <div key={bedType} className="bed-type-item">
                        <div className="bed-type-info">
                          <MdBed size={24} className="bed-type-icon" />
                          <div className="bed-type-details">
                            <div className="bed-type-name">
                              {bedType === 'twin' ? 'Односпальная кровать' :
                               bedType === 'full' ? 'Двуспальная кровать' :
                               bedType === 'queen' ? 'Кровать размера Queen' :
                               'Кровать размера King'}
                            </div>
                            <div className="bed-type-size">{getBedSize(bedType)}</div>
                          </div>
                        </div>
                        <div className="bed-type-control">
                          <button
                            type="button"
                            className="bed-count-btn bed-count-btn--minus"
                            onClick={() => handleBedCountChange(bedType, -1)}
                            disabled={getBedCount(bedType) === 0}
                          >
                            <span className="bed-count-icon">−</span>
                          </button>
                          <span className="bed-count-value">{getBedCount(bedType)}</span>
                          <button
                            type="button"
                            className="bed-count-btn bed-count-btn--plus"
                            onClick={() => handleBedCountChange(bedType, 1)}
                          >
                            <span className="bed-count-icon">+</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bed-modal-footer">
                    <button
                      type="button"
                      className="bed-modal-save-btn"
                      onClick={() => handleSaveBeds(selectedBedroom.id, selectedBedroom.beds)}
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="property-name-hints" style={{ marginLeft: '150px' , marginTop: '75px'}}>
              <HintCard
                icon={MdBed}
                iconColor="property-name-hint-icon--thumbs"
                title="Как правильно указать детали недвижимости?"
                content={[
                  "Укажите точное количество спален и ванных комнат",
                  "Добавьте информацию о площади для лучшего понимания размера",
                  "Укажите количество этажей, если это многоэтажное здание"
                ]}
                show={showHints['details']}
                onClose={() => setShowHints(prev => ({ ...prev, 'details': false }))}
              />
              <HintCard
                icon={MdLightbulb}
                iconColor="property-name-hint-icon--bulb"
                title="Зачем нужны детали?"
                content="Подробная информация о недвижимости помогает покупателям лучше понять объект и принять обоснованное решение о покупке."
                show={showHints['details']}
                onClose={() => setShowHints(prev => ({ ...prev, 'details': false }))}
              />
            </div>
          </div>
        ) : currentStep === 'amenities' ? (
          /* Экран удобств */
          <div className="property-amenities-screen">
            <div className="property-amenities-main">
              <h2 className="property-amenities-title">
                Дополнительные удобства и особенности
              </h2>
              
              <div className="property-amenities-content-scrollable">
                {/* Парковка и гараж */}
                <div className="amenities-category">
                  <h4 className="amenities-category-title">Парковка и гараж</h4>
                  <div className="amenities-list">
                    <label className="amenity-item">
                      <input
                        type="checkbox"
                        checked={formData.garage || false}
                        onChange={(e) => handleDetailChange('garage', e.target.checked)}
                        className="amenity-checkbox"
                      />
                      <span className="amenity-label">Гараж</span>
                    </label>
                    <label className="amenity-item">
                      <input
                        type="checkbox"
                        checked={formData.parking || false}
                        onChange={(e) => handleDetailChange('parking', e.target.checked)}
                        className="amenity-checkbox"
                      />
                      <span className="amenity-label">Парковочное место</span>
                    </label>
                    <label className="amenity-item">
                      <input
                        type="checkbox"
                        checked={formData.feature1 || false}
                        onChange={(e) => handleDetailChange('feature1', e.target.checked)}
                        className="amenity-checkbox"
                      />
                      <span className="amenity-label">Подземная парковка</span>
                    </label>
                  </div>
                </div>

                {/* Мебель и техника */}
                <div className="amenities-category">
                  <h4 className="amenities-category-title">Мебель и техника</h4>
                  <div className="amenities-list">
                    <label className="amenity-item">
                      <input
                        type="checkbox"
                        checked={formData.feature2 || false}
                        onChange={(e) => handleDetailChange('feature2', e.target.checked)}
                        className="amenity-checkbox"
                      />
                      <span className="amenity-label">Кухонная мебель</span>
                    </label>
                    <label className="amenity-item">
                      <input
                        type="checkbox"
                        checked={formData.furniture || false}
                        onChange={(e) => handleDetailChange('furniture', e.target.checked)}
                        className="amenity-checkbox"
                      />
                      <span className="amenity-label">Встроенная мебель</span>
                    </label>
                    <label className="amenity-item">
                      <input
                        type="checkbox"
                        checked={formData.feature3 || false}
                        onChange={(e) => handleDetailChange('feature3', e.target.checked)}
                        className="amenity-checkbox"
                      />
                      <span className="amenity-label">Стиральная машина</span>
                    </label>
                    <label className="amenity-item">
                      <input
                        type="checkbox"
                        checked={formData.feature4 || false}
                        onChange={(e) => handleDetailChange('feature4', e.target.checked)}
                        className="amenity-checkbox"
                      />
                      <span className="amenity-label">Посудомоечная машина</span>
                    </label>
                    <label className="amenity-item">
                      <input
                        type="checkbox"
                        checked={formData.electricity || false}
                        onChange={(e) => handleDetailChange('electricity', e.target.checked)}
                        className="amenity-checkbox"
                      />
                      <span className="amenity-label">Кондиционер</span>
                    </label>
                  </div>
                </div>

                {/* Коммуникации и безопасность */}
                <div className="amenities-category">
                  <h4 className="amenities-category-title">Коммуникации и безопасность</h4>
                  <div className="amenities-list">
                    <label className="amenity-item">
                      <input
                        type="checkbox"
                        checked={formData.internet || false}
                        onChange={(e) => handleDetailChange('internet', e.target.checked)}
                        className="amenity-checkbox"
                      />
                      <span className="amenity-label">Интернет</span>
                    </label>
                    <label className="amenity-item">
                      <input
                        type="checkbox"
                        checked={formData.security || false}
                        onChange={(e) => handleDetailChange('security', e.target.checked)}
                        className="amenity-checkbox"
                      />
                      <span className="amenity-label">Охрана</span>
                    </label>
                    <label className="amenity-item">
                      <input
                        type="checkbox"
                        checked={formData.feature5 || false}
                        onChange={(e) => handleDetailChange('feature5', e.target.checked)}
                        className="amenity-checkbox"
                      />
                      <span className="amenity-label">Домофон</span>
                    </label>
                    <label className="amenity-item">
                      <input
                        type="checkbox"
                        checked={formData.feature6 || false}
                        onChange={(e) => handleDetailChange('feature6', e.target.checked)}
                        className="amenity-checkbox"
                      />
                      <span className="amenity-label">Видеонаблюдение</span>
                    </label>
                  </div>
                </div>

                {/* Дополнительные помещения */}
                <div className="amenities-category">
                  <h4 className="amenities-category-title">Дополнительные помещения</h4>
                  <div className="amenities-list">
                    <label className="amenity-item">
                      <input
                        type="checkbox"
                        checked={formData.balcony || false}
                        onChange={(e) => handleDetailChange('balcony', e.target.checked)}
                        className="amenity-checkbox"
                      />
                      <span className="amenity-label">Балкон</span>
                    </label>
                    <label className="amenity-item">
                      <input
                        type="checkbox"
                        checked={formData.feature7 || false}
                        onChange={(e) => handleDetailChange('feature7', e.target.checked)}
                        className="amenity-checkbox"
                      />
                      <span className="amenity-label">Лоджия</span>
                    </label>
                    <label className="amenity-item">
                      <input
                        type="checkbox"
                        checked={formData.feature8 || false}
                        onChange={(e) => handleDetailChange('feature8', e.target.checked)}
                        className="amenity-checkbox"
                      />
                      <span className="amenity-label">Кладовая</span>
                    </label>
                    <label className="amenity-item">
                      <input
                        type="checkbox"
                        checked={formData.elevator || false}
                        onChange={(e) => handleDetailChange('elevator', e.target.checked)}
                        className="amenity-checkbox"
                      />
                      <span className="amenity-label">Лифт</span>
                    </label>
                  </div>
                </div>

                {/* Дополнительные удобства */}
                <div className="amenities-category">
                  <h4 className="amenities-category-title">Дополнительные удобства</h4>
                  <div className="amenities-list">
                    <label className="amenity-item">
                      <input
                        type="checkbox"
                        checked={formData.pool || false}
                        onChange={(e) => handleDetailChange('pool', e.target.checked)}
                        className="amenity-checkbox"
                      />
                      <span className="amenity-label">Бассейн</span>
                    </label>
                    <label className="amenity-item">
                      <input
                        type="checkbox"
                        checked={formData.garden || false}
                        onChange={(e) => handleDetailChange('garden', e.target.checked)}
                        className="amenity-checkbox"
                      />
                      <span className="amenity-label">Сад</span>
                    </label>
                    <label className="amenity-item">
                      <input
                        type="checkbox"
                        checked={formData.feature9 || false}
                        onChange={(e) => handleDetailChange('feature9', e.target.checked)}
                        className="amenity-checkbox"
                      />
                      <span className="amenity-label">Терраса</span>
                    </label>
                    <label className="amenity-item">
                      <input
                        type="checkbox"
                        checked={formData.feature10 || false}
                        onChange={(e) => handleDetailChange('feature10', e.target.checked)}
                        className="amenity-checkbox"
                      />
                      <span className="amenity-label">Камин</span>
                    </label>
                    <label className="amenity-item">
                      <input
                        type="checkbox"
                        checked={formData.feature11 || false}
                        onChange={(e) => handleDetailChange('feature11', e.target.checked)}
                        className="amenity-checkbox"
                      />
                      <span className="amenity-label">Мансарда</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="property-amenities-actions">
                <button
                  type="button"
                  className="property-amenities-back-btn"
                  onClick={() => setCurrentStep('details')}
                >
                  <FiChevronLeft size={16} />
                  Назад
                </button>
                <button
                  type="button"
                  className="property-amenities-continue-btn"
                  onClick={handleAmenitiesContinue}
                >
                  Продолжить
                </button>
              </div>
            </div>

            <div className="property-name-hints" style={{ marginLeft: '150px' , marginTop: '75px'}}>
              <HintCard
                icon={MdLightbulb}
                iconColor="property-name-hint-icon--thumbs"
                title="Какие удобства указать?"
                content={[
                  "Укажите все доступные удобства для привлечения покупателей",
                  "Будьте честны - это повысит доверие",
                  "Удобства влияют на цену и привлекательность объекта"
                ]}
                show={showHints['amenities']}
                onClose={() => setShowHints(prev => ({ ...prev, 'amenities': false }))}
              />
              <HintCard
                icon={FiThumbsUp}
                iconColor="property-name-hint-icon--bulb"
                title="Зачем указывать удобства?"
                content="Полный список удобств помогает покупателям понять, что они получают за свою цену, и делает ваше объявление более привлекательным."
                show={showHints['amenities']}
                onClose={() => setShowHints(prev => ({ ...prev, 'amenities': false }))}
              />
            </div>
          </div>
        ) : currentStep === 'photos' ? (
          /* Экран загрузки фотографий */
          <div className="property-photos-screen">
            <div className="property-photos-main">
              <h2 className="property-photos-title">
                Как выглядит ваше место?
              </h2>
              
              <p className="property-photos-description">
                Загрузите минимум 10 фотографий вашей недвижимости. Чем больше вы загрузите, тем больше вероятность продать недвижимость. Вы можете добавить больше позже.
              </p>

              {/* Большой блок для drag and drop и отображения медиа */}
              <div 
                className={`photos-upload-area ${isDragging ? 'photos-upload-area--dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {mediaItems.length === 0 ? (
                  <div className="photos-upload-placeholder">
                    <div className="photos-upload-icon">
                      <FiUpload size={48} />
                    </div>
                    <p className="photos-upload-text">Перетащите файлы сюда или</p>
                    <button
                      type="button"
                      className="photos-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FiUpload size={20} />
                      Загрузить фотографии
                    </button>
                    <p className="photos-upload-hint">jpg/jpeg или png, максимум 47MB каждый</p>
                  </div>
                ) : (
                  <div className="photos-carousel-container">
                    {/* Кнопка назад */}
                    {mediaItems.length > 1 && (
                      <button
                        type="button"
                        className="photos-carousel-nav photos-carousel-nav--prev"
                        onClick={handlePrevMedia}
                      >
                        <FiChevronLeft size={24} />
                      </button>
                    )}

                    {/* Текущее медиа */}
                    {mediaItems.length > 0 && photosMediaIndex >= 0 && photosMediaIndex < mediaItems.length && mediaItems[photosMediaIndex] && (
                      <div className="photos-carousel-item">
                        {(() => {
                          const currentMedia = mediaItems[photosMediaIndex]
                          if (!currentMedia) return null
                          
                          if (currentMedia.mediaType === 'photo') {
                            return (
                              <img 
                                src={currentMedia.url} 
                                alt={`Фото ${photosMediaIndex + 1}`}
                                className="photos-carousel-image"
                              />
                            )
                          } else if (currentMedia.type === 'youtube' && currentMedia.videoId) {
                            return (
                              <iframe
                                src={`https://www.youtube.com/embed/${currentMedia.videoId}`}
                                title={`YouTube видео ${photosMediaIndex + 1}`}
                                className="photos-carousel-video"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            )
                          } else if (currentMedia.type === 'googledrive') {
                            return (
                              <div className="photos-carousel-video-placeholder">
                                <FiVideo size={48} />
                                <span className="video-type-badge">Google Drive</span>
                              </div>
                            )
                          } else {
                            return (
                              <video 
                                src={currentMedia.url} 
                                className="photos-carousel-video"
                                controls
                              />
                            )
                          }
                        })()}
                        
                        {/* Кнопка удаления */}
                        {mediaItems[photosMediaIndex] && (
                          <button
                            type="button"
                            className="photos-carousel-remove"
                            onClick={() => {
                              const currentItem = mediaItems[photosMediaIndex]
                              if (!currentItem) return
                              
                              if (currentItem.mediaType === 'photo') {
                                handleRemovePhoto(currentItem.id)
                              } else {
                                handleRemoveVideo(currentItem.id)
                              }
                              // Индекс будет автоматически скорректирован в useEffect
                            }}
                          >
                            <FiX size={20} />
                          </button>
                        )}

                        {/* Номер медиа */}
                        <div className="photos-carousel-number">
                          {photosMediaIndex + 1} / {mediaItems.length}
                        </div>
                      </div>
                    )}

                    {/* Кнопка вперед */}
                    {mediaItems.length > 1 && (
                      <button
                        type="button"
                        className="photos-carousel-nav photos-carousel-nav--next"
                        onClick={handleNextMedia}
                      >
                        <FiChevronRight size={24} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Кнопки для загрузки фото, видео и ссылок */}
              <div className="photos-additional-options">
                {photos.length < 10 && (
                  <button
                    type="button"
                    className="photos-option-btn photos-option-btn--photo"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FiUpload size={20} />
                    Добавить фото
                    <span className="photos-option-count">{photos.length}/10</span>
                  </button>
                )}
                {videos.length < 3 && (
                  <>
                    <button
                      type="button"
                      className="photos-option-btn photos-option-btn--video"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <FiVideo size={20} />
                      Загрузить видео
                      <span className="photos-option-hint">до 1 минуты</span>
                      <span className="photos-option-count">{videos.length}/3</span>
                    </button>
                    <button
                      type="button"
                      className="photos-option-btn photos-option-btn--link"
                      onClick={() => setShowVideoLinkModal(true)}
                    >
                      <FiLink size={20} />
                      Добавить ссылку
                      <span className="photos-option-hint">YouTube / Google Drive</span>
                    </button>
                  </>
                )}
              </div>

              <div className="property-photos-actions">
                <button
                  type="button"
                  className="property-photos-back-btn"
                  onClick={() => setCurrentStep('amenities')}
                >
                  <FiChevronLeft size={16} />
                  Назад
                </button>
                <button
                  type="button"
                  className="property-photos-continue-btn"
                  onClick={handlePhotosContinue}
                  disabled={photos.length === 0}
                >
                  Продолжить
                </button>
              </div>

              {/* Скрытые input для загрузки файлов */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/jpeg,image/jpg,image/png"
                multiple
                style={{ display: 'none' }}
              />
              <input
                type="file"
                ref={videoInputRef}
                onChange={handleVideoUpload}
                accept="video/*"
                multiple
                style={{ display: 'none' }}
              />

              {/* Модальное окно для добавления ссылки на видео */}
              {showVideoLinkModal && (
                <div className="video-link-modal-overlay" onClick={() => setShowVideoLinkModal(false)}>
                  <div className="video-link-modal" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="video-link-modal-close"
                      onClick={() => setShowVideoLinkModal(false)}
                    >
                      <FiX size={20} />
                    </button>
                    <h3 className="video-link-modal-title">Добавить ссылку на видео</h3>
                    <p className="video-link-modal-subtitle">
                      Вставьте ссылку на видео с YouTube или Google Drive
                    </p>
                    <input
                      type="text"
                      className="video-link-input"
                      placeholder="https://youtube.com/watch?v=... или https://drive.google.com/file/d/..."
                      value={videoLink}
                      onChange={(e) => setVideoLink(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleVideoLinkSubmit()
                        }
                      }}
                    />
                    <div className="video-link-modal-actions">
                      <button
                        type="button"
                        className="video-link-modal-cancel"
                        onClick={() => {
                          setShowVideoLinkModal(false)
                          setVideoLink('')
                        }}
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        className="video-link-modal-submit"
                        onClick={handleVideoLinkSubmit}
                      >
                        Добавить
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="property-name-hints" style={{ marginLeft: '150px' , marginTop: '75px'}}>
              <HintCard
                icon={FiUpload}
                iconColor="property-name-hint-icon--thumbs"
                title="Как правильно загрузить фотографии?"
                content={[
                  "Загрузите качественные фотографии в формате JPG или PNG",
                  "Добавьте видео для лучшего представления объекта",
                  "Первое фото будет главным изображением объявления"
                ]}
                show={showHints['photos']}
                onClose={() => setShowHints(prev => ({ ...prev, 'photos': false }))}
              />
              <HintCard
                icon={MdLightbulb}
                iconColor="property-name-hint-icon--bulb"
                title="Зачем нужны фотографии?"
                content="Качественные фотографии и видео помогают покупателям лучше представить объект и увеличивают интерес к вашему объявлению."
                show={showHints['photos']}
                onClose={() => setShowHints(prev => ({ ...prev, 'photos': false }))}
              />
            </div>
          </div>
        ) : currentStep === 'documents' ? (
          /* Экран загрузки документов на собственность */
          <div className="property-documents-screen">
            <div className="property-documents-main">
              <h2 className="property-documents-title">
                Документы на собственность
              </h2>
              
              <p className="property-documents-description">
                Загрузите документы, подтверждающие право собственности на недвижимость. Это поможет быстрее продать вашу недвижимость.
              </p>

              {/* Блок для обязательных документов */}
              <div className="documents-required-section">
                <h3 className="documents-section-title">Обязательные документы</h3>
                
                {/* Документ о праве собственности */}
                <div className="document-upload-item">
                  <div className="document-upload-info">
                    <div className="document-upload-icon">
                      <FiFileText size={24} />
                    </div>
                    <div className="document-upload-text">
                      <h4 className="document-upload-title">Документ о праве собственности</h4>
                      <p className="document-upload-hint">PDF или изображение (JPG, PNG)</p>
                    </div>
                  </div>
                  <div className="document-upload-action">
                    {requiredDocuments.ownership ? (
                      <div className="document-uploaded">
                        <FiCheck size={20} />
                        <span>{requiredDocuments.ownership.name}</span>
                        <button
                          type="button"
                          className="document-remove-btn"
                          onClick={() => {
                            setRequiredDocuments(prev => ({ ...prev, ownership: null }))
                            setUploadedDocuments(prev => ({ ...prev, ownership: false }))
                          }}
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="document-upload-btn"
                        onClick={() => ownershipInputRef.current?.click()}
                      >
                        <FiUpload size={18} />
                        Загрузить
                      </button>
                    )}
                  </div>
                </div>

                {/* Документ об отсутствии долгов */}
                <div className="document-upload-item">
                  <div className="document-upload-info">
                    <div className="document-upload-icon">
                      <FiFileText size={24} />
                    </div>
              <div className="document-upload-text">
                      <h4 className="document-upload-title">Справка об отсутствии долгов</h4>
                      <p className="document-upload-hint">PDF или изображение (JPG, PNG)</p>
                    </div>
                  </div>
                  <div className="document-upload-action">
                    {requiredDocuments.noDebts ? (
                      <div className="document-uploaded">
                        <FiCheck size={20} />
                        <span>{requiredDocuments.noDebts.name}</span>
                        <button
                          type="button"
                          className="document-remove-btn"
                          onClick={() => {
                            setRequiredDocuments(prev => ({ ...prev, noDebts: null }))
                            setUploadedDocuments(prev => ({ ...prev, noDebts: false }))
                          }}
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="document-upload-btn"
                        onClick={() => noDebtsInputRef.current?.click()}
                      >
                        <FiUpload size={18} />
                        Загрузить
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Блок для дополнительных документов */}
              <div className="documents-additional-section">
                <h3 className="documents-section-title">Дополнительные документы</h3>
                <p className="documents-section-hint">Вы можете загрузить дополнительные документы, которые помогут покупателю принять решение</p>
                
                {/* Drag and drop область для дополнительных документов */}
                <div 
                  className={`documents-upload-area ${isDragging ? 'documents-upload-area--dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    const files = Array.from(e.dataTransfer.files)
                    const validFiles = files.filter(file => 
                      file.type === 'application/pdf' || file.type.startsWith('image/')
                    )
                    if (validFiles.length > 0) {
                      handleDocumentUpload({ target: { files: validFiles } })
                    }
                  }}
                >
                  {additionalDocuments.length === 0 ? (
                    <div className="documents-upload-placeholder">
                      <div className="documents-upload-icon">
                        <FiFileText size={48} />
                      </div>
                      <p className="documents-upload-text">Перетащите документы сюда или</p>
                      <button
                        type="button"
                        className="documents-upload-btn"
                        onClick={() => documentInputRef.current?.click()}
                      >
                        <FiUpload size={20} />
                        Загрузить документы
                      </button>
                      <p className="documents-upload-hint">PDF или изображения (JPG, PNG)</p>
                    </div>
                  ) : (
                    <div className="documents-list-horizontal">
                      {additionalDocuments.map((doc) => (
                        <div key={doc.id} className="document-preview-item">
                          {doc.type === 'pdf' ? (
                            <div className="document-preview-pdf">
                              <FiFileText size={32} />
                              <span className="document-type-badge">PDF</span>
                            </div>
                          ) : (
                            <img src={doc.url} alt={doc.name} className="document-preview-image" />
                          )}
                          <button
                            type="button"
                            className="document-preview-remove"
                            onClick={() => handleRemoveDocument(doc.id)}
                          >
                            <FiX size={16} />
                          </button>
                          <div className="document-preview-name" title={doc.name}>
                            {doc.name}
                          </div>
                        </div>
                      ))}
                      {additionalDocuments.length < 10 && (
                        <div
                          className="document-preview-add"
                          onClick={() => documentInputRef.current?.click()}
                        >
                          <FiUpload size={24} />
                          <span>Добавить</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Скрытые input для загрузки документов */}
              <input
                type="file"
                ref={ownershipInputRef}
                accept="application/pdf,image/jpeg,image/jpg,image/png"
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (file) {
                    setRequiredDocuments(prev => ({ ...prev, ownership: file }))
                    setUploadedDocuments(prev => ({ ...prev, ownership: true }))
                  }
                  e.target.value = ''
                }}
                style={{ display: 'none' }}
              />
              <input
                type="file"
                ref={noDebtsInputRef}
                accept="application/pdf,image/jpeg,image/jpg,image/png"
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (file) {
                    setRequiredDocuments(prev => ({ ...prev, noDebts: file }))
                    setUploadedDocuments(prev => ({ ...prev, noDebts: true }))
                  }
                  e.target.value = ''
                }}
                style={{ display: 'none' }}
              />
              <input
                type="file"
                ref={documentInputRef}
                multiple
                accept="application/pdf,image/*"
                onChange={handleDocumentUpload}
                style={{ display: 'none' }}
              />

              <div className="property-documents-actions">
                <button
                  type="button"
                  className="property-documents-back-btn"
                  onClick={() => setCurrentStep('photos')}
                >
                  <FiChevronLeft size={16} />
                  Назад
                </button>
                <button
                  type="button"
                  className="property-documents-continue-btn"
                  onClick={handleDocumentsContinue}
                >
                  Продолжить
                </button>
              </div>
            </div>

            <div className="property-name-hints" style={{ marginLeft: '150px' , marginTop: '75px'}}>
              <HintCard
                icon={FiFileText}
                iconColor="property-name-hint-icon--thumbs"
                title="Какие документы нужны?"
                content={[
                  "Обязательно загрузите документ о праве собственности",
                  "Добавьте справку об отсутствии долгов",
                  "Можно загрузить дополнительные документы для доверия покупателей"
                ]}
                show={showHints['documents']}
                onClose={() => setShowHints(prev => ({ ...prev, 'documents': false }))}
              />
              <HintCard
                icon={MdLightbulb}
                iconColor="property-name-hint-icon--bulb"
                title="Зачем нужны документы?"
                content="Документы подтверждают ваше право собственности и отсутствие обременений, что повышает доверие покупателей и ускоряет процесс продажи."
                show={showHints['documents']}
                onClose={() => setShowHints(prev => ({ ...prev, 'documents': false }))}
              />
            </div>
          </div>
        ) : currentStep === 'price' ? (
          /* Экран цены и аукциона */
          <div className="property-price-screen">
            <div className="property-price-main">
              <h2 className="property-price-title">
                Укажите стоимость
              </h2>
              
              <p className="property-price-description">
                Укажите минимальную цену продажи вашей недвижимости. Вы также можете выставить объект на аукцион.
              </p>

              {/* Блок цены */}
              <div className="price-input-section">
                <label className="price-input-label">
                  Минимальная цена продажи
                </label>
                <div className="price-input-wrapper-large">
                  <div className="currency-selector">
                    <button
                      type="button"
                      className="currency-button"
                      onClick={() => setShowCurrencyDropdown(showCurrencyDropdown === 'price' ? null : 'price')}
                    >
                      <span className="currency-symbol">{currencies.find(c => c.code === currency)?.symbol || '$'}</span>
                      <FiChevronDown className="currency-chevron" size={14} />
                    </button>
                    {showCurrencyDropdown === 'price' && (
                      <div className="currency-dropdown">
                        {currencies.map((curr) => (
                          <button
                            key={curr.code}
                            type="button"
                            className={`currency-option ${currency === curr.code ? 'active' : ''}`}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setCurrency(curr.code)
                              setShowCurrencyDropdown(null)
                            }}
                          >
                            <span className="currency-option-symbol">{curr.symbol}</span>
                            <span className="currency-option-name">{curr.name}</span>
                            <span className="currency-option-code">({curr.code})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    name="price"
                    value={formData.price ? formatNumberWithCommas(formData.price) : ''}
                    onChange={handlePriceChange}
                    className="price-input-large"
                    placeholder="0"
                    inputMode="numeric"
                    required
                  />
                </div>
              </div>

              {/* Блок аукциона */}
              <div className="auction-toggle-section">
                <div className="auction-toggle-wrapper">
                  <input
                    type="checkbox"
                    id="isAuction"
                    name="isAuction"
                    checked={formData.isAuction}
                    onChange={handleInputChange}
                    className="auction-toggle-checkbox"
                  />
                  <label htmlFor="isAuction" className="auction-toggle-label">
                    <div className="auction-toggle-icon">
                      <FiDollarSign size={20} />
                    </div>
                    <div className="auction-toggle-text">
                      <span className="auction-toggle-title">Выставить объект на аукцион</span>
                      <span className="auction-toggle-hint">Позволяет покупателям делать ставки</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Поля аукциона (показываются при включении) */}
              {formData.isAuction && (
                <div className="auction-fields-section">
                  <div className="auction-date-range">
                    <AuctionPeriodPicker
                      label="Период проведения аукциона"
                      startDate={formData.auctionStartDate}
                      endDate={formData.auctionEndDate}
                      onStartDateChange={(date) => setFormData(prev => ({ ...prev, auctionStartDate: date }))}
                      onEndDateChange={(date) => setFormData(prev => ({ ...prev, auctionEndDate: date }))}
                    />
                  </div>
                  
                  <div className="auction-starting-price">
                    <label className="auction-starting-price-label">
                      Стартовая сумма ставки
                    </label>
                    <div className="bid-step-input-wrapper-large">
                      <div className="currency-selector">
                        <button
                          type="button"
                          className="currency-button"
                          onClick={() => setShowCurrencyDropdown(showCurrencyDropdown === 'auction' ? null : 'auction')}
                        >
                          <span className="currency-symbol">{currencies.find(c => c.code === currency)?.symbol || '$'}</span>
                          <FiChevronDown className="currency-chevron" size={14} />
                        </button>
                        {showCurrencyDropdown === 'auction' && (
                          <div className="currency-dropdown">
                            {currencies.map((curr) => (
                              <button
                                key={curr.code}
                                type="button"
                                className={`currency-option ${currency === curr.code ? 'active' : ''}`}
                                onClick={() => {
                                  setCurrency(curr.code)
                                  setShowCurrencyDropdown(null)
                                }}
                              >
                                <span className="currency-option-symbol">{curr.symbol}</span>
                                <span className="currency-option-name">{curr.name}</span>
                                <span className="currency-option-code">({curr.code})</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        name="auctionStartingPrice"
                        value={formData.auctionStartingPrice ? formatNumberWithCommas(formData.auctionStartingPrice) : ''}
                        onChange={handleAuctionPriceChange}
                        className="price-input-large"
                        placeholder="0"
                        inputMode="numeric"
                        required={formData.isAuction}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="property-price-actions">
                <button
                  type="button"
                  className="property-price-back-btn"
                  onClick={() => setCurrentStep('documents')}
                >
                  <FiChevronLeft size={16} />
                  Назад
                </button>
                <button
                  type="button"
                  className="property-price-continue-btn"
                  onClick={handlePriceContinue}
                >
                  Продолжить
                </button>
              </div>
            </div>

            <div className="property-name-hints" style={{ marginLeft: '150px'}}>
              <HintCard
                icon={FiDollarSign}
                iconColor="property-name-hint-icon--thumbs"
                title="Как установить цену?"
                content={[
                  "Изучите цены на аналогичные объекты в вашем районе",
                  "Учитывайте состояние и особенности недвижимости",
                  "Можно установить фиксированную цену или начать аукцион"
                ]}
                show={showHints['price']}
                onClose={() => setShowHints(prev => ({ ...prev, 'price': false }))}
              />
              <HintCard
                icon={MdLightbulb}
                iconColor="property-name-hint-icon--bulb"
                title="Что такое аукцион?"
                content="Аукцион позволяет покупателям делать ставки, что может привести к более высокой цене продажи. Вы устанавливаете стартовую цену, а покупатели соревнуются за объект."
                show={showHints['price']}
                onClose={() => setShowHints(prev => ({ ...prev, 'price': false }))}
              />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="add-property-form">
            {/* Фото/Видео Объекта */}
            <section className="form-section">
              <h2 className="section-title">Фото/Видео Объекта</h2>
              
              {/* Первая строка - три квадратика для загрузки */}
              <div className="media-upload-buttons">
                {photos.length < 10 && (
                  <div 
                    className="media-upload-box"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FiUpload size={24} />
                    <p>Добавить фото</p>
                    <span>{photos.length}/10</span>
                  </div>
                )}
                {videos.length < 3 && (
                  <>
                    <div 
                      className="media-upload-box"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <FiUpload size={24} />
                      <p>Загрузить видео</p>
                      <span className="upload-hint">до 1 минуты</span>
                      <span>{videos.length}/3</span>
                    </div>
                    <div 
                      className="media-upload-box media-upload-box--link"
                      onClick={() => setShowVideoLinkModal(true)}
                    >
                      <FiLink size={24} />
                      <p>Добавить ссылку</p>
                      <span className="upload-hint">YouTube / Google Drive</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* Вторая строка - загруженные медиа */}
              {(photos.length > 0 || videos.length > 0) && (
                <div className="media-grid">
                  {photos.map((photo, index) => (
                    <div key={photo.id} className="photo-item">
                      <img src={photo.url} alt={`Фото ${index + 1}`} />
                      <button
                        type="button"
                        className="photo-remove"
                        onClick={() => handleRemovePhoto(photo.id)}
                      >
                        <FiX size={16} />
                      </button>
                      <div className="photo-number">{index + 1}</div>
                    </div>
                  ))}
                  {videos.map((video, index) => (
                    <div key={video.id} className="photo-item">
                      {video.type === 'youtube' && video.thumbnail ? (
                        <img 
                          src={video.thumbnail} 
                          alt="YouTube видео"
                          className="video-thumbnail"
                        />
                      ) : video.type === 'googledrive' ? (
                        <div className="video-preview">
                          <FiVideo size={32} />
                          <span className="video-type-badge">Google Drive</span>
                        </div>
                      ) : (
                        <video 
                          src={video.url} 
                          className="video-preview-element"
                          muted
                        />
                      )}
                      <button
                        type="button"
                        className="photo-remove"
                        onClick={() => handleRemoveVideo(video.id)}
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
              
              <input
                ref={videoInputRef}
                type="file"
                multiple
                accept="video/*"
                onChange={handleVideoUpload}
                style={{ display: 'none' }}
              />
              
              {(photos.length > 0 || videos.length > 0) && (
                <button
                  type="button"
                  className="view-carousel-btn"
                  onClick={() => {
                    setCurrentMediaIndex(0)
                    setShowCarousel(true)
                  }}
                >
                  <FiEye size={16} />
                  Просмотреть карусель
                </button>
              )}
            </section>

          {/* Заголовок */}
          <section className="form-section">
            <h2 className="section-title">Заголовок</h2>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Введите заголовок объявления"
              required
            />
          </section>

          {/* Описание */}
          <section className="form-section">
            <h2 className="section-title">Описание</h2>
            <div className="description-wrapper">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="Опишите объект недвижимости"
                rows="6"
                required
              />
              <button
                type="button"
                className="translate-button"
                onClick={handleTranslateAll}
                disabled={isTranslating || (!formData.title && !formData.description)}
              >
                {isTranslating ? (
                  <>
                    <FiLoader className="spinner" size={16} />
                    Перевод...
                  </>
                ) : (
                  <>
                    <FiGlobe size={16} />
                    Перевести на все языки
                  </>
                )}
              </button>
            </div>

            {/* Выпадающий список с переводами */}
            {showTranslations && translations && (
              <div className="translations-dropdown">
                <div className="translations-dropdown__header">
                  <h3 className="translations-dropdown__title">Переводы</h3>
                  <button
                    type="button"
                    className="translations-dropdown__toggle"
                    onClick={() => setShowTranslations(false)}
                  >
                    <FiX size={18} />
                  </button>
                </div>
                <div className="translations-dropdown__content">
                  {Object.entries(translations).map(([code, translation]) => (
                    <div key={code} className="translation-item">
                      <div className="translation-item__header">
                        <span className="translation-item__language">{translation.name}</span>
                        <button
                          type="button"
                          className="translation-item__copy"
                          onClick={() => {
                            navigator.clipboard.writeText(translation.text)
                            alert(`Перевод на ${translation.name} скопирован в буфер обмена`)
                          }}
                        >
                          Копировать
                        </button>
                      </div>
                      <p className="translation-item__text">{translation.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Цена и Аукцион */}
          <section className="form-section">
            <div className="price-auction-wrapper">
              <div className="price-section">
                <h2 className="section-title">Минимальная цена продажи</h2>
                <div className="price-input-wrapper">
                  <div className="currency-selector">
                    <button
                      type="button"
                      className="currency-button"
                      onClick={() => setShowCurrencyDropdown(showCurrencyDropdown === 'price' ? null : 'price')}
                    >
                      <span className="currency-symbol">{currencies.find(c => c.code === currency)?.symbol || '$'}</span>
                      <FiChevronDown className="currency-chevron" size={14} />
                    </button>
                    {showCurrencyDropdown === 'price' && (
                      <div className="currency-dropdown">
                        {currencies.map((curr) => (
                          <button
                            key={curr.code}
                            type="button"
                            className={`currency-option ${currency === curr.code ? 'active' : ''}`}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setCurrency(curr.code)
                              setShowCurrencyDropdown(null)
                            }}
                          >
                            <span className="currency-option-symbol">{curr.symbol}</span>
                            <span className="currency-option-name">{curr.name}</span>
                            <span className="currency-option-code">({curr.code})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="form-input price-input"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
              </div>
              
              <div className="auction-section">
                <h2 className="section-title">Аукцион</h2>
                <div className="auction-checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="isAuction"
                    name="isAuction"
                    checked={formData.isAuction}
                    onChange={handleInputChange}
                    className="auction-checkbox"
                  />
                  <label htmlFor="isAuction" className="auction-label">
                    Выставить объект на аукцион
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Поля аукциона */}
          {formData.isAuction && (
            <section className="form-section">
              <div className="auction-fields">
                <DateRangePicker
                  label="Период проведения аукциона"
                  startDate={formData.auctionStartDate}
                  endDate={formData.auctionEndDate}
                  onStartDateChange={(date) => setFormData(prev => ({ ...prev, auctionStartDate: date }))}
                  onEndDateChange={(date) => setFormData(prev => ({ ...prev, auctionEndDate: date }))}
                />
                
                <div className="bid-step-group">
                  <label className="bid-step-label">Стартовая цена продажи</label>
                  <div className="bid-step-input-wrapper">
                    <div className="currency-selector">
                      <button
                        type="button"
                        className="currency-button"
                        onClick={() => setShowCurrencyDropdown(showCurrencyDropdown === 'auction' ? null : 'auction')}
                      >
                        <span className="currency-symbol">{currencies.find(c => c.code === currency)?.symbol || '$'}</span>
                        <FiChevronDown className="currency-chevron" size={14} />
                      </button>
                      {showCurrencyDropdown === 'auction' && (
                        <div className="currency-dropdown">
                          {currencies.map((curr) => (
                            <button
                              key={curr.code}
                              type="button"
                              className={`currency-option ${currency === curr.code ? 'active' : ''}`}
                              onClick={() => {
                                setCurrency(curr.code)
                                setShowCurrencyDropdown(null)
                              }}
                            >
                              <span className="currency-option-symbol">{curr.symbol}</span>
                              <span className="currency-option-name">{curr.name}</span>
                              <span className="currency-option-code">({curr.code})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="number"
                      name="auctionStartingPrice"
                      value={formData.auctionStartingPrice}
                      onChange={handleInputChange}
                      className="form-input bid-step-input"
                      placeholder="0"
                      min="0"
                      required={formData.isAuction}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Загрузка документов */}
          <section className="form-section">
            <h2 className="section-title">Загрузка документов</h2>
            
            <div className="documents-upload-list">
              {/* Право собственности */}
              <div className="document-upload-item">
                <div className="document-upload-header">
                  <div className="document-upload-info">
                    <h3 className="document-upload-title">
                      Право собственности
                    </h3>
                    <p className="document-upload-description">
                      Загрузите документ о праве собственности
                    </p>
                  </div>
                  {uploadedDocuments.ownership && (
                    <div className="document-upload-check">
                      <FiCheck size={20} />
                    </div>
                  )}
                </div>

                {!uploadedDocuments.ownership ? (
                  <label className="document-upload-label">
                    <input
                      type="file"
                      ref={ownershipInputRef}
                      accept="image/*,.pdf"
                      onChange={(e) => handleRequiredDocumentChange('ownership', e)}
                      style={{ display: 'none' }}
                    />
                    <FiUpload size={24} />
                    <span>Загрузить файл</span>
                  </label>
                ) : (
                  <div className="document-upload-file-info">
                    <FiFile size={20} />
                    <span className="document-upload-file-name">
                      {requiredDocuments.ownership?.name || 'Файл загружен'}
                    </span>
                    <button
                      type="button"
                      className="document-upload-remove"
                      onClick={() => handleRemoveRequiredDocument('ownership')}
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </div>

              {/* Справка об отсутствии долгов */}
              <div className="document-upload-item">
                <div className="document-upload-header">
                  <div className="document-upload-info">
                    <h3 className="document-upload-title">
                      Справка об отсутствии долгов
                    </h3>
                    <p className="document-upload-description">
                      Загрузите справку об отсутствии задолженностей
                    </p>
                  </div>
                  {uploadedDocuments.noDebts && (
                    <div className="document-upload-check">
                      <FiCheck size={20} />
                    </div>
                  )}
                </div>

                {!uploadedDocuments.noDebts ? (
                  <label className="document-upload-label">
                    <input
                      type="file"
                      ref={noDebtsInputRef}
                      accept="image/*,.pdf"
                      onChange={(e) => handleRequiredDocumentChange('noDebts', e)}
                      style={{ display: 'none' }}
                    />
                    <FiUpload size={24} />
                    <span>Загрузить файл</span>
                  </label>
                ) : (
                  <div className="document-upload-file-info">
                    <FiFile size={20} />
                    <span className="document-upload-file-name">
                      {requiredDocuments.noDebts?.name || 'Файл загружен'}
                    </span>
                    <button
                      type="button"
                      className="document-upload-remove"
                      onClick={() => handleRemoveRequiredDocument('noDebts')}
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Дополнительные документы */}
          <section className="form-section">
            <h2 className="section-title">Дополнительные документы</h2>
            <div className="photos-upload-area">
              <div 
                className="photo-upload-box"
                onClick={() => documentInputRef.current?.click()}
              >
                <FiFileText size={20} />
                <p>Загрузить документы</p>
                <span className="upload-hint">PDF или фото</span>
              </div>
              
              <div className="photos-grid">
                {additionalDocuments.map((doc) => (
                  <div key={doc.id} className="photo-item">
                    {doc.type === 'pdf' ? (
                      <div className="document-preview">
                        <FiFileText size={32} />
                        <span className="document-type-badge">PDF</span>
                      </div>
                    ) : (
                      <img src={doc.url} alt={doc.name} />
                    )}
                    <button
                      type="button"
                      className="photo-remove"
                      onClick={() => handleRemoveDocument(doc.id)}
                    >
                      <FiX size={16} />
                    </button>
                    <div className="document-name">{doc.name}</div>
                  </div>
                ))}
              </div>
              
              <input
                ref={documentInputRef}
                type="file"
                multiple
                accept="application/pdf,image/*"
                onChange={handleDocumentUpload}
                style={{ display: 'none' }}
              />
            </div>
          </section>

          {/* Кнопки */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-preview"
              onClick={handlePreview}
            >
              <FiEye size={16} />
              Предпросмотр
            </button>
            <button
              type="submit"
              className="btn-submit"
            >
              Опубликовать объявление
            </button>
          </div>
          </form>
        )}
      </div>
      {showCarousel && mediaItems.length > 0 && (
        <div className="carousel-overlay" onClick={() => setShowCarousel(false)}>
          <div className="carousel-container" onClick={(e) => e.stopPropagation()}>
            <button 
              className="carousel-close"
              onClick={() => setShowCarousel(false)}
            >
              <FiX size={24} />
            </button>
            {mediaItems.length > 1 && (
              <>
                <button 
                  className="carousel-nav carousel-nav--prev"
                  onClick={prevMedia}
                >
                  <FiChevronLeft size={24} />
                </button>
                <button 
                  className="carousel-nav carousel-nav--next"
                  onClick={nextMedia}
                >
                  <FiChevronRight size={24} />
                </button>
              </>
            )}
            <div className="carousel-media-wrapper">
              {mediaItems[currentMediaIndex].mediaType === 'photo' ? (
                <>
                  <div className="carousel-image-wrapper">
                    <img 
                      src={mediaItems[currentMediaIndex].url} 
                      alt={`Фото ${currentMediaIndex + 1}`}
                      className="carousel-image"
                    />
                  </div>
                  <div className="carousel-counter">
                    {currentMediaIndex + 1} / {mediaItems.length}
                  </div>
                </>
              ) : (
                <>
                  <div className="carousel-video-wrapper">
                    {mediaItems[currentMediaIndex].type === 'youtube' && mediaItems[currentMediaIndex].videoId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${mediaItems[currentMediaIndex].videoId}`}
                        title={`YouTube видео ${currentMediaIndex + 1}`}
                        className="carousel-video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : mediaItems[currentMediaIndex].type === 'googledrive' && mediaItems[currentMediaIndex].videoId ? (
                      <iframe
                        src={`https://drive.google.com/file/d/${mediaItems[currentMediaIndex].videoId}/preview`}
                        title={`Google Drive видео ${currentMediaIndex + 1}`}
                        className="carousel-video"
                        frameBorder="0"
                        allowFullScreen
                      />
                    ) : mediaItems[currentMediaIndex].type === 'file' && mediaItems[currentMediaIndex].url ? (
                      <video
                        src={mediaItems[currentMediaIndex].url}
                        controls
                        className="carousel-video-file"
                        autoPlay
                      >
                        Ваш браузер не поддерживает воспроизведение видео.
                      </video>
                    ) : null}
                  </div>
                  <div className="carousel-counter">
                    {currentMediaIndex + 1} / {mediaItems.length}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно предпросмотра */}
      <PropertyPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        propertyData={{ 
          ...formData, 
          photos: photos.map(p => p.url), 
          videos: videos,
          additionalDocuments: additionalDocuments
        }}
      />

      {/* Модальное окно для добавления ссылки на видео */}
      {showVideoLinkModal && (
        <div className="video-link-modal-overlay" onClick={() => setShowVideoLinkModal(false)}>
          <div className="video-link-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="video-link-modal-close"
              onClick={() => setShowVideoLinkModal(false)}
            >
              <FiX size={20} />
            </button>
            <h3 className="video-link-modal-title">Добавить ссылку на видео</h3>
            <p className="video-link-modal-subtitle">
              Вставьте ссылку на YouTube или Google Drive
            </p>
            <input
              type="text"
              className="video-link-input"
              placeholder="https://youtube.com/watch?v=... или https://drive.google.com/file/d/..."
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleVideoLinkSubmit()}
            />
            <div className="video-link-modal-actions">
              <button
                type="button"
                className="video-link-modal-cancel"
                onClick={() => {
                  setShowVideoLinkModal(false)
                  setVideoLink('')
                }}
              >
                Отмена
              </button>
              <button
                type="button"
                className="video-link-modal-submit"
                onClick={handleVideoLinkSubmit}
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}

      <SellerVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        userId={userId}
        onComplete={handleVerificationComplete}
      />

      <CardBindingModal
        isOpen={showCardBindingModal}
        onClose={() => setShowCardBindingModal(false)}
        userId={userId}
        onComplete={handleCardBindingComplete}
      />

      {/* Модальное окно об успешной отправке */}
      {showSuccessModal && (
        <div className="success-modal-overlay" onClick={() => {
          setShowSuccessModal(false)
          navigate('/owner')
        }}>
          <div className="success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-modal__icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#0ABAB5" strokeWidth="2"/>
                <path d="M8 12L11 15L16 9" stroke="#0ABAB5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="success-modal__title">Ваш объект отправлен на модерацию</h2>
            <p className="success-modal__message">
              <FiClock style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Ожидайте ответ в течение 48 часов
            </p>
            <button
              className="success-modal__button"
              onClick={() => {
                setShowSuccessModal(false)
                navigate('/owner')
              }}
            >
              Понятно
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default AddProperty
