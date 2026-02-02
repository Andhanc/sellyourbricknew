import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { properties } from '../data/properties'
import CountdownTimer from '../components/CountdownTimer'
import { FiX } from 'react-icons/fi'
import { IoLocationOutline } from 'react-icons/io5'
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
  const historyPanelRef = useRef(null)

  // Загружаем данные объявления
  useEffect(() => {
    const loadProperty = async () => {
      // Сначала проверяем, есть ли данные в location.state
      const propertyFromState = location.state?.property
      if (propertyFromState) {
        setProperty(propertyFromState)
        setIsLoading(false)
        return
      }

      // Если данных нет, загружаем с сервера
      if (id) {
        try {
          setIsLoading(true)
          const response = await fetch(`${API_BASE_URL}/properties/${id}`)
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              const prop = result.data
              
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
                  // Если видео - строка, пытаемся определить тип
                  if (typeof video === 'string') {
                    // Проверяем, является ли это YouTube URL
                    const youtubeMatch = video.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
                    if (youtubeMatch) {
                      return {
                        type: 'youtube',
                        videoId: youtubeMatch[1],
                        url: video
                      }
                    }
                    // Проверяем, является ли это Google Drive URL
                    const driveMatch = video.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
                    if (driveMatch) {
                      return {
                        type: 'googledrive',
                        videoId: driveMatch[1],
                        url: video
                      }
                    }
                    // Иначе считаем обычным URL
                    return {
                      type: 'file',
                      url: video
                    }
                  } else if (video && typeof video === 'object') {
                    // Если видео - объект, используем его как есть
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
              
              const formattedProperty = {
                id: prop.id,
                title: prop.title,
                name: prop.title,
                description: prop.description || '',
                location: prop.location || '',
                price: prop.price || 0,
                currentBid: prop.price || 0,
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
                endTime: prop.auction_end_date || null,
                seller: prop.first_name && prop.last_name 
                  ? `${prop.first_name} ${prop.last_name}` 
                  : 'Продавец',
              }
              
              setProperty(formattedProperty)
            }
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
    } else if (id && !isLoading) {
      console.error('❌ Property not found for ID:', id)
    }
  }, [id, normalizedProperty, isLoading])

  // Закрытие панели истории при клике вне её
  useEffect(() => {
    function handleClickOutside(event) {
      if (historyPanelRef.current && !historyPanelRef.current.contains(event.target)) {
        // Проверяем, что клик не по кнопке открытия
        if (!event.target.closest('.btn-bid-history')) {
          setIsBidHistoryOpen(false)
        }
      }
    }

    if (isBidHistoryOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isBidHistoryOpen])

  if (isLoading) {
    return (
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
    )
  }

  if (!normalizedProperty) {
    console.error('Property not found. ID:', id, 'Available IDs:', properties.map(p => p.id))
    return (
      <div className="property-detail">
        <div className="not-found">
          <h2>Объект не найден</h2>
          <p>ID: {id}</p>
          <Link to="/" className="btn btn-primary">Вернуться на главную</Link>
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

  const handleBid = (e) => {
    e.preventDefault()
    if (bidAmount && parseFloat(bidAmount) > normalizedProperty.currentBid) {
      alert(`Ставка ${formatPrice(parseFloat(bidAmount))} принята!`)
      setBidAmount('')
    } else {
      alert('Ставка должна быть выше текущей!')
    }
  }

  // Генерация тестовых данных истории ставок
  const generateBidHistory = () => {
    const history = []
    const now = new Date()
    const startPrice = normalizedProperty.currentBid * 0.7 // Начальная цена (70% от текущей)
    const priceStep = (normalizedProperty.currentBid - startPrice) / 10
    const countries = ['Россия', 'Германия', 'Франция', 'Великобритания', 'США', 'Канада', 'Испания', 'Италия', 'Швейцария', 'ОАЭ']
    
    for (let i = 10; i >= 1; i--) {
      const price = Math.round(startPrice + priceStep * i)
      const time = new Date(now.getTime() - i * 2 * 60 * 60 * 1000) // Каждые 2 часа назад
      history.push({
        id: i,
        amount: price,
        time: time,
        userId: `ID-${1000 + i * 100}`,
        country: countries[i % countries.length]
      })
    }
    return history.reverse() // От старых к новым
  }

  const bidHistory = normalizedProperty ? generateBidHistory() : []
  const lastFiveBids = bidHistory.slice(-5).reverse() // Последние 5, от новых к старым

  // Форматирование времени для истории
  const formatTime = (date) => {
    const now = new Date()
    const diff = now - date
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours} ч ${minutes} мин назад`
    }
    return `${minutes} мин назад`
  }

  // Получение кода страны для флага
  const getCountryCode = (country) => {
    const countryCodes = {
      'Россия': 'ru',
      'Германия': 'de',
      'Франция': 'fr',
      'Великобритания': 'gb',
      'Испания': 'es',
      'Италия': 'it',
      'Швейцария': 'ch',
      'США': 'us',
      'Канада': 'ca',
      'ОАЭ': 'ae'
    }
    return countryCodes[country] || 'xx'
  }

  // Данные для графика
  const chartData = bidHistory.map(bid => ({
    time: bid.time,
    price: bid.amount
  }))

  // Вычисление размеров для графика
  const getChartDimensions = () => {
    const minPrice = Math.min(...chartData.map(d => d.price))
    const maxPrice = Math.max(...chartData.map(d => d.price))
    const priceRange = maxPrice - minPrice || 1
    return { minPrice, maxPrice, priceRange }
  }

  const { minPrice, maxPrice, priceRange } = getChartDimensions()
  const chartWidth = 500
  const chartHeight = 200
  const padding = 40

  return (
    <div className="property-detail-page">
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
              <h1 className="detail-title">{normalizedProperty.title}</h1>
              <div className="detail-location">
                <IoLocationOutline size={18} />
                <span>{normalizedProperty.location}</span>
              </div>
              
              {/* Объединенный блок с параметрами, описанием и картой */}
              <div className="detail-info-with-map">
                <div className="detail-info-content">
                  <div className="detail-specs">
                    <div className="spec-item">
                      <span className="spec-label">Площадь:</span>
                      <span className="spec-value">{normalizedProperty.area} м²</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Комнат:</span>
                      <span className="spec-value">{normalizedProperty.rooms || 'Студия'}</span>
                    </div>
                    {normalizedProperty.floor && (
                    <div className="spec-item">
                      <span className="spec-label">Этаж:</span>
                      <span className="spec-value">{normalizedProperty.floor}</span>
                    </div>
                    )}
                    {normalizedProperty.seller && (
                    <div className="spec-item">
                      <span className="spec-label">Продавец:</span>
                      <span className="spec-value">{normalizedProperty.seller}</span>
                    </div>
                    )}
                    {normalizedProperty.sellerId && (
                    <div className="spec-item">
                      <span className="spec-label">ID:</span>
                      <span className="spec-value">{normalizedProperty.sellerId}</span>
                    </div>
                    )}
                  </div>

                  <div className="detail-description">
                    <h3>Описание</h3>
                    <p>{normalizedProperty.description}</p>
                  </div>
                </div>

                {/* Карта */}
                {normalizedProperty.coordinates && Array.isArray(normalizedProperty.coordinates) && normalizedProperty.coordinates.length === 2 && (
                  <div className="detail-map">
                    <div className="detail-map-container">
                      <MapContainer
                        center={normalizedProperty.coordinates}
                        zoom={15}
                        style={{ height: '100%', width: '100%', borderRadius: '12px' }}
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
                <div className="bid-amount">{formatPrice(normalizedProperty.currentBid)}</div>
              </div>

              <form onSubmit={handleBid} className="bid-form">
                <div className="bid-input-group">
                  <label>Ваша ставка</label>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Минимум ${formatPrice(normalizedProperty.currentBid + (normalizedProperty.currentBid * 0.05))}`}
                    min={normalizedProperty.currentBid + (normalizedProperty.currentBid * 0.05)}
                    step="1000"
                  />
                </div>
                <button type="submit" className="btn btn-bid glass-button">
                  Сделать ставку сейчас
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

      {/* Панель истории ставок */}
      {isBidHistoryOpen && (
        <>
          <div 
            className="bid-history-backdrop"
            onClick={() => setIsBidHistoryOpen(false)}
          />
          <div className="bid-history-panel" ref={historyPanelRef}>
            <div className="bid-history-header">
              <h2>История ставок</h2>
              <button 
                type="button"
                className="bid-history-close"
                onClick={() => setIsBidHistoryOpen(false)}
                aria-label="Закрыть"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="bid-history-content">
              {/* Последние 5 ставок */}
              <div className="bid-history-list">
                <h3>Последние ставки</h3>
                <div className="bid-history-items">
                  {lastFiveBids.map((bid) => (
                    <div key={bid.id} className="bid-history-item">
                      <div className="bid-history-item-info">
                        <div className="bid-history-item-amount">{formatPrice(bid.amount)}</div>
                        <div className="bid-history-item-details">
                          <span className="bid-history-item-bidder">
                            {bid.userId} • {bid.country}
                            <img 
                              src={`https://flagcdn.com/w20/${getCountryCode(bid.country)}.png`}
                              alt={bid.country}
                              className="bid-history-item-flag"
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                          </span>
                          <span className="bid-history-item-time">{formatTime(bid.time)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* График изменения цены */}
              <div className="bid-history-chart">
                <h3>Изменение цены за всё время</h3>
                <div className="chart-container">
                  <svg 
                    width={chartWidth} 
                    height={chartHeight}
                    className="price-chart"
                  >
                    {/* Сетка */}
                    <defs>
                      <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#0ABAB5" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#0ABAB5" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    
                    {/* Горизонтальные линии сетки */}
                    {[0, 1, 2, 3, 4].map((i) => {
                      const y = padding + (chartHeight - padding * 2) * (i / 4)
                      const price = maxPrice - (priceRange * i / 4)
                      return (
                        <g key={`grid-${i}`}>
                          <line
                            x1={padding}
                            y1={y}
                            x2={chartWidth - padding}
                            y2={y}
                            stroke="#e0e0e0"
                            strokeWidth="1"
                            strokeDasharray="4,4"
                          />
                          <text
                            x={padding - 10}
                            y={y + 4}
                            textAnchor="end"
                            fontSize="12"
                            fill="#666"
                          >
                            {formatPrice(price)}
                          </text>
                        </g>
                      )
                    })}

                    {/* Область под графиком (градиент) */}
                    <path
                      d={`M ${padding},${chartHeight - padding} ${
                        chartData.map((point, index) => {
                          const x = padding + (index / (chartData.length - 1)) * (chartWidth - padding * 2)
                          const y = chartHeight - padding - ((point.price - minPrice) / priceRange) * (chartHeight - padding * 2)
                          return `${index === 0 ? 'L' : 'L'} ${x},${y}`
                        }).join(' ')
                      } L ${chartWidth - padding},${chartHeight - padding} Z`}
                      fill="url(#priceGradient)"
                    />

                    {/* Линия графика */}
                    <polyline
                      points={chartData.map((point, index) => {
                        const x = padding + (index / (chartData.length - 1)) * (chartWidth - padding * 2)
                        const y = chartHeight - padding - ((point.price - minPrice) / priceRange) * (chartHeight - padding * 2)
                        return `${x},${y}`
                      }).join(' ')}
                      fill="none"
                      stroke="#0ABAB5"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Точки на графике */}
                    {chartData.map((point, index) => {
                      const x = padding + (index / (chartData.length - 1)) * (chartWidth - padding * 2)
                      const y = chartHeight - padding - ((point.price - minPrice) / priceRange) * (chartHeight - padding * 2)
                      return (
                        <circle
                          key={index}
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#0ABAB5"
                          stroke="#fff"
                          strokeWidth="2"
                        />
                      )
                    })}

                    {/* Ось X (время) */}
                    <line
                      x1={padding}
                      y1={chartHeight - padding}
                      x2={chartWidth - padding}
                      y2={chartHeight - padding}
                      stroke="#333"
                      strokeWidth="2"
                    />

                    {/* Ось Y (цена) */}
                    <line
                      x1={padding}
                      y1={padding}
                      x2={padding}
                      y2={chartHeight - padding}
                      stroke="#333"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default PropertyDetail

