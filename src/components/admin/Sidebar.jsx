import React from 'react';
import { FaChartBar, FaUsers, FaShieldAlt, FaComment, FaBuilding } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ activeSection, onSectionChange }) => {
  const menuItems = [
    { id: 'statistics', icon: FaChartBar, label: 'Статистика' },
    { id: 'users', icon: FaUsers, label: 'Пользователи' },
    { id: 'moderation', icon: FaShieldAlt, label: 'Модерация' },
    { id: 'chat', icon: FaComment, label: 'Чат' },
    { id: 'objects', icon: FaBuilding, label: 'Объекты' }
  ];

  return (
    <div className="sidebar" id="sidebar">
      <div className="sidebar-header">
        <h2>Sellyourbrick</h2>
      </div>
      <div className="sidebar-menu">
        {menuItems.map(item => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.id}
              className={`menu-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => onSectionChange(item.id)}
            >
              <IconComponent size={20} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;


