import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { MdBed, MdOutlineBathtub, MdDirectionsCar } from 'react-icons/md'
import { BiArea } from 'react-icons/bi'
import { FiLayers, FiCalendar } from 'react-icons/fi'
import { properties } from '../data/properties'
import { isAuthenticated } from '../services/authService'
import PropertyTimer from './PropertyTimer'
import CircularTimer from './CircularTimer'
import './PropertyList.css'

const PropertyList = ({ auctionProperties = null }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isLoaded: userLoaded } = useUser()
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [propertyType, setPropertyType] = useState('все')
  
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
  }, [searchQuery, propertyType])

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
            {showFilters && <span className="filters-badge">1</span>}
          </button>
        </div>

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
                const hasTestTimer = property.test_timer_end_date != null && property.test_timer_end_date !== ''
                const hasTimer = (property.isAuction === true && property.endTime != null && property.endTime !== '') || hasTestTimer
                const hasTestDrive = property.test_drive === 1 || property.testDrive === true || property.test_drive === true
                
                // Проверяем, закончился ли таймер
                const checkTimerExpired = () => {
                  if (hasTestTimer && property.test_timer_end_date) {
                    const now = new Date().getTime();
                    const end = new Date(property.test_timer_end_date).getTime();
                    return end <= now;
                  }
                  if (property.endTime) {
                    const now = new Date().getTime();
                    const end = new Date(property.endTime).getTime();
                    return end <= now;
                  }
                  return false;
                };
                const isTimerExpired = checkTimerExpired();
                
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
                  <div 
                    className="property-buy-badge"
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
                  {hasTestTimer && (
                    <div 
                      className="property-auction-badge"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        navigate(`/property/${property.id}`, {
                          state: { property }
                        })
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span>Аукцион</span>
                    </div>
                  )}
                  {hasTestDrive && (
                    <div 
                      className="property-testdrive-badge"
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
                    <div className="property-timer-wrapper">
                      {hasTestTimer ? (
                        <CircularTimer 
                          endTime={property.test_timer_end_date} 
                          size={120} 
                          strokeWidth={6} 
                        />
                      ) : (
                        <PropertyTimer endTime={property.endTime} compact={true} />
                      )}
                    </div>
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
                        <div className="property-price">{formatPrice(property.price || 0)}</div>
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
    </section>
  )
}

export default PropertyList

