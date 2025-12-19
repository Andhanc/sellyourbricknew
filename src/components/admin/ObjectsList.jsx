import React, { useState, useMemo } from 'react';
import { FiSearch, FiSliders, FiHeart } from 'react-icons/fi';
import { FaHeart as FaHeartSolid } from 'react-icons/fa';
import { IoLocationOutline } from 'react-icons/io5';
import { MdBed, MdOutlineBathtub } from 'react-icons/md';
import { BiArea } from 'react-icons/bi';
import CountdownTimer from '../CountdownTimer';
import './ObjectsList.css';

// Моковые данные объектов недвижимости
const mockProperties = [
  {
    id: 1,
    tag: 'House',
    name: 'Lakeshore Blvd West',
    title: 'Уютный дом с видом на озеро',
    location: 'Costa Adeje, Tenerife',
    price: 797500,
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
    beds: 2,
    baths: 2,
    sqft: 2000,
    isAuction: false
  },
  {
    id: 2,
    tag: 'Apartment',
    name: 'Modern Apartment',
    title: 'Современная квартира в центре',
    location: 'Playa de las Américas, Tenerife',
    price: 450000,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
    beds: 1,
    baths: 1,
    sqft: 850,
    isAuction: false
  },
  {
    id: 3,
    tag: 'Villa',
    name: 'Luxury Villa',
    title: 'Комфортная вилла на берегу моря',
    location: 'Los Cristianos, Tenerife',
    price: 1200000,
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
    beds: 4,
    baths: 3,
    sqft: 3500,
    isAuction: false
  },
  {
    id: 4,
    tag: 'House',
    name: 'Beach House',
    title: 'Пляжный дом с выходом к морю',
    location: 'Puerto de la Cruz, Tenerife',
    price: 950000,
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
    beds: 3,
    baths: 2,
    sqft: 2200,
    isAuction: true,
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 дней от текущего момента
  },
  {
    id: 5,
    tag: 'Apartment',
    name: 'City Center Apartment',
    title: 'Квартира в центре города',
    location: 'Santa Cruz de Tenerife, Tenerife',
    price: 380000,
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
    beds: 2,
    baths: 1,
    sqft: 950,
    isAuction: false
  },
  {
    id: 6,
    tag: 'Villa',
    name: 'Ocean View Villa',
    title: 'Роскошная вилла с видом на океан',
    location: 'Golf del Sur, Tenerife',
    price: 1500000,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    beds: 5,
    baths: 4,
    sqft: 4200,
    isAuction: false
  },
  {
    id: 7,
    tag: 'House',
    name: 'Mountain View House',
    title: 'Дом с панорамным видом на горы',
    location: 'La Laguna, Tenerife',
    price: 680000,
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    beds: 3,
    baths: 2,
    sqft: 1800,
    isAuction: false
  },
  {
    id: 8,
    tag: 'Apartment',
    name: 'Studio Apartment',
    title: 'Студия для комфортного проживания',
    location: 'Callao Salvaje, Tenerife',
    price: 250000,
    image: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=800&q=80',
    beds: 0,
    baths: 1,
    sqft: 550,
    isAuction: false
  },
  {
    id: 9,
    tag: 'Villa',
    name: 'Seaside Villa',
    title: 'Вилла у моря с частным пляжем',
    location: 'El Médano, Tenerife',
    price: 1100000,
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80',
    beds: 4,
    baths: 3,
    sqft: 3800,
    isAuction: false
  },
  {
    id: 10,
    tag: 'House',
    name: 'Garden House',
    title: 'Дом с садом и террасой',
    location: 'Costa Adeje, Tenerife',
    price: 720000,
    image: 'https://images.unsplash.com/photo-1600585154526-990dbe4eb5f3?auto=format&fit=crop&w=800&q=80',
    beds: 2,
    baths: 2,
    sqft: 1900,
    isAuction: false
  },
  {
    id: 11,
    tag: 'Apartment',
    name: 'Luxury Apartment',
    title: 'Элитная квартира с панорамными окнами',
    location: 'Playa de las Américas, Tenerife',
    price: 520000,
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
    beds: 2,
    baths: 2,
    sqft: 1200,
    isAuction: false
  },
  {
    id: 12,
    tag: 'Villa',
    name: 'Modern Villa',
    title: 'Современная вилла с бассейном',
    location: 'Los Cristianos, Tenerife',
    price: 1350000,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
    beds: 5,
    baths: 4,
    sqft: 4500,
    isAuction: true,
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 дней от текущего момента
  },
  {
    id: 13,
    tag: 'House',
    name: 'Family House',
    title: 'Семейный дом для комфортной жизни',
    location: 'Puerto de la Cruz, Tenerife',
    price: 880000,
    image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
    beds: 3,
    baths: 2,
    sqft: 2100,
    isAuction: false
  },
  {
    id: 14,
    tag: 'Apartment',
    name: 'Downtown Apartment',
    title: 'Квартира в деловом центре',
    location: 'Santa Cruz de Tenerife, Tenerife',
    price: 420000,
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
    beds: 2,
    baths: 1,
    sqft: 1050,
    isAuction: false
  },
  {
    id: 15,
    tag: 'Villa',
    name: 'Estate Villa',
    title: 'Поместье с обширной территорией',
    location: 'Golf del Sur, Tenerife',
    price: 1650000,
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
    beds: 6,
    baths: 5,
    sqft: 5000,
    isAuction: false
  },
  {
    id: 16,
    tag: 'House',
    name: 'Country House',
    title: 'Загородный дом в тихом районе',
    location: 'La Laguna, Tenerife',
    price: 750000,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    beds: 3,
    baths: 3,
    sqft: 2400,
    isAuction: false
  },
  {
    id: 17,
    tag: 'Apartment',
    name: 'Cozy Apartment',
    title: 'Уютная квартира для двоих',
    location: 'Callao Salvaje, Tenerife',
    price: 320000,
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    beds: 1,
    baths: 1,
    sqft: 750,
    isAuction: false
  },
  {
    id: 18,
    tag: 'Villa',
    name: 'Cliffside Villa',
    title: 'Вилла на скале с невероятным видом',
    location: 'El Médano, Tenerife',
    price: 1420000,
    image: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=800&q=80',
    beds: 4,
    baths: 3,
    sqft: 4000,
    isAuction: false
  }
];

