import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, change, changeType, icon, iconClass }) => {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconClass}`}>
        <i className={icon}></i>
      </div>
      <div className="stat-header">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        {change && (
          <div className={`stat-change ${changeType}`}>
            <i className={`fas fa-arrow-${changeType === 'positive' ? 'up' : 'down'}`}></i>
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

