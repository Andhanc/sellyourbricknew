import { useState, useEffect } from 'react'
import './PropertyTimer.css'

const PropertyTimer = ({ endTime, compact = false }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const end = new Date(endTime).getTime()
      const difference = end - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        return { days, hours, minutes, seconds }
      }
      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }

    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime])

  if (compact) {
    const hasDays = timeLeft.days > 0
    const hasHours = timeLeft.hours > 0
    
    return (
      <div className="property-timer compact">
        <div className="timer-compact-time">
          <svg className="timer-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          {hasDays && (
            <>
              <span className="time-unit"><span className="time-value">{String(timeLeft.days).padStart(2, '0')}</span><span className="time-label">д</span></span>
              <span className="timer-separator">:</span>
            </>
          )}
          {hasHours && (
            <>
              <span className="time-unit"><span className="time-value">{String(timeLeft.hours).padStart(2, '0')}</span><span className="time-label">ч</span></span>
              <span className="timer-separator">:</span>
            </>
          )}
          <span className="time-unit"><span className="time-value">{String(timeLeft.minutes).padStart(2, '0')}</span><span className="time-label">м</span></span>
          <span className="timer-separator">:</span>
          <span className="time-unit"><span className="time-value">{String(timeLeft.seconds).padStart(2, '0')}</span><span className="time-label">с</span></span>
        </div>
      </div>
    )
  }

  return (
    <div className="property-timer">
      <div className="timer-compact-time">
        {String(timeLeft.days).padStart(2, '0')}д {String(timeLeft.hours).padStart(2, '0')}ч {String(timeLeft.minutes).padStart(2, '0')}м {String(timeLeft.seconds).padStart(2, '0')}с
      </div>
      <div className="timer-compact-label">До окончания аукциона</div>
    </div>
  )
}

export default PropertyTimer

