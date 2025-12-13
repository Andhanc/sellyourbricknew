import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { properties } from '../data/properties'
import PropertyTimer from './PropertyTimer'
import './PropertyList.css'

const PropertyList = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [propertyType, setPropertyType] = useState('все')
  const [favorites, setFavorites] = useState(new Set())
  const [visibleCount, setVisibleCount] = useState(9)

  const formatPrice = (price) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} млн Р`
    }
    return `${price.toLocaleString('ru-RU')} Р`
  }

  const filteredProperties = properties.filter(property => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      property.title.toLowerCase().includes(query) ||
      property.location.toLowerCase().includes(query)
    )
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
            <div className="properties-grid">
              {filteredProperties.slice(0, visibleCount).map((property) => (
            <div key={property.id} className="property-card">
              <Link to={`/property/${property.id}`} className="property-link">
                <div className="property-image-container">
                  <img 
                    src={property.images[0]} 
                    alt={property.title}
                    className="property-image"
                  />
                  <div className="property-timer-overlay">
                    <PropertyTimer endTime={property.endTime} compact={true} />
                  </div>
                  <button 
                    className={`property-favorite ${favorites.has(property.id) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const newFavorites = new Set(favorites)
                      if (newFavorites.has(property.id)) {
                        newFavorites.delete(property.id)
                      } else {
                        newFavorites.add(property.id)
                      }
                      setFavorites(newFavorites)
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
                  <h3 className="property-title">{property.title}</h3>
                  <p className="property-location">{property.location}</p>
                  <div className="property-price">{formatPrice(property.price)}</div>
                  <div className="property-bid-info">
                    <span className="bid-label">Текущая ставка:</span>
                    <span className="bid-value">{formatPrice(property.currentBid)}</span>
                  </div>
                  <div className="property-actions">
                    <Link 
                      to={`/property/${property.id}`}
                      className="btn btn-secondary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Открыть
                    </Link>
                    <button 
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        window.location.href = `/property/${property.id}`
                      }}
                    >
                      Сделать ставку
                    </button>
                  </div>
                </div>
              </Link>
            </div>
              ))}
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

