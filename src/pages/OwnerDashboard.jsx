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
  FiBarChart2,
  FiX,
  FiDownload,
  FiChevronDown,
  FiCalendar,
  FiDollarSign as FiDollar,
  FiClock
} from 'react-icons/fi'
import { MdBed, MdOutlineBathtub } from 'react-icons/md'
import { BiArea } from 'react-icons/bi'
import WelcomeModal from '../components/WelcomeModal'
import QuickAddCard from '../components/QuickAddCard'
import FileUploadModal from '../components/FileUploadModal'
import PropertyCalculatorModal from '../components/PropertyCalculatorModal'
import BiddingHistoryModal from '../components/BiddingHistoryModal'
import { getUserData, saveUserData, logout } from '../services/authService'
import './OwnerDashboard.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

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
    soldDate: '2024-02-10',
    buyer: {
      name: 'Мария Иванова',
      email: 'maria.ivanova@example.com',
      phone: '+7 (999) 123-45-67',
      purchasePrice: 1200000
    }
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
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false)
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false)
  const [isSalesExpanded, setIsSalesExpanded] = useState(false)
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false)
  const [selectedPropertyForHistory, setSelectedPropertyForHistory] = useState(null)
  const [ownerProfile, setOwnerProfile] = useState({
    name: '',
    email: '',
    phone: '',
    passportSeries: '',
    passportNumber: '',
    passportId: ''
  })
  const [isProfileEditing, setIsProfileEditing] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  useEffect(() => {
    // Проверяем, авторизован ли владелец
    const isOwnerLoggedIn = localStorage.getItem('isOwnerLoggedIn')
    if (!isOwnerLoggedIn) {
      navigate('/')
    } else {
      // Подтягиваем данные пользователя из локального хранилища
      const userData = getUserData()
      if (userData && userData.isLoggedIn) {
        setOwnerProfile(prev => ({
          ...prev,
          name: userData.name || 'Пользователь',
          email: userData.email || '',
          phone: userData.phoneFormatted || userData.phone || '',
          passportSeries: userData.passportSeries || '',
          passportNumber: userData.passportNumber || '',
          passportId: userData.passportId || ''
        }))

        // Дополнительно загружаем актуальные данные из БД (если есть ID)
        const loadFromDb = async () => {
          if (!userData.id) return
          try {
            const response = await fetch(`${API_BASE_URL}/users/${userData.id}`)
            if (response.ok) {
              const result = await response.json()
              if (result.success && result.data) {
                const dbUser = result.data
                setOwnerProfile(prev => ({
                  ...prev,
                  name:
                    prev.name ||
                    `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim() ||
                    'Пользователь',
                  email: prev.email || dbUser.email || '',
                  phone: prev.phone || dbUser.phone_number || '',
                  passportSeries: prev.passportSeries || dbUser.passport_series || '',
                  passportNumber: prev.passportNumber || dbUser.passport_number || '',
                  passportId: prev.passportId || dbUser.identification_number || ''
                }))
              }
            }
          } catch (error) {
            console.warn('⚠️ Не удалось загрузить данные владельца из БД:', error)
          }
        }

        loadFromDb()
      }

      // Показываем модальное окно приветствия при первом входе
      // Для тестирования можно временно убрать проверку hasSeenWelcome
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
      if (!hasSeenWelcome) {
        // Небольшая задержка для корректного рендеринга
        setTimeout(() => {
          setShowWelcomeModal(true)
        }, 100)
      }
    }
  }, [navigate])

  // Сохраняем флаг после закрытия модального окна
  const handleWelcomeClose = () => {
    setShowWelcomeModal(false)
    localStorage.setItem('hasSeenWelcome', 'true')
  }

  const handleProfileFieldChange = (field, value) => {
    setOwnerProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleProfileCancel = () => {
    const userData = getUserData()
    if (userData && userData.isLoggedIn) {
      setOwnerProfile({
        name: userData.name || 'Пользователь',
        email: userData.email || '',
        phone: userData.phoneFormatted || userData.phone || '',
        passportSeries: userData.passportSeries || '',
        passportNumber: userData.passportNumber || '',
        passportId: userData.passportId || ''
      })
    }
    setIsProfileEditing(false)
  }

  const handleProfileSave = async () => {
    try {
      setIsSavingProfile(true)
      const userData = getUserData()

      // Парсим ФИО во имя и фамилию для БД
      const fullName = (ownerProfile.name || '').trim()
      const nameParts = fullName.split(' ').filter(Boolean)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      // Обновляем данные в БД, если есть ID пользователя
      if (userData.id) {
        try {
          await fetch(`${API_BASE_URL}/users/${userData.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              first_name: firstName || null,
              last_name: lastName || null,
              email: ownerProfile.email || null,
              phone_number: ownerProfile.phone || null,
              passport_series: ownerProfile.passportSeries || null,
              passport_number: ownerProfile.passportNumber || null,
              identification_number: ownerProfile.passportId || null
            })
          })
        } catch (apiError) {
          console.warn('⚠️ Не удалось обновить данные владельца в БД:', apiError)
        }
      }

      // Обновляем данные в localStorage (как у покупателя)
      const updatedUserData = {
        ...userData,
        name: fullName || userData.name,
        email: ownerProfile.email || userData.email,
        phone: ownerProfile.phone || userData.phone,
        phoneFormatted: ownerProfile.phone || userData.phoneFormatted,
        passportSeries: ownerProfile.passportSeries,
        passportNumber: ownerProfile.passportNumber,
        passportId: ownerProfile.passportId
      }

      saveUserData(updatedUserData, userData.loginMethod || 'whatsapp')
      setIsProfileEditing(false)
    } catch (error) {
      console.error('Ошибка при сохранении профиля владельца:', error)
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleLogout = async () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      try {
        // Используем функцию logout из authService для полной очистки данных
        await logout()
        // Дополнительно удаляем специфичные для продавца флаги
        localStorage.removeItem('isOwnerLoggedIn')
        localStorage.removeItem('hasSeenWelcome')
        // Перенаправляем на главную страницу
        navigate('/')
        // Небольшая задержка перед перезагрузкой, чтобы данные успели очиститься
        setTimeout(() => {
          window.location.reload()
        }, 100)
      } catch (error) {
        console.error('Ошибка при выходе:', error)
        // В случае ошибки все равно очищаем данные и перенаправляем
        localStorage.removeItem('isOwnerLoggedIn')
        localStorage.removeItem('hasSeenWelcome')
        localStorage.removeItem('userRole')
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('userData')
        navigate('/')
        setTimeout(() => {
          window.location.reload()
        }, 100)
      }
    }
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

  const handleExportToExcel = () => {
    // Формируем данные для Excel отчета
    const analyticsData = []
    
    // Заголовки
    analyticsData.push([
      'Название', 
      'Локация', 
      'Цена', 
      'Спальни', 
      'Ванные', 
      'Площадь (м²)', 
      'Статус', 
      'Просмотры', 
      'Запросы', 
      'Дата публикации'
    ])
    
    // Данные по объявлениям
    properties.forEach(property => {
      const statusText = property.status === 'active' ? 'Активно' : 
                        property.status === 'sold' ? 'Продано' : 
                        'На модерации'
      
      analyticsData.push([
        property.title,
        property.location,
        property.price,
        property.beds,
        property.baths,
        property.sqft,
        statusText,
        property.views,
        property.inquiries,
        new Date(property.publishedDate).toLocaleDateString('ru-RU')
      ])
    })
    
    // Добавляем итоговую статистику
    analyticsData.push([])
    analyticsData.push(['ИТОГОВАЯ СТАТИСТИКА'])
    analyticsData.push(['Всего объявлений', totalProperties])
    analyticsData.push(['Активных объявлений', activeProperties])
    analyticsData.push(['Продано объявлений', soldProperties])
    analyticsData.push(['Всего просмотров', totalViews])
    analyticsData.push(['Всего запросов', totalInquiries])
    analyticsData.push(['Общая выручка', properties
      .filter(p => p.status === 'sold')
      .reduce((sum, p) => sum + p.price, 0)])
    analyticsData.push(['Средняя цена', 
      Math.round(properties.reduce((sum, p) => sum + p.price, 0) / totalProperties)])
    analyticsData.push(['Конверсия просмотры → запросы', 
      totalViews > 0 ? ((totalInquiries / totalViews) * 100).toFixed(1) + '%' : '0%'])
    analyticsData.push(['Конверсия запросы → продажи', 
      totalInquiries > 0 ? ((soldProperties / totalInquiries) * 100).toFixed(1) + '%' : '0%'])
    
    // Преобразуем в CSV формат
    const csvContent = analyticsData
      .map(row => row.map(cell => {
        // Экранируем кавычки и запятые
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
          return `"${cell.replace(/"/g, '""')}"`
        }
        return cell
      }).join(','))
      .join('\n')
    
    // Добавляем BOM для правильной кодировки в Excel
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `analytics_report_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="owner-dashboard">
      <header className="owner-dashboard__header">
        <div className="owner-dashboard__header-content">
          <div className="owner-dashboard__header-left">
            <h1 className="owner-dashboard__title">
              {ownerProfile.name || 'Ваш кабинет продавца'}
            </h1>
            <p className="owner-dashboard__subtitle">Управление вашей недвижимостью</p>
          </div>
          <div className="owner-dashboard__header-right">
            <button 
              className="owner-dashboard__icon-btn"
              onClick={() => {
                setIsProfilePanelOpen(true)
                setIsSettingsPanelOpen(false)
              }}
              aria-label="Профиль"
            >
              <FiUser size={20} />
            </button>
            <button 
              className="owner-dashboard__icon-btn"
              onClick={() => {
                setIsSettingsPanelOpen(true)
                setIsProfilePanelOpen(false)
              }}
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

        {/* Блок "Рассчитать стоимость объекта" */}
        {activeTab === 'properties' && (
          <div className="property-calculator-card">
            <div className="property-calculator-card__image">
              <img 
                src="https://t4.ftcdn.net/jpg/18/28/02/25/360_F_1828022572_oAUGr6FsgeCSUty8xFbtsj2pOwXdthho.jpg" 
                alt="Рассчитать стоимость объекта" 
              />
            </div>
            <div className="property-calculator-card__content">
              <h2 className="property-calculator-card__title">Рассчитать стоимость объекта</h2>
              <p className="property-calculator-card__description">
                Узнайте рыночную стоимость вашей недвижимости за несколько минут
              </p>
              <button 
                className="property-calculator-card__button"
                onClick={() => setIsCalculatorModalOpen(true)}
              >
                Начать расчет
              </button>
            </div>
          </div>
        )}

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
                    {property.status === 'active' && (
                      <button
                        className="action-btn action-btn--history"
                        onClick={() => setSelectedPropertyForHistory(property)}
                      >
                        <FiClock size={16} />
                        История
                      </button>
                    )}
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
              <div className="analytics-section__header">
                <h2 className="analytics-section__title">Аналитика продаж</h2>
                <button 
                  className="analytics-section__export-btn"
                  onClick={handleExportToExcel}
                  aria-label="Получить Excel отчет"
                >
                  <FiDownload size={18} />
                  <span>Получить Excel отчет</span>
                </button>
              </div>
              
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
              </div>

              {/* Блоки "Статистика по статусам" и "Мои продажи" в одной линии */}
              <div className="analytics-bottom-row">
                <div className="analytics-card analytics-card--half">
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

                {/* Блок "Мои продажи" */}
                <div className="my-sales-card my-sales-card--inline">
                  <button 
                  className="my-sales-card__header"
                  onClick={() => setIsSalesExpanded(!isSalesExpanded)}
                  aria-expanded={isSalesExpanded}
                >
                  <h3 className="my-sales-card__title">Мои продажи</h3>
                  <FiChevronDown 
                    size={24} 
                    className={`my-sales-card__icon ${isSalesExpanded ? 'my-sales-card__icon--expanded' : ''}`}
                  />
                  </button>
                  
                  {isSalesExpanded && (
                    <div className="my-sales-card__content">
                    {properties.filter(p => p.status === 'sold' && p.buyer).length > 0 ? (
                      <div className="sales-list">
                        {properties
                          .filter(p => p.status === 'sold' && p.buyer)
                          .map((property) => (
                            <div key={property.id} className="sale-item">
                              <div className="sale-item__image">
                                <img src={property.image} alt={property.title} />
                              </div>
                              <div className="sale-item__info">
                                <h4 className="sale-item__property-title">{property.title}</h4>
                                <p className="sale-item__property-location">{property.location}</p>
                                
                                <div className="sale-item__buyer">
                                  <div className="sale-item__buyer-info">
                                    <div className="sale-item__buyer-field">
                                      <FiUser size={16} />
                                      <span className="sale-item__buyer-label">Покупатель:</span>
                                      <span className="sale-item__buyer-value">{property.buyer.name}</span>
                                    </div>
                                    <div className="sale-item__buyer-field">
                                      <FiDollar size={16} />
                                      <span className="sale-item__buyer-label">Цена продажи:</span>
                                      <span className="sale-item__buyer-value sale-item__buyer-value--price">
                                        ${property.buyer.purchasePrice.toLocaleString('ru-RU')}
                                      </span>
                                    </div>
                                    <div className="sale-item__buyer-field">
                                      <FiCalendar size={16} />
                                      <span className="sale-item__buyer-label">Дата продажи:</span>
                                      <span className="sale-item__buyer-value">
                                        {new Date(property.soldDate).toLocaleDateString('ru-RU', {
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                    <div className="sale-item__buyer-field">
                                      <span className="sale-item__buyer-label">Email:</span>
                                      <span className="sale-item__buyer-value">{property.buyer.email}</span>
                                    </div>
                                    <div className="sale-item__buyer-field">
                                      <span className="sale-item__buyer-label">Телефон:</span>
                                      <span className="sale-item__buyer-value">{property.buyer.phone}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="sales-empty">
                        <p>У вас пока нет завершенных продаж</p>
                      </div>
                    )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Модальное окно приветствия */}
      <WelcomeModal 
        isOpen={showWelcomeModal}
        onClose={handleWelcomeClose}
        userName={ownerProfile.name || 'Ваш кабинет продавца'}
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

      {/* Модальное окно калькулятора стоимости */}
      <PropertyCalculatorModal
        isOpen={isCalculatorModalOpen}
        onClose={() => setIsCalculatorModalOpen(false)}
      />

      {/* Модальное окно истории ставок */}
      <BiddingHistoryModal
        isOpen={!!selectedPropertyForHistory}
        onClose={() => setSelectedPropertyForHistory(null)}
        property={selectedPropertyForHistory}
      />

      {/* Панель профиля */}
      {isProfilePanelOpen && (
        <>
          <div 
            className="owner-sidebar-backdrop"
            onClick={() => setIsProfilePanelOpen(false)}
          />
          <div className="owner-sidebar-panel owner-sidebar-panel--profile">
            <div className="owner-sidebar-panel__content">
              <div className="owner-sidebar-panel__header">
                <h3 className="owner-sidebar-panel__title">Профиль</h3>
                <button 
                  type="button" 
                  className="owner-sidebar-panel__close"
                  onClick={() => setIsProfilePanelOpen(false)}
                  aria-label="Закрыть профиль"
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="owner-sidebar-panel__body">
                <div className="owner-profile-section">
                  <h4 className="owner-profile-section__title">ФИО</h4>
                  {isProfileEditing ? (
                    <input
                      type="text"
                      className="owner-profile-section__value-input"
                      value={ownerProfile.name}
                      onChange={(e) => handleProfileFieldChange('name', e.target.value)}
                      placeholder="Введите ФИО"
                    />
                  ) : (
                    <p className="owner-profile-section__value">
                      {ownerProfile.name || 'Имя не указано'}
                    </p>
                  )}
                </div>
                <div className="owner-profile-section">
                  <h4 className="owner-profile-section__title">Паспортные данные</h4>
                  <div className="owner-profile-passport">
                    <div className="owner-profile-passport-row">
                      <span className="owner-profile-passport-label">Серия</span>
                      {isProfileEditing ? (
                        <input
                          type="text"
                          className="owner-profile-section__value-input"
                          value={ownerProfile.passportSeries}
                          onChange={(e) => handleProfileFieldChange('passportSeries', e.target.value)}
                          placeholder="Серия паспорта"
                        />
                      ) : (
                        <span className="owner-profile-section__value">
                          {ownerProfile.passportSeries || 'Не указана'}
                        </span>
                      )}
                    </div>
                    <div className="owner-profile-passport-row">
                      <span className="owner-profile-passport-label">Номер</span>
                      {isProfileEditing ? (
                        <input
                          type="text"
                          className="owner-profile-section__value-input"
                          value={ownerProfile.passportNumber}
                          onChange={(e) => handleProfileFieldChange('passportNumber', e.target.value)}
                          placeholder="Номер паспорта"
                        />
                      ) : (
                        <span className="owner-profile-section__value">
                          {ownerProfile.passportNumber || 'Не указан'}
                        </span>
                      )}
                    </div>
                    <div className="owner-profile-passport-row">
                      <span className="owner-profile-passport-label">Идентификационный номер</span>
                      {isProfileEditing ? (
                        <input
                          type="text"
                          className="owner-profile-section__value-input"
                          value={ownerProfile.passportId}
                          onChange={(e) => handleProfileFieldChange('passportId', e.target.value)}
                          placeholder="Идентификационный номер"
                        />
                      ) : (
                        <span className="owner-profile-section__value">
                          {ownerProfile.passportId || 'Не указан'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="owner-profile-section">
                  <h4 className="owner-profile-section__title">Подписка</h4>
                  <p className="owner-profile-section__value">Базовая</p>
                  <button className="owner-profile-section__button">Изменить подписку</button>
                </div>
                <div className="owner-profile-section">
                  <h4 className="owner-profile-section__title">Верификация</h4>
                  <p className="owner-profile-section__value owner-profile-section__value--warning">Не верифицирован</p>
                  <button className="owner-profile-section__button owner-profile-section__button--primary">Пройти верификацию</button>
                </div>
                <div className="owner-profile-section">
                  <h4 className="owner-profile-section__title">Паспортные данные</h4>
                  <p className="owner-profile-section__value">Загружено</p>
                  <button className="owner-profile-section__button">Изменить</button>
                </div>
                <div className="owner-profile-section">
                  <h4 className="owner-profile-section__title">Почта</h4>
                  {isProfileEditing ? (
                    <input
                      type="email"
                      className="owner-profile-section__value-input"
                      value={ownerProfile.email}
                      onChange={(e) => handleProfileFieldChange('email', e.target.value)}
                      placeholder="Введите email"
                    />
                  ) : (
                    <p className="owner-profile-section__value">
                      {ownerProfile.email || 'Email не указан'}
                    </p>
                  )}
                </div>
                <div className="owner-profile-section">
                  <h4 className="owner-profile-section__title">WhatsApp</h4>
                  {isProfileEditing ? (
                    <input
                      type="tel"
                      className="owner-profile-section__value-input"
                      value={ownerProfile.phone}
                      onChange={(e) => handleProfileFieldChange('phone', e.target.value)}
                      placeholder="Введите номер телефона"
                    />
                  ) : (
                    <p className="owner-profile-section__value">
                      {ownerProfile.phone || 'Телефон не указан'}
                    </p>
                  )}
                </div>

                <div className="owner-profile-section owner-profile-section--actions">
                  {!isProfileEditing ? (
                    <button
                      className="owner-profile-section__button owner-profile-section__button--primary"
                      onClick={() => setIsProfileEditing(true)}
                    >
                      Редактировать профиль
                    </button>
                  ) : (
                    <div className="owner-profile-actions">
                      <button
                        className="owner-profile-section__button owner-profile-section__button--primary"
                        onClick={handleProfileSave}
                        disabled={isSavingProfile}
                      >
                        {isSavingProfile ? 'Сохранение...' : 'Сохранить'}
                      </button>
                      <button
                        className="owner-profile-section__button"
                        onClick={handleProfileCancel}
                        disabled={isSavingProfile}
                      >
                        Отмена
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Панель настроек */}
      {isSettingsPanelOpen && (
        <>
          <div 
            className="owner-sidebar-backdrop"
            onClick={() => setIsSettingsPanelOpen(false)}
          />
          <div className="owner-sidebar-panel owner-sidebar-panel--settings">
            <div className="owner-sidebar-panel__content">
              <div className="owner-sidebar-panel__header">
                <h3 className="owner-sidebar-panel__title">Настройки</h3>
                <button 
                  type="button" 
                  className="owner-sidebar-panel__close"
                  onClick={() => setIsSettingsPanelOpen(false)}
                  aria-label="Закрыть настройки"
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="owner-sidebar-panel__body">
                <div className="owner-settings-section">
                  <h4 className="owner-settings-section__title">Смена языка</h4>
                  <select className="owner-settings-section__select">
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>
                <div className="owner-settings-section">
                  <h4 className="owner-settings-section__title">Смена пароля</h4>
                  <button className="owner-settings-section__button">Изменить пароль</button>
                </div>
                <div className="owner-settings-section">
                  <h4 className="owner-settings-section__title">Уведомления</h4>
                  <div className="owner-settings-section__toggle">
                    <label className="owner-toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="owner-toggle-slider"></span>
                    </label>
                    <span className="owner-toggle-label">Включить уведомления</span>
                  </div>
                  <div className="owner-settings-section__toggle">
                    <label className="owner-toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="owner-toggle-slider"></span>
                    </label>
                    <span className="owner-toggle-label">Email уведомления</span>
                  </div>
                  <div className="owner-settings-section__toggle">
                    <label className="owner-toggle-switch">
                      <input type="checkbox" />
                      <span className="owner-toggle-slider"></span>
                    </label>
                    <span className="owner-toggle-label">SMS уведомления</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default OwnerDashboard
