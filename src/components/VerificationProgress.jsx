import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheck, FiX, FiFile, FiUser } from 'react-icons/fi';
import './VerificationProgress.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const VerificationProgress = ({ userId }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadVerificationStatus();
    }
  }, [userId]);

  const loadVerificationStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/${userId}/verification-status`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setStatus(result.data);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки статуса верификации:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !status) {
    return null;
  }

  const fieldLabels = {
    firstName: 'Имя',
    lastName: 'Фамилия',
    emailOrPhone: 'Email или телефон',
    country: 'Страна',
    address: 'Адрес',
    passportSeries: 'Серия паспорта',
    passportNumber: 'Номер паспорта',
    identificationNumber: 'Идентификационный номер'
  };

  const missingFieldsList = Object.entries(status.missingFields)
    .filter(([_, isMissing]) => isMissing)
    .map(([field, _]) => fieldLabels[field]);

  const getProgressColor = () => {
    if (status.progress === 100 && status.hasDocuments) return '#10b981'; // green
    if (status.progress >= 75) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="verification-progress">
      <div className="verification-progress__header">
        <h3 className="verification-progress__title">
          {status.isReady ? (
            <>
              <FiCheck className="verification-progress__icon verification-progress__icon--success" />
              Готов к верификации
            </>
          ) : (
            <>
              <FiAlertCircle className="verification-progress__icon verification-progress__icon--warning" />
              Верификация не завершена
            </>
          )}
        </h3>
        <div className="verification-progress__percentage">{status.progress}%</div>
      </div>

      <div className="verification-progress__bar-container">
        <div 
          className="verification-progress__bar"
          style={{ 
            width: `${status.progress}%`,
            backgroundColor: getProgressColor()
          }}
        />
      </div>

      <div className="verification-progress__info">
        <div className="verification-progress__stats">
          <div className="verification-progress__stat">
            <FiUser className="verification-progress__stat-icon" />
            <span>Заполнено полей: {status.filledFields} из {status.totalFields}</span>
          </div>
          <div className="verification-progress__stat">
            <FiFile className="verification-progress__stat-icon" />
            <span>Документов: {status.documentsCount}</span>
          </div>
        </div>

        {!status.isReady && (
          <div className="verification-progress__missing">
            <p className="verification-progress__missing-title">
              Для отправки на верификацию заполните:
            </p>
            <ul className="verification-progress__missing-list">
              {missingFieldsList.map((field, index) => (
                <li key={index} className="verification-progress__missing-item">
                  <FiX className="verification-progress__missing-icon" />
                  {field}
                </li>
              ))}
              {!status.hasDocuments && (
                <li className="verification-progress__missing-item">
                  <FiX className="verification-progress__missing-icon" />
                  Загрузите документы на верификацию
                </li>
              )}
            </ul>
          </div>
        )}

        {status.isReady && (
          <div className="verification-progress__ready">
            <FiCheck className="verification-progress__ready-icon" />
            <p>Все данные заполнены и документы загружены. Ваша заявка будет рассмотрена модератором.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationProgress;


