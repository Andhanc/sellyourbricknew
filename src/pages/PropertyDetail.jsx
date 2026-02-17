import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { properties } from '../data/properties'
import CountdownTimer from '../components/CountdownTimer'
import BiddingHistoryModal from '../components/BiddingHistoryModal'
import DepositButton from '../components/DepositButton'
import { getUserData } from '../services/authService'
import BidOutbidNotification from '../components/BidOutbidNotification'
import { FiX, FiLayers, FiHome, FiCheck, FiX as FiXIcon } from 'react-icons/fi'
import { IoLocationOutline } from 'react-icons/io5'
import { MdBed, MdOutlineBathtub } from 'react-icons/md'
import { BiArea } from 'react-icons/bi'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './PropertyDetail.css'

// Фикс для иконок Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const PropertyDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [property, setProperty] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [bidAmount, setBidAmount] = useState('')
  const [isBidHistoryOpen, setIsBidHistoryOpen] = useState(false)
  const [userDeposit, setUserDeposit] = useState(0)
  const [minimumBid, setMinimumBid] = useState(0)
  const [currentBid, setCurrentBid] = useState(0)
  const [isSubmittingBid, setIsSubmittingBid] = useState(false)
  const [bidError, setBidError] = useState('')
  const [bidHistoryRefresh, setBidHistoryRefresh] = useState(0)
  const [outbidNotification, setOutbidNotification] = useState(null)
  const shownNotificationIdsRef = useRef(new Set())
  const userData = getUserData()
  const userId = userData?.id

  // Функция для загрузки данных объекта
  const loadPropertyData = async (propertyId) => {
    if (!propertyId) return null
    
    try {
      const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          return result.data
        }
      }
    } catch (err) {
      console.error('Ошибка загрузки объявления:', err)
    }
    return null
  }

  // Функция для обработки данных объекта
  const processPropertyData = async (prop) => {
    // Получаем базовый URL без /api
    const baseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '')
    
    // Обрабатываем фотографии
    let processedImages = []
    if (prop.photos && Array.isArray(prop.photos) && prop.photos.length > 0) {
      processedImages = prop.photos.map(photo => {
        if (typeof photo === 'string') {
          const photoStr = photo.trim()
          if (photoStr.startsWith('data:')) return photoStr
          else if (photoStr.startsWith('http://') || photoStr.startsWith('https://')) return photoStr
          else if (photoStr.startsWith('/uploads/')) return `${baseUrl}${photoStr}`
          else if (photoStr.startsWith('uploads/')) return `${baseUrl}/${photoStr}`
          else return `${baseUrl}/uploads/${photoStr}`
        } else if (photo && typeof photo === 'object' && photo.url) {
          const photoUrl = String(photo.url).trim()
          if (photoUrl.startsWith('data:')) return photoUrl
          else if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) return photoUrl
          else if (photoUrl.startsWith('/uploads/')) return `${baseUrl}${photoUrl}`
          else if (photoUrl.startsWith('uploads/')) return `${baseUrl}/${photoUrl}`
          else return `${baseUrl}/uploads/${photoUrl}`
        }
        return photo
      })
    }
    if (processedImages.length === 0) {
      processedImages = ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80']
    }
    
    // Обрабатываем видео
    let processedVideos = []
    if (prop.videos && Array.isArray(prop.videos) && prop.videos.length > 0) {
      processedVideos = prop.videos.map(video => {
        if (typeof video === 'string') {
          const youtubeMatch = video.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
          if (youtubeMatch) {
            return {
              type: 'youtube',
              videoId: youtubeMatch[1],
              url: video
            }
          }
          const driveMatch = video.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
          if (driveMatch) {
            return {
              type: 'googledrive',
              videoId: driveMatch[1],
              url: video
            }
          }
          return {
            type: 'file',
            url: video
          }
        } else if (video && typeof video === 'object') {
          return video
        }
        return video
      })
    }
    
    // Обрабатываем координаты
    let coordinates = [28.1000, -16.7200]
    if (prop.coordinates) {
      try {
        if (typeof prop.coordinates === 'string') {
          const parsed = JSON.parse(prop.coordinates)
          if (Array.isArray(parsed) && parsed.length >= 2) {
            coordinates = [parseFloat(parsed[0]), parseFloat(parsed[1])]
          }
        } else if (Array.isArray(prop.coordinates) && prop.coordinates.length >= 2) {
          coordinates = [parseFloat(prop.coordinates[0]), parseFloat(prop.coordinates[1])]
        }
      } catch (e) {
        console.warn('Ошибка парсинга coordinates:', e)
      }
    }
    
      // Получаем текущую максимальную ставку
      // Сначала показываем стартовую цену, если есть ставки - показываем максимальную ставку
      let currentMaxBid = prop.auction_starting_price || prop.price || 0
      let minBid = prop.auction_minimum_bid || (currentMaxBid + (currentMaxBid * 0.05))
      
      // Загружаем ставки для этого объекта, чтобы получить актуальную максимальную ставку
      try {
        const bidsResponse = await fetch(`${API_BASE_URL}/bids/property/${prop.id}`)
        if (bidsResponse.ok) {
          const bidsData = await bidsResponse.json()
          if (bidsData.success && bidsData.data && bidsData.data.length > 0) {
            // Если есть ставки - показываем максимальную ставку
            const maxBid = Math.max(...bidsData.data.map(b => b.bid_amount))
            currentMaxBid = maxBid
            console.log(`✅ Найдены ставки, текущая максимальная: ${currentMaxBid}`)
          } else {
            // Если ставок нет - показываем стартовую цену
            console.log(`📊 Ставок нет, показываем стартовую цену: ${currentMaxBid}`)
          }
          // Обновляем минимальную ставку на основе актуальных данных
          minBid = prop.auction_minimum_bid || (currentMaxBid + (currentMaxBid * 0.05))
        }
      } catch (bidsError) {
        console.warn('Не удалось загрузить ставки:', bidsError)
      }
    
    const formattedProperty = {
      id: prop.id,
      title: prop.title,
      name: prop.title,
      description: prop.description || '',
      location: prop.location || '',
      price: prop.price || 0,
      currentBid: currentMaxBid,
      area: prop.area || 0,
      sqft: prop.area || 0,
      rooms: prop.rooms || 0,
      beds: prop.bedrooms || prop.rooms || 0,
      bathrooms: prop.bathrooms || 0,
      floor: prop.floor || null,
      total_floors: prop.total_floors || null,
      year_built: prop.year_built || null,
      property_type: prop.property_type || 'apartment',
      coordinates: coordinates,
      images: processedImages,
      videos: processedVideos,
      balcony: prop.balcony === 1,
      parking: prop.parking === 1,
      elevator: prop.elevator === 1,
      land_area: prop.land_area || null,
      garage: prop.garage === 1,
      pool: prop.pool === 1,
      garden: prop.garden === 1,
      renovation: prop.renovation || null,
      condition: prop.condition || null,
      heating: prop.heating || null,
      water_supply: prop.water_supply || null,
      sewerage: prop.sewerage || null,
      electricity: prop.electricity === 1,
      internet: prop.internet === 1,
      security: prop.security === 1,
      furniture: prop.furniture === 1,
      commercial_type: prop.commercial_type || null,
      business_hours: prop.business_hours || null,
      currency: prop.currency || 'USD',
      is_auction: prop.is_auction === 1 || prop.is_auction === true,
      auction_start_date: prop.auction_start_date || null,
      auction_end_date: prop.auction_end_date || null,
      auction_starting_price: prop.auction_starting_price || null,
      auction_minimum_bid: prop.auction_minimum_bid || null,
      endTime: prop.auction_end_date || null,
      additional_amenities: prop.additional_amenities || null,
      seller: prop.first_name && prop.last_name 
        ? `${prop.first_name} ${prop.last_name}` 
        : 'Продавец',
    }
    
    setProperty(formattedProperty)
    setCurrentBid(currentMaxBid)
    setMinimumBid(minBid)
    
    return formattedProperty
  }

  // Загружаем данные объявления
  useEffect(() => {
    const loadProperty = async () => {
      // Сначала проверяем, есть ли данные в location.state
      const propertyFromState = location.state?.property
      if (propertyFromState) {
        setProperty(propertyFromState)
        setIsLoading(false)
        // Загружаем актуальные данные с сервера в фоне
        const prop = await loadPropertyData(propertyFromState.id)
        if (prop) {
          processPropertyData(prop)
        }
        return
      }

      // Если данных нет, загружаем с сервера
      if (id) {
        try {
          setIsLoading(true)
          const prop = await loadPropertyData(id)
          if (prop) {
            await processPropertyData(prop)
          }
        } catch (err) {
          console.error('Ошибка загрузки объявления:', err)
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    loadProperty()
  }, [id, location.state])

  // Функция для загрузки депозита пользователя
  const loadUserDeposit = async () => {
    if (!userId) {
      setUserDeposit(0)
      return
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/deposit`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUserDeposit(data.data.depositAmount || 0)
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки депозита:', error)
      setUserDeposit(0)
    }
  }

  // Нормализуем данные объекта для совместимости с разными форматами
  const normalizedProperty = property ? {
    ...property,
    title: property.title || property.name || 'Объект недвижимости',
    area: property.area || property.sqft,
    rooms: property.rooms || property.beds,
    images: property.images || (property.image ? [property.image] : []),
    currentBid: property.currentBid || property.price,
    price: property.price || property.currentBid,
    coordinates: property.coordinates || [28.1000, -16.7200]
  } : null
  
  // Логируем для отладки
  useEffect(() => {
    if (normalizedProperty) {
      console.log('✅ Property loaded:', normalizedProperty.id, normalizedProperty.title, 'Auction:', normalizedProperty.is_auction)
      console.log('📊 Property data:', {
        area: normalizedProperty.area,
        rooms: normalizedProperty.rooms,
        bathrooms: normalizedProperty.bathrooms,
        floor: normalizedProperty.floor,
        total_floors: normalizedProperty.total_floors,
        coordinates: normalizedProperty.coordinates
      })
    } else if (id && !isLoading) {
      console.error('❌ Property not found for ID:', id)
    }
  }, [id, normalizedProperty, isLoading])

  // Загружаем депозит пользователя
  useEffect(() => {
    loadUserDeposit()
    // Обновляем каждые 5 секунд для актуальности данных
    const interval = setInterval(loadUserDeposit, 5000)
    return () => clearInterval(interval)
  }, [userId])

  // Периодическое обновление данных объекта (ставки, текущая ставка)
  useEffect(() => {
    if (!normalizedProperty?.id || !normalizedProperty?.is_auction) return
    
    const updateBids = async () => {
      try {
        // Загружаем актуальные ставки
        const bidsResponse = await fetch(`${API_BASE_URL}/bids/property/${normalizedProperty.id}`)
        if (bidsResponse.ok) {
          const bidsData = await bidsResponse.json()
          if (bidsData.success && bidsData.data && bidsData.data.length > 0) {
            const maxBid = Math.max(...bidsData.data.map(b => b.bid_amount))
            if (maxBid !== currentBid) {
              setCurrentBid(maxBid)
              setProperty({
                ...normalizedProperty,
                currentBid: maxBid
              })
              // Обновляем минимальную ставку
              const prop = await loadPropertyData(normalizedProperty.id)
              if (prop) {
                const newMinBid = prop.auction_minimum_bid || (maxBid + (maxBid * 0.05))
                setMinimumBid(newMinBid)
              }
            }
          }
        }
      } catch (error) {
        console.warn('Ошибка обновления ставок:', error)
      }
    }
    
    // Обновляем каждые 3 секунды
    const interval = setInterval(updateBids, 3000)
    return () => clearInterval(interval)
  }, [normalizedProperty?.id, normalizedProperty?.is_auction, currentBid])

  // Проверяем уведомления о перебитой ставке для текущего объекта
  useEffect(() => {
    if (!normalizedProperty?.id || !normalizedProperty?.is_auction || !userId) return

    const checkNotifications = async () => {
      try {
        // Загружаем уведомления пользователя
        const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            console.log('🔍 Проверка уведомлений для объекта:', normalizedProperty.id)
            console.log('🔍 Все уведомления:', data.data)
            console.log('🔍 Уведомления bid_outbid:', data.data.filter(n => n.type === 'bid_outbid'))
            
            // Ищем уведомления о перебитой ставке для текущего объекта
            const outbidNotifs = data.data.filter(n => {
              if (n.type !== 'bid_outbid') return false
              if (shownNotificationIdsRef.current.has(n.id)) return false
              if (n.view_count !== 0) return false
              
              // data уже парсится на сервере, но на всякий случай проверяем
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
              const currentPropertyId = parseInt(normalizedProperty.id)
              
              console.log('🔍 Сравнение property_id:', {
                notifPropertyId,
                currentPropertyId,
                notifPropertyIdType: typeof notifPropertyId,
                currentPropertyIdType: typeof currentPropertyId,
                match: notifPropertyId == currentPropertyId || parseInt(notifPropertyId) === currentPropertyId
              })
              
              return notifPropertyId && (
                notifPropertyId == currentPropertyId || 
                parseInt(notifPropertyId) === currentPropertyId
              )
            })

            if (outbidNotifs.length > 0) {
              // Берем самое свежее уведомление
              const latestNotif = outbidNotifs.sort((a, b) => 
                new Date(b.created_at) - new Date(a.created_at)
              )[0]
              
              // Убеждаемся, что data парсится правильно
              let parsedData = latestNotif.data
              if (typeof parsedData === 'string') {
                try {
                  parsedData = JSON.parse(parsedData)
                } catch (e) {
                  console.warn('Ошибка парсинга data:', e)
                }
              }
              
              const notificationToShow = {
                ...latestNotif,
                data: parsedData
              }
              
              setOutbidNotification(notificationToShow)
              shownNotificationIdsRef.current.add(latestNotif.id)
              console.log('🔔 ✅ Показано уведомление о перебитой ставке на странице объекта:', latestNotif.id, notificationToShow)
            } else {
              console.log('🔍 Уведомления о перебитой ставке для этого объекта не найдены')
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
  }, [normalizedProperty?.id, normalizedProperty?.is_auction, userId])

  if (isLoading) {
    return (
      <div className="property-detail-page">
        <DepositButton amount={userDeposit} />
        <div className="property-detail">
          <div className="loading" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '50vh',
            fontSize: '18px'
          }}>
            Загрузка...
          </div>
        </div>
      </div>
    )
  }

  const handleCloseOutbidNotification = () => {
    setOutbidNotification(null)
  }

  const handleGoToPropertyFromNotification = (propertyId) => {
    // Если мы уже на странице этого объекта, просто прокручиваем к форме ставки
    if (propertyId === parseInt(normalizedProperty?.id)) {
      const bidForm = document.querySelector('.bid-form') || document.querySelector('.property-bid-section')
      if (bidForm) {
        bidForm.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  if (!normalizedProperty) {
    console.error('Property not found. ID:', id, 'Available IDs:', properties.map(p => p.id))
    return (
      <div className="property-detail-page">
        {outbidNotification && (
          <BidOutbidNotification
            notification={outbidNotification}
            onClose={handleCloseOutbidNotification}
            onGoToProperty={handleGoToPropertyFromNotification}
          />
        )}
        <DepositButton amount={userDeposit} />
        <div className="property-detail">
          <div className="not-found">
            <h2>Объект не найден</h2>
            <p>ID: {id}</p>
            <Link to="/" className="btn btn-primary">Вернуться на главную</Link>
          </div>
        </div>
      </div>
    )
  }

  const formatPrice = (price) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`
    }
    return `$${price.toLocaleString('en-US')}`
  }

  const handleBid = async (e) => {
    e.preventDefault()
    setBidError('')
    
    if (!userId) {
      setBidError('Необходимо войти в систему')
      return
    }
    
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setBidError('Введите сумму ставки')
      return
    }
    
    const bidAmountNum = parseFloat(bidAmount)
    
    // Проверяем минимальную ставку
    if (bidAmountNum < minimumBid) {
      setBidError(`Ставка должна быть не меньше ${formatPrice(minimumBid)}`)
      return
    }
    
    // Проверяем депозит
    if (userDeposit <= 0) {
      setBidError('Для участия в аукционе необходим депозит. Пожалуйста, пополните депозит.')
      return
    }
    
    setIsSubmittingBid(true)
    
    const requestData = {
      user_id: parseInt(userId),
      property_id: parseInt(normalizedProperty.id),
      bid_amount: parseFloat(bidAmountNum)
    }
    
    console.log('📤 Отправка ставки:', requestData)
    console.log('📤 Типы данных:', {
      user_id: typeof requestData.user_id,
      property_id: typeof requestData.property_id,
      bid_amount: typeof requestData.bid_amount
    })
    console.log('📤 API_BASE_URL:', API_BASE_URL)
    console.log('📤 Полный URL:', `${API_BASE_URL}/bids`)
    console.log('📤 userId:', userId, '->', requestData.user_id)
    console.log('📤 property_id:', normalizedProperty.id, '->', requestData.property_id)
    
    try {
      const response = await fetch(`${API_BASE_URL}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
      
      console.log('📥 Ответ сервера:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Ошибка HTTP:', response.status, errorText)
        setBidError(`Ошибка сервера: ${response.status}`)
        setIsSubmittingBid(false)
        return
      }
      
      const data = await response.json()
      console.log('📥 Данные ответа:', data)
      
      if (data.success) {
        console.log('✅ Ставка успешно создана на сервере:', data)
        setBidAmount('')
        setBidError('')
        
        // Сразу обновляем историю ставок
        setBidHistoryRefresh(prev => prev + 1)
        
        // Перезагружаем данные объекта с сервера для получения актуальной информации
        try {
          const prop = await loadPropertyData(normalizedProperty.id)
          if (prop) {
            await processPropertyData(prop)
            console.log('✅ Данные объекта обновлены')
          }
        } catch (err) {
          console.error('Ошибка обновления данных объекта:', err)
        }
        
        // Обновляем депозит
        await loadUserDeposit()
        
        // Показываем успешное сообщение
        alert(`Ставка ${formatPrice(bidAmountNum)} успешно принята!`)
        
        // Перезагружаем данные и историю через небольшую задержку для гарантии
        setTimeout(async () => {
          try {
            const prop = await loadPropertyData(normalizedProperty.id)
            if (prop) {
              await processPropertyData(prop)
            }
            // Еще раз обновляем историю
            setBidHistoryRefresh(prev => prev + 1)
            console.log('✅ Повторное обновление данных выполнено')
          } catch (err) {
            console.error('Ошибка повторного обновления:', err)
          }
        }, 1500)
      } else {
        console.error('❌ Ошибка создания ставки:', data)
        setBidError(data.error || 'Ошибка при создании ставки')
        alert(`Ошибка: ${data.error || 'Ошибка при создании ставки'}`)
      }
    } catch (error) {
      console.error('❌ Ошибка при создании ставки:', error)
      setBidError('Ошибка при создании ставки. Попробуйте позже.')
      alert(`Ошибка сети: ${error.message}`)
    } finally {
      setIsSubmittingBid(false)
    }
  }


  return (
    <div className="property-detail-page">
      {outbidNotification && (
        <BidOutbidNotification
          notification={outbidNotification}
          onClose={handleCloseOutbidNotification}
          onGoToProperty={handleGoToPropertyFromNotification}
        />
      )}
      <DepositButton amount={userDeposit} />
      <div className="property-detail">
        <div className="detail-header">
          <button onClick={() => navigate(-1)} className="back-button">
            ← Назад
          </button>
          <div className="detail-nav">
            <Link to="/">Результаты поиска</Link>
            <span> / </span>
            <span>{normalizedProperty.title}</span>
          </div>
        </div>

        <div className="detail-content">
          <div className="detail-left">
            <div className="detail-images">
              <div className="main-image">
                <img 
                  src={normalizedProperty.images[selectedImage]} 
                  alt={normalizedProperty.title}
                />
                <div className="image-controls">
                  <button 
                    className="image-btn"
                    onClick={() => setSelectedImage(Math.max(0, selectedImage - 1))}
                    disabled={selectedImage === 0}
                  >
                    ←
                  </button>
                  <button 
                    className="image-btn"
                    onClick={() => setSelectedImage(Math.min(normalizedProperty.images.length - 1, selectedImage + 1))}
                    disabled={selectedImage === normalizedProperty.images.length - 1}
                  >
                    →
                  </button>
                </div>
              </div>
              <div className="image-thumbnails">
                {normalizedProperty.images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`${normalizedProperty.title} ${index + 1}`}
                    className={selectedImage === index ? 'active' : ''}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </div>
            </div>

            <div className="detail-main">
              <div className="detail-header-info">
                <h1 className="detail-title">{normalizedProperty.title}</h1>
                <div className="detail-location">
                  <IoLocationOutline size={18} />
                  <span>{normalizedProperty.location}</span>
                </div>
                {/* Цена объекта */}
                {normalizedProperty.price && (
                  <div className="detail-price">
                    <span className="detail-price-label">Цена:</span>
                    <span className="detail-price-value">
                      {normalizedProperty.currency === 'EUR' ? '€' : 
                       normalizedProperty.currency === 'USD' ? '$' : 
                       normalizedProperty.currency === 'BYN' ? 'Br' : ''}
                      {normalizedProperty.price.toLocaleString('ru-RU')}
                    </span>
                  </div>
                )}
                {/* Тип недвижимости */}
                {normalizedProperty.property_type && (
                  <div className="detail-property-type">
                    <span className="property-type-badge">
                      {normalizedProperty.property_type === 'apartment' ? 'Квартира' :
                       normalizedProperty.property_type === 'house' ? 'Дом' :
                       normalizedProperty.property_type === 'villa' ? 'Вилла' :
<<<<<<< HEAD
                       normalizedProperty.property_type === 'townhouse' ? 'Таунхаус' :
=======
                       normalizedProperty.property_type === 'townhouse' ? 'Дом' :
>>>>>>> 9834624ce85afa7fe9aa397716cd67d8da737a39
                       normalizedProperty.property_type === 'commercial' ? 'Коммерческая' :
                       normalizedProperty.property_type}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Основная информация об объекте */}
              <div className="detail-info-sections">
                {/* Основные параметры */}
                <div className="detail-section">
                  <h3 className="detail-section-title">Основные параметры</h3>
                  <div className="detail-specs-grid">
                    {(normalizedProperty.area || normalizedProperty.sqft) && (
                      <div className="spec-item-icon">
                        <BiArea size={20} />
                        <div className="spec-item-content">
                          <span className="spec-label">Площадь</span>
                          <span className="spec-value">{normalizedProperty.area || normalizedProperty.sqft || 0} м²</span>
                        </div>
                      </div>
                    )}
                    {(normalizedProperty.rooms || normalizedProperty.beds) && (
                      <div className="spec-item-icon">
                        <MdBed size={20} />
                        <div className="spec-item-content">
                          <span className="spec-label">Комнат</span>
                          <span className="spec-value">{normalizedProperty.rooms || normalizedProperty.beds || 'Студия'}</span>
                        </div>
                      </div>
                    )}
                    {normalizedProperty.bathrooms && (
                      <div className="spec-item-icon">
                        <MdOutlineBathtub size={20} />
                        <div className="spec-item-content">
                          <span className="spec-label">Ванных</span>
                          <span className="spec-value">{normalizedProperty.bathrooms}</span>
                        </div>
                      </div>
                    )}
                    {(normalizedProperty.floor || normalizedProperty.total_floors) && (
                      <div className="spec-item-icon">
                        <FiLayers size={20} />
                        <div className="spec-item-content">
                          <span className="spec-label">Этаж</span>
                          <span className="spec-value">
                            {normalizedProperty.floor || ''}
                            {normalizedProperty.total_floors && `/${normalizedProperty.total_floors}`}
                          </span>
                        </div>
                      </div>
                    )}
                    {normalizedProperty.year_built && (
                      <div className="spec-item-icon">
                        <FiHome size={20} />
                        <div className="spec-item-content">
                          <span className="spec-label">Год постройки</span>
                          <span className="spec-value">{normalizedProperty.year_built}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Удобства и особенности */}
                {(normalizedProperty.balcony || normalizedProperty.parking || normalizedProperty.elevator || 
                  normalizedProperty.garage || normalizedProperty.pool || normalizedProperty.garden ||
                  normalizedProperty.electricity || normalizedProperty.internet || normalizedProperty.security ||
                  normalizedProperty.furniture) && (
                  <div className="detail-section">
                    <h3 className="detail-section-title">Удобства и особенности</h3>
                    <div className="detail-features-grid">
                      {normalizedProperty.balcony && (
                        <div className="feature-item">
                          <FiCheck size={18} />
                          <span>Балкон</span>
                        </div>
                      )}
                      {normalizedProperty.parking && (
                        <div className="feature-item">
                          <FiCheck size={18} />
                          <span>Парковка</span>
                        </div>
                      )}
                      {normalizedProperty.elevator && (
                        <div className="feature-item">
                          <FiCheck size={18} />
                          <span>Лифт</span>
                        </div>
                      )}
                      {normalizedProperty.garage && (
                        <div className="feature-item">
                          <FiCheck size={18} />
                          <span>Гараж</span>
                        </div>
                      )}
                      {normalizedProperty.pool && (
                        <div className="feature-item">
                          <FiCheck size={18} />
                          <span>Бассейн</span>
                        </div>
                      )}
                      {normalizedProperty.garden && (
                        <div className="feature-item">
                          <FiCheck size={18} />
                          <span>Сад</span>
                        </div>
                      )}
                      {normalizedProperty.electricity && (
                        <div className="feature-item">
                          <FiCheck size={18} />
                          <span>Электричество</span>
                        </div>
                      )}
                      {normalizedProperty.internet && (
                        <div className="feature-item">
                          <FiCheck size={18} />
                          <span>Интернет</span>
                        </div>
                      )}
                      {normalizedProperty.security && (
                        <div className="feature-item">
                          <FiCheck size={18} />
                          <span>Охрана</span>
                        </div>
                      )}
                      {normalizedProperty.furniture && (
                        <div className="feature-item">
                          <FiCheck size={18} />
                          <span>Мебель</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Дополнительная информация */}
                {(normalizedProperty.land_area || normalizedProperty.renovation || normalizedProperty.condition ||
                  normalizedProperty.heating || normalizedProperty.water_supply || normalizedProperty.sewerage ||
                  normalizedProperty.commercial_type || normalizedProperty.business_hours) && (
                  <div className="detail-section">
                    <h3 className="detail-section-title">Дополнительная информация</h3>
                    <div className="detail-additional-info">
                      {normalizedProperty.land_area && (
                        <div className="info-item">
                          <span className="info-label">Площадь участка:</span>
                          <span className="info-value">{normalizedProperty.land_area} м²</span>
                        </div>
                      )}
                      {normalizedProperty.renovation && (
                        <div className="info-item">
                          <span className="info-label">Ремонт:</span>
                          <span className="info-value">{normalizedProperty.renovation}</span>
                        </div>
                      )}
                      {normalizedProperty.condition && (
                        <div className="info-item">
                          <span className="info-label">Состояние:</span>
                          <span className="info-value">{normalizedProperty.condition}</span>
                        </div>
                      )}
                      {normalizedProperty.heating && (
                        <div className="info-item">
                          <span className="info-label">Отопление:</span>
                          <span className="info-value">{normalizedProperty.heating}</span>
                        </div>
                      )}
                      {normalizedProperty.water_supply && (
                        <div className="info-item">
                          <span className="info-label">Водоснабжение:</span>
                          <span className="info-value">{normalizedProperty.water_supply}</span>
                        </div>
                      )}
                      {normalizedProperty.sewerage && (
                        <div className="info-item">
                          <span className="info-label">Канализация:</span>
                          <span className="info-value">{normalizedProperty.sewerage}</span>
                        </div>
                      )}
                      {normalizedProperty.commercial_type && (
                        <div className="info-item">
                          <span className="info-label">Тип коммерческой недвижимости:</span>
                          <span className="info-value">{normalizedProperty.commercial_type}</span>
                        </div>
                      )}
                      {normalizedProperty.business_hours && (
                        <div className="info-item">
                          <span className="info-label">Часы работы:</span>
                          <span className="info-value">{normalizedProperty.business_hours}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Описание */}
                {normalizedProperty.description && (
                  <div className="detail-section">
                    <h3 className="detail-section-title">Описание</h3>
                    <div className="detail-description">
                      <p>{normalizedProperty.description}</p>
                    </div>
                  </div>
                )}

                {/* Карта */}
                {normalizedProperty.coordinates && Array.isArray(normalizedProperty.coordinates) && normalizedProperty.coordinates.length === 2 && (
                  <div className="detail-section">
                    <h3 className="detail-section-title">Местоположение</h3>
                    <div className="detail-map">
                      <div className="detail-map-container">
                        <MapContainer
                          center={normalizedProperty.coordinates}
                          zoom={15}
                          style={{ height: '400px', width: '100%', borderRadius: '12px' }}
                          scrollWheelZoom={true}
                          zoomControl={true}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={normalizedProperty.coordinates} />
                        </MapContainer>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="detail-sidebar">
            <div className="auction-info">
              <div className="auction-status active glass-panel glass-panel--pill">
                Активный аукцион в процессе
              </div>
              
              <CountdownTimer endTime={normalizedProperty.endTime} />

              <div className="current-bid glass-panel">
                <div className="bid-label">Текущая ставка</div>
                <div className="bid-amount">{formatPrice(currentBid || normalizedProperty.currentBid)}</div>
              </div>

              <form onSubmit={handleBid} className="bid-form">
                <div className="bid-input-group">
                  <label>Ваша ставка</label>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => {
                      setBidAmount(e.target.value)
                      setBidError('')
                    }}
                    placeholder={`Минимум ${formatPrice(minimumBid || (normalizedProperty.currentBid + (normalizedProperty.currentBid * 0.05)))}`}
                    min={minimumBid || (normalizedProperty.currentBid + (normalizedProperty.currentBid * 0.05))}
                    step="1000"
                    disabled={isSubmittingBid}
                  />
                  {bidError && (
                    <div className="bid-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
                      {bidError}
                    </div>
                  )}
                </div>
                <button 
                  type="submit" 
                  className="btn btn-bid glass-button"
                  disabled={isSubmittingBid}
                >
                  {isSubmittingBid ? 'Отправка...' : 'Сделать ставку сейчас'}
                </button>
              </form>

              <div className="bid-warning glass-panel glass-panel--warning">
                Все ставки и продажи финальные и не подлежат отмене.
              </div>

              <button 
                type="button"
                className="btn btn-bid-history glass-button glass-button--secondary"
                onClick={() => setIsBidHistoryOpen(true)}
              >
                История ставок
              </button>

              <div className="bid-status">
                <div className="status-item">
                  <span className="status-label">Статус ставки:</span>
                  <span className="status-value">У ВАС НЕТ СТАВОК</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Статус участника:</span>
                  <span className="status-value link">Проверить сейчас &gt;</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Статус продажи:</span>
                  <span className="status-value">Чистая продажа</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно истории ставок */}
      <BiddingHistoryModal
        isOpen={isBidHistoryOpen}
        onClose={() => setIsBidHistoryOpen(false)}
        refreshTrigger={bidHistoryRefresh}
        property={{
          id: normalizedProperty.id,
          title: normalizedProperty.title,
          start_date: normalizedProperty.auction_start_date,
          end_date: normalizedProperty.auction_end_date,
          auction_starting_price: normalizedProperty.auction_starting_price,
          price: normalizedProperty.price,
          currentBid: normalizedProperty.currentBid
        }}
      />
    </div>
  )
}

export default PropertyDetail

