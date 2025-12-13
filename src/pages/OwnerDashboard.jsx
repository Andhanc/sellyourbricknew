import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FiHome, 
  FiDollarSign, 
  FiList, 
  FiTrendingUp,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiPlus,
  FiLogOut,
  FiUser,
  FiSettings,
  FiBarChart2
} from 'react-icons/fi'
import { MdBed, MdOutlineBathtub } from 'react-icons/md'
import { BiArea } from 'react-icons/bi'
import WelcomeModal from '../components/WelcomeModal'
import QuickAddCard from '../components/QuickAddCard'
import FileUploadModal from '../components/FileUploadModal'
import './OwnerDashboard.css'

// Демонстрационные данные объявлений владельца
const mockOwnerProperties = [
  {
    id: 1,
    title: 'Lakeshore Blvd West',
    location: 'Costa Adeje, Tenerife',
    price: 797500,
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
    beds: 2,
    baths: 2,
    sqft: 2000,
    status: 'active',
    views: 1245,
    inquiries: 23,
    publishedDate: '2024-01-15'
  },
  {
    id: 2,
    title: 'Eleanor Pena Property',
    location: 'Playa de las Américas, Tenerife',
    price: 1200000,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    beds: 3,
    baths: 2,
    sqft: 1800,
    status: 'sold',
    views: 2156,
    inquiries: 45,
    publishedDate: '2023-11-20',
    soldDate: '2024-02-10'
  },
  {
    id: 3,
    title: 'Bessie Cooper Property',
    location: 'Los Cristianos, Tenerife',
    price: 950000,
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    beds: 2,
    baths: 1,
    sqft: 1500,
    status: 'active',
    views: 892,
    inquiries: 12,
    publishedDate: '2024-02-01'
  },
  {
    id: 4,
    title: 'Darrell Steward Property',
    location: 'Puerto de la Cruz, Tenerife',
    price: 680000,
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80',
    beds: 1,
    baths: 1,
    sqft: 1200,
    status: 'pending',
    views: 567,
    inquiries: 8,
    publishedDate: '2024-02-20'
  }
]

