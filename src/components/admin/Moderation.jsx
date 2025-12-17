import React, { useState, useMemo } from 'react';
import { FiSearch, FiUser, FiHome, FiShield, FiShieldOff, FiX, FiCheck, FiXCircle } from 'react-icons/fi';
import { FaBuilding } from 'react-icons/fa';
import ModerationPropertyDetail from './ModerationPropertyDetail';
import ModerationUserDetail from './ModerationUserDetail';
import './Moderation.css';

// Моковые данные для модерации пользователей
const mockUsersForModeration = [
  {
    id: 1,
    firstName: 'Петр',
    lastName: 'Петров',
    middleName: 'Иванович',
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

  const filteredUsers = useMemo(() => {
    if (activeTab !== 'users') return [];
    return mockUsersForModeration.filter(user => {
      return (
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [activeTab, searchQuery]);

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

  const handleApprove = (type, id) => {
    if (window.confirm(`Вы уверены, что хотите одобрить этот ${type === 'users' ? 'пользователя' : 'объект'}?`)) {
      alert(`${type === 'users' ? 'Пользователь' : 'Объект'} одобрен`);
      if (type === 'users') {
        setSelectedUser(null);
      } else {
        setSelectedProperty(null);
      }
    }
  };

  const handleReject = (type, id) => {
    if (window.confirm(`Вы уверены, что хотите отклонить этот ${type === 'users' ? 'пользователя' : 'объект'}?`)) {
      alert(`${type === 'users' ? 'Пользователь' : 'Объект'} отклонен`);
      if (type === 'users') {
        setSelectedUser(null);
      } else {
        setSelectedProperty(null);
      }
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
        onApprove={() => handleApprove('users', selectedUser.id)}
        onReject={() => handleReject('users', selectedUser.id)}
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
          {filteredUsers.length === 0 ? (
            <div className="moderation-empty">
              <p>Нет пользователей на модерации</p>
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
                    {user.firstName[0]}{user.lastName[0]}
                  </div>

                  <div className="moderation-card__info">
                    <div className="moderation-card__header">
                      <h3>{user.firstName} {user.lastName}</h3>
                      <span className={`moderation-badge moderation-badge--${user.moderationStatus}`}>
                        {user.moderationStatus === 'pending' ? (
                          <FiShieldOff size={14} />
                        ) : (
                          <FiShield size={14} />
                        )}
                        На модерации
                      </span>
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
                        <span className="moderation-value">{user.documents.map(doc => doc.name).join(', ')}</span>
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
                      <span className={`moderation-badge moderation-badge--${property.moderationStatus}`}>
                        <FiShieldOff size={14} />
                        На модерации
                      </span>
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


