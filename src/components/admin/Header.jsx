import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import './Header.css';

const Header = ({ title, onLogout, onBack }) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <div className="header">
      <div className="header-left">
        <button 
          className="btn btn-back" 
          onClick={handleBack}
          aria-label="Вернуться на главную"
          title="Вернуться на главную"
        >
          <FiArrowLeft size={20} />
        </button>
        <button className="btn btn-outline" id="burgerIcon">
          <i className="fas fa-star"></i>
        </button>
        <h1 className="page-title">{title}</h1>
      </div>
      <div className="header-actions">
        <button className="btn btn-outline">
          <i className="fas fa-download"></i> Экспорт в excel
        </button>
        <button className="btn btn-primary" onClick={onLogout}>
          <i className="fas fa-sign-out-alt"></i> Выйти
        </button>
        <div className="user-avatar">AD</div>
      </div>
    </div>
  );
};

export default Header;

