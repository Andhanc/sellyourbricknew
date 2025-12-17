import React, { useState } from 'react';
import './UsersModal.css';

const UsersModal = ({ isOpen, onClose, businessInfo }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filteredUsers = businessInfo.all_users?.filter(user => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (user.full_name || '').toLowerCase().includes(term) ||
      (user.username || '').toLowerCase().includes(term) ||
      user.telegram_id.toString().includes(term)
    );
  }) || [];

  return (
    <div className="modal" onClick={(e) => e.target.classList.contains('modal') && onClose()}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="modal-header">
          <h3 className="modal-title">Информация о пользователях</h3>
        </div>
        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Поиск по имени, username или Telegram ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-btn" onClick={() => {}}>
            Поиск
          </button>
        </div>
        <div style={{ marginBottom: '1rem', color: 'var(--gray-dark)' }}>
          Всего пользователей: <strong>{searchTerm ? `${filteredUsers.length} из ${businessInfo.all_users?.length || 0}` : businessInfo.all_users?.length || 0}</strong>
        </div>
        <table className="users-table">
          <thead>
            <tr>
              <th>Имя</th>
              <th>Username</th>
              <th>Telegram ID</th>
              <th>Дата регистрации</th>
              <th>Всего баллов</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.full_name || 'Не указано'}</td>
                  <td>@{user.username || '-'}</td>
                  <td>{user.telegram_id}</td>
                  <td>{formatDate(user.registration_date)}</td>
                  <td>{user.total_points}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>
                  {searchTerm ? 'Пользователи не найдены' : 'Нет зарегистрированных пользователей'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersModal;


