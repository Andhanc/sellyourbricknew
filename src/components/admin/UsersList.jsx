import React, { useState, useMemo } from 'react';
import { FiSearch, FiUser, FiUserCheck, FiShield, FiShieldOff, FiX } from 'react-icons/fi';
import './UsersList.css';

const mockUsers = [
  {
    id: 1,
    firstName: 'Иван',
    lastName: 'Иванов',
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80',
    role: 'buyer',
    moderationStatus: 'approved',
    isBlocked: false,
    email: 'ivan@example.com',
    registrationDate: '2024-01-15',
    objectsCount: 5
  },
  {
    id: 2,
    firstName: 'Петр',
    lastName: 'Петров',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    role: 'seller',
    moderationStatus: 'pending',
    isBlocked: false,
    email: 'petr@example.com',
    registrationDate: '2024-02-20',
    objectsCount: 12
  },
  {
    id: 3,
    firstName: 'Анна',
    lastName: 'Сидорова',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    role: 'buyer',
    moderationStatus: 'approved',
    isBlocked: false,
    email: 'anna@example.com',
    registrationDate: '2024-03-10',
    objectsCount: 3
  },
  {
    id: 4,
    firstName: 'Алексей',
    lastName: 'Кузнецов',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    role: 'seller',
    moderationStatus: 'approved',
    isBlocked: true,
    email: 'alex@example.com',
    registrationDate: '2024-04-05',
    objectsCount: 8
  },
  {
    id: 5,
    firstName: 'Мария',
    lastName: 'Иванова',
    avatar: 'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=crop&w=200&q=80',
    role: 'buyer',
    moderationStatus: 'pending',
    isBlocked: false,
    email: 'maria@example.com',
    registrationDate: '2024-05-12',
    objectsCount: 0
  },
  {
    id: 6,
    firstName: 'Дмитрий',
    lastName: 'Смирнов',
    avatar: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=200&q=80',
    role: 'seller',
    moderationStatus: 'approved',
    isBlocked: false,
    email: 'dmitry@example.com',
    registrationDate: '2024-06-18',
    objectsCount: 25
  },
  {
    id: 7,
    firstName: 'Елена',
    lastName: 'Петрова',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    role: 'buyer',
    moderationStatus: 'approved',
    isBlocked: false,
    email: 'elena@example.com',
    registrationDate: '2024-07-22',
    objectsCount: 7
  },
  {
    id: 8,
    firstName: 'Сергей',
    lastName: 'Волков',
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb0b90c07c1?auto=format&fit=crop&w=200&q=80',
    role: 'seller',
    moderationStatus: 'pending',
    isBlocked: false,
    email: 'sergey@example.com',
    registrationDate: '2024-08-30',
    objectsCount: 3
  }
];

const UsersList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [users, setUsers] = useState(mockUsers);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      let matchesStatus = true;
      if (statusFilter === 'blocked') {
        matchesStatus = user.isBlocked === true;
      } else if (statusFilter === 'pending' || statusFilter === 'approved') {
        matchesStatus = !user.isBlocked && user.moderationStatus === statusFilter;
      } else if (statusFilter === 'all') {
        matchesStatus = true;
      }
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [searchQuery, roleFilter, statusFilter, users]);

  const handleBlock = (userId) => {
    if (window.confirm('Вы уверены, что хотите заблокировать этого пользователя?')) {
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isBlocked: !user.isBlocked } : user
      ));
    }
  };

  const getRoleLabel = (role) => {
    return role === 'buyer' ? 'Покупатель' : 'Продавец';
  };

  const getRoleIcon = (role) => {
    return role === 'buyer' ? <FiUser size={18} /> : <FiUserCheck size={18} />;
  };

  const getStatusLabel = (status) => {
    return status === 'approved' ? 'Одобрен' : 'На модерации';
  };

  const getStatusBadgeClass = (status) => {
    return status === 'approved' ? 'status-badge--approved' : 'status-badge--pending';
  };

  return (
    <div className="users-list-container">
      <div className="users-filter">
        <div className="filter-search">
          <FiSearch className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Поиск по имени, фамилии или email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-input"
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
        
        <div className="filter-buttons">
          <div className="filter-group">
            <label className="filter-label">Роль:</label>
            <div className="filter-options">
              <button
                className={`filter-btn ${roleFilter === 'all' ? 'active' : ''}`}
                onClick={() => setRoleFilter('all')}
              >
                Все
              </button>
              <button
                className={`filter-btn ${roleFilter === 'buyer' ? 'active' : ''}`}
                onClick={() => setRoleFilter('buyer')}
              >
                Покупатели
              </button>
              <button
                className={`filter-btn ${roleFilter === 'seller' ? 'active' : ''}`}
                onClick={() => setRoleFilter('seller')}
              >
                Продавцы
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Статус:</label>
            <div className="filter-options">
              <button
                className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                Все
              </button>
              <button
                className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setStatusFilter('pending')}
              >
                На модерации
              </button>
              <button
                className={`filter-btn ${statusFilter === 'approved' ? 'active' : ''}`}
                onClick={() => setStatusFilter('approved')}
              >
                Одобрены
              </button>
              <button
                className={`filter-btn ${statusFilter === 'blocked' ? 'active' : ''}`}
                onClick={() => setStatusFilter('blocked')}
              >
                Заблокированы
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="users-list">
        {filteredUsers.length === 0 ? (
          <div className="users-empty">
            <p>Пользователи не найдены</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <div 
              key={user.id} 
              className={`user-card ${user.isBlocked ? 'user-card--blocked' : ''}`}
            >
              <div className="user-card__avatar">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={`${user.firstName} ${user.lastName}`} 
                    className="user-card__avatar-image"
                  />
                ) : (
                  <span>
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </span>
                )}
              </div>
              
              <div className="user-card__info">
                <div className="user-card__name">
                  <h3>{user.firstName} {user.lastName}</h3>
                  {user.isBlocked && (
                    <span className="blocked-badge">Заблокирован</span>
                  )}
                </div>
                <p className="user-card__email">{user.email}</p>
                
                <div className="user-card__meta">
                  <div className="user-meta-item">
                    <span className="meta-label">Роль:</span>
                    <span className={`meta-value meta-value--role meta-value--${user.role}`}>
                      {getRoleIcon(user.role)}
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  
                  <div className="user-meta-item">
                    <span className="meta-label">Регистрация:</span>
                    <span className="meta-value">{new Date(user.registrationDate).toLocaleDateString('ru-RU')}</span>
                  </div>
                  
                  <div className="user-meta-item">
                    <span className="meta-label">
                      {user.role === 'buyer' ? 'Куплено объектов:' : 'Выставлено объектов:'}
                    </span>
                    <span className="meta-value meta-value--objects">{user.objectsCount || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="user-card__actions">
                <button
                  className={`btn-action ${user.isBlocked ? 'btn-action--unblock' : 'btn-action--block'}`}
                  onClick={() => handleBlock(user.id)}
                  title={user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                >
                  {user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="users-stats">
        <div className="stat-item">
          <span className="stat-label">Всего пользователей:</span>
          <span className="stat-value">{users.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Найдено:</span>
          <span className="stat-value">{filteredUsers.length}</span>
        </div>
      </div>
    </div>
  );
};

export default UsersList;


