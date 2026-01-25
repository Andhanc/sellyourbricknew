import { useState, useEffect } from 'react'
import './AuctionPeriodPicker.css'

const AuctionPeriodPicker = ({ startDate, endDate, onStartDateChange, onEndDateChange, label }) => {
  const [months, setMonths] = useState(3)
  const [days, setDays] = useState(15)
  const [startDateValue, setStartDateValue] = useState(startDate || '')

  const MIN_MONTHS = 3
  const MIN_DAYS = 15 // 3.5 месяца = 3 месяца + 15 дней

  useEffect(() => {
    if (startDate) {
      setStartDateValue(startDate)
    } else if (!startDateValue) {
      // Устанавливаем сегодняшнюю дату по умолчанию только если нет значения
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]
      setStartDateValue(todayStr)
      onStartDateChange(todayStr)
    }
  }, [startDate])

  useEffect(() => {
    if (startDateValue) {
      calculateEndDate()
    }
  }, [months, days, startDateValue])

  const calculateEndDate = () => {
    if (!startDateValue) return

    const start = new Date(startDateValue)
    const end = new Date(start)
    
    // Добавляем месяцы
    end.setMonth(end.getMonth() + months)
    // Добавляем дни
    end.setDate(end.getDate() + days)
    
    const endDateStr = end.toISOString().split('T')[0]
    onEndDateChange(endDateStr)
  }

  const handleStartDateChange = (e) => {
    const date = e.target.value
    setStartDateValue(date)
    onStartDateChange(date)
    if (date) {
      calculateEndDate()
    }
  }

  const handleMonthsChange = (value) => {
    let newMonths = value
    if (newMonths < MIN_MONTHS) {
      newMonths = MIN_MONTHS
      setDays(MIN_DAYS)
    } else if (newMonths === MIN_MONTHS && days < MIN_DAYS) {
      setDays(MIN_DAYS)
    }
    setMonths(newMonths)
  }

  const handleDaysChange = (value) => {
    let newDays = value
    if (months === MIN_MONTHS && newDays < MIN_DAYS) {
      newDays = MIN_DAYS
    }
    setDays(newDays)
  }

  const handleMonthsIncrement = () => {
    handleMonthsChange(months + 1)
  }

  const handleMonthsDecrement = () => {
    if (months > MIN_MONTHS) {
      handleMonthsChange(months - 1)
    } else if (months === MIN_MONTHS && days > MIN_DAYS) {
      setDays(days - 1)
    }
  }

  const handleDaysIncrement = () => {
    handleDaysChange(days + 1)
  }

  const handleDaysDecrement = () => {
    if (months > MIN_MONTHS) {
      handleDaysChange(days - 1)
    } else if (months === MIN_MONTHS && days > MIN_DAYS) {
      handleDaysChange(days - 1)
    }
  }

  const getTotalDays = () => {
    // Приблизительный расчет: месяцы * 30 + дни
    return months * 30 + days
  }

  const getEndDateDisplay = () => {
    if (!startDateValue) return 'Не указана'
    const start = new Date(startDateValue)
    const end = new Date(start)
    end.setMonth(end.getMonth() + months)
    end.setDate(end.getDate() + days)
    return end.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div className="auction-period-picker">
      {label && <label className="auction-period-label">{label}</label>}
      
      <div className="auction-period-content">
        <div className="auction-period-start-date">
          <label className="auction-period-field-label">Дата начала аукциона</label>
          <input
            type="date"
            value={startDateValue}
            onChange={handleStartDateChange}
            className="auction-period-date-input"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="auction-period-duration">
          <label className="auction-period-field-label">Продолжительность</label>
          <div className="auction-period-duration-controls">
            <div className="auction-period-control-group">
              <label className="auction-period-control-label">Месяцы</label>
              <div className="auction-period-number-input">
                <button
                  type="button"
                  className="auction-period-btn auction-period-btn--decrement"
                  onClick={handleMonthsDecrement}
                  disabled={months === MIN_MONTHS && days === MIN_DAYS}
                >
                  −
                </button>
                <input
                  type="number"
                  value={months}
                  onChange={(e) => handleMonthsChange(parseInt(e.target.value) || MIN_MONTHS)}
                  min={MIN_MONTHS}
                  className="auction-period-number-value"
                />
                <button
                  type="button"
                  className="auction-period-btn auction-period-btn--increment"
                  onClick={handleMonthsIncrement}
                >
                  +
                </button>
              </div>
            </div>

            <div className="auction-period-control-group">
              <label className="auction-period-control-label">Дни</label>
              <div className="auction-period-number-input">
                <button
                  type="button"
                  className="auction-period-btn auction-period-btn--decrement"
                  onClick={handleDaysDecrement}
                  disabled={months === MIN_MONTHS && days === MIN_DAYS}
                >
                  −
                </button>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => handleDaysChange(parseInt(e.target.value) || 0)}
                  min={months === MIN_MONTHS ? MIN_DAYS : 0}
                  className="auction-period-number-value"
                />
                <button
                  type="button"
                  className="auction-period-btn auction-period-btn--increment"
                  onClick={handleDaysIncrement}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="auction-period-end-date">
          <label className="auction-period-field-label">Дата окончания аукциона</label>
          <div className="auction-period-end-date-display">
            {getEndDateDisplay()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuctionPeriodPicker
