import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { properties } from '../data/properties'
import Footer from '../components/Footer'
import './MapPage.css'

const MapPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [favorites, setFavorites] = useState(new Set())
  const [activeTab, setActiveTab] = useState('listings') // 'listings' или 'favorites'
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  const formatPrice = (price) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} млн Р`
    }
    return `${price.toLocaleString('ru-RU')} Р`
  }

  const filteredProperties = properties.filter(property => {
    // Фильтр по избранному
    if (activeTab === 'favorites' && !favorites.has(property.id)) {
      return false
    }
    
    // Фильтр по поиску
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      property.title.toLowerCase().includes(query) ||
      property.location.toLowerCase().includes(query)
    )
  })

  // Координаты разных районов Москвы и области
  const locationCoordinates = [
    [55.7558, 37.6173], // Центр Москвы
    [55.7520, 37.6156], // Красная площадь
    [55.7512, 37.6175], // Китай-город
    [55.7527, 37.6234], // Тверская
    [55.7494, 37.6250], // Арбат
    [55.7600, 37.6000], // Пресня
    [55.7400, 37.6500], // Замоскворечье
    [55.7800, 37.5800], // Хорошево-Мневники
    [55.7300, 37.7000], // Юго-Восток
    [55.8000, 37.5500], // Северо-Запад
    [55.7000, 37.8000], // Юг
    [55.8500, 37.5000], // Север
    [55.7200, 37.6200], // Юго-Запад
    [55.7700, 37.6500], // Северо-Восток
    [55.6800, 37.7500], // Бутово
    [55.8200, 37.6000], // Митино
    [55.7500, 37.9000], // Люберцы
    [55.6500, 37.7000], // Подольск
    [55.9000, 37.5500], // Химки
    [55.6000, 37.8000], // Домодедово
  ]

  // Генерируем координаты для объектов из разных районов
  const getPropertyCoordinates = (property) => {
    // Используем id для выбора района из массива
    const locationIndex = (property.id - 1) % locationCoordinates.length
    const baseCoords = locationCoordinates[locationIndex]
    
    // Добавляем небольшое случайное смещение в пределах района
    const offsetLat = (Math.random() - 0.5) * 0.02 // ~2км
    const offsetLng = (Math.random() - 0.5) * 0.03 // ~2км
    
    return [baseCoords[0] + offsetLat, baseCoords[1] + offsetLng]
  }

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Проверяем, что Leaflet загружен
    if (!window.L) {
      console.error('Leaflet не загружен')
      return
    }

    // Небольшая задержка для гарантии, что DOM готов
    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return

      try {
        // Инициализация карты с центром в Москве, зум для показа всей области
        const map = window.L.map(mapRef.current, {
          zoomControl: true,
          scrollWheelZoom: true
        }).setView([55.7558, 37.6173], 10)

        // Добавление тайлов OpenStreetMap
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map)

        mapInstanceRef.current = map

        // Обновляем размер карты после инициализации
        setTimeout(() => {
          if (map && map.invalidateSize) {
            map.invalidateSize()
          }
        }, 200)
      } catch (error) {
        console.error('Ошибка инициализации карты:', error)
      }
    }

    // Пробуем инициализировать сразу, если DOM готов
    if (mapRef.current.offsetParent !== null) {
      initMap()
    } else {
      // Если DOM еще не готов, ждем
      setTimeout(initMap, 100)
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch (e) {
          console.error('Ошибка при удалении карты:', e)
        }
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Обновление маркеров при изменении фильтров или выбранного объекта
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Удаляем старые маркеры
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker)
    })
    markersRef.current = []

    // Добавляем новые маркеры
    filteredProperties.forEach(property => {
      const coords = getPropertyCoordinates(property)
      const isSelected = selectedProperty?.id === property.id

      const marker = window.L.marker(coords, {
        icon: window.L.divIcon({
          className: `custom-marker ${isSelected ? 'active' : ''}`,
          html: `<div class="marker-content">${formatPrice(property.price)}</div>`,
          iconSize: [80, 30],
          iconAnchor: [40, 15]
        })
      })

      // Создаем popup с информацией об объекте
      const popupContent = `
        <div class="map-popup">
          <div class="map-popup-image">
            <img src="${property.images[0]}" alt="${property.title}" />
          </div>
          <div class="map-popup-info">
            <div class="map-popup-price">${formatPrice(property.price)}</div>
            <div class="map-popup-title">${property.title}</div>
            <div class="map-popup-location">${property.location}</div>
            <div class="map-popup-details">${property.rooms || 'Студия'} комн. · ${property.area} м² · ${property.floor} этаж</div>
          </div>
        </div>
      `

      marker.bindPopup(popupContent, {
        className: 'custom-popup',
        maxWidth: 300,
        closeButton: false,
        offset: [0, -10]
      })

      // Открываем popup при наведении
      marker.on('mouseover', () => {
        marker.openPopup()
      })

      // Закрываем popup при уходе курсора
      marker.on('mouseout', () => {
        marker.closePopup()
      })

      marker.on('click', () => {
        setSelectedProperty(property)
      })

      marker.addTo(mapInstanceRef.current)
      markersRef.current.push(marker)
    })

    // Центрируем карту на выбранном объекте
    if (selectedProperty) {
      const coords = getPropertyCoordinates(selectedProperty)
      mapInstanceRef.current.setView(coords, 14, { animate: true, duration: 0.5 })
    }
  }, [filteredProperties, selectedProperty])

  return (
    <div className="map-page" style={{ margin: 0, padding: 0 }}>
      <div className="map-container">
        <div className="map-view">
          <div ref={mapRef} className="leaflet-map"></div>
          <div className="map-tabs">
            <button 
              className={`map-tab ${activeTab === 'listings' ? 'active' : ''}`}
              onClick={() => setActiveTab('listings')}
            >
              Объявления
            </button>
            <button 
              className={`map-tab ${activeTab === 'favorites' ? 'active' : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              Избранное
            </button>
          </div>
        </div>

        <div className="map-sidebar">
          <div className="map-filters">
            <div className="filter-section">
              <label className="filter-label">Местоположение</label>
              <input
                type="text"
                className="filter-input"
                placeholder="Город, адрес, индекс"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-row">
              <div className="filter-section">
                <label className="filter-label">Комнаты</label>
                <select className="filter-select">
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4+</option>
                </select>
              </div>
              <div className="filter-section">
                <label className="filter-label">Санузлы</label>
                <select className="filter-select">
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3+</option>
                </select>
              </div>
            </div>
            <button className="filters-button-map">Фильтры</button>
          </div>

          <div className="map-results-count">
            {filteredProperties.length} объектов на продажу
          </div>

          <div className="map-properties-list">
            {filteredProperties.length === 0 ? (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3 className="no-results-title">Ничего не найдено</h3>
                <p className="no-results-text">Попробуйте изменить параметры поиска</p>
              </div>
            ) : (
              filteredProperties.map((property) => (
                <div 
                  key={property.id} 
                  className={`map-property-card ${selectedProperty?.id === property.id ? 'selected' : ''}`}
                  onClick={() => setSelectedProperty(property)}
                >
                  <div className="map-property-images">
                    <div className="map-property-main-image">
                      <img src={property.images[0]} alt={property.title} />
                      <button 
                        className={`map-favorite ${favorites.has(property.id) ? 'active' : ''}`}
                        onClick={(e) => {
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
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path 
                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            fill={favorites.has(property.id) ? "currentColor" : "none"}
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="map-property-thumbnails">
                      {property.images.slice(1, 4).map((image, idx) => (
                        <div key={idx} className="map-property-thumbnail">
                          <img src={image} alt={`${property.title} ${idx + 2}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="map-property-info">
                    <div className="map-property-price">{formatPrice(property.price)}</div>
                    <div className="map-property-details">
                      {property.rooms || 'Студия'} комн. · {property.area} м² · {property.floor} этаж
                    </div>
                    <div className="map-property-location">{property.location}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default MapPage

