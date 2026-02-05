import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { FaArrowLeft, FaArrowUp, FaArrowDown, FaLock, FaWifi, FaPlus, FaBuilding, FaMoneyBillWave } from 'react-icons/fa'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import './Wallet.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Демо данные для транзакций
const generateDemoTransactions = () => {
  const names = [
    { name: 'Henry James', initials: 'HJ', time: '10:30 AM', amount: 450.00, type: 'Пополнение' },
    { name: 'Chris Michael', initials: 'CM', time: '10:00 AM', amount: 250.00, type: 'Пополнение' },
    { name: 'Sarah Johnson', initials: 'SJ', time: '09:45 AM', amount: -1200.00, type: 'Вывод' },
    { name: 'Michael Brown', initials: 'MB', time: '09:20 AM', amount: 750.00, type: 'Пополнение' },
    { name: 'Emma Wilson', initials: 'EW', time: '08:55 AM', amount: -350.00, type: 'Вывод' },
    { name: 'David Lee', initials: 'DL', time: '08:30 AM', amount: 1500.00, type: 'Пополнение' },
  ]
  return names
}

// Данные для графиков по периодам
const getChartDataByPeriod = (period) => {
  const data = {
    Daily: {
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
      values: [5000, 8000, 12000, 18000, 15000, 10000, 7000]
    },
    Weekly: {
      labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
      values: [12000, 15000, 18000, 22000, 25000, 20000, 15000]
    },
    Monthly: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      values: [12000, 15000, 28000, 14000, 16000, 15000]
    }
  }
  return data[period] || data.Monthly
}

// Данные карт
const cardsData = [
  {
    id: 1,
    type: 'VISA',
    number: '4532 1234 5678 5466',
    cvv: '123',
    balance: 786898.67,
    color: 'linear-gradient(135deg, #0ABAB5 0%, #089a95 50%, #0ABAB5 100%)'
  },
  {
    id: 2,
    type: 'MASTERCARD',
    number: '5555 4321 9876 3210',
    cvv: '456',
    balance: 245000.00,
    color: 'linear-gradient(135deg, #EB001B 0%, #F79E1B 50%, #EB001B 100%)'
  }
]

