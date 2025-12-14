import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiHeart } from 'react-icons/fi'
import { FaHeart as FaHeartSolid } from 'react-icons/fa'
import PropertyTimer from './PropertyTimer'
import './PropertyList.css'

const apartmentsData = [
  {
    id: 1,
    title: '2-комн. квартира, 58 м², 9/10 этаж',
    location: 'Costa Adeje, Tenerife',
    price: 8500372,
    currentBid: 8000000,
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'],
    isAuction: true,
    beds: 2,
    baths: 1,
    sqft: 850,
  },
  {
    id: 2,
    title: '3-комн. квартира, 120 м², 5/10 этаж',
    location: 'Playa de las Américas, Tenerife',
    price: 25748010,
    currentBid: 24000000,
    endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'],
    isAuction: false,
    beds: 3,
    baths: 2,
    sqft: 1200,
  },
  {
    id: 3,
    title: '1-комн. квартира, 37 м², 6/9 этаж',
    location: 'Los Cristianos, Tenerife',
    price: 28078032,
    currentBid: 26000000,
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
    isAuction: true,
    beds: 1,
    baths: 1,
    sqft: 650,
  },
  {
    id: 4,
    title: '2-комн. квартира, 95 м², 3/9 этаж',
    location: 'Puerto de la Cruz, Tenerife',
    price: 4441729,
    currentBid: 4200000,
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80'],
    isAuction: false,
    beds: 2,
    baths: 1,
    sqft: 950,
  },
  {
    id: 5,
    title: '2-комн. квартира, 110 м², 4/10 этаж',
    location: 'Santa Cruz de Tenerife, Tenerife',
    price: 12345678,
    currentBid: 11500000,
    endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'],
    isAuction: true,
    beds: 2,
    baths: 2,
    sqft: 1100,
  },
  {
    id: 6,
    title: '3-комн. квартира, 130 м², 7/12 этаж',
    location: 'La Laguna, Tenerife',
    price: 9876543,
    currentBid: 9500000,
    endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000 + 58 * 60 * 1000 + 53 * 1000).toISOString(),
    images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'],
    isAuction: false,
    beds: 3,
    baths: 2,
    sqft: 1300,
  },
]

function ApartmentsSection() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [favoriteProperties, setFavoriteProperties] = useState(() => {
    const initialFavorites = new Map()
    apartmentsData.forEach((property) => {
      initialFavorites.set(`apartment-${property.id}`, false)
    })
    return initialFavorites
  })

  const formatPrice = (price) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} млн Р`
    }
    return `${price.toLocaleString('ru-RU')} Р`
  }

  const toggleFavorite = (propertyId) => {
    setFavoriteProperties((prev) => {
      const updated = new Map(prev)
      updated.set(`apartment-${propertyId}`, !prev.get(`apartment-${propertyId}`))
      return updated
    })
  }

  const handleHeaderClick = () => {
    window.location.href = '/main?category=Apartment&filter=auction'
  }

  const handlePropertyClick = (propertyId) => {
    window.location.href = '/main?category=Apartment&filter=auction'
  }

  return (
    <section className="property-list">
      <div className="property-list-container">
        <div 
          className="property-list-title"
          onClick={handleHeaderClick}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <h2 style={{ margin: 0 }}>{t('apartmentsSection') || 'Аппартаменты'}</h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#111827' }}>
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
        
        <div className="properties-grid">
          {apartmentsData.map((apartment) => (
            <div key={apartment.id} className="property-card">
              <div 
                className="property-link"
                onClick={() => handlePropertyClick(apartment.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="property-image-container">
                  <img 
                    src={apartment.images[0]} 
                    alt={apartment.title}
                    className="property-image"
                  />
                  {apartment.endTime && (
                    <div className="property-timer-overlay">
                      <PropertyTimer endTime={apartment.endTime} compact={true} />
                    </div>
                  )}
                  <button
                    type="button"
                    className={`property-favorite ${
                      favoriteProperties.get(`apartment-${apartment.id}`) ? 'active' : ''
                    }`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleFavorite(apartment.id)
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path 
                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        fill={favoriteProperties.get(`apartment-${apartment.id}`) ? "currentColor" : "none"}
                      />
                    </svg>
                  </button>
                </div>
                <div className="property-content">
                  <h3 className="property-title">{apartment.title}</h3>
                  <p className="property-location">{apartment.location}</p>
                  <div className="property-price">{formatPrice(apartment.price)}</div>
                  {apartment.currentBid && (
                    <div className="property-bid-info">
                      <span className="bid-label">Текущая ставка:</span>
                      <span className="bid-value">{formatPrice(apartment.currentBid)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ApartmentsSection
