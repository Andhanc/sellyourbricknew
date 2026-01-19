import React, { useEffect } from 'react';
import { useClerk, useAuth } from '@clerk/clerk-react';
import { FaTimes } from 'react-icons/fa';
import { clearUserData } from '../services/authService';
import './BlockedUserModal.css';

const BlockedUserModal = ({ isOpen }) => {
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();

  // Блокируем прокрутку body когда модальное окно открыто
  useEffect(() => {
    if (isOpen) {
      // Сохраняем текущую позицию прокрутки
      const scrollY = window.scrollY;
      // Блокируем прокрутку
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Восстанавливаем прокрутку при закрытии
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEmailClick = () => {
    // Можно настроить email для оспаривания
    const email = 'support@example.com'; // Замените на реальный email
    window.location.href = `mailto:${email}?subject=Оспаривание блокировки аккаунта`;
  };

  const handleClose = async () => {
    // Если есть активная сессия Clerk — выходим и там,
    // чтобы не происходила повторная автоматическая авторизация
    try {
      if (isSignedIn && signOut) {
        await signOut();
      }
    } catch (e) {
      console.warn('⚠️ Ошибка при выходе из Clerk в BlockedUserModal:', e);
    }

    // Очищаем все данные пользователя из localStorage (включая флаги блокировки)
    clearUserData();
    
    // Перенаправляем на главную, чтобы приложение загрузилось "с нуля"
    window.location.href = '/';
  };

  // Предотвращаем закрытие модального окна при клике на затемненный фон
  const handleOverlayClick = (e) => {
    // Разрешаем клики только по самому модальному окну
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div 
      className="blocked-user-modal-overlay"
      onClick={handleOverlayClick}
      onContextMenu={(e) => e.preventDefault()} // Предотвращаем контекстное меню
    >
      <div className="blocked-user-modal">
        <button 
          className="blocked-user-modal-close"
          onClick={handleClose}
          aria-label="Выйти из аккаунта"
          title="Выйти из аккаунта"
        >
          <FaTimes size={20} />
        </button>
        <div className="blocked-user-modal-content">
          <div className="blocked-user-icon">
            <i className="fas fa-frown"></i>
          </div>
          <h2 className="blocked-user-title">К сожалению, вы заблокированы</h2>
          <p className="blocked-user-message">
            Для оспаривания напишите на почту
          </p>
          <button 
            className="blocked-user-button"
            onClick={handleEmailClick}
          >
            Перейти
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockedUserModal;

