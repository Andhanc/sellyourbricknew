import { useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import './Data.css'

const Data = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [userData, setUserData] = useState({
    firstName: 'Vlad',
    lastName: 'Tichonenko',
    middleName: '',
    email: 'vladtichonenko@gmail.com',
    phone: '+375 33 686-79-11',
    address: 'г. Минск, ул. Примерная, д. 1, кв. 10',
    passportSeries: 'AB',
    passportNumber: '1234567',
    identificationNumber: '1234567A001PB1'
  })

  const [connectedAccounts, setConnectedAccounts] = useState({
    google: true
  })

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSave = () => {
    setIsEditing(false)
    // Здесь можно добавить логику сохранения данных
  }

  const handleChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDisconnectAccount = (account) => {
    setConnectedAccounts(prev => ({
      ...prev,
      [account]: false
    }))
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.')) {
      // Здесь можно добавить логику удаления аккаунта
      alert('Аккаунт будет удален')
    }
  }

  return (
    <div className="data-page">
      <div className="data-container">
        <aside className="data-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#gradient1)"/>
                <path d="M2 17L12 22L22 17" stroke="url(#gradient1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="url(#gradient1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4A90E2" />
                    <stop offset="100%" stopColor="#357ABD" />
                  </linearGradient>
                </defs>
              </svg>
              <span>Профиль</span>
            </div>
          </div>
          <nav className="sidebar-nav">
            <Link to="/profile" className="nav-item">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" fill="currentColor"/>
                <path d="M10 12C5.58172 12 2 13.7909 2 16V20H18V16C18 13.7909 14.4183 12 10 12Z" fill="currentColor"/>
              </svg>
              <span>Профиль</span>
            </Link>
            <Link to="/data" className="nav-item active">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 8H14M6 12H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Данные</span>
            </Link>
            <Link to="/subscriptions" className="nav-item">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L12.5 7.5L19 10L12.5 12.5L10 19L7.5 12.5L1 10L7.5 7.5L10 2Z" fill="currentColor"/>
              </svg>
              <span>Подписки</span>
            </Link>
            <Link to="/history" className="nav-item">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 8H14M6 12H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>История</span>
            </Link>
            <Link to="/chat" className="nav-item">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 8H13M7 12H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Чат</span>
            </Link>
            <a href="#" className="nav-item">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L12.5 7.5L19 10L12.5 12.5L10 19L7.5 12.5L1 10L7.5 7.5L10 2Z" fill="currentColor"/>
              </svg>
              <span>Фаворит</span>
            </a>
          </nav>
        </aside>

        <main className="data-main">
          <div className="data-header">
            <h1>Личные данные</h1>
            {!isEditing ? (
              <button className="edit-button" onClick={handleEdit}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M12.75 2.25C13.0721 1.92788 13.4563 1.70947 13.8874 1.61553C14.3185 1.52159 14.767 1.46849 15.2188 1.47159C15.6706 1.47469 16.1188 1.53394 16.5474 1.63628C16.976 1.73862 17.3638 1.96012 17.6875 2.28375C18.0111 2.60738 18.2326 2.99525 18.335 3.42381C18.4373 3.85237 18.4966 4.30056 18.4997 4.75237C18.5028 5.20419 18.4497 5.65269 18.3557 6.08381C18.2618 6.51494 18.0434 6.89912 17.7213 7.22125L6.375 18.5625L1.125 19.875L2.4375 14.625L13.7813 3.28125C13.9001 3.16245 14.0438 3.07141 14.2026 3.01406C14.3614 2.95671 14.5316 2.93439 14.7006 2.94844H14.8L12.75 2.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Редактировать</span>
              </button>
            ) : (
              <div className="edit-actions">
                <button className="save-button" onClick={handleSave}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M15 4.5L6.75 12.75L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Сохранить</span>
                </button>
                <button className="cancel-button" onClick={handleCancel}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Отменить</span>
                </button>
              </div>
            )}
          </div>

          <div className="data-content">
            <section className="data-section">
              <h2 className="section-title">Основная информация</h2>
              <div className="data-grid">
                <div className="data-field">
                  <label>Имя</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className="data-input"
                    />
                  ) : (
                    <div className="data-value">{userData.firstName}</div>
                  )}
                </div>

                <div className="data-field">
                  <label>Фамилия</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className="data-input"
                    />
                  ) : (
                    <div className="data-value">{userData.lastName}</div>
                  )}
                </div>

                <div className="data-field">
                  <label>Отчество</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.middleName}
                      onChange={(e) => handleChange('middleName', e.target.value)}
                      className="data-input"
                      placeholder="Введите отчество"
                    />
                  ) : (
                    <div className="data-value">{userData.middleName || 'Не указано'}</div>
                  )}
                </div>

                <div className="data-field">
                  <label>Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={userData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="data-input"
                    />
                  ) : (
                    <div className="data-value">{userData.email}</div>
                  )}
                </div>

                <div className="data-field">
                  <label>Номер телефона</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={userData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="data-input"
                    />
                  ) : (
                    <div className="data-value">{userData.phone}</div>
                  )}
                </div>

                <div className="data-field data-field-full">
                  <label>Адрес проживания</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className="data-input"
                    />
                  ) : (
                    <div className="data-value">{userData.address}</div>
                  )}
                </div>
              </div>
            </section>

            <section className="data-section">
              <h2 className="section-title">Паспортные данные</h2>
              <div className="data-grid">
                <div className="data-field">
                  <label>Серия паспорта</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.passportSeries}
                      onChange={(e) => handleChange('passportSeries', e.target.value)}
                      className="data-input"
                      maxLength="2"
                    />
                  ) : (
                    <div className="data-value">{userData.passportSeries}</div>
                  )}
                </div>

                <div className="data-field">
                  <label>Номер паспорта</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.passportNumber}
                      onChange={(e) => handleChange('passportNumber', e.target.value)}
                      className="data-input"
                    />
                  ) : (
                    <div className="data-value">{userData.passportNumber}</div>
                  )}
                </div>

                <div className="data-field data-field-full">
                  <label>Идентификационный номер</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={userData.identificationNumber}
                      onChange={(e) => handleChange('identificationNumber', e.target.value)}
                      className="data-input"
                    />
                  ) : (
                    <div className="data-value">{userData.identificationNumber}</div>
                  )}
                </div>
              </div>
            </section>

            <section className="data-section">
              <h2 className="section-title">Подключенные аккаунты</h2>
              <div className="connected-accounts">
                <div className="account-item">
                  <div className="account-info">
                    <div className="account-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    </div>
                    <div className="account-details">
                      <div className="account-name">Google</div>
                      <div className="account-status">
                        {connectedAccounts.google ? 'Подключен' : 'Не подключен'}
                      </div>
                    </div>
                  </div>
                  {connectedAccounts.google && (
                    <button
                      className="disconnect-button"
                      onClick={() => handleDisconnectAccount('google')}
                    >
                      Отключить
                    </button>
                  )}
                </div>
              </div>
            </section>

            <section className="data-section danger-section">
              <div className="danger-actions">
                <div className="danger-info">
                  <h3>Удаление аккаунта</h3>
                  <p>После удаления аккаунта все ваши данные будут безвозвратно удалены. Это действие нельзя отменить.</p>
                </div>
                <button className="delete-account-button" onClick={handleDeleteAccount}>
                  Удалить аккаунт
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default Data

