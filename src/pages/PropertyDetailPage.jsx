import { useState } from 'react'
import {
  FiArrowLeft,
  FiShare2,
  FiHeart,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi'
import {
  FaHeart as FaHeartSolid,
} from 'react-icons/fa'
import { IoLocationOutline } from 'react-icons/io5'
import { MdBed, MdOutlineBathtub } from 'react-icons/md'
import { BiArea } from 'react-icons/bi'
import '../App.css'
import './PropertyDetailPage.css'

// Компонент календаря
function Calendar({ currentMonth, setCurrentMonth, selectedDates, setSelectedDates, onClose }) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Пустые ячейки для дней предыдущего месяца
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Дни текущего месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const handleDateClick = (date) => {
    if (!date) return

    if (!selectedDates.start || (selectedDates.start && selectedDates.end)) {
      // Начинаем новый выбор
      setSelectedDates({ start: date, end: null })
    } else if (selectedDates.start && !selectedDates.end) {
      // Завершаем выбор
      if (date < selectedDates.start) {
        // Если выбранная дата раньше начальной, меняем их местами
        setSelectedDates({ start: date, end: selectedDates.start })
      } else {
        setSelectedDates({ start: selectedDates.start, end: date })
      }
    }
  }

  const isDateInRange = (date) => {
    if (!date || !selectedDates.start) return false
    if (!selectedDates.end) return false
    return date >= selectedDates.start && date <= selectedDates.end
  }

  const isDateSelected = (date) => {
    if (!date) return false
    if (!selectedDates.start) return false
    if (date.getTime() === selectedDates.start.getTime()) return true
    if (selectedDates.end && date.getTime() === selectedDates.end.getTime()) return true
    return false
  }

  const isDateDisabled = (date) => {
    if (!date) return true
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const days = getDaysInMonth(currentMonth)

  return (
    <div className="calendar">
      <div className="calendar__header">
        <button
          type="button"
          className="calendar__nav-btn"
          onClick={goToPreviousMonth}
          aria-label="Previous month"
        >
          <FiChevronLeft size={20} />
        </button>
        <h3 className="calendar__month-year">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          type="button"
          className="calendar__nav-btn"
          onClick={goToNextMonth}
          aria-label="Next month"
        >
          <FiChevronRight size={20} />
        </button>
      </div>

      <div className="calendar__days-header">
        {dayNames.map((day) => (
          <div key={day} className="calendar__day-name">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar__days-grid">
        {days.map((date, index) => {
          const isSelected = isDateSelected(date)
          const inRange = isDateInRange(date)
          const isDisabled = isDateDisabled(date)
          const isStart = date && selectedDates.start && date.getTime() === selectedDates.start.getTime()
          const isEnd = date && selectedDates.end && date.getTime() === selectedDates.end.getTime()

          return (
            <button
              key={index}
              type="button"
              className={`calendar__day ${
                !date ? 'calendar__day--empty' : ''
              } ${
                isSelected ? 'calendar__day--selected' : ''
              } ${
                inRange ? 'calendar__day--in-range' : ''
              } ${
                isDisabled ? 'calendar__day--disabled' : ''
              } ${
                isStart ? 'calendar__day--start' : ''
              } ${
                isEnd ? 'calendar__day--end' : ''
              }`}
              onClick={() => handleDateClick(date)}
              disabled={isDisabled || !date}
            >
              {date ? date.getDate() : ''}
            </button>
          )
        })}
      </div>

      <div className="calendar__footer">
        <button
          type="button"
          className="calendar__close-btn"
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </div>
  )
}

function PropertyDetailPage({
  property,
  isFavorite,
  onBack,
  onToggleFavorite,
  onShare,
  onBookNow,
  onCallBroker,
  onChatBroker,
  navigationItems,
  activeNav,
  onNavChange,
}) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [selectedDates, setSelectedDates] = useState({ start: null, end: null })
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Показываем 4 миниатюры: 3 обычных + 1 с overlay "+10+"
  const visibleImages = property.images?.slice(0, 3) || []
  const totalImages = property.images?.length || 0
  const remainingImages = totalImages > 3 ? totalImages - 3 : 0

  const formatDate = (date) => {
    if (!date) return ''
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  return (
    <div className="app property-detail-page">
      {/* Header с кнопками поверх изображения */}
      <div className="property-detail__header-overlay">
        <button
          type="button"
          className="property-detail__header-btn"
          onClick={onBack}
          aria-label="Назад"
        >
          <FiArrowLeft size={20} />
        </button>
        <div className="property-detail__header-actions">
          <button
            type="button"
            className="property-detail__header-btn"
            onClick={onShare}
            aria-label="Поделиться"
          >
            <FiShare2 size={20} />
          </button>
          <button
            type="button"
            className={`property-detail__header-btn ${
              isFavorite ? 'property-detail__header-btn--active' : ''
            }`}
            onClick={onToggleFavorite}
            aria-label="Добавить в избранное"
          >
            {isFavorite ? <FaHeartSolid size={20} /> : <FiHeart size={20} />}
          </button>
        </div>
      </div>

      {/* Главное изображение */}
      <div className="property-detail__hero">
        <img
          src={property.image}
          alt={property.name}
          className="property-detail__hero-image"
        />
      </div>

      {/* Миниатюры изображений - между главной картинкой и белой частью */}
      <div className="property-detail__thumbnails-wrapper">
        <div className="property-detail__thumbnails">
          {visibleImages.map((img, index) => (
            <div key={index} className="property-detail__thumbnail">
              <img src={img} alt={`${property.name} ${index + 1}`} />
            </div>
          ))}
          {remainingImages > 0 && visibleImages.length > 0 && (
            <div className="property-detail__thumbnail property-detail__thumbnail--overlay">
              <div className="property-detail__thumbnail-overlay">
                <span className="property-detail__thumbnail-count">
                  +{remainingImages}
                </span>
                <img
                  src={property.images?.[3] || property.image}
                  alt={`${property.name} еще ${remainingImages} фото`}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Контент карточки */}
      <div className="property-detail__content">

        {/* Название и цена */}
        <div className="property-detail__title-section">
          <span className="property-detail__badge">{property.tag}</span>
          <div className="property-detail__title-row">
            <h1 className="property-detail__title">{property.name}</h1>
            <div className="property-detail__price">
              <span className="property-detail__price-amount">
                ${property.price}
              </span>
              <span className="property-detail__price-period">/Month</span>
            </div>
          </div>
        </div>

        {/* Адрес */}
        <div className="property-detail__location">
          <IoLocationOutline
            size={18}
            className="property-detail__location-icon"
          />
          <span className="property-detail__location-text">
            {property.location}
          </span>
        </div>

        {/* Характеристики */}
        <div className="property-detail__features">
          <div className="property-detail__feature">
            <MdBed size={22} />
            <span>{property.beds} Bed</span>
          </div>
          <div className="property-detail__feature">
            <MdOutlineBathtub size={22} />
            <span>{property.baths} Bath</span>
          </div>
          <div className="property-detail__feature">
            <BiArea size={22} />
            <span>{property.sqft?.toLocaleString()} Sqft</span>
          </div>
        </div>

        {/* Описание */}
        <div className="property-detail__description">
          <h2 className="property-detail__description-title">Description</h2>
          <p
            className={`property-detail__description-text ${
              descriptionExpanded
                ? 'property-detail__description-text--expanded'
                : ''
            }`}
          >
            {property.description}
          </p>
          {property.description?.length > 150 && (
            <button
              type="button"
              className="property-detail__description-toggle"
              onClick={() => setDescriptionExpanded(!descriptionExpanded)}
            >
              {descriptionExpanded ? 'Read Less' : 'Read More...'}
            </button>
          )}
        </div>

        {/* Календарь */}
        <div className="property-detail__calendar">
          <h2 className="property-detail__calendar-title">Select Dates</h2>
          <button
            type="button"
            className="property-detail__calendar-trigger"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          >
            <FiCalendar size={20} />
            <span className="property-detail__calendar-dates">
              {selectedDates.start && selectedDates.end
                ? `${formatDate(selectedDates.start)} - ${formatDate(selectedDates.end)}`
                : selectedDates.start
                ? `${formatDate(selectedDates.start)} - Select end date`
                : 'Select check-in and check-out dates'}
            </span>
            <FiChevronRight 
              size={20} 
              className={`property-detail__calendar-arrow ${isCalendarOpen ? 'property-detail__calendar-arrow--open' : ''}`}
            />
          </button>

          {isCalendarOpen && (
            <>
              <div 
                className="property-detail__calendar-overlay"
                onClick={() => setIsCalendarOpen(false)}
              />
              <div className="property-detail__calendar-popup">
                <Calendar
                  currentMonth={currentMonth}
                  setCurrentMonth={setCurrentMonth}
                  selectedDates={selectedDates}
                  setSelectedDates={setSelectedDates}
                  onClose={() => setIsCalendarOpen(false)}
                />
              </div>
            </>
          )}
        </div>

        {/* Кнопка Book Now */}
        <button
          type="button"
          className="property-detail__book-btn"
          onClick={onBookNow}
        >
          Book Now
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {navigationItems.map((item) => {
          const IconComponent = item.icon
          const isActive = activeNav === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`bottom-nav__item ${
                isActive ? 'bottom-nav__item--active' : ''
              }`}
              onClick={() => onNavChange(item.id)}
              aria-label={item.label}
              aria-pressed={isActive}
            >
              <IconComponent />
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default PropertyDetailPage

