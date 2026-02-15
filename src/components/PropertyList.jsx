import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { MdBed, MdOutlineBathtub, MdDirectionsCar } from 'react-icons/md'
import { BiArea } from 'react-icons/bi'
import { FiLayers, FiCalendar } from 'react-icons/fi'
import { properties } from '../data/properties'
import { isAuthenticated } from '../services/authService'
import PropertyTimer from './PropertyTimer'
import './PropertyList.css'

const PropertyList = ({ auctionProperties = null }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isLoaded: userLoaded } = useUser()
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [propertyType, setPropertyType] = useState('все')
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 })
  
  // Состояния для фильтров
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [areaMin, setAreaMin] = useState('')
  const [areaMax, setAreaMax] = useState('')
  const [roomsMin, setRoomsMin] = useState('')
  const [roomsMax, setRoomsMax] = useState('')
  const [bathroomsMin, setBathroomsMin] = useState('')
  const [bathroomsMax, setBathroomsMax] = useState('')
  const [floorMin, setFloorMin] = useState('')
  const [floorMax, setFloorMax] = useState('')
  const [yearBuiltMin, setYearBuiltMin] = useState('')
  const [yearBuiltMax, setYearBuiltMax] = useState('')

  const handleTooltipShow = (e, text) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      show: true,
      text: text,
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    })
  }

  const handleTooltipHide = () => {
    setTooltip({ show: false, text: '', x: 0, y: 0 })
  }
  
  // Маппинг категорий из URL (английские) в русские названия для фильтра
  const categoryMap = {
    'Apartment': 'апартаменты',
    'Villa': 'вилла',
    'Flat': 'квартира',
    'Townhouse': 'таунхаус',
    'House': 'все' // для домов пока используем "все"
  }
  
  // Читаем параметры из URL при загрузке и прокручиваем к объектам
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const category = searchParams.get('category')
    
    if (category && categoryMap[category]) {
      setPropertyType(categoryMap[category])
    }
    
    // Прокрутка к блоку объектов при наличии параметров в URL
    if (location.search.includes('category=')) {
      setTimeout(() => {
        const element = document.getElementById('properties-grid')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 300) // Небольшая задержка для применения фильтров
    }
  }, [location.search])
  const [favorites, setFavorites] = useState(() => {
    // Загружаем из localStorage
    const savedFavorites = localStorage.getItem('favoriteProperties')
    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites)
        const favoritesMap = new Map(Object.entries(parsed))
        const favoriteIds = new Set()
        // Проверяем все свойства из localStorage, не только текущие
        favoritesMap.forEach((value, key) => {
          if (value && key.startsWith('property-')) {
            const id = key.replace('property-', '')
            favoriteIds.add(id)
          }
        })
        return favoriteIds
      } catch (e) {
        console.error('Ошибка при загрузке избранного:', e)
      }
    }
    return new Set()
  })
  
  // Обновляем избранное при изменении auctionProperties
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteProperties')
    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites)
        const favoritesMap = new Map(Object.entries(parsed))
        const favoriteIds = new Set()
        favoritesMap.forEach((value, key) => {
          if (value && key.startsWith('property-')) {
            const id = key.replace('property-', '')
            favoriteIds.add(id)
          }
        })
        setFavorites(favoriteIds)
      } catch (e) {
        console.error('Ошибка при обновлении избранного:', e)
      }
    }
  }, [auctionProperties])
  const [visibleCount, setVisibleCount] = useState(9)

  const formatPrice = (price) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`
    }
    return `$${price.toLocaleString('en-US')}`
  }

  // Используем переданные аукционные объявления или статические данные
  const propertiesToUse = auctionProperties || properties

  // Функция для подсчета активных фильтров
  const getActiveFiltersCount = () => {
    let count = 0
    if (priceMin && priceMin.trim() !== '') count++
    if (priceMax && priceMax.trim() !== '') count++
    if (areaMin && areaMin.trim() !== '') count++
    if (areaMax && areaMax.trim() !== '') count++
    if (roomsMin && roomsMin.trim() !== '') count++
    if (roomsMax && roomsMax.trim() !== '') count++
    if (bathroomsMin && bathroomsMin.trim() !== '') count++
    if (bathroomsMax && bathroomsMax.trim() !== '') count++
    if (floorMin && floorMin.trim() !== '') count++
    if (floorMax && floorMax.trim() !== '') count++
    if (yearBuiltMin && yearBuiltMin.trim() !== '') count++
    if (yearBuiltMax && yearBuiltMax.trim() !== '') count++
    return count
  }

  // Функция для сброса всех фильтров
  const resetFilters = () => {
    setPriceMin('')
    setPriceMax('')
    setAreaMin('')
    setAreaMax('')
    setRoomsMin('')
    setRoomsMax('')
    setBathroomsMin('')
    setBathroomsMax('')
    setFloorMin('')
    setFloorMax('')
    setYearBuiltMin('')
    setYearBuiltMax('')
  }

  const filteredProperties = propertiesToUse.filter(property => {
    // Фильтрация по типу недвижимости
    if (propertyType !== 'все') {
      // Если есть property_type из API, используем его
      if (property.property_type) {
        const typeMap = {
          'квартира': ['apartment'],
          'апартаменты': ['commercial'],
          'вилла': ['villa'],
          'таунхаус': ['house']
        }
        if (typeMap[propertyType] && !typeMap[propertyType].includes(property.property_type)) {
          return false
        }
      } else {
        // Иначе используем старую логику по названию
        const titleLower = property.title.toLowerCase()
        const typeMatch = {
          'квартира': titleLower.includes('квартир') || titleLower.includes('студи'),
          'апартаменты': titleLower.includes('апартамент'),
          'вилла': titleLower.includes('вилл'),
          'таунхаус': titleLower.includes('таунхаус')
        }
        
        if (!typeMatch[propertyType]) {
          return false
        }
      }
    }
    
    // Фильтрация по цене
    const propertyPrice = property.currentBid || property.price || property.auction_starting_price || 0
    if (priceMin && priceMin.trim() !== '' && !isNaN(parseFloat(priceMin))) {
      if (propertyPrice < parseFloat(priceMin)) {
        return false
      }
    }
    if (priceMax && priceMax.trim() !== '' && !isNaN(parseFloat(priceMax))) {
      if (propertyPrice > parseFloat(priceMax)) {
        return false
      }
    }
    
    // Фильтрация по площади
    const propertyArea = property.area || property.sqft || 0
    if (areaMin && areaMin.trim() !== '' && !isNaN(parseFloat(areaMin))) {
      if (propertyArea < parseFloat(areaMin)) {
        return false
      }
    }
    if (areaMax && areaMax.trim() !== '' && !isNaN(parseFloat(areaMax))) {
      if (propertyArea > parseFloat(areaMax)) {
        return false
      }
    }
    
    // Фильтрация по количеству комнат
    const propertyRooms = property.rooms || property.beds || property.bedrooms || 0
    if (roomsMin && roomsMin.trim() !== '' && !isNaN(parseFloat(roomsMin))) {
      if (propertyRooms < parseFloat(roomsMin)) {
        return false
      }
    }
    if (roomsMax && roomsMax.trim() !== '' && !isNaN(parseFloat(roomsMax))) {
      if (propertyRooms > parseFloat(roomsMax)) {
        return false
      }
    }
    
    // Фильтрация по количеству ванных
    const propertyBathrooms = property.bathrooms || 0
    if (bathroomsMin && bathroomsMin.trim() !== '' && !isNaN(parseFloat(bathroomsMin))) {
      if (propertyBathrooms < parseFloat(bathroomsMin)) {
        return false
      }
    }
    if (bathroomsMax && bathroomsMax.trim() !== '' && !isNaN(parseFloat(bathroomsMax))) {
      if (propertyBathrooms > parseFloat(bathroomsMax)) {
        return false
      }
    }
    
    // Фильтрация по этажу
    const propertyFloor = property.floor || 0
    if (floorMin && floorMin.trim() !== '' && !isNaN(parseFloat(floorMin))) {
      if (propertyFloor < parseFloat(floorMin)) {
        return false
      }
    }
    if (floorMax && floorMax.trim() !== '' && !isNaN(parseFloat(floorMax))) {
      if (propertyFloor > parseFloat(floorMax)) {
        return false
      }
    }
    
    // Фильтрация по году постройки
    const propertyYear = property.year_built || 0
    if (yearBuiltMin && yearBuiltMin.trim() !== '' && !isNaN(parseFloat(yearBuiltMin))) {
      if (propertyYear < parseFloat(yearBuiltMin)) {
        return false
      }
    }
    if (yearBuiltMax && yearBuiltMax.trim() !== '' && !isNaN(parseFloat(yearBuiltMax))) {
      if (propertyYear > parseFloat(yearBuiltMax)) {
        return false
      }
    }
    
    // Фильтрация по поисковому запросу
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        (property.title || property.name || '').toLowerCase().includes(query) ||
        (property.location || '').toLowerCase().includes(query)
      )
    }
    
    return true
  })

  useEffect(() => {
    setVisibleCount(9)
  }, [searchQuery, propertyType, priceMin, priceMax, areaMin, areaMax, roomsMin, roomsMax, bathroomsMin, bathroomsMax, floorMin, floorMax, yearBuiltMin, yearBuiltMax])

  return (
    <section className="property-list">
      <div className="property-list-container">
        <h2 className="property-list-title">Активные аукционы</h2>
        
        <div className="search-filters-bar">
          <div className="search-box">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Поиск по названию или адресу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="search-clear"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>
          <button 
            className="filters-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Фильтры
            {getActiveFiltersCount() > 0 && (
              <span className="filters-badge">{getActiveFiltersCount()}</span>
            )}
          </button>
        </div>

        {/* Панель фильтров */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-panel-header">
              <h3 className="filters-panel-title">Фильтры</h3>
              <button 
                className="filters-panel-close"
                onClick={() => setShowFilters(false)}
                aria-label="Закрыть фильтры"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="filters-panel-content">
              {/* Фильтр по цене */}
              <div className="filter-group">
                <label className="filter-label">Цена ($)</label>
                <div className="filter-range">
                  <input
                    type="number"
                    className="filter-input"
                    placeholder="От"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                  />
                  <span className="filter-separator">—</span>
                  <input
                    type="number"
                    className="filter-input"
                    placeholder="До"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                  />
                </div>
              </div>

              {/* Фильтр по площади */}
              <div className="filter-group">
                <label className="filter-label">Площадь (м²)</label>
                <div className="filter-range">
                  <input
                    type="number"
                    className="filter-input"
                    placeholder="От"
                    value={areaMin}
                    onChange={(e) => setAreaMin(e.target.value)}
                  />
                  <span className="filter-separator">—</span>
                  <input
                    type="number"
                    className="filter-input"
                    placeholder="До"
                    value={areaMax}
                    onChange={(e) => setAreaMax(e.target.value)}
                  />
                </div>
              </div>

              {/* Фильтр по количеству комнат */}
              <div className="filter-group">
                <label className="filter-label">Количество комнат</label>
                <div className="filter-range">
                  <input
                    type="number"
                    className="filter-input"
                    placeholder="От"
                    value={roomsMin}
                    onChange={(e) => setRoomsMin(e.target.value)}
                    min="0"
                  />
                  <span className="filter-separator">—</span>
                  <input
                    type="number"
                    className="filter-input"
                    placeholder="До"
                    value={roomsMax}
                    onChange={(e) => setRoomsMax(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              {/* Фильтр по количеству ванных */}
              <div className="filter-group">
                <label className="filter-label">Количество ванных</label>
                <div className="filter-range">
                  <input
                    type="number"
                    className="filter-input"
                    placeholder="От"
                    value={bathroomsMin}
                    onChange={(e) => setBathroomsMin(e.target.value)}
                    min="0"
                  />
                  <span className="filter-separator">—</span>
                  <input
                    type="number"
                    className="filter-input"
                    placeholder="До"
                    value={bathroomsMax}
                    onChange={(e) => setBathroomsMax(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              {/* Фильтр по этажу */}
              <div className="filter-group">
                <label className="filter-label">Этаж</label>
                <div className="filter-range">
                  <input
                    type="number"
                    className="filter-input"
                    placeholder="От"
                    value={floorMin}
                    onChange={(e) => setFloorMin(e.target.value)}
                    min="0"
                  />
                  <span className="filter-separator">—</span>
                  <input
                    type="number"
                    className="filter-input"
                    placeholder="До"
                    value={floorMax}
                    onChange={(e) => setFloorMax(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              {/* Фильтр по году постройки */}
              <div className="filter-group">
                <label className="filter-label">Год постройки</label>
                <div className="filter-range">
                  <input
                    type="number"
                    className="filter-input"
                    placeholder="От"
                    value={yearBuiltMin}
                    onChange={(e) => setYearBuiltMin(e.target.value)}
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                  <span className="filter-separator">—</span>
                  <input
                    type="number"
                    className="filter-input"
                    placeholder="До"
                    value={yearBuiltMax}
                    onChange={(e) => setYearBuiltMax(e.target.value)}
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>
            </div>

            <div className="filters-panel-footer">
              <button 
                className="filter-reset-button"
                onClick={resetFilters}
              >
                Сбросить фильтры
              </button>
              <button 
                className="filter-apply-button"
                onClick={() => setShowFilters(false)}
              >
                Применить
              </button>
            </div>
          </div>
        )}

        <div className="property-types">
          <button 
            className={`type-button ${propertyType === 'все' ? 'active' : ''}`}
            onClick={() => setPropertyType('все')}
          >
            Все
          </button>
          <button 
            className={`type-button ${propertyType === 'квартира' ? 'active' : ''}`}
            onClick={() => setPropertyType('квартира')}
          >
            Квартира
          </button>
          <button 
            className={`type-button ${propertyType === 'апартаменты' ? 'active' : ''}`}
            onClick={() => setPropertyType('апартаменты')}
          >
            Апартаменты
          </button>
          <button 
            className={`type-button ${propertyType === 'вилла' ? 'active' : ''}`}
            onClick={() => setPropertyType('вилла')}
          >
            Вилла
          </button>
          <button 
            className={`type-button ${propertyType === 'таунхаус' ? 'active' : ''}`}
            onClick={() => setPropertyType('таунхаус')}
          >
            Таунхаус
          </button>
        </div>

        {filteredProperties.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3 className="no-results-title">Ничего не найдено</h3>
            <p className="no-results-text">Попробуйте изменить параметры поиска или фильтры</p>
          </div>
        ) : (
          <>
            <div id="properties-grid" className="properties-grid">
              {filteredProperties.slice(0, visibleCount).map((property) => {
                const propertyTitle = property.title || property.name || ''
                const propertyImages = property.images || (property.image ? [property.image] : [])
                const propertyImage = propertyImages[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'
                const hasTimer = property.isAuction === true && property.endTime != null && property.endTime !== ''
                const hasTestDrive = property.test_drive === 1 || property.testDrive === true || property.test_drive === true
                
                return (
            <div 
              key={property.id} 
              className="property-card"
              onClick={(e) => {
                // Проверяем, что клик не по кнопке или ссылке
                if (e.target.closest('button') || e.target.closest('a')) {
                  return
                }
                console.log('Navigating to property:', property.id)
                navigate(`/property/${property.id}`, {
                  state: { property }
                })
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="property-link">
                <div className="property-image-container">
                  <img 
                    src={propertyImage} 
                    alt={propertyTitle}
                    className="property-image"
                  />
                  <div className="property-badges-container">
                    <div 
                      className="property-buy-badge"
                      onMouseEnter={(e) => handleTooltipShow(e, 'Выкупите объект прямо сейчас по фиксированной цене без участия в аукционе')}
                      onMouseLeave={handleTooltipHide}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        navigate(`/property/${property.id}`, {
                          state: { property }
                        })
                      }}
                    >
                      <span>Купить сейчас</span>
                    </div>
                    {hasTestDrive && (
                      <div 
                        className="property-testdrive-badge"
                        onMouseEnter={(e) => handleTooltipShow(e, 'Арендуйте объект на время, оцените все преимущества проживания и выкупите его')}
                        onMouseLeave={handleTooltipHide}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          navigate(`/property/${property.id}`, {
                            state: { property }
                          })
                        }}
                      >
                        <span>Тест-драйв</span>
                      </div>
                    )}
                  </div>
                  <button 
                    className={`property-favorite ${favorites.has(property.id) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      
                      // Проверяем авторизацию через Clerk или старую систему
                      const isClerkAuth = user && userLoaded
                      const isOldAuth = isAuthenticated()
                      const isFavorite = favorites.has(property.id)
                      
                      // Разрешаем удаление из избранного без авторизации, но добавление требует авторизации
                      if (!isFavorite && !isClerkAuth && !isOldAuth) {
                        alert('Пожалуйста, войдите в систему, чтобы добавлять объявления в избранное')
                        return
                      }
                      
                      const newFavorites = new Set(favorites)
                      
                      if (isFavorite) {
                        newFavorites.delete(property.id)
                      } else {
                        newFavorites.add(property.id)
                      }
                      setFavorites(newFavorites)
                      
                      // Сохраняем в localStorage в формате, совместимом с MainPage
                      const savedFavorites = localStorage.getItem('favoriteProperties')
                      let favoritesMap = new Map()
                      if (savedFavorites) {
                        try {
                          const parsed = JSON.parse(savedFavorites)
                          favoritesMap = new Map(Object.entries(parsed))
                        } catch (e) {
                          console.error('Ошибка:', e)
                        }
                      }
                      favoritesMap.set(`property-${property.id}`, !isFavorite)
                      const obj = Object.fromEntries(favoritesMap)
                      localStorage.setItem('favoriteProperties', JSON.stringify(obj))
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path 
                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        fill={favorites.has(property.id) ? "currentColor" : "none"}
                      />
                    </svg>
                  </button>
                </div>
                <div className="property-content">
                  {hasTimer && (
                    <PropertyTimer endTime={property.endTime} compact={true} />
                  )}
                  <h3 className="property-title">{propertyTitle}</h3>
                  {!hasTimer && property.description && (
                    <p className="property-description">{property.description}</p>
                  )}
                  <p className="property-location">{property.location || ''}</p>
                  
                  {/* Обертка для данных, закрепленных снизу */}
                  <div className="property-content-bottom">
                    {/* Основные характеристики для аукционных карточек - в стиле личного кабинета продавца */}
                    {hasTimer && (
                      <div className="property-card-owner__info">
                        {(property.area || property.sqft) && (
                          <div className="property-card-owner__info-item">
                            <BiArea size={16} />
                            <span>{property.area || property.sqft} м²</span>
                          </div>
                        )}
                        {(property.rooms || property.beds || property.bedrooms) && (
                          <div className="property-card-owner__info-item">
                            <MdBed size={16} />
                            <span>{property.rooms || property.beds || property.bedrooms}</span>
                          </div>
                        )}
                        {property.bathrooms && (
                          <div className="property-card-owner__info-item">
                            <MdOutlineBathtub size={16} />
                            <span>{property.bathrooms}</span>
                          </div>
                        )}
                        {property.floor && (
                          <div className="property-card-owner__info-item">
                            <FiLayers size={16} />
                            <span>
                              {property.floor}
                              {(property.total_floors || property.totalFloors) && `/${property.total_floors || property.totalFloors}`}
                            </span>
                          </div>
                        )}
                        {property.year_built && (
                          <div className="property-card-owner__info-item">
                            <FiCalendar size={16} />
                            <span>{property.year_built}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {hasTimer ? (
                      <div className="property-bid-info">
                        <span className="bid-label">Текущая ставка:</span>
                        <span className="bid-value">{formatPrice(property.currentBid || property.price || 0)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="property-price">
                          {property.is_shared_ownership && property.total_shares 
                            ? formatPrice(Math.ceil((property.price || 0) / property.total_shares)) + ' за долю'
                            : formatPrice(property.price || 0)}
                        </div>
                        {property.is_shared_ownership && (
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#0ea5e9', 
                            fontWeight: '600',
                            marginTop: '4px',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span style={{ 
                              padding: '2px 6px', 
                              backgroundColor: '#e0f2fe', 
                              borderRadius: '4px' 
                            }}>
                              Долевая продажа
                            </span>
                            <span>{(property.total_shares - (property.shares_sold || 0))} из {property.total_shares}</span>
                          </div>
                        )}
                        <div className="property-specs">
                        {(property.rooms || property.beds) && (
                          <div className="spec-item">
                            <MdBed size={18} />
                            <span>{property.rooms || property.beds}</span>
                          </div>
                        )}
                        {(property.area || property.sqft) && (
                          <div className="spec-item">
                            <BiArea size={18} />
                            <span>{property.area || property.sqft} м²</span>
                          </div>
                        )}
                        {property.floor && (
                          <span className="spec-item">{property.floor} этаж</span>
                        )}
                        </div>
                      </>
                    )}
                    <div className="property-actions" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="btn btn-primary btn-liquid-glass"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          navigate(`/property/${property.id}`, {
                            state: { property }
                          })
                        }}
                      >
                        Сделать ставку
                      </button>
                      <button 
                        className="btn btn-buy-now btn-liquid-glass-buy"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          navigate(`/property/${property.id}`, {
                            state: { property }
                          })
                        }}
                      >
                        Купить сейчас
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
                )
              })}
            </div>

            {filteredProperties.length > visibleCount && (
          <div className="load-more-container">
            <button 
              className="load-more-button"
              onClick={() => setVisibleCount(filteredProperties.length)}
            >
              Показать еще ({filteredProperties.length - visibleCount})
            </button>
          </div>
        )}
          </>
        )}
      </div>
      
      {/* Глобальный tooltip с fixed позиционированием */}
      {tooltip.show && (
        <div 
          className="property-badge-tooltip-global"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`
          }}
        >
          {tooltip.text}
          <div className="property-badge-tooltip-arrow"></div>
        </div>
      )}
    </section>
  )
}

export default PropertyList

