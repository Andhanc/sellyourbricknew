import React, { useState } from 'react';
import { FiArrowLeft, FiUser, FiMail, FiCalendar, FiFileText, FiPhone, FiCreditCard, FiGlobe, FiHash, FiImage, FiDollarSign, FiCheck, FiXCircle } from 'react-icons/fi';
import { getApiBaseUrlSync } from '../../utils/apiConfig';
import './ModerationUserDetail.css';

const API_BASE_URL = getApiBaseUrlSync();

const ModerationUserDetail = ({ user, onBack, onApprove, onReject, onRefresh }) => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const handleApproveUser = () => {
    if (window.confirm('Вы уверены, что хотите одобрить этого пользователя? Все его документы будут одобрены, и пользователь получит статус верифицированного.')) {
      onApprove('users', user.id);
    }
  };

  const handleRejectUser = () => {
    const rejectionReason = prompt('Укажите причину отклонения (необязательно):') || null;
    if (rejectionReason !== null) { // null если пользователь нажал Cancel
      if (window.confirm('Вы уверены, что хотите отклонить этого пользователя? Все его документы будут отклонены.')) {
        onReject('users', user.id, rejectionReason);
      }
    }
  };

  const getDocumentTypeLabel = (type) => {
    const types = {
      'passport': 'Паспорт',
      'passport_with_face': 'Паспорт + лицо',
      'other': 'Другой документ'
    };
    return types[type] || type || 'Документ';
  };

  const getDocumentImageUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    return `${API_BASE_URL.replace('/api', '')}${photoPath}`;
  };

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Не указано';

  // Отладочная информация
  console.log('👤 Данные пользователя в ModerationUserDetail:', user);
  console.log('💳 Данные карты:', user.cardInfo);

  return (
    <div className="moderation-user-detail">
      <button className="moderation-user-detail__back" onClick={onBack}>
        <FiArrowLeft size={20} />
        Назад
      </button>

      <div className="moderation-user-detail__content">
        <div className="moderation-user-detail__info-section">
          <div className="moderation-user-detail__info-card">
            <h2 className="moderation-user-detail__info-title">Информация о пользователе</h2>
            
            <div className="moderation-user-detail__info-list">
              <div className="moderation-user-detail__info-row">
                <div className="moderation-user-detail__info-label">
                  <FiUser size={18} />
                  Имя
                </div>
                <div className="moderation-user-detail__info-value">
                  {fullName}
                </div>
              </div>

              <div className="moderation-user-detail__info-row">
                <div className="moderation-user-detail__info-label">
                  <FiMail size={18} />
                  Email
                </div>
                <div className="moderation-user-detail__info-value">
                  {user.email}
                </div>
              </div>

              <div className="moderation-user-detail__info-row">
                <div className="moderation-user-detail__info-label">
                  <FiPhone size={18} />
                  Номер телефона
                </div>
                <div className="moderation-user-detail__info-value">
                  {user.phone || 'Не указан'}
                </div>
              </div>

              <div className="moderation-user-detail__info-row">
                <div className="moderation-user-detail__info-label">
                  <FiHash size={18} />
                  ID
                </div>
                <div className="moderation-user-detail__info-value">
                  {user.id}
                </div>
              </div>

              <div className="moderation-user-detail__info-row">
                <div className="moderation-user-detail__info-label">
                  <FiUser size={18} />
                  Роль
                </div>
                <div className={`moderation-user-detail__info-value moderation-user-detail__info-value--${user.role}`}>
                  {user.role === 'buyer' ? 'Покупатель' : 'Продавец'}
                </div>
              </div>

            </div>
          </div>

          {/* Информация о привязанной карте */}
          {user.cardInfo && (
            <div className="moderation-user-detail__info-card">
              <h2 className="moderation-user-detail__info-title">
                <FiCreditCard size={20} />
                Привязанная банковская карта
              </h2>
              
              <div className="moderation-user-detail__info-list">
                <div className="moderation-user-detail__info-row">
                  <div className="moderation-user-detail__info-label">
                    <FiCreditCard size={18} />
                    Номер карты
                  </div>
                  <div className="moderation-user-detail__info-value">
                    {user.cardInfo.maskedCardNumber || 'Не указано'}
                  </div>
                </div>

                {user.cardInfo.last4 && (
                  <div className="moderation-user-detail__info-row">
                    <div className="moderation-user-detail__info-label">
                      <FiHash size={18} />
                      Последние 4 цифры
                    </div>
                    <div className="moderation-user-detail__info-value">
                      **** {user.cardInfo.last4}
                    </div>
                  </div>
                )}

                {user.cardInfo.cardType && (
                  <div className="moderation-user-detail__info-row">
                    <div className="moderation-user-detail__info-label">
                      <FiCreditCard size={18} />
                      Тип карты
                    </div>
                    <div className="moderation-user-detail__info-value">
                      {user.cardInfo.cardType === 'visa' ? 'Visa' : 
                       user.cardInfo.cardType === 'mastercard' ? 'Mastercard' : 
                       user.cardInfo.cardType === 'amex' ? 'American Express' : 
                       user.cardInfo.cardType === 'discover' ? 'Discover' : 
                       user.cardInfo.cardType}
                    </div>
                  </div>
                )}

                {user.cardInfo.expiryDate && (
                  <div className="moderation-user-detail__info-row">
                    <div className="moderation-user-detail__info-label">
                      <FiCalendar size={18} />
                      Срок действия
                    </div>
                    <div className="moderation-user-detail__info-value">
                      {user.cardInfo.expiryDate}
                    </div>
                  </div>
                )}

                {user.cardInfo.cardholderName && (
                  <div className="moderation-user-detail__info-row">
                    <div className="moderation-user-detail__info-label">
                      <FiUser size={18} />
                      Имя держателя
                    </div>
                    <div className="moderation-user-detail__info-value">
                      {user.cardInfo.cardholderName}
                    </div>
                  </div>
                )}

                {user.cardInfo.boundAt && (
                  <div className="moderation-user-detail__info-row">
                    <div className="moderation-user-detail__info-label">
                      <FiCalendar size={18} />
                      Дата привязки
                    </div>
                    <div className="moderation-user-detail__info-value">
                      {new Date(user.cardInfo.boundAt).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        <div className="moderation-user-detail__media-section">
          {user.photos && user.photos.length > 0 && (
            <div className="moderation-user-detail__media-card">
              <h2 className="moderation-user-detail__media-title">
                <FiImage size={20} />
                Фотографии
              </h2>
              <div className="moderation-user-detail__photos-grid">
                <div
                  className="moderation-user-detail__photo-item"
                  onClick={() => setSelectedPhoto(user.photos[0])}
                >
                  <img src={user.photos[0]} alt="Фото пользователя" />
                </div>
              </div>
            </div>
          )}

          <div className="moderation-user-detail__media-card">
            <h2 className="moderation-user-detail__media-title">
              <FiFileText size={20} />
              Документы на верификацию
            </h2>
            <div className="moderation-user-detail__documents-photos-grid">
              {user.documents && user.documents.length > 0 ? (
                user.documents.map((doc) => {
                  const documentPhoto = getDocumentImageUrl(doc.document_photo);
                  const documentName = getDocumentTypeLabel(doc.document_type);
                  const isPassport = doc.document_type === 'passport';
                  const isPassportWithFace = doc.document_type === 'passport_with_face';

                  if (!documentPhoto) return null;

                  return (
                    <div key={doc.id} className="moderation-user-detail__document-item-wrapper">
                      {(isPassport || isPassportWithFace) ? (
                        <div className="moderation-user-detail__document-photo-item-full">
                          <div className="moderation-user-detail__document-photo-label">
                            {documentName}
                          </div>
                          <div className="moderation-user-detail__document-photo-image-full">
                            <img 
                              src={documentPhoto} 
                              alt={documentName}
                              onClick={() => setSelectedPhoto(documentPhoto)}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="moderation-user-detail__document-photo-item">
                          <div 
                            className="moderation-user-detail__document-photo-image"
                            onClick={() => setSelectedPhoto(documentPhoto)}
                            style={{ cursor: 'pointer' }}
                          >
                            <img src={documentPhoto} alt={documentName} />
                          </div>
                          <div className="moderation-user-detail__document-photo-label">
                            {documentName}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="moderation-user-detail__no-documents">Документы не предоставлены</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Кнопки одобрения/отклонения пользователя */}
      <div className="moderation-user-detail__user-actions">
        <button
          className="moderation-user-detail__user-btn moderation-user-detail__user-btn--approve"
          onClick={handleApproveUser}
        >
          <FiCheck size={20} />
          Одобрить пользователя
        </button>
        <button
          className="moderation-user-detail__user-btn moderation-user-detail__user-btn--reject"
          onClick={handleRejectUser}
        >
          <FiXCircle size={20} />
          Отклонить пользователя
        </button>
      </div>

      {selectedDocument && (
        <div
          className="moderation-user-detail__document-modal"
          onClick={() => setSelectedDocument(null)}
        >
          <div className="moderation-user-detail__document-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="moderation-user-detail__document-modal-close"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDocument(null);
              }}
            >
              <FiXCircle size={32} strokeWidth={2} />
            </button>
            {selectedDocument.type === 'pdf' ? (
              <iframe
                src={`${selectedDocument.url}#toolbar=0`}
                className="moderation-user-detail__document-pdf"
                title={selectedDocument.name}
              />
            ) : (
              <img src={selectedDocument.url} alt={selectedDocument.name} />
            )}
          </div>
        </div>
      )}

      {selectedPhoto && (
        <div
          className="moderation-user-detail__photo-modal"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="moderation-user-detail__photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="moderation-user-detail__photo-modal-close"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhoto(null);
              }}
            >
              <FiXCircle size={32} strokeWidth={2} />
            </button>
            <img src={selectedPhoto} alt="Фото пользователя" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ModerationUserDetail;


