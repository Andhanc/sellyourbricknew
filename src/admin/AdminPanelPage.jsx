import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/admin/Sidebar';
import Header from '../components/admin/Header';
import Statistics from '../components/admin/Statistics';
import Operations from '../components/admin/Operations';
import Promotions from '../components/admin/Promotions';
import UsersModal from '../components/admin/UsersModal';
import UsersList from '../components/admin/UsersList';
import Moderation from '../components/admin/Moderation';
import ObjectsList from '../components/admin/ObjectsList';
import AdminChat from '../components/admin/AdminChat';
import { mockBusinessInfo } from '../data/mockData';
import '../styles/admin/global.css';
import './AdminPanelPage.css';

const AdminPanelPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('statistics');
  const [showUsersModal, setShowUsersModal] = useState(false);

  // Проверка авторизации администратора
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
    
    // Если пользователь не авторизован как администратор, перенаправляем на главную
    if (!isAdminLoggedIn || userRole !== 'admin') {
      console.warn('⚠️ Доступ к админ-панели запрещен. Необходима авторизация администратора.')
      navigate('/', { replace: true });
      return;
    }
    
    document.body.classList.add('admin-panel-active');
    return () => {
      document.body.classList.remove('admin-panel-active');
    };
  }, [navigate]);

  const sectionTitles = {
    statistics: 'Статистика',
    users: 'Пользователи',
    moderation: 'Модерация',
    chat: 'Чат',
    objects: 'Объекты'
  };

  // Функция для очистки сессии администратора
  const clearAdminSession = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('isLoggedIn');
  };

  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      // Очищаем данные администратора
      clearAdminSession();
      navigate('/');
      alert('Выход выполнен');
    }
  };

  const handleBack = () => {
    // При переходе на главную автоматически завершаем сессию администратора
    clearAdminSession();
    navigate('/');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'statistics':
        return <Statistics businessInfo={mockBusinessInfo} onShowUsers={() => setShowUsersModal(true)} />;
      case 'users':
        return <UsersList />;
      case 'moderation':
        return <Moderation />;
      case 'chat':
        return <AdminChat />;
      case 'objects':
        return <ObjectsList />;
      default:
        return <Statistics businessInfo={mockBusinessInfo} onShowUsers={() => setShowUsersModal(true)} />;
    }
  };

  return (
    <div className="admin-panel-app">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        onLogout={handleLogout}
      />
      <div className="main-content">
        <Header 
          title={sectionTitles[activeSection] || 'Статистика'} 
          onLogout={handleLogout}
          onBack={handleBack}
        />
        {renderContent()}
      </div>
      <UsersModal
        isOpen={showUsersModal}
        onClose={() => setShowUsersModal(false)}
        businessInfo={mockBusinessInfo}
      />
    </div>
  );
};

export default AdminPanelPage;


