import { FiX, FiTrendingUp, FiUser } from 'react-icons/fi'
import CountdownTimer from './CountdownTimer'
import './BiddingHistoryModal.css'

const BiddingHistoryModal = ({ isOpen, onClose, property }) => {
  // Демо-данные ставок (хронологический порядок - только восходящий тренд)
  const bidsChronological = [
    { id: 10, user: 'Ольга Смирнова', amount: 750000, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { id: 9, user: 'Иван Козлов', amount: 765000, timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000) },
    { id: 8, user: 'Анна Петрова', amount: 780000, timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000) },
    { id: 7, user: 'Сергей Волков', amount: 795000, timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000) },
    { id: 6, user: 'Елена Соколова', amount: 810000, timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) },
    { id: 5, user: 'Дмитрий Лебедев', amount: 825000, timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000) },
    { id: 4, user: 'Мария Новикова', amount: 840000, timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000) },
    { id: 3, user: 'Алексей Морозов', amount: 855000, timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) },
    { id: 2, user: 'Петр Сидоров', amount: 870000, timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) },
    { id: 1, user: 'Мария Иванова', amount: 885000, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  ]
  
  // Для списка сортируем по сумме (от большей к меньшей)
  const bids = [...bidsChronological].sort((a, b) => b.amount - a.amount)

  // Дата окончания аукциона (через 3 дня от текущего момента)
  const auctionEndDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

  // Форматирование цены
  const formatPrice = (price) => {
    return `$${price.toLocaleString('ru-RU')}`
  }

  if (!isOpen) return null

  // Данные для графика
  const chartData = bidsChronological.map(bid => ({
    time: bid.timestamp,
    price: bid.amount
  }))

  // Вычисление размеров для графика
  const minPrice = Math.min(...chartData.map(d => d.price))
  const maxPrice = Math.max(...chartData.map(d => d.price))
  const priceRange = maxPrice - minPrice || 1
  // График на всю ширину
  const chartWidth = typeof window !== 'undefined' ? Math.min(800, window.innerWidth - 120) : 800
  const chartHeight = 280
  const padding = 50
  const bottomPadding = 60

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

  return (
    <div className="bidding-history-overlay" onClick={onClose}>
      <div className="bidding-history-modal" onClick={(e) => e.stopPropagation()}>
        <button 
          className="bidding-history-modal__close" 
          onClick={onClose}
          aria-label="Закрыть"
        >
          <FiX size={24} />
        </button>

        <div className="bidding-history-modal__content">
          <div className="bidding-history-modal__header">
            <h2 className="bidding-history-modal__title">История ставок</h2>
            <p className="bidding-history-modal__subtitle">{property?.title || 'Объект недвижимости'}</p>
          </div>

          {/* Таймер */}
          <div className="bidding-history-timer-wrapper">
            <CountdownTimer endTime={auctionEndDate} />
          </div>

          {/* График изменения ставок */}
          <div className="bidding-history-chart">
            <h3 className="bidding-history-chart__title">
              <FiTrendingUp size={20} />
              Изменение цены за всё время
            </h3>
            <div className="chart-container">
              <svg 
                width="100%" 
                height={chartHeight}
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                preserveAspectRatio="none"
                className="price-chart"
              >
                {/* Сетка */}
                <defs>
                  <linearGradient id={`priceGradient-${property?.id || 'default'}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#4A90E2" stopOpacity="0.25" />
                    <stop offset="50%" stopColor="#4A90E2" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                  </linearGradient>
                  <linearGradient id={`lineGradient-${property?.id || 'default'}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4A90E2" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                
                {/* Горизонтальные линии сетки */}
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const y = padding + (chartHeight - padding - bottomPadding) * (i / 5)
                  const price = maxPrice - (priceRange * i / 5)
                  return (
                    <g key={`grid-${i}`}>
                      <line
                        x1={padding}
                        y1={y}
                        x2={chartWidth - padding}
                        y2={y}
                        stroke={i === 0 ? "#333" : "#e8e8e8"}
                        strokeWidth={i === 0 ? "2" : "1"}
                        strokeDasharray={i === 0 ? "0" : "3,3"}
                      />
                      <text
                        x={padding - 12}
                        y={y + 5}
                        textAnchor="end"
                        fontSize="13"
                        fontWeight="500"
                        fill="#666"
                      >
                        {formatPrice(Math.round(price))}
                      </text>
                    </g>
                  )
                })}

                {/* Область под графиком (градиент) */}
                <path
                  d={`M ${padding},${chartHeight - bottomPadding} ${
                    chartData.map((point, index) => {
                      const x = padding + (index / (chartData.length - 1)) * (chartWidth - padding * 2)
                      const y = chartHeight - bottomPadding - ((point.price - minPrice) / priceRange) * (chartHeight - padding - bottomPadding)
                      return `${index === 0 ? 'L' : 'L'} ${x},${y}`
                    }).join(' ')
                  } L ${chartWidth - padding},${chartHeight - bottomPadding} Z`}
                  fill={`url(#priceGradient-${property?.id || 'default'})`}
                />

                {/* Линия графика */}
                <polyline
                  points={chartData.map((point, index) => {
                    const x = padding + (index / (chartData.length - 1)) * (chartWidth - padding * 2)
                    const y = chartHeight - bottomPadding - ((point.price - minPrice) / priceRange) * (chartHeight - padding - bottomPadding)
                    return `${x},${y}`
                  }).join(' ')}
                  fill="none"
                  stroke={`url(#lineGradient-${property?.id || 'default'})`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="chart-line"
                />

                {/* Точки на графике */}
                {chartData.map((point, index) => {
                  const x = padding + (index / (chartData.length - 1)) * (chartWidth - padding * 2)
                  const y = chartHeight - bottomPadding - ((point.price - minPrice) / priceRange) * (chartHeight - padding - bottomPadding)
                  const isFirst = index === 0
                  const isLast = index === chartData.length - 1
                  return (
                    <g key={index}>
                      {/* Внешняя тень точки */}
                      <circle
                        cx={x}
                        cy={y}
                        r="8"
                        fill="rgba(74, 144, 226, 0.2)"
                      />
                      {/* Точка */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isFirst || isLast ? "6" : "5"}
                        fill={isLast ? "#10b981" : "#4A90E2"}
                        stroke="#fff"
                        strokeWidth="3"
                        className="chart-point"
                      />
                      {/* Значение цены над последней точкой */}
                      {isLast && (
                        <text
                          x={x}
                          y={y - 15}
                          textAnchor="middle"
                          fontSize="13"
                          fontWeight="700"
                          fill="#10b981"
                        >
                          {formatPrice(point.price)}
                        </text>
                      )}
                    </g>
                  )
                })}

                {/* Ось X (время) */}
                <line
                  x1={padding}
                  y1={chartHeight - bottomPadding}
                  x2={chartWidth - padding}
                  y2={chartHeight - bottomPadding}
                  stroke="#333"
                  strokeWidth="2"
                />

                {/* Ось Y (цена) */}
                <line
                  x1={padding}
                  y1={padding}
                  x2={padding}
                  y2={chartHeight - bottomPadding}
                  stroke="#333"
                  strokeWidth="2"
                />

                {/* Подписи времени под осью X */}
                {chartData.filter((_, index) => index === 0 || index === Math.floor(chartData.length / 2) || index === chartData.length - 1).map((point, idx, arr) => {
                  const originalIndex = chartData.indexOf(point)
                  const x = padding + (originalIndex / (chartData.length - 1)) * (chartWidth - padding * 2)
                  return (
                    <text
                      key={originalIndex}
                      x={x}
                      y={chartHeight - bottomPadding + 25}
                      textAnchor="middle"
                      fontSize="12"
                      fill="#666"
                    >
                      {new Date(point.time).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </text>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* Список ставок */}
          <div className="bidding-history-list">
            <h3 className="bidding-history-list__title">
              <FiUser size={20} />
              Все ставки
            </h3>
            <div className="bids-list">
              {bids.map((bid, index) => (
                <div key={bid.id} className="bid-item">
                  <div className="bid-item__info">
                    <div className="bid-item__amount">{formatPrice(bid.amount)}</div>
                    <div className="bid-item__details">
                      <span className="bid-item__user">{bid.user}</span>
                      <span className="bid-item__time">{formatTime(bid.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BiddingHistoryModal
