import React, { useState, useMemo, useEffect } from 'react';
import { FiSearch, FiUser, FiHome, FiShield, FiShieldOff, FiX, FiCheck, FiXCircle } from 'react-icons/fi';
import { FaBuilding } from 'react-icons/fa';
import ModerationPropertyDetail from './ModerationPropertyDetail';
import ModerationUserDetail from './ModerationUserDetail';
import './Moderation.css';

// Используем proxy из vite.config.js или полный URL
// В режиме разработки всегда используем относительный путь через proxy
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Моковые данные для модерации пользователей (fallback)
const mockUsersForModeration = [
  {
    id: 1,
    firstName: 'Петр',
    lastName: 'Петров',
    middleName: 'Иванович',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    email: 'petr@example.com',
    phone: '+7 (912) 345-67-89',
    passportNumber: '4512 345678',
    citizenship: 'Российская Федерация',
    accountNumber: '40817810099910004312',
    role: 'seller',
    registrationDate: '2024-02-20',
    moderationStatus: 'pending',
    documents: [
      { name: 'Паспорт', type: 'pdf', url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf', photo: 'https://upload.wikimedia.org/wikipedia/commons/c/c6/%D0%AD%D0%BB%D0%B5%D0%BA%D1%82%D1%80%D0%BE%D0%BD%D0%BD%D1%8B%D0%B9_%D0%BF%D0%B0%D1%81%D0%BF%D0%BE%D1%80%D1%82_%D0%A0%D0%A4.jpg' },
      { name: 'Справка', type: 'pdf', url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf', photo: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80' }
    ],
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
    ]
  },
  {
    id: 2,
    firstName: 'Мария',
    lastName: 'Иванова',
    middleName: 'Сергеевна',
    avatar: 'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=crop&w=200&q=80',
    email: 'maria@example.com',
    phone: '+7 (923) 456-78-90',
    passportNumber: '4513 456789',
    citizenship: 'Российская Федерация',
    accountNumber: '40817810099910004313',
    role: 'buyer',
    registrationDate: '2024-05-12',
    moderationStatus: 'pending',
    documents: [
      { name: 'Паспорт', type: 'pdf', url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf', photo: 'https://upload.wikimedia.org/wikipedia/commons/c/c6/%D0%AD%D0%BB%D0%B5%D0%BA%D1%82%D1%80%D0%BE%D0%BD%D0%BD%D1%8B%D0%B9_%D0%BF%D0%B0%D1%81%D0%BF%D0%BE%D1%80%D1%82_%D0%A0%D0%A4.jpg' }
    ],
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
    ]
  },
  {
    id: 3,
    firstName: 'Сергей',
    lastName: 'Волков',
    middleName: 'Александрович',
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb0b90c07c1?auto=format&fit=crop&w=200&q=80',
    email: 'sergey@example.com',
    phone: '+7 (934) 567-89-01',
    passportNumber: '4514 567890',
    citizenship: 'Российская Федерация',
    accountNumber: '40817810099910004314',
    role: 'seller',
    registrationDate: '2024-08-30',
    moderationStatus: 'pending',
    documents: [
      { name: 'Паспорт', type: 'pdf', url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf', photo: 'https://upload.wikimedia.org/wikipedia/commons/c/c6/%D0%AD%D0%BB%D0%B5%D0%BA%D1%82%D1%80%D0%BE%D0%BD%D0%BD%D1%8B%D0%B9_%D0%BF%D0%B0%D1%81%D0%BF%D0%BE%D1%80%D1%82_%D0%A0%D0%A4.jpg' },
      { name: 'Справка', type: 'pdf', url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf', photo: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80' },
      { name: 'Лицензия', type: 'pdf', url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf', photo: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80' }
    ],
    photos: [
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80'
    ]
  }
];

// Моковые данные для модерации недвижимости
const mockPropertiesForModeration = [
  {
    id: 1,
    title: 'Квартира в центре города',
    type: 'apartment',
    price: 8500000,
    location: 'Costa Adeje, Tenerife',
    ownerName: 'Петр Петров',
    ownerEmail: 'petr@example.com',
    submittedDate: '2024-12-10',
    moderationStatus: 'pending',
    images: 5,
    description: 'Прекрасная квартира с видом на океан',
    imageUrls: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80'
    ],
    documents: [
      { name: 'Свидетельство о праве собственности', type: 'pdf', url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' },
      { name: 'Кадастровый паспорт', type: 'pdf', url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' },
      { name: 'Технический паспорт', type: 'pdf', url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' },
      { name: 'Справка БТИ', type: 'pdf', url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' }
    ]
  },
  {
    id: 2,
    title: 'Вилла на берегу моря',
    type: 'villa',
    price: 25000000,
    location: 'Playa de las Américas, Tenerife',
    ownerName: 'Анна Сидорова',
    ownerEmail: 'anna@example.com',
    submittedDate: '2024-12-12',
    moderationStatus: 'pending',
    images: 8,
    description: 'Роскошная вилла с бассейном',
    imageUrls: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'
    ],
    documents: [
      { name: 'Свидетельство о праве собственности', type: 'pdf', url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' },
      { name: 'Кадастровый паспорт', type: 'pdf', url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' },
      { name: 'Технический паспорт', type: 'pdf', url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' },
      { name: 'Справка БТИ', type: 'pdf', url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' },
      { name: 'Договор купли-продажи', type: 'pdf', url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' }
    ]
  },
  {
    id: 3,
    title: 'Дом в тихом районе',
    type: 'house',
    price: 12000000,
    location: 'Los Cristianos, Tenerife',
    ownerName: 'Сергей Волков',
    ownerEmail: 'sergey@example.com',
    submittedDate: '2024-12-14',
    moderationStatus: 'pending',
    images: 6,
    description: 'Уютный дом для семьи',
    imageUrls: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dbe4eb5f3?auto=format&fit=crop&w=1200&q=80'
    ],
    documents: [
      { name: 'Свидетельство о праве собственности', type: 'pdf', url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' },
      { name: 'Кадастровый паспорт', type: 'pdf', url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' },
      { name: 'Технический паспорт', type: 'pdf', url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' }
    ]
  }
];

const Moderation = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Загрузка документов на верификацию
  useEffect(() => {
    if (activeTab === 'users') {
      loadPendingDocuments();
    }
  }, [activeTab]);

  // Автообновление каждые 5 секунд
  useEffect(() => {
    if (activeTab === 'users') {
      const interval = setInterval(() => {
        loadPendingDocuments();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const loadPendingDocuments = async () => {
    setLoading(true);
    try {
      console.log('🔄 Загрузка документов на верификацию из:', `${API_BASE_URL}/documents/pending`);
      const response = await fetch(`${API_BASE_URL}/documents/pending`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Получены данные от API:', data);
        
        if (data.success && data.data) {
          console.log('✅ Найдено документов:', data.data.length);
          
          // Группируем документы по пользователям
          const groupedByUser = {};
          data.data.forEach(doc => {
            console.log('📄 Обработка документа:', doc);
            
            if (!groupedByUser[doc.user_id]) {
              groupedByUser[doc.user_id] = {
                id: doc.user_id,
                firstName: doc.first_name || 'Не указано',
                lastName: doc.last_name || '',
                email: doc.email || 'Не указано',
                phone: doc.phone_number || 'Не указано',
                role: doc.role || 'buyer',
                documents: []
              };
            }
            groupedByUser[doc.user_id].documents.push({
              id: doc.id,
              document_type: doc.document_type,
              document_photo: doc.document_photo,
              verification_status: doc.verification_status || 'pending',
              created_at: doc.created_at
            });
          });
          
          const usersList = Object.values(groupedByUser);
          console.log('👥 Сгруппировано пользователей:', usersList.length);
          console.log('👥 Список пользователей:', usersList);
          
          setPendingDocuments(usersList);
        } else {
          console.log('⚠️ Нет данных в ответе API');
          setPendingDocuments([]);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Ошибка загрузки документов: ответ не успешный', response.status, errorText);
        setPendingDocuments([]);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки документов:', error);
      setPendingDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (activeTab !== 'users') return [];
    // Используем только реальные данные из API, без моковых
    return pendingDocuments.filter(user => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return (
        fullName.includes(searchQuery.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [activeTab, searchQuery, pendingDocuments]);

  const filteredProperties = useMemo(() => {
    if (activeTab !== 'properties') return [];
    return mockPropertiesForModeration.filter(property => {
      return (
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [activeTab, searchQuery]);

  const handleApprove = async (userId) => {
    try {
      const adminId = localStorage.getItem('userId') || 'admin';
      const response = await fetch(`${API_BASE_URL}/users/${userId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewed_by: adminId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Пользователь одобрен и верифицирован. Ему отправлено уведомление.');
          // Перезагружаем список документов
          loadPendingDocuments();
          setSelectedUser(null);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Ошибка при одобрении пользователя');
      }
    } catch (error) {
      console.error('Ошибка при одобрении пользователя:', error);
      alert('Ошибка при одобрении пользователя');
    }
  };

  const handleReject = async (userId, rejectionReason) => {
    try {
      const adminId = localStorage.getItem('userId') || 'admin';
      const response = await fetch(`${API_BASE_URL}/users/${userId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewed_by: adminId,
          rejection_reason: rejectionReason
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Пользователь отклонен. Ему отправлено уведомление.');
          // Перезагружаем список документов
          loadPendingDocuments();
          setSelectedUser(null);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Ошибка при отклонении пользователя');
      }
    } catch (error) {
      console.error('Ошибка при отклонении пользователя:', error);
      alert('Ошибка при отклонении пользователя');
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      apartment: 'Квартира',
      villa: 'Вилла',
      house: 'Дом'
    };
    return types[type] || type;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'apartment':
        return <FiHome size={32} />;
      case 'villa':
        return <FaBuilding size={32} />;
      case 'house':
        return <FaBuilding size={32} />;
      default:
        return <FiHome size={32} />;
    }
  };

  if (selectedUser) {
    return (
      <ModerationUserDetail
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onRefresh={loadPendingDocuments}
      />
    );
  }

  if (selectedProperty) {
    return (
      <ModerationPropertyDetail
        property={selectedProperty}
        onBack={() => setSelectedProperty(null)}
        onApprove={() => handleApprove('properties', selectedProperty.id)}
        onReject={() => handleReject('properties', selectedProperty.id)}
      />
    );
  }

  return (
    <div className="moderation-container">
      <div className="moderation-tabs" data-active={activeTab}>
        <button
          className={`moderation-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('users');
            setSearchQuery('');
          }}
        >
          <FiUser size={18} />
          Пользователи
        </button>
        <button
          className={`moderation-tab ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('properties');
            setSearchQuery('');
          }}
        >
          <FiHome size={18} />
          Недвижимость
        </button>
      </div>

      <div className="moderation-search">
        <FiSearch className="search-icon" size={20} />
        <input
          type="text"
          placeholder={
            activeTab === 'users'
              ? 'Поиск по имени, фамилии или email...'
              : 'Поиск по названию, локации или владельцу...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="moderation-search-input"
        />
        {searchQuery && (
          <button
            className="clear-search"
            onClick={() => setSearchQuery('')}
            aria-label="Очистить поиск"
          >
            <FiX size={18} />
          </button>
        )}
      </div>

      {activeTab === 'users' && (
        <div className="moderation-content">
          {loading ? (
            <div className="moderation-empty">
              <p>Загрузка документов...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="moderation-empty">
              <p>Нет документов на верификацию</p>
            </div>
          ) : (
            <div className="moderation-list">
              {filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  className="moderation-card"
                  onClick={() => setSelectedUser(user)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="moderation-card__avatar">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={`${user.firstName} ${user.lastName}`} 
                        className="moderation-card__avatar-image"
                      />
                    ) : (
                      <span>
                        {user.firstName[0]}{user.lastName[0]}
                      </span>
                    )}
                  </div>

                  <div className="moderation-card__info">
                    <div className="moderation-card__header">
                      <h3>{user.firstName} {user.lastName}</h3>
                    </div>
                    <p className="moderation-card__email">{user.email}</p>

                    <div className="moderation-card__meta">
                      <div className="moderation-meta-item">
                        <span className="moderation-label">Роль:</span>
                        <span className={`moderation-value moderation-value--${user.role}`}>
                          {user.role === 'buyer' ? 'Покупатель' : 'Продавец'}
                        </span>
                      </div>
                      <div className="moderation-meta-item">
                        <span className="moderation-label">Регистрация:</span>
                        <span className="moderation-value">
                          {new Date(user.registrationDate).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <div className="moderation-meta-item">
                        <span className="moderation-label">Документы:</span>
                        <span className="moderation-value">
                          {user.documents ? user.documents.length : 0} документ(ов) на проверку
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'properties' && (
        <div className="moderation-content">
          {filteredProperties.length === 0 ? (
            <div className="moderation-empty">
              <p>Нет объектов недвижимости на модерации</p>
            </div>
          ) : (
            <div className="moderation-list">
              {filteredProperties.map(property => (
                <div 
                  key={property.id} 
                  className="moderation-card"
                  onClick={() => setSelectedProperty(property)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="moderation-card__image">
                    {getTypeIcon(property.type)}
                  </div>

                  <div className="moderation-card__info">
                    <div className="moderation-card__header">
                      <h3>{property.title}</h3>
                    </div>
                    <p className="moderation-card__location">{property.location}</p>

                    <div className="moderation-card__meta">
                      <div className="moderation-meta-item">
                        <span className="moderation-label">Тип:</span>
                        <span className="moderation-value">{getTypeLabel(property.type)}</span>
                      </div>
                      <div className="moderation-meta-item">
                        <span className="moderation-label">Цена:</span>
                        <span className="moderation-value moderation-value--price">
                          {property.price.toLocaleString('ru-RU')} $
                        </span>
                      </div>
                      <div className="moderation-meta-item">
                        <span className="moderation-label">Владелец:</span>
                        <span className="moderation-value">{property.ownerName}</span>
                      </div>
                      <div className="moderation-meta-item">
                        <span className="moderation-label">Дата подачи:</span>
                        <span className="moderation-value">
                          {new Date(property.submittedDate).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <div className="moderation-meta-item">
                        <span className="moderation-label">Фотографий:</span>
                        <span className="moderation-value">{property.images}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Moderation;


