import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { properties } from '../data/properties'
import CountdownTimer from '../components/CountdownTimer'
import { FiX } from 'react-icons/fi'
import './PropertyDetail.css'

const PropertyDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [bidAmount, setBidAmount] = useState('')
  const [isBidHistoryOpen, setIsBidHistoryOpen] = useState(false)
  const historyPanelRef = useRef(null)

  // Ищем объект по ID
  const property = properties.find(p => {
    // Пробуем разные варианты сравнения
    const propertyId = p.id
    const paramId = parseInt(id, 10)
    const isMatch = propertyId === paramId || propertyId.toString() === id || propertyId === Number(id)
    
    if (!isMatch && id) {
      console.log('Checking property:', propertyId, 'against param:', id, 'parsed:', paramId, 'match:', isMatch)
    }
    
    return isMatch
  })

  useEffect(() => {
    // Небольшая задержка для имитации загрузки
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [id])
  
  // Логируем для отладки
  useEffect(() => {
    if (property) {
      console.log('Property found:', property.id, property.title)
    } else if (id) {
      console.error('Property not found for ID:', id, 'Type:', typeof id)
      console.log('Available properties:', properties.map(p => ({ id: p.id, title: p.title })))
    }
  }, [id, property])

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

  if (!property) {
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
      return `${(price / 1000000).toFixed(1)} млн Р`
    }
    return `${price.toLocaleString('ru-RU')} Р`
  }

  const handleBid = (e) => {
    e.preventDefault()
    if (bidAmount && parseFloat(bidAmount) > property.currentBid) {
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
    const startPrice = property.currentBid * 0.7 // Начальная цена (70% от текущей)
    const priceStep = (property.currentBid - startPrice) / 10
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

  const bidHistory = property ? generateBidHistory() : []
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
            <span>{property.title}</span>
          </div>
        </div>

        <div className="detail-content">
          <div className="detail-left">
            <div className="detail-images">
              <div className="main-image">
                <img 
                  src={property.images[selectedImage]} 
                  alt={property.title}
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
                    onClick={() => setSelectedImage(Math.min(property.images.length - 1, selectedImage + 1))}
                    disabled={selectedImage === property.images.length - 1}
                  >
                    →
                  </button>
                </div>
              </div>
              <div className="image-thumbnails">
                {property.images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`${property.title} ${index + 1}`}
                    className={selectedImage === index ? 'active' : ''}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </div>
            </div>

            <div className="detail-main">
              <h1 className="detail-title">{property.title}</h1>
              <p className="detail-location">{property.location}</p>
              
              <div className="detail-specs">
                <div className="spec-item">
                  <span className="spec-label">Площадь:</span>
                  <span className="spec-value">{property.area} м²</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Комнат:</span>
                  <span className="spec-value">{property.rooms || 'Студия'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Этаж:</span>
                  <span className="spec-value">{property.floor}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Продавец:</span>
                  <span className="spec-value">{property.seller}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">ID:</span>
                  <span className="spec-value">{property.sellerId}</span>
                </div>
              </div>

              <div className="detail-description">
                <h3>Описание</h3>
                <p>{property.description}</p>
              </div>
            </div>
          </div>

          <div className="detail-sidebar">
            <div className="auction-info">
              <div className="auction-status active">
                Активный аукцион в процессе
              </div>
              
              <CountdownTimer endTime={property.endTime} />

              <div className="current-bid">
                <div className="bid-label">Текущая ставка</div>
                <div className="bid-amount">{formatPrice(property.currentBid)}</div>
              </div>

              <form onSubmit={handleBid} className="bid-form">
                <div className="bid-input-group">
                  <label>Ваша ставка</label>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Минимум ${formatPrice(property.currentBid + (property.currentBid * 0.05))}`}
                    min={property.currentBid + (property.currentBid * 0.05)}
                    step="1000"
                  />
                </div>
                <button type="submit" className="btn btn-bid">
                  Сделать ставку сейчас
                </button>
              </form>

              <div className="bid-warning">
                Все ставки и продажи финальные и не подлежат отмене.
              </div>

              <button 
                type="button"
                className="btn btn-bid-history"
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
                        <stop offset="0%" stopColor="#4A90E2" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#4A90E2" stopOpacity="0.05" />
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
                      stroke="#4A90E2"
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
                          fill="#4A90E2"
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