const OwnerDashboard = () => {
  const navigate = useNavigate()
  const [properties, setProperties] = useState(mockOwnerProperties)
  const [activeTab, setActiveTab] = useState('properties') // 'properties' или 'analytics'
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [showFileUploadModal, setShowFileUploadModal] = useState(false)

  useEffect(() => {
    // Проверяем, авторизован ли владелец
    const isOwnerLoggedIn = localStorage.getItem('isOwnerLoggedIn')
    if (!isOwnerLoggedIn) {
      navigate('/')
    } else {
      // Показываем модальное окно приветствия при первом входе
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
      if (!hasSeenWelcome) {
        setShowWelcomeModal(true)
        localStorage.setItem('hasSeenWelcome', 'true')
      }
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('isOwnerLoggedIn')
    localStorage.removeItem('userRole')
    navigate('/')
  }

  // Статистика
  const totalProperties = properties.length
  const soldProperties = properties.filter(p => p.status === 'sold').length
  const activeProperties = properties.filter(p => p.status === 'active').length
  const totalRevenue = properties
    .filter(p => p.status === 'sold')
    .reduce((sum, p) => sum + p.price, 0)
  const totalViews = properties.reduce((sum, p) => sum + p.views, 0)
  const totalInquiries = properties.reduce((sum, p) => sum + p.inquiries, 0)

  const handleDeleteProperty = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить это объявление?')) {
      setProperties(properties.filter(p => p.id !== id))
    }
  }

  const handleEditProperty = (id) => {
    navigate(`/property/${id}/edit`)
  }

  const handleViewProperty = (id) => {
    navigate(`/property/${id}`)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { text: 'Активно', class: 'status-badge--active' },
      sold: { text: 'Продано', class: 'status-badge--sold' },
      pending: { text: 'На модерации', class: 'status-badge--pending' }
    }
    const config = statusConfig[status] || statusConfig.active
    return <span className={`status-badge ${config.class}`}>{config.text}</span>
  }

  return (
    <div className="owner-dashboard">
      <header className="owner-dashboard__header">
        <div className="owner-dashboard__header-content">
          <div className="owner-dashboard__header-left">
            <h1 className="owner-dashboard__title">Панель владельца</h1>
            <p className="owner-dashboard__subtitle">Управление вашей недвижимостью</p>
          </div>
          <div className="owner-dashboard__header-right">
            <button 
              className="owner-dashboard__icon-btn"
              onClick={() => navigate('/profile')}
              aria-label="Профиль"
            >
              <FiUser size={20} />
            </button>
            <button 
              className="owner-dashboard__icon-btn"
              onClick={() => navigate('/owner/settings')}
              aria-label="Настройки"
            >
              <FiSettings size={20} />
            </button>
            <button 
              className="owner-dashboard__add-btn"
              onClick={() => navigate('/owner/property/new')}
            >
              <FiPlus size={20} />
              <span>Добавить объявление</span>
            </button>
            <button 
              className="owner-dashboard__logout-btn"
              onClick={handleLogout}
            >
              <FiLogOut size={20} />
              <span>Выйти</span>
            </button>
          </div>
        </div>
        
        {/* Переключатель вкладок */}
        <div className="owner-dashboard__tabs">
          <button
            className={`owner-dashboard__tab ${activeTab === 'properties' ? 'owner-dashboard__tab--active' : ''}`}
            onClick={() => setActiveTab('properties')}
          >
            <FiList size={20} />
            <span>Объявления</span>
          </button>
          <button
            className={`owner-dashboard__tab ${activeTab === 'analytics' ? 'owner-dashboard__tab--active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <FiBarChart2 size={20} />
            <span>Аналитика</span>
          </button>
        </div>
      </header>

      <div className="owner-dashboard__content">
        {/* Статистика - показывается всегда */}
        <section className="owner-dashboard__stats">
          <QuickAddCard onClick={() => setShowFileUploadModal(true)} />

          <div className="stat-card stat-card--properties">
            <div className="stat-card__icon">
              <FiHome size={32} />
            </div>
            <div className="stat-card__content">
              <h3 className="stat-card__label">Всего объявлений</h3>
              <p className="stat-card__value">{totalProperties}</p>
              <p className="stat-card__subtext">Активных: {activeProperties}</p>
            </div>
          </div>

          <div className="stat-card stat-card--views">
            <div className="stat-card__icon">
              <FiEye size={32} />
            </div>
            <div className="stat-card__content">
              <h3 className="stat-card__label">Просмотры</h3>
              <p className="stat-card__value">{totalViews.toLocaleString('ru-RU')}</p>
              <p className="stat-card__subtext">Запросов: {totalInquiries}</p>
            </div>
          </div>

          <div className="stat-card stat-card--trending">
            <div className="stat-card__icon">
              <FiTrendingUp size={32} />
            </div>
            <div className="stat-card__content">
              <h3 className="stat-card__label">Средняя цена</h3>
              <p className="stat-card__value">
                ${Math.round(properties.reduce((sum, p) => sum + p.price, 0) / totalProperties).toLocaleString('ru-RU')}
              </p>
              <p className="stat-card__subtext">За объект</p>
            </div>
          </div>
        </section>

        {/* Контент вкладок */}
        {activeTab === 'properties' && (
          <section className="owner-dashboard__properties">
          <div className="owner-dashboard__section-header">
            <h2 className="owner-dashboard__section-title">
              <FiList size={24} />
              Мои объявления
            </h2>
            <div className="owner-dashboard__filters">
              <button className="filter-btn filter-btn--active">Все</button>
              <button className="filter-btn">Активные</button>
              <button className="filter-btn">Продано</button>
              <button className="filter-btn">На модерации</button>
            </div>
          </div>

          <div className="properties-list">
            {properties.map((property) => (
              <div key={property.id} className="property-card-owner">
                <div className="property-card-owner__image">
                  <img src={property.image} alt={property.title} />
                  {getStatusBadge(property.status)}
                </div>

                <div className="property-card-owner__content">
                  <div className="property-card-owner__header">
                    <h3 className="property-card-owner__title">{property.title}</h3>
                    <div className="property-card-owner__price">
                      ${property.price.toLocaleString('ru-RU')}
                    </div>
                  </div>

                  <p className="property-card-owner__location">{property.location}</p>

                  <div className="property-card-owner__info">
                    <div className="property-card-owner__info-item">
                      <MdBed size={16} />
                      <span>{property.beds}</span>
                    </div>
                    <div className="property-card-owner__info-item">
                      <MdOutlineBathtub size={16} />
                      <span>{property.baths}</span>
                    </div>
                    <div className="property-card-owner__info-item">
                      <BiArea size={16} />
                      <span>{property.sqft} м²</span>
                    </div>
                  </div>

                  <div className="property-card-owner__stats">
                    <div className="property-card-owner__stat">
                      <FiEye size={14} />
                      <span>{property.views} просмотров</span>
                    </div>
                    <div className="property-card-owner__stat">
                      <span>{property.inquiries} запросов</span>
                    </div>
                    <div className="property-card-owner__stat">
                      <span>Опубликовано: {new Date(property.publishedDate).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>

                  <div className="property-card-owner__actions">
                    <button
                      className="action-btn action-btn--view"
                      onClick={() => handleViewProperty(property.id)}
                    >
                      <FiEye size={16} />
                      Просмотр
                    </button>
                    <button
                      className="action-btn action-btn--edit"
                      onClick={() => handleEditProperty(property.id)}
                    >
                      <FiEdit2 size={16} />
                      Редактировать
                    </button>
                    <button
                      className="action-btn action-btn--delete"
                      onClick={() => handleDeleteProperty(property.id)}
                    >
                      <FiTrash2 size={16} />
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

        {activeTab === 'analytics' && (
          <section className="owner-dashboard__analytics">
            <div className="analytics-section">
              <h2 className="analytics-section__title">Аналитика продаж</h2>
              
              <div className="analytics-grid">
                <div className="analytics-card">
                  <h3 className="analytics-card__title">Динамика продаж</h3>
                  <div className="analytics-chart">
                    <div className="chart-placeholder">
                      <p>График динамики продаж</p>
                      <div className="chart-bars">
                        <div className="chart-bar" style={{ height: '60%' }}></div>
                        <div className="chart-bar" style={{ height: '80%' }}></div>
                        <div className="chart-bar" style={{ height: '45%' }}></div>
                        <div className="chart-bar" style={{ height: '90%' }}></div>
                        <div className="chart-bar" style={{ height: '70%' }}></div>
                        <div className="chart-bar" style={{ height: '85%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="analytics-card">
                  <h3 className="analytics-card__title">Топ объявления</h3>
                  <div className="top-properties">
                    {properties
                      .sort((a, b) => b.views - a.views)
                      .slice(0, 3)
                      .map((property, index) => (
                        <div key={property.id} className="top-property-item">
                          <div className="top-property-item__rank">#{index + 1}</div>
                          <div className="top-property-item__content">
                            <h4 className="top-property-item__title">{property.title}</h4>
                            <p className="top-property-item__stats">
                              {property.views} просмотров · {property.inquiries} запросов
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="analytics-card">
                  <h3 className="analytics-card__title">Конверсия</h3>
                  <div className="conversion-stats">
                    <div className="conversion-item">
                      <span className="conversion-item__label">Просмотры → Запросы</span>
                      <span className="conversion-item__value">
                        {totalViews > 0 ? ((totalInquiries / totalViews) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="conversion-item">
                      <span className="conversion-item__label">Запросы → Продажи</span>
                      <span className="conversion-item__value">
                        {totalInquiries > 0 ? ((soldProperties / totalInquiries) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="conversion-item">
                      <span className="conversion-item__label">Общая конверсия</span>
                      <span className="conversion-item__value">
                        {totalViews > 0 ? ((soldProperties / totalViews) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="analytics-card">
                  <h3 className="analytics-card__title">Статистика по статусам</h3>
                  <div className="status-stats">
                    <div className="status-stat-item">
                      <div className="status-stat-item__indicator status-stat-item__indicator--active"></div>
                      <div className="status-stat-item__content">
                        <span className="status-stat-item__label">Активные</span>
                        <span className="status-stat-item__value">{activeProperties}</span>
                      </div>
                    </div>
                    <div className="status-stat-item">
                      <div className="status-stat-item__indicator status-stat-item__indicator--sold"></div>
                      <div className="status-stat-item__content">
                        <span className="status-stat-item__label">Продано</span>
                        <span className="status-stat-item__value">{soldProperties}</span>
                      </div>
                    </div>
                    <div className="status-stat-item">
                      <div className="status-stat-item__indicator status-stat-item__indicator--pending"></div>
                      <div className="status-stat-item__content">
                        <span className="status-stat-item__label">На модерации</span>
                        <span className="status-stat-item__value">
                          {properties.filter(p => p.status === 'pending').length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Модальное окно приветствия */}
      <WelcomeModal 
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        userName="Иван Иванов"
      />

      {/* Модальное окно загрузки файла */}
      <FileUploadModal
        isOpen={showFileUploadModal}
        onClose={() => setShowFileUploadModal(false)}
        onSuccess={() => {
          // Здесь можно обновить список объявлений после успешной загрузки
          console.log('Файл успешно загружен!')
        }}
      />
    </div>
  )
}

export default OwnerDashboard
