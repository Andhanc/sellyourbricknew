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
  FiVideo
} from 'react-icons/fi'
import { PiBuildingApartment, PiBuildings, PiWarehouse } from 'react-icons/pi'
import { MdBed, MdOutlineBathtub } from 'react-icons/md'
import { BiArea } from 'react-icons/bi'
import PropertyPreviewModal from '../components/PropertyPreviewModal'
import DateRangePicker from '../components/DateRangePicker'
import TestDriveModal from '../components/TestDriveModal'
import DocumentsModal from '../components/DocumentsModal'
import './AddProperty.css'

const AddProperty = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)
  
  const [photos, setPhotos] = useState([])
  const [videos, setVideos] = useState([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [showCarousel, setShowCarousel] = useState(false)
  const [showVideoCarousel, setShowVideoCarousel] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showTestDriveModal, setShowTestDriveModal] = useState(false)
  const [showDocumentsModal, setShowDocumentsModal] = useState(false)
  const [testDriveData, setTestDriveData] = useState(null)
  const [showVideoLinkModal, setShowVideoLinkModal] = useState(false)
  const [videoLink, setVideoLink] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [translations, setTranslations] = useState(null)
  const [showTranslations, setShowTranslations] = useState(false)
  const [currency, setCurrency] = useState('USD')
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(null) // 'price' или 'auction' или null
  
  const currencies = [
    { code: 'USD', symbol: '$', name: 'Доллар США' },
    { code: 'EUR', symbol: '€', name: 'Евро' },
    { code: 'RUB', symbol: '₽', name: 'Российский рубль' },
    { code: 'GBP', symbol: '£', name: 'Фунт стерлингов' }
  ]
  
  const [formData, setFormData] = useState({
    propertyType: '', // Сначала выбираем тип
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
    if (currentPhotoIndex >= photos.length - 1) {
      setCurrentPhotoIndex(Math.max(0, photos.length - 2))
    }
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

  const handleSubmit = (e) => {
    e.preventDefault()
    // Валидация основных полей
    if (!formData.title || photos.length === 0) {
      alert('Пожалуйста, заполните заголовок и загрузите хотя бы одно фото')
      return
    }
    // Открываем второй шаг (модальное окно тест-драйва)
    setShowTestDriveModal(true)
  }

  const handleTestDriveNext = (data) => {
    setTestDriveData(data)
    setShowTestDriveModal(false)
    // Открываем третий шаг (модальное окно документов)
    setShowDocumentsModal(true)
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

  const handleDocumentsComplete = (documents) => {
    // Здесь будет логика сохранения объявления со всеми данными
    console.log('Объявление сохранено:', { 
      ...formData, 
      photos,
      testDrive: testDriveData,
      documents
    })
    alert('Объявление успешно опубликовано!')
    setShowDocumentsModal(false)
    navigate('/owner')
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  const nextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % videos.length)
  }

  const prevVideo = () => {
    setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length)
  }

  return (
    <div className="add-property-page">
      <div className="add-property-container">
        <div className="add-property-header">
          <button 
            className="back-btn"
            onClick={() => navigate('/owner')}
          >
            <FiChevronLeft size={20} />
            Назад
          </button>
          <h1 className="page-title">Добавить объявление</h1>
        </div>

        {/* Выбор типа недвижимости */}
        <section className="form-section">
          <h2 className="section-title">Выберите тип недвижимости</h2>
          <div className="property-type-selector">
            <button
              type="button"
              className={`property-type-card ${formData.propertyType === 'apartment' ? 'property-type-card--active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, propertyType: 'apartment' }))}
            >
              <PiBuildingApartment size={32} />
              <span>Квартира</span>
            </button>
            <button
              type="button"
              className={`property-type-card ${formData.propertyType === 'house' ? 'property-type-card--active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, propertyType: 'house' }))}
            >
              <FiHome size={32} />
              <span>Дом</span>
            </button>
            <button
              type="button"
              className={`property-type-card ${formData.propertyType === 'villa' ? 'property-type-card--active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, propertyType: 'villa' }))}
            >
              <PiBuildings size={32} />
              <span>Вилла</span>
            </button>
            <button
              type="button"
              className={`property-type-card ${formData.propertyType === 'commercial' ? 'property-type-card--active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, propertyType: 'commercial' }))}
            >
              <PiWarehouse size={32} />
              <span>Коммерческая</span>
            </button>
          </div>
        </section>

        {formData.propertyType && (
          <form onSubmit={handleSubmit} className="add-property-form">
            {/* Загрузка фото */}
            <section className="form-section">
            <h2 className="section-title">Фотографии (до 10 шт.)</h2>
            <div className="photos-upload-area">
              {photos.length < 10 && (
                <div 
                  className="photo-upload-box"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiUpload size={20} />
                  <p>Добавить фото</p>
                  <span>{photos.length}/10</span>
                </div>
              )}
              
              <div className="photos-grid">
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
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </div>
            
            {photos.length > 0 && (
            <button
              type="button"
              className="view-carousel-btn"
              onClick={() => setShowCarousel(true)}
            >
              <FiEye size={16} />
              Просмотреть карусель
            </button>
            )}
          </section>

          {/* Загрузка видео */}
          <section className="form-section">
            <h2 className="section-title">Видео (до 3 шт.)</h2>
            <div className="photos-upload-area">
              {videos.length < 3 && (
                <>
                  <div 
                    className="photo-upload-box"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <FiUpload size={20} />
                    <p>Загрузить видео</p>
                    <span className="upload-hint">до 1 минуты</span>
                    <span>{videos.length}/3</span>
                  </div>
                  <div 
                    className="photo-upload-box photo-upload-box--link"
                    onClick={() => setShowVideoLinkModal(true)}
                  >
                    <FiLink size={20} />
                    <p>Добавить ссылку</p>
                    <span className="upload-hint">YouTube / Google Drive</span>
                  </div>
                </>
              )}
              
              <div className="photos-grid">
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
                    <div className="video-play-overlay">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
                      </svg>
                    </div>
                    <button
                      type="button"
                      className="photo-remove"
                      onClick={() => handleRemoveVideo(video.id)}
                    >
                      <FiX size={16} />
                    </button>
                    <div className="photo-number">{index + 1}</div>
                  </div>
                ))}
              </div>
              
              <input
                ref={videoInputRef}
                type="file"
                multiple
                accept="video/*"
                onChange={handleVideoUpload}
                style={{ display: 'none' }}
              />
            </div>
            
            {videos.length > 0 && (
              <button
                type="button"
                className="view-carousel-btn"
                onClick={() => setShowVideoCarousel(true)}
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

      {/* Карусель фото */}
      {showCarousel && photos.length > 0 && (
        <div className="carousel-overlay" onClick={() => setShowCarousel(false)}>
          <div className="carousel-container" onClick={(e) => e.stopPropagation()}>
            <button 
              className="carousel-close"
              onClick={() => setShowCarousel(false)}
            >
              <FiX size={24} />
            </button>
            <button 
              className="carousel-nav carousel-nav--prev"
              onClick={prevPhoto}
            >
              <FiChevronLeft size={24} />
            </button>
            <div className="carousel-image-wrapper">
              <img 
                src={photos[currentPhotoIndex].url} 
                alt={`Фото ${currentPhotoIndex + 1}`}
                className="carousel-image"
              />
              <div className="carousel-counter">
                {currentPhotoIndex + 1} / {photos.length}
              </div>
            </div>
            <button 
              className="carousel-nav carousel-nav--next"
              onClick={nextPhoto}
            >
              <FiChevronRight size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Карусель видео */}
      {showVideoCarousel && videos.length > 0 && (
        <div className="carousel-overlay" onClick={() => setShowVideoCarousel(false)}>
          <div className="carousel-container" onClick={(e) => e.stopPropagation()}>
            <button 
              className="carousel-close"
              onClick={() => setShowVideoCarousel(false)}
            >
              <FiX size={24} />
            </button>
            {videos.length > 1 && (
              <>
                <button 
                  className="carousel-nav carousel-nav--prev"
                  onClick={prevVideo}
                >
                  <FiChevronLeft size={24} />
                </button>
                <button 
                  className="carousel-nav carousel-nav--next"
                  onClick={nextVideo}
                >
                  <FiChevronRight size={24} />
                </button>
              </>
            )}
            <div className="carousel-video-wrapper">
              {videos[currentVideoIndex].type === 'youtube' && videos[currentVideoIndex].videoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videos[currentVideoIndex].videoId}`}
                  title={`YouTube видео ${currentVideoIndex + 1}`}
                  className="carousel-video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : videos[currentVideoIndex].type === 'googledrive' && videos[currentVideoIndex].videoId ? (
                <iframe
                  src={`https://drive.google.com/file/d/${videos[currentVideoIndex].videoId}/preview`}
                  title={`Google Drive видео ${currentVideoIndex + 1}`}
                  className="carousel-video"
                  frameBorder="0"
                  allowFullScreen
                />
              ) : videos[currentVideoIndex].type === 'file' && videos[currentVideoIndex].url ? (
                <video
                  src={videos[currentVideoIndex].url}
                  controls
                  className="carousel-video-file"
                  autoPlay
                >
                  Ваш браузер не поддерживает воспроизведение видео.
                </video>
              ) : null}
              <div className="carousel-counter">
                {currentVideoIndex + 1} / {videos.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно предпросмотра */}
      <PropertyPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        propertyData={{ ...formData, photos: photos.map(p => p.url), videos: videos }}
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

      <TestDriveModal
        isOpen={showTestDriveModal}
        onClose={() => setShowTestDriveModal(false)}
        onNext={handleTestDriveNext}
      />

      <DocumentsModal
        isOpen={showDocumentsModal}
        onClose={() => setShowDocumentsModal(false)}
        onComplete={handleDocumentsComplete}
      />
    </div>
  )
}

export default AddProperty