const ObjectsList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [saleTypeFilter, setSaleTypeFilter] = useState('all');
  const [displayedCount, setDisplayedCount] = useState(9);
  const [favorites, setFavorites] = useState(new Set());

  const filteredProperties = useMemo(() => {
    return mockProperties.filter(property => {
      const matchesSearch = 
        property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = 
        typeFilter === 'all' || 
        property.tag.toLowerCase() === typeFilter.toLowerCase();

      let matchesPrice = true;
      if (priceRange === 'low') {
        matchesPrice = property.price < 500000;
      } else if (priceRange === 'medium') {
        matchesPrice = property.price >= 500000 && property.price < 1000000;
      } else if (priceRange === 'high') {
        matchesPrice = property.price >= 1000000;
      }

      let matchesSaleType = true;
      if (saleTypeFilter === 'auction') {
        matchesSaleType = property.isAuction === true;
      } else if (saleTypeFilter === 'sale') {
        matchesSaleType = property.isAuction === false;
      }

      return matchesSearch && matchesType && matchesPrice && matchesSaleType;
    });
  }, [searchQuery, typeFilter, priceRange, saleTypeFilter]);

  const displayedProperties = filteredProperties.slice(0, displayedCount);
  const hasMore = displayedCount < filteredProperties.length;

  const handleLoadMore = () => {
    setDisplayedCount(prev => prev + 9);
  };

  const toggleFavorite = (propertyId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(propertyId)) {
        newFavorites.delete(propertyId);
      } else {
        newFavorites.add(propertyId);
      }
      return newFavorites;
    });
  };

  return (
    <div className="objects-list-container">
      <div className="objects-list__filters">
        <div className="objects-list__search">
          <FiSearch size={20} />
          <input
            type="text"
            placeholder="Поиск по названию или локации..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="objects-list__filter-group">
          <div className="objects-list__filter">
            <FiSliders size={18} />
            <label>Тип:</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">Все типы</option>
              <option value="house">Дома</option>
              <option value="apartment">Квартиры</option>
              <option value="villa">Виллы</option>
            </select>
          </div>

          <div className="objects-list__filter">
            <label>Цена:</label>
            <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
              <option value="all">Все цены</option>
              <option value="low">До 500 000 $</option>
              <option value="medium">500 000 - 1 000 000 $</option>
              <option value="high">От 1 000 000 $</option>
            </select>
          </div>

          <div className="objects-list__filter">
            <label>Тип продажи:</label>
            <select value={saleTypeFilter} onChange={(e) => setSaleTypeFilter(e.target.value)}>
              <option value="all">Все</option>
              <option value="auction">Аукционные</option>
              <option value="sale">Продажа</option>
            </select>
          </div>
        </div>
      </div>

      <div className="objects-list__grid">
        {displayedProperties.map((property) => (
          <article
            key={property.id}
            className="property-card"
            style={{ cursor: 'pointer' }}
          >
            <div className="property-card__image">
              <img src={property.image} alt={property.name} />
              {property.isAuction && property.endTime && (
                <div className="property-card__timer">
                  <CountdownTimer endTime={property.endTime} />
                </div>
              )}
              <button
                type="button"
                className={`property-card__favorite ${
                  favorites.has(property.id) ? 'property-card__favorite--active' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(property.id);
                }}
              >
                {favorites.has(property.id) ? (
                  <FaHeartSolid size={16} />
                ) : (
                  <FiHeart size={16} />
                )}
              </button>
            </div>

            <div className="property-card__content">
              <span className="property-card__badge">{property.title || property.name}</span>
              <div className="property-card__info">
                <div className="property-card__info-item">
                  <MdBed size={16} />
                  <span>{property.beds || 0}</span>
                </div>
                <div className="property-card__info-item">
                  <MdOutlineBathtub size={16} />
                  <span>{property.baths || 0}</span>
                </div>
                <div className="property-card__info-item">
                  <BiArea size={16} />
                  <span>{property.sqft || 0} м²</span>
                </div>
              </div>
              <p className="property-card__location">{property.location}</p>
              <div className="property-card__price">
                <span className="property-card__price-amount">
                  ${property.price.toLocaleString('ru-RU')}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {hasMore && (
        <div className="objects-list__load-more">
          <button className="objects-list__load-more-btn" onClick={handleLoadMore}>
            Смотреть еще
          </button>
        </div>
      )}
    </div>
  );
};

export default ObjectsList;


