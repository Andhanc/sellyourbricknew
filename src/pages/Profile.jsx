import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import './Profile.css'

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: 'Vlad Tichonenko',
    phone: '+375 33 686-79-11',
    email: 'vladtichonenko',
    avatar: null
  })
  const fileInputRef = useRef(null)

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSave = () => {
    // Здесь можно добавить логику сохранения данных
    setIsEditing(false)
  }

  const handleChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileData(prev => ({
          ...prev,
          avatar: reader.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <aside className="profile-sidebar">
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
            <Link to="/profile" className="nav-item active">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" fill="currentColor"/>
                <path d="M10 12C5.58172 12 2 13.7909 2 16V20H18V16C18 13.7909 14.4183 12 10 12Z" fill="currentColor"/>
              </svg>
              <span>Профиль</span>
            </Link>
            <Link to="/data" className="nav-item">
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

          <div className="sidebar-footer">
            <div className="language-selector">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 1C9.5 3 10.5 5.5 10.5 8C10.5 10.5 9.5 13 8 15M8 1C6.5 3 5.5 5.5 5.5 8C5.5 10.5 6.5 13 8 15M1 8H15" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>Русский</span>
            </div>
            <a href="#" className="help-link">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 5V8M8 11H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Справка</span>
            </a>
            <a href="#" className="help-link">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 6H10M6 10H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Яндекс ID для сайта</span>
            </a>
            <div className="copyright">© 2001-2025 Яндекс</div>
          </div>
        </aside>

        <main className="profile-main">
          <div className="profile-header">
            <div className="profile-avatar-wrapper">
              <div 
                className={`profile-avatar ${isEditing ? 'editable' : ''}`}
                onClick={handleAvatarClick}
              >
                {profileData.avatar ? (
                  <img src={profileData.avatar} alt="Avatar" className="avatar-image" />
                ) : (
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                    <defs>
                      <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4A90E2" />
                        <stop offset="100%" stopColor="#357abd" />
                      </linearGradient>
                    </defs>
                    <circle cx="60" cy="60" r="60" fill="url(#avatarGradient)"/>
                    <circle cx="60" cy="48" r="18" fill="white" opacity="0.9"/>
                    <path d="M30 90 Q30 75 60 75 Q90 75 90 90 L90 100 L30 100 Z" fill="white" opacity="0.9"/>
                  </svg>
                )}
                {isEditing && (
                  <div className="avatar-edit-overlay">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 4V20M4 12H20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="avatar-edit-text">Изменить фото</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
            <div className="profile-info">
              <div className="profile-name">
                {isEditing ? (
                  <input
                    type="text"
                    className="profile-name-input"
                    value={profileData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    autoFocus
                  />
                ) : (
                  <h1>{profileData.name}</h1>
                )}
                {!isEditing ? (
                  <button className="edit-button" onClick={handleEdit} aria-label="Редактировать">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M12.75 2.25C13.0721 1.92788 13.4563 1.70947 13.8874 1.61553C14.3185 1.52159 14.767 1.46849 15.2188 1.47159C15.6706 1.47469 16.1188 1.53394 16.5474 1.63628C16.976 1.73862 17.3638 1.96012 17.6875 2.28375C18.0111 2.60738 18.2326 2.99525 18.335 3.42381C18.4373 3.85237 18.4966 4.30056 18.4997 4.75237C18.5028 5.20419 18.4497 5.65269 18.3557 6.08381C18.2618 6.51494 18.0434 6.89912 17.7213 7.22125L6.375 18.5625L1.125 19.875L2.4375 14.625L13.7813 3.28125C13.9001 3.16245 14.0438 3.07141 14.2026 3.01406C14.3614 2.95671 14.5316 2.93439 14.7006 2.94844H14.8L12.75 2.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button className="save-button" onClick={handleSave} aria-label="Сохранить">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M15 4.5L6.75 12.75L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button className="cancel-button" onClick={handleCancel} aria-label="Отменить">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="profile-contacts">
                <div className="contact-item">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3.75 3.75L8.25 8.25M14.25 14.25L9.75 9.75M9.75 9.75L14.25 3.75M9.75 9.75L3.75 14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {isEditing ? (
                    <input
                      type="tel"
                      className="contact-input"
                      value={profileData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+375 33 686-79-11"
                    />
                  ) : (
                    <span>{profileData.phone}</span>
                  )}
                </div>
                <div className="contact-item">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M2 6L9 10L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {isEditing ? (
                    <input
                      type="email"
                      className="contact-input"
                      value={profileData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="vladtichonenko"
                    />
                  ) : (
                    <span>{profileData.email}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="profile-sections">
            <section className="profile-section">
              <div className="section-header">
                <h2 className="section-title">Мои подписки</h2>
                <div className="section-subtitle">Управляйте своими подписками</div>
              </div>
              <div className="section-cards">
                <div className="section-card subscription-card subscription-active">
                  <div className="subscription-badge">Активна</div>
                  <div className="card-icon-wrapper">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <path d="M20 5L25 15H35L27 22L30 32L20 26L10 32L13 22L5 15H15L20 5Z" fill="url(#subscriptionActiveGrad)"/>
                      <defs>
                        <linearGradient id="subscriptionActiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4A90E2" />
                          <stop offset="100%" stopColor="#357abd" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="card-content">
                    <h3>Премиум</h3>
                    <p>Полный доступ ко всем функциям</p>
                    <div className="subscription-price">999 ₽/мес</div>
                  </div>
                </div>
                <div className="section-card subscription-card subscription-inactive">
                  <div className="card-icon-wrapper">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <rect x="8" y="8" width="24" height="24" rx="3" fill="url(#subscriptionInactive1Grad)"/>
                      <path d="M12 20H28M20 12V28" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
                      <defs>
                        <linearGradient id="subscriptionInactive1Grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#999" />
                          <stop offset="100%" stopColor="#666" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="card-content">
                    <h3>Базовый</h3>
                    <p>Основные возможности</p>
                    <div className="subscription-price">499 ₽/мес</div>
                  </div>
                </div>
                <div className="section-card subscription-card subscription-inactive">
                  <div className="card-icon-wrapper">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="12" fill="url(#subscriptionInactive2Grad)"/>
                      <path d="M20 12V20L26 26" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
                      <defs>
                        <linearGradient id="subscriptionInactive2Grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#999" />
                          <stop offset="100%" stopColor="#666" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="card-content">
                    <h3>Стандарт</h3>
                    <p>Расширенные функции</p>
                    <div className="subscription-price">749 ₽/мес</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="profile-section">
              <div className="section-header">
                <h2 className="section-title">Документы</h2>
                <div className="section-subtitle">Храните важные документы в безопасности</div>
              </div>
              <div className="section-cards">
                <div className="section-card">
                  <div className="card-icon-wrapper">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <rect x="8" y="6" width="24" height="28" rx="2" fill="url(#docAllGrad)"/>
                      <path d="M14 14H26M14 18H26M14 22H22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      <defs>
                        <linearGradient id="docAllGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4A90E2" />
                          <stop offset="100%" stopColor="#357abd" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="card-content">
                    <h3>Все</h3>
                    <p>Все документы</p>
                  </div>
                </div>
                <div className="section-card">
                  <div className="card-icon-wrapper">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <rect x="8" y="6" width="24" height="28" rx="2" fill="url(#passportGrad)"/>
                      <circle cx="20" cy="16" r="3" fill="white" opacity="0.8"/>
                      <path d="M14 22C14 22 16 26 20 26C24 26 26 22 26 22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      <defs>
                        <linearGradient id="passportGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4A90E2" />
                          <stop offset="100%" stopColor="#357abd" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="card-content">
                    <h3>Паспорт</h3>
                    <p>Российский паспорт</p>
                  </div>
                  <div className="card-badge">+</div>
                </div>
                <div className="section-card">
                  <div className="card-icon-wrapper">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <rect x="8" y="6" width="24" height="28" rx="2" fill="url(#foreignGrad)"/>
                      <path d="M12 12H28M12 16H28M12 20H24" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      <defs>
                        <linearGradient id="foreignGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4A90E2" />
                          <stop offset="100%" stopColor="#357abd" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="card-content">
                    <h3>Загран</h3>
                    <p>Заграничный паспорт</p>
                  </div>
                  <div className="card-badge">+</div>
                </div>
                <div className="section-card">
                  <div className="card-icon-wrapper">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <rect x="10" y="8" width="20" height="24" rx="2" fill="url(#licenseGrad)"/>
                      <circle cx="20" cy="18" r="4" fill="white" opacity="0.3"/>
                      <path d="M16 24H24" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      <defs>
                        <linearGradient id="licenseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4A90E2" />
                          <stop offset="100%" stopColor="#357abd" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="card-content">
                    <h3>ВУ</h3>
                    <p>Водительское удостоверение</p>
                  </div>
                  <div className="card-badge">+</div>
                </div>
                <div className="section-card">
                  <div className="card-icon-wrapper">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <path d="M20 8L12 14V28L20 34L28 28V14L20 8Z" fill="url(#omsGrad)"/>
                      <path d="M20 12V20M16 16L24 24" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <defs>
                        <linearGradient id="omsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4A90E2" />
                          <stop offset="100%" stopColor="#357abd" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="card-content">
                    <h3>ОМС</h3>
                    <p>Полис ОМС</p>
                  </div>
                  <div className="card-badge">+</div>
                </div>
                <div className="section-card">
                  <div className="card-icon-wrapper">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <rect x="8" y="8" width="24" height="24" rx="3" fill="url(#snilsGrad)"/>
                      <path d="M14 16H26M14 20H26M14 24H22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      <defs>
                        <linearGradient id="snilsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4A90E2" />
                          <stop offset="100%" stopColor="#357abd" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="card-content">
                    <h3>СНИЛС</h3>
                    <p>Страховое свидетельство</p>
                  </div>
                  <div className="card-badge">+</div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default Profile