const Wallet = () => {
  const navigate = useNavigate()
  const [selectedPeriod, setSelectedPeriod] = useState('M')
  const [selectedTab, setSelectedTab] = useState('Monthly')
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [isCardFlipped, setIsCardFlipped] = useState(false)
  const [activeAction, setActiveAction] = useState(null)
  const [isCardDataVisible, setIsCardDataVisible] = useState(false)

  // Демо данные
  const activeCard = cardsData[activeCardIndex]
  const balance = activeCard.balance
  const totalWithdrawal = 60500
  const totalDeposit = 20500
  const transactions = generateDemoTransactions()

  // Данные для графика
  const chartDataConfig = useMemo(() => {
    const periodData = getChartDataByPeriod(selectedTab)
    return {
      labels: periodData.labels,
      datasets: [
        {
          label: 'Расходы',
          data: periodData.values,
          borderColor: '#0ABAB5',
          backgroundColor: (context) => {
            const ctx = context.chart.ctx
            const gradient = ctx.createLinearGradient(0, 0, 0, 400)
            gradient.addColorStop(0, 'rgba(10, 186, 181, 0.3)')
            gradient.addColorStop(1, 'rgba(10, 186, 181, 0.05)')
            return gradient
          },
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 8,
          pointBackgroundColor: '#0ABAB5',
          pointBorderColor: '#fff',
          pointBorderWidth: 3,
          pointHoverBorderWidth: 4
        }
      ]
    }
  }, [selectedTab])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: 16,
        titleFont: { size: 14, weight: 'bold', family: 'inherit' },
        bodyFont: { size: 16, weight: '600', family: 'inherit' },
        displayColors: false,
        borderColor: '#0ABAB5',
        borderWidth: 2,
        cornerRadius: 12,
        callbacks: {
          label: function(context) {
            return `$${context.parsed.y.toLocaleString()}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: { size: 12, weight: '500' }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: { size: 12, weight: '500' },
          callback: function(value) {
            return `$${value / 1000}K`
          }
        }
      }
    }
  }

  const formatAmount = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getMaskedCardNumber = () => {
    if (isCardDataVisible) {
      return activeCard.number
    }
    const last4 = activeCard.number.slice(-4)
    return `**** **** **** ${last4}`
  }

  const getCardNumberForDisplay = () => {
    const number = getMaskedCardNumber()
    // Форматируем с пробелами каждые 4 цифры
    return number.replace(/(.{4})/g, '$1 ').trim()
  }

  const handleCardLockClick = (e) => {
    e.stopPropagation()
    setIsCardDataVisible(!isCardDataVisible)
  }

  return (
    <div className="wallet-page">
      <div className="wallet-background">
        <div className="wallet-background__gradient"></div>
        <div className="wallet-background__pattern"></div>
      </div>

      <div className="wallet-container">
        {/* Заголовок */}
        <div className="wallet-header">
          <button onClick={() => navigate(-1)} className="wallet-back-button">
            <FaArrowLeft />
            <span>Назад</span>
          </button>
          <h1 className="wallet-title">Мой кошелёк</h1>
        </div>

        {/* Банковская карта */}
        <div className="wallet-card-section">
          <div className="wallet-card-header">
            <h2 className="wallet-card-title">Мои карты</h2>
            <button className="wallet-add-card-btn">
              <FaPlus />
              <span>Добавить карту</span>
            </button>
          </div>
          
          {/* Карусель карт */}
          <div className="wallet-cards-carousel">
            <div className="wallet-cards-wrapper" style={{ transform: `translateX(-${activeCardIndex * 100}%)` }}>
              {cardsData.map((card, index) => (
                <div 
                  key={card.id}
                  className={`bank-card ${isCardFlipped && activeCardIndex === index ? 'flipped' : ''}`}
                  onClick={() => {
                    if (activeCardIndex === index) {
                      setIsCardFlipped(!isCardFlipped)
                    } else {
                      setActiveCardIndex(index)
                      setIsCardFlipped(false)
                      setIsCardDataVisible(false)
                    }
                  }}
                  style={{ '--card-color': card.color }}
                >
                  <div className="bank-card__front">
                    <div className="bank-card__background" style={{ background: card.color }}>
                      <div className="bank-card__pattern"></div>
                      <div className="bank-card__shine"></div>
                    </div>
                    <div className="bank-card__content">
                      <div className="bank-card__top">
                        <div className={`bank-card__logo ${card.type === 'MASTERCARD' ? 'mastercard' : ''}`}>
                          {card.type === 'MASTERCARD' ? (
                            <div className="mastercard-logo">
                              <div className="mastercard-circle mastercard-circle--red"></div>
                              <div className="mastercard-circle mastercard-circle--yellow"></div>
                            </div>
                          ) : (
                            'VISA'
                          )}
                        </div>
                        <div 
                          className="bank-card__security"
                          onClick={handleCardLockClick}
                        >
                          <FaLock className={`bank-card__lock-icon ${isCardDataVisible ? 'unlocked' : ''}`} />
                        </div>
                      </div>
                      
                      <div className="bank-card__middle">
                        <div className="bank-card__chip">
                          <div className="chip"></div>
                        </div>
                        <div className="bank-card__contactless">
                          <FaWifi className="contactless-icon" />
                        </div>
                      </div>
                      
                      <div className="bank-card__number">
                        <span className="bank-card__number-text">
                          {activeCardIndex === index ? getCardNumberForDisplay() : `**** **** **** ${card.number.slice(-4)}`}
                        </span>
                        {activeCardIndex === index && (
                          <FaLock 
                            className={`bank-card__number-lock ${isCardDataVisible ? 'unlocked' : ''}`}
                            onClick={handleCardLockClick}
                          />
                        )}
                      </div>
                      
                      <div className="bank-card__bottom">
                        <div className="bank-card__balance-label">Баланс</div>
                        <div className="bank-card__balance-amount">{formatAmount(card.balance)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="bank-card__back">
                    <div className="bank-card__back-content">
                      <div className="bank-card__magnetic-stripe"></div>
                      <div className="bank-card__cvv">
                        <div className="cvv-label">CVV</div>
                        <div className={`cvv-value ${activeCardIndex === index && isCardDataVisible ? 'visible' : ''}`}>
                          {activeCardIndex === index && isCardDataVisible ? card.cvv : '***'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Точки для переключения карт */}
            <div className="wallet-cards-dots">
              {cardsData.map((card, index) => (
                <button
                  key={card.id}
                  className={`wallet-card-dot ${activeCardIndex === index ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCardIndex(index)
                    setIsCardFlipped(false)
                    setIsCardDataVisible(false)
                  }}
                  aria-label={`Карта ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="wallet-actions">
          <button 
            className={`wallet-action-btn ${activeAction === 'deposit' ? 'active' : ''}`}
            onClick={() => setActiveAction(activeAction === 'deposit' ? null : 'deposit')}
          >
            <div className="wallet-action-icon-wrapper">
              <FaArrowUp className="wallet-action-icon" />
            </div>
            <span>Пополнить</span>
          </button>
          <button 
            className={`wallet-action-btn ${activeAction === 'withdraw' ? 'active' : ''}`}
            onClick={() => setActiveAction(activeAction === 'withdraw' ? null : 'withdraw')}
          >
            <div className="wallet-action-icon-wrapper">
              <FaArrowDown className="wallet-action-icon" />
            </div>
            <span>Вывести</span>
          </button>
          <button 
            className={`wallet-action-btn ${activeAction === 'loan' ? 'active' : ''}`}
            onClick={() => setActiveAction(activeAction === 'loan' ? null : 'loan')}
          >
            <div className="wallet-action-icon-wrapper">
              <FaBuilding className="wallet-action-icon" />
            </div>
            <span>Кредит</span>
          </button>
          <button 
            className={`wallet-action-btn ${activeAction === 'remit' ? 'active' : ''}`}
            onClick={() => setActiveAction(activeAction === 'remit' ? null : 'remit')}
          >
            <div className="wallet-action-icon-wrapper">
              <FaMoneyBillWave className="wallet-action-icon" />
            </div>
            <span>Перевод</span>
          </button>
        </div>

        {/* Аналитика */}
        <div className="wallet-analytics">
          <div className="wallet-analytics-header">
            <h2 className="wallet-analytics-title">Аналитика</h2>
            
            {/* Табы периода */}
            <div className="wallet-period-tabs">
              <button 
                className={`wallet-period-tab ${selectedTab === 'Daily' ? 'active' : ''}`}
                onClick={() => setSelectedTab('Daily')}
              >
                День
              </button>
              <button 
                className={`wallet-period-tab ${selectedTab === 'Weekly' ? 'active' : ''}`}
                onClick={() => setSelectedTab('Weekly')}
              >
                Неделя
              </button>
              <button 
                className={`wallet-period-tab ${selectedTab === 'Monthly' ? 'active' : ''}`}
                onClick={() => setSelectedTab('Monthly')}
              >
                Месяц
              </button>
            </div>
          </div>

          {/* Общая сумма */}
          <div className="wallet-total">
            <div className="wallet-total-content">
              <div className="wallet-total-label">Всего</div>
              <div className="wallet-total-amount">{formatAmount(balance)}</div>
            </div>
            <div className="wallet-total-trend">
              <FaArrowUp className="trend-icon" />
              <span className="trend-text">+12.5%</span>
            </div>
          </div>

          {/* Периоды */}
          <div className="wallet-period-buttons">
            <button 
              className={`wallet-period-btn ${selectedPeriod === 'D' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('D')}
            >
              Д
            </button>
            <button 
              className={`wallet-period-btn ${selectedPeriod === 'W' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('W')}
            >
              Н
            </button>
            <button 
              className={`wallet-period-btn ${selectedPeriod === 'M' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('M')}
            >
              М
            </button>
            <button 
              className={`wallet-period-btn ${selectedPeriod === 'Y' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('Y')}
            >
              Г
            </button>
          </div>

          {/* График */}
          <div className="wallet-chart-container">
            <div className="wallet-chart">
              <Line data={chartDataConfig} options={chartOptions} />
            </div>
          </div>

          {/* Статистика */}
          <div className="wallet-stats">
            <div className="wallet-stat-card">
              <div className="wallet-stat-header">
                <div className="wallet-stat-label">Всего выведено</div>
                <div className="wallet-stat-icon">
                  <FaArrowDown />
                </div>
              </div>
              <div className="wallet-stat-amount">{formatAmount(totalWithdrawal)}</div>
              <div className="wallet-stat-change negative">-5.2% за месяц</div>
            </div>
            <div className="wallet-stat-card">
              <div className="wallet-stat-header">
                <div className="wallet-stat-label">Всего пополнено</div>
                <div className="wallet-stat-icon">
                  <FaArrowUp />
                </div>
              </div>
              <div className="wallet-stat-amount">{formatAmount(totalDeposit)}</div>
              <div className="wallet-stat-change positive">+18.3% за месяц</div>
            </div>
          </div>

          {/* Последние транзакции */}
          <div className="wallet-transactions">
            <div className="wallet-transactions-header">
              <h3 className="wallet-transactions-title">Транзакции</h3>
              <button className="wallet-view-all">Показать все →</button>
            </div>
            
            <div className="wallet-transactions-list">
              {transactions.map((transaction, index) => (
                <div key={index} className="wallet-transaction-item">
                  <div className="wallet-transaction-avatar">
                    <div className="avatar-placeholder">{transaction.initials}</div>
                  </div>
                  <div className="wallet-transaction-info">
                    <div className="wallet-transaction-name">{transaction.name}</div>
                    <div className="wallet-transaction-time">{transaction.time}</div>
                  </div>
                  <div className="wallet-transaction-right">
                    <div className={`wallet-transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}`}>
                      {transaction.amount > 0 ? '+' : ''}{formatAmount(Math.abs(transaction.amount))}
                    </div>
                    <div className="wallet-transaction-type">{transaction.type}</div>
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

export default Wallet
