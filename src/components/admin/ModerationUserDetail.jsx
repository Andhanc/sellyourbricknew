import React, { useState } from 'react';
import { FiArrowLeft, FiUser, FiMail, FiCalendar, FiFileText, FiPhone, FiCreditCard, FiGlobe, FiHash, FiImage, FiDollarSign, FiCheck, FiXCircle } from 'react-icons/fi';
import './ModerationUserDetail.css';

const ModerationUserDetail = ({ user, onBack, onApprove, onReject }) => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const handleApproveClick = () => {
    if (window.confirm('Вы уверены, что хотите одобрить этого пользователя?')) {
      onApprove(user.id);
    }
  };

  const handleRejectClick = () => {
    if (window.confirm('Вы уверены, что хотите отклонить этого пользователя?')) {
      onReject(user.id);
    }
  };

  const fullName = `${user.lastName} ${user.firstName}${user.middleName ? ' ' + user.middleName : ''}`;

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
                  ФИО
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
                  <FiCreditCard size={18} />
                  Номер паспорта
                </div>
                <div className="moderation-user-detail__info-value">
                  {user.passportNumber || 'Не указан'}
                </div>
              </div>

              <div className="moderation-user-detail__info-row">
                <div className="moderation-user-detail__info-label">
                  <FiGlobe size={18} />
                  Гражданство
                </div>
                <div className="moderation-user-detail__info-value">
                  {user.citizenship || 'Не указано'}
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
                  <FiDollarSign size={18} />
                  Номер счета
                </div>
                <div className="moderation-user-detail__info-value">
                  {user.accountNumber || 'Не указан'}
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

              <div className="moderation-user-detail__info-row">
                <div className="moderation-user-detail__info-label">
                  <FiCalendar size={18} />
                  Дата регистрации
                </div>
                <div className="moderation-user-detail__info-value">
                  {new Date(user.registrationDate).toLocaleDateString('ru-RU')}
                </div>
              </div>
            </div>
          </div>

          <div className="moderation-user-detail__actions-card">
            <div className="moderation-user-detail__actions">
              <button
                className="moderation-user-detail__btn moderation-user-detail__btn--approve"
                onClick={handleApproveClick}
              >
                <FiCheck size={20} />
                Одобрить
              </button>
              <button
                className="moderation-user-detail__btn moderation-user-detail__btn--reject"
                onClick={handleRejectClick}
              >
                <FiXCircle size={20} />
                Отклонить
              </button>
            </div>
          </div>
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
              Фотографии документов
            </h2>
            <div className="moderation-user-detail__documents-photos-grid">
              {user.documents && user.documents.length > 0 ? (
                user.documents.map((doc, index) => {
                  const documentName = typeof doc === 'string' ? doc : doc.name;
                  const documentPhoto = typeof doc === 'object' && doc.photo ? doc.photo : null;
                  const documentUrl = typeof doc === 'object' && doc.url ? doc.url : null;
                  const documentType = typeof doc === 'object' && doc.type ? doc.type : 'pdf';

                  if (!documentPhoto) return null;

                  if (documentName === 'Справка') return null;

                  if (documentName === 'Паспорт') {
                    return (
                      <div key={index} className="moderation-user-detail__document-photo-item-full">
                        <div className="moderation-user-detail__document-photo-label">
                          {documentName}
                        </div>
                        <div className="moderation-user-detail__document-photo-image-full">
                          <img src={documentPhoto} alt={documentName} />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={index}
                      className="moderation-user-detail__document-photo-item"
                      onClick={() => {
                        setSelectedPhoto(documentPhoto);
                      }}
                    >
                      <div className="moderation-user-detail__document-photo-image">
                        <img src={documentPhoto} alt={documentName} />
                      </div>
                      <div className="moderation-user-detail__document-photo-label">
                        {documentName}
                      </div>
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

