import React from 'react';
import { FaChartBar, FaUsers, FaShieldAlt, FaComment, FaBuilding, FaSignOutAlt, FaKey } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ activeSection, onSectionChange, onLogout, adminPermissions }) => {
  // Получаем права доступа из localStorage или пропсов
  const permissions = adminPermissions || JSON.parse(localStorage.getItem('adminPermissions') || '{}');
  const isSuperAdmin = permissions.is_super_admin || false;

  const allMenuItems = [
    { id: 'statistics', icon: FaChartBar, label: 'Статистика', permission: 'can_access_statistics' },
    { id: 'users', icon: FaUsers, label: 'Пользователи', permission: 'can_access_users' },
    { id: 'moderation', icon: FaShieldAlt, label: 'Модерация', permission: 'can_access_moderation' },
    { id: 'chat', icon: FaComment, label: 'Чат', permission: 'can_access_chat' },
    { id: 'objects', icon: FaBuilding, label: 'Объекты', permission: 'can_access_objects' },
    { id: 'access_management', icon: FaKey, label: 'Доступы', permission: 'can_access_access_management' }
  ];

  // Фильтруем пункты меню в зависимости от прав доступа
  const menuItems = allMenuItems.filter(item => {
    if (item.id === 'access_management') {
      return isSuperAdmin || permissions.can_access_access_management;
    }
    return permissions[item.permission] || isSuperAdmin;
  });

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
      <div className="sidebar-footer">
        <button className="menu-item menu-item--logout" onClick={onLogout}>
          <FaSignOutAlt size={20} />
          <span>Выйти</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;


