import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiArrowRight, FiHeart } from 'react-icons/fi'
import { FaHeart as FaHeartSolid } from 'react-icons/fa'
import { MdBed, MdOutlineBathtub } from 'react-icons/md'
import { BiArea } from 'react-icons/bi'
import '../pages/MainPage.css'

const apartmentsData = [
  {
    id: 1,
    name: 'Тропарево Парк',
    location: 'Costa Adeje, Tenerife',
    price: 8500372,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
    isAuction: true,
    beds: 2,
    baths: 1,
    sqft: 850,
  },
  {
    id: 2,
    name: 'Клубный город на реке Primavera',
    location: 'Playa de las Américas, Tenerife',
    price: 25748010,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    isAuction: false,
    beds: 3,
    baths: 2,
    sqft: 1200,
  },
  {
    id: 3,
    name: 'Slava',
    location: 'Los Cristianos, Tenerife',
    price: 28078032,
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    isAuction: true,
    beds: 1,
    baths: 1,
    sqft: 650,
  },
  {
    id: 4,
    name: 'Пригород Лесное',
    location: 'Puerto de la Cruz, Tenerife',
    price: 4441729,
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80',
    isAuction: false,
    beds: 2,
    baths: 1,
    sqft: 950,
  },
  {
    id: 5,
    name: 'ЖК "Солнечный"',
    location: 'Santa Cruz de Tenerife, Tenerife',
    price: 12345678,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    isAuction: true,
    beds: 2,
    baths: 2,
    sqft: 1100,
  },
  {
    id: 6,
    name: 'Элитный комплекс',
    location: 'La Laguna, Tenerife',
    price: 9876543,
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    isAuction: false,
    beds: 3,
    baths: 2,
    sqft: 1300,
  },
]

const ApartmentsSection = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [favoriteProperties, setFavoriteProperties] = useState(() => {
    const initialFavorites = new Map()
    apartmentsData.forEach((property) => {
      initialFavorites.set(`apartment-${property.id}`, false)
    })
    return initialFavorites
  })

  const toggleFavorite = (propertyId) => {
    setFavoriteProperties((prev) => {
      const updated = new Map(prev)
      updated.set(`apartment-${propertyId}`, !prev.get(`apartment-${propertyId}`))
      return updated
    })
  }

  const handleHeaderClick = () => {
    // Переход на страницу аукциона с фильтром для аппартаментов
    navigate('/main?category=Apartment&filter=auction')
  }

  const handlePropertyClick = (propertyId) => {
    // Переход на страницу аукциона с фильтром для аппартаментов
    navigate('/main?category=Apartment&filter=auction')
  }

  return (
    <section className="apartments-section">
      <div className="apartments-section__container">
        <div 
          className="apartments-section__header"
          onClick={handleHeaderClick}
          style={{ cursor: 'pointer' }}
        >
          <h2 className="apartments-section__title">{t('apartmentsSection') || 'Аппартаменты'}</h2>
          <FiArrowRight size={24} className="apartments-section__arrow" />
        </div>
        
        <div className="apartments-section__content">
          <div className="apartments-section__grid">
            {apartmentsData.map((apartment) => (
              <article
                key={apartment.id}
                className="apartment-card"
                onClick={() => handlePropertyClick(apartment.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="apartment-card__image">
                  <img src={apartment.image} alt={apartment.name} />
                  <button
                    type="button"
                    className={`apartment-card__favorite ${
                      favoriteProperties.get(`apartment-${apartment.id}`)
                        ? 'apartment-card__favorite--active'
                        : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(apartment.id)
                    }}
                    aria-pressed={favoriteProperties.get(`apartment-${apartment.id}`)}
                  >
                    {favoriteProperties.get(`apartment-${apartment.id}`) ? (
                      <FaHeartSolid size={16} />
                    ) : (
                      <FiHeart size={16} />
                    )}
                  </button>
                </div>
                
                <div className="apartment-card__content">
                  <div className="apartment-card__content-wrapper">
                    <div className="apartment-card__content-main">
                      <div className="apartment-card__price">
                        от {apartment.price.toLocaleString('ru-RU')} $
                      </div>
                      <div className="apartment-card__info">
                        <div className="apartment-card__info-item">
                          <MdBed size={16} />
                          <span>{apartment.beds || 0}</span>
                        </div>
                        <div className="apartment-card__info-item">
                          <MdOutlineBathtub size={16} />
                          <span>{apartment.baths || 0}</span>
                        </div>
                        <div className="apartment-card__info-item">
                          <BiArea size={16} />
                          <span>{apartment.sqft || 0} м²</span>
                        </div>
                      </div>
                      <p className="apartment-card__location">{apartment.location}</p>
                    </div>
                    {apartment.isAuction && (
                      <img 
                        src="https://png.pngtree.com/png-vector/20220525/ourmid/pngtree-test-drive-rubber-stamp-png-image_4726533.png" 
                        alt="Аукцион" 
                        className="apartment-card__auction-badge"
                      />
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ApartmentsSection
