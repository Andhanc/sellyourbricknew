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
  FiThumbsUp
} from 'react-icons/fi'
import { PiBuildingApartment, PiBuildings, PiWarehouse } from 'react-icons/pi'
import { MdBed, MdOutlineBathtub, MdLightbulb } from 'react-icons/md'
import { BiArea } from 'react-icons/bi'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import PropertyPreviewModal from '../components/PropertyPreviewModal'
import DateRangePicker from '../components/DateRangePicker'
import SellerVerificationModal from '../components/SellerVerificationModal'
import { getUserData } from '../services/authService'
import './AddProperty.css'

// Фикс для иконок Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

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
  const [showPreview, setShowPreview] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [userId, setUserId] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showVideoLinkModal, setShowVideoLinkModal] = useState(false)
  const [videoLink, setVideoLink] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [translations, setTranslations] = useState(null)
  const [showTranslations, setShowTranslations] = useState(false)
  const [currency, setCurrency] = useState('USD')
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(null) // 'price' или 'auction' или null
  const [currentStep, setCurrentStep] = useState('type-selection') // 'type-selection', 'test-drive-question', 'property-name', 'location', 'form'
  const [showHint1, setShowHint1] = useState(true)
  const [showHint2, setShowHint2] = useState(true)
  const [addressSearch, setAddressSearch] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCoordinates, setSelectedCoordinates] = useState(null)
  const [mapCenter, setMapCenter] = useState([55.7558, 37.6173]) // Москва по умолчанию
  
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

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPhotos(prev => [...prev, {
            id: Date.now() + Math.random(),
            url: reader.result,
            file: file
          }])
        }
        reader.readAsDataURL(file)
      }
    })
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

    files.forEach((file) => {
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
        // Закрываем модальное окно верификации
        setShowVerificationModal(false)
        // Показываем модальное окно об успешной отправке
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
    // После завершения верификации сразу публикуем объявление
    // Пользователь уже отправлен на модерацию через верификацию
    // Теперь отправляем объект недвижимости на модерацию
    const success = await handlePublish()
    if (!success) {
      // Если отправка не удалась, оставляем модальное окно верификации открытым
      // чтобы пользователь мог попробовать еще раз
      return
    }
    // Если успешно, модальное окно закроется в handlePublish через setShowSuccessModal
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

  // Поиск адреса через Nominatim API
  const searchAddress = async (query) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=ru`
      )
      const data = await response.json()
      setAddressSuggestions(data)
      setShowSuggestions(true)
    } catch (error) {
      console.error('Ошибка поиска адреса:', error)
    }
  }

  // Debounce для поиска адреса
  useEffect(() => {
    if (addressSearch.length < 3) {
      setAddressSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timeoutId = setTimeout(() => {
      searchAddress(addressSearch)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [addressSearch])

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

  // Обработчик перехода к форме после заполнения местоположения
  const handleLocationContinue = () => {
    if (!formData.address) {
      alert('Пожалуйста, введите адрес')
      return
    }
    setCurrentStep('form')
  }

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
                setCurrentStep('location')
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
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="property-location-input"
                  placeholder="Страна"
                />
              </div>

              <div className="property-location-input-group">
                <label className="property-location-label">Город</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="property-location-input"
                  placeholder="Город"
                />
              </div>

              <div className="property-location-input-group">
                <label className="property-location-label">Адрес</label>
                <div className="property-location-search-wrapper">
                  <input
                    type="text"
                    value={addressSearch}
                    onChange={(e) => setAddressSearch(e.target.value)}
                    onFocus={() => {
                      if (addressSuggestions.length > 0) {
                        setShowSuggestions(true)
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 200)
                    }}
                    className="property-location-input"
                    placeholder="Введите адрес"
                  />
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
                <label className="property-location-label">
                  Номер дома (необязательно)
                </label>
                <input
                  type="text"
                  name="apartment"
                  value={formData.apartment}
                  onChange={handleInputChange}
                  className="property-location-input"
                  placeholder="Номер дома"
                />
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
                <MapContainer
                  key={selectedCoordinates ? `map-${selectedCoordinates[0]}-${selectedCoordinates[1]}` : 'map-default'}
                  center={selectedCoordinates || mapCenter}
                  zoom={selectedCoordinates ? 15 : 10}
                  style={{ height: '100%', width: '100%', borderRadius: '12px', minHeight: '500px' }}
                  scrollWheelZoom={true}
                  zoomControl={true}
                  whenReady={(map) => {
                    map.target.invalidateSize()
                  }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {selectedCoordinates && selectedCoordinates.length === 2 && (
                    <Marker key={`marker-${selectedCoordinates[0]}-${selectedCoordinates[1]}`} position={selectedCoordinates} />
                  )}
                  <MapUpdater center={selectedCoordinates || mapCenter} zoom={selectedCoordinates ? 15 : 10} />
                </MapContainer>
              )}
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

          {/* Подробная информация */}
          <section className="form-section">
            <h2 className="section-title">Подробная информация</h2>
            <div className="details-grid">
              {/* Общие поля */}
              <div className="detail-field">
                <label className="detail-label">
                  <BiArea size={18} />
                  Площадь (м²)
                </label>
                <input
                  type="number"
                  value={formData.area}
                  onChange={(e) => handleDetailChange('area', e.target.value)}
                  className="detail-input"
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div className="detail-field">
                <label className="detail-label">
                  <MdBed size={18} />
                  Спальные места
                </label>
                <input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleDetailChange('bedrooms', e.target.value)}
                  className="detail-input"
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div className="detail-field">
                <label className="detail-label">Количество комнат</label>
                <input
                  type="number"
                  value={formData.rooms}
                  onChange={(e) => handleDetailChange('rooms', e.target.value)}
                  className="detail-input"
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div className="detail-field">
                <label className="detail-label">
                  <MdOutlineBathtub size={18} />
                  Санузлы
                </label>
                <input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => handleDetailChange('bathrooms', e.target.value)}
                  className="detail-input"
                  placeholder="0"
                  min="0"
                />
              </div>
              
              {(formData.propertyType === 'apartment' || formData.propertyType === 'commercial') && (
                <>
                  <div className="detail-field">
                    <label className="detail-label">Этаж</label>
                    <input
                      type="number"
                      value={formData.floor}
                      onChange={(e) => handleDetailChange('floor', e.target.value)}
                      className="detail-input"
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="detail-field">
                    <label className="detail-label">Всего этажей</label>
                    <input
                      type="number"
                      value={formData.totalFloors}
                      onChange={(e) => handleDetailChange('totalFloors', e.target.value)}
                      className="detail-input"
                      placeholder="0"
                    />
                  </div>
                </>
              )}
              
              <div className="detail-field">
                <label className="detail-label">Год постройки</label>
                <input
                  type="number"
                  value={formData.yearBuilt}
                  onChange={(e) => handleDetailChange('yearBuilt', e.target.value)}
                  className="detail-input"
                  placeholder="2024"
                  min="1900"
                  max="2024"
                />
              </div>
              
              <div className="detail-field detail-field--full">
                <label className="detail-label">
                  <FiMapPin size={18} />
                  Локация
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleDetailChange('location', e.target.value)}
                  className="detail-input"
                  placeholder="Адрес или район"
                />
              </div>
            </div>
            
            {/* Две колонки: слева чекбоксы, справа выпадающие списки */}
            <div className="two-columns-layout">
              {/* Левая колонка: все чекбоксы */}
              <div className="checkboxes-column">
                <div className="checkboxes-section">
                {/* Первый ряд: 3 чекбокса + количество комнат */}
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature1"
                    checked={formData.feature1}
                    onChange={(e) => handleDetailChange('feature1', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature1" className="detail-checkbox-label">Особенность 1</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature2"
                    checked={formData.feature2}
                    onChange={(e) => handleDetailChange('feature2', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature2" className="detail-checkbox-label">Особенность 2</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature3"
                    checked={formData.feature3}
                    onChange={(e) => handleDetailChange('feature3', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature3" className="detail-checkbox-label">Особенность 3</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="garage"
                    checked={formData.garage}
                    onChange={(e) => handleDetailChange('garage', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="garage" className="detail-checkbox-label">Гараж</label>
                </div>

                {/* Второй ряд: 4 чекбокса */}
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature4"
                    checked={formData.feature4}
                    onChange={(e) => handleDetailChange('feature4', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature4" className="detail-checkbox-label">Особенность 4</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature5"
                    checked={formData.feature5}
                    onChange={(e) => handleDetailChange('feature5', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature5" className="detail-checkbox-label">Особенность 5</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature6"
                    checked={formData.feature6}
                    onChange={(e) => handleDetailChange('feature6', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature6" className="detail-checkbox-label">Особенность 6</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature7"
                    checked={formData.feature7}
                    onChange={(e) => handleDetailChange('feature7', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature7" className="detail-checkbox-label">Особенность 7</label>
                </div>

                {/* Третий ряд: 4 чекбокса */}
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature8"
                    checked={formData.feature8}
                    onChange={(e) => handleDetailChange('feature8', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature8" className="detail-checkbox-label">Особенность 8</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature9"
                    checked={formData.feature9}
                    onChange={(e) => handleDetailChange('feature9', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature9" className="detail-checkbox-label">Особенность 9</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature10"
                    checked={formData.feature10}
                    onChange={(e) => handleDetailChange('feature10', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature10" className="detail-checkbox-label">Особенность 10</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature11"
                    checked={formData.feature11}
                    onChange={(e) => handleDetailChange('feature11', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature11" className="detail-checkbox-label">Особенность 11</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="pool"
                    checked={formData.pool}
                    onChange={(e) => handleDetailChange('pool', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="pool" className="detail-checkbox-label">Бассейн</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="security"
                    checked={formData.security}
                    onChange={(e) => handleDetailChange('security', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="security" className="detail-checkbox-label">Охрана</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="furniture"
                    checked={formData.furniture}
                    onChange={(e) => handleDetailChange('furniture', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="furniture" className="detail-checkbox-label">Мебель</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="electricity"
                    checked={formData.electricity}
                    onChange={(e) => handleDetailChange('electricity', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="electricity" className="detail-checkbox-label">Электричество</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="internet"
                    checked={formData.internet}
                    onChange={(e) => handleDetailChange('internet', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="internet" className="detail-checkbox-label">Интернет</label>
                </div>
                
                {/* Чекбоксы для квартиры */}
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="balcony"
                    checked={formData.balcony}
                    onChange={(e) => handleDetailChange('balcony', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="balcony" className="detail-checkbox-label">Балкон</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="parking"
                    checked={formData.parking}
                    onChange={(e) => handleDetailChange('parking', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="parking" className="detail-checkbox-label">Парковка</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="elevator"
                    checked={formData.elevator}
                    onChange={(e) => handleDetailChange('elevator', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="elevator" className="detail-checkbox-label">Лифт</label>
                </div>
                
                {/* Чекбокс для дома/виллы */}
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="garden"
                    checked={formData.garden}
                    onChange={(e) => handleDetailChange('garden', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="garden" className="detail-checkbox-label">Сад</label>
                </div>
              </div>
              </div>
              
              {/* Правая колонка: все выпадающие списки */}
              <div className="dropdowns-column">
                <div className="dropdowns-section">
                  <div className="detail-field">
                    <label className="detail-label">Ремонт</label>
                    <select
                      value={formData.renovation}
                      onChange={(e) => handleDetailChange('renovation', e.target.value)}
                      className="detail-input"
                    >
                      <option value="">Выберите</option>
                      <option value="excellent">Отличный</option>
                      <option value="good">Хороший</option>
                      <option value="satisfactory">Удовлетворительный</option>
                      <option value="needs">Требуется ремонт</option>
                    </select>
                  </div>
                  
                  <div className="detail-field">
                    <label className="detail-label">Состояние</label>
                    <select
                      value={formData.condition}
                      onChange={(e) => handleDetailChange('condition', e.target.value)}
                      className="detail-input"
                    >
                      <option value="">Выберите</option>
                      <option value="new">Новостройка</option>
                      <option value="excellent">Отличное</option>
                      <option value="good">Хорошее</option>
                      <option value="satisfactory">Удовлетворительное</option>
                    </select>
                  </div>
                  
                  <div className="detail-field">
                    <label className="detail-label">Отопление</label>
                    <select
                      value={formData.heating}
                      onChange={(e) => handleDetailChange('heating', e.target.value)}
                      className="detail-input"
                    >
                      <option value="">Выберите</option>
                      <option value="central">Центральное</option>
                      <option value="individual">Индивидуальное</option>
                      <option value="gas">Газовое</option>
                      <option value="electric">Электрическое</option>
                      <option value="none">Нет</option>
                    </select>
                  </div>
                  
                  <div className="detail-field">
                    <label className="detail-label">Водоснабжение</label>
                    <select
                      value={formData.waterSupply}
                      onChange={(e) => handleDetailChange('waterSupply', e.target.value)}
                      className="detail-input"
                    >
                      <option value="">Выберите</option>
                      <option value="central">Центральное</option>
                      <option value="well">Скважина</option>
                      <option value="none">Нет</option>
                    </select>
                  </div>
                  
                  <div className="detail-field">
                    <label className="detail-label">Канализация</label>
                    <select
                      value={formData.sewerage}
                      onChange={(e) => handleDetailChange('sewerage', e.target.value)}
                      className="detail-input"
                    >
                      <option value="">Выберите</option>
                      <option value="central">Центральная</option>
                      <option value="septic">Септик</option>
                      <option value="none">Нет</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="details-grid">
              {/* Поля для дома/виллы */}
              {(formData.propertyType === 'house' || formData.propertyType === 'villa') && (
                <>
                  <div className="detail-field">
                    <label className="detail-label">Площадь участка (м²)</label>
                    <input
                      type="number"
                      value={formData.landArea}
                      onChange={(e) => handleDetailChange('landArea', e.target.value)}
                      className="detail-input"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </>
              )}

              {/* Поля для коммерческой */}
              {formData.propertyType === 'commercial' && (
                <>
                  <div className="detail-field">
                    <label className="detail-label">Тип коммерческой недвижимости</label>
                    <select
                      value={formData.commercialType}
                      onChange={(e) => handleDetailChange('commercialType', e.target.value)}
                      className="detail-input"
                    >
                      <option value="">Выберите тип</option>
                      <option value="office">Офис</option>
                      <option value="shop">Магазин</option>
                      <option value="warehouse">Склад</option>
                      <option value="restaurant">Ресторан</option>
                      <option value="other">Другое</option>
                    </select>
                  </div>
                  
                  <div className="detail-field">
                    <label className="detail-label">Часы работы</label>
                    <input
                      type="text"
                      value={formData.businessHours}
                      onChange={(e) => handleDetailChange('businessHours', e.target.value)}
                      className="detail-input"
                      placeholder="9:00 - 18:00"
                    />
                  </div>
                </>
              )}

            </div>
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

      {/* Объединенная карусель фото и видео */}
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
            <h2 className="success-modal__title">Данные отправлены на верификацию</h2>
            <p className="success-modal__message">
              Ваши документы и объявление о недвижимости успешно отправлены на модерацию. 
              Вы получите уведомление после проверки.
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
