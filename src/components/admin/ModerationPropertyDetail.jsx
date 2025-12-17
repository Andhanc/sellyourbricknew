import React, { useState, useRef } from 'react';
import { FiArrowLeft, FiChevronLeft, FiChevronRight, FiCheck, FiXCircle, FiFileText } from 'react-icons/fi';
import { IoLocationOutline as IoLocation } from 'react-icons/io5';
import { MdBed, MdOutlineBathtub } from 'react-icons/md';
import { BiArea } from 'react-icons/bi';
import './ModerationPropertyDetail.css';

// Моковые изображения для недвижимости
const mockPropertyImages = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=1200&q=80'
];

const ModerationPropertyDetail = ({ property, onBack, onApprove, onReject }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const images = property.imageUrls || mockPropertyImages.slice(0, property.images || 5);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const getTypeLabel = (type) => {
    const types = {
      apartment: 'Квартира',
      villa: 'Вилла',
      house: 'Дом'
    };
    return types[type] || type;
  };

  const handleApproveClick = () => {
    if (window.confirm('Вы уверены, что хотите одобрить этот объект недвижимости?')) {
      onApprove(property.id);
    }
  };

  const handleRejectClick = () => {
    if (window.confirm('Вы уверены, что хотите отклонить этот объект недвижимости?')) {
      onReject(property.id);
    }
  };

  return (
    <div className="moderation-property-detail">
      <button className="moderation-property-detail__back" onClick={onBack}>
        <FiArrowLeft size={20} />
        Назад
      </button>

      <div className="moderation-property-detail__content">
        <div className="moderation-property-detail__gallery">
          <div className="moderation-property-detail__main-image">
            <img src={images[currentImageIndex]} alt={property.title} />
            
            {images.length > 1 && (
              <>
                <button
                  className="moderation-property-detail__nav-btn moderation-property-detail__nav-btn--prev"
                  onClick={handlePrevImage}
                  aria-label="Предыдущее изображение"
                >
                  <FiChevronLeft size={24} />
                </button>
                <button
                  className="moderation-property-detail__nav-btn moderation-property-detail__nav-btn--next"
                  onClick={handleNextImage}
                  aria-label="Следующее изображение"
                >
                  <FiChevronRight size={24} />
                </button>
                
                <div className="moderation-property-detail__image-counter">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          <div className="moderation-property-detail__gallery-info">
            <p className="moderation-property-detail__gallery-info-title">Галерея</p>
            <p className="moderation-property-detail__gallery-info-text">
              {images.length} {images.length === 1 ? 'фотография' : images.length < 5 ? 'фотографии' : 'фотографий'} объекта недвижимости
            </p>
          </div>
        </div>

        <div className="moderation-property-detail__info">
          <div className="moderation-property-detail__header">
            <h1 className="moderation-property-detail__title">{property.title}</h1>
            <div className="moderation-property-detail__badge">
              {getTypeLabel(property.type)}
            </div>
          </div>

          <div className="moderation-property-detail__location">
            <IoLocation size={20} />
            <span>{property.location}</span>
          </div>

          <div className="moderation-property-detail__features">
            <div className="moderation-property-detail__feature">
              <BiArea size={20} />
              <span>120 м²</span>
            </div>
            <div className="moderation-property-detail__feature">
              <MdBed size={20} />
              <span>3</span>
            </div>
            <div className="moderation-property-detail__feature">
              <MdOutlineBathtub size={20} />
              <span>2</span>
            </div>
          </div>

          <div className="moderation-property-detail__price">
            {property.price.toLocaleString('ru-RU')} $
          </div>

          {property.description && (
            <div className="moderation-property-detail__description">
              <h3>Описание объекта</h3>
              <p>{property.description}</p>
            </div>
          )}

          <div className="moderation-property-detail__owner">
            <h3>Информация о владельце</h3>
            <p><strong>Имя:</strong> {property.ownerName}</p>
            <p><strong>Email:</strong> {property.ownerEmail}</p>
            <p><strong>Дата подачи:</strong> {new Date(property.submittedDate).toLocaleDateString('ru-RU')}</p>
          </div>

          <div className="moderation-property-detail__actions">
            <button
              className="moderation-property-detail__btn moderation-property-detail__btn--approve"
              onClick={handleApproveClick}
            >
              <FiCheck size={20} />
              Одобрить
            </button>
            <button
              className="moderation-property-detail__btn moderation-property-detail__btn--reject"
              onClick={handleRejectClick}
            >
              <FiXCircle size={20} />
              Отклонить
            </button>
          </div>
        </div>
      </div>

      <div className="moderation-property-detail__gallery-section">
        <h2 className="moderation-property-detail__gallery-title">Фотографии объекта</h2>
        <div className="moderation-property-detail__gallery-grid">
          {images.map((img, index) => (
            <div
              key={index}
              className={`moderation-property-detail__gallery-item ${
                currentImageIndex === index ? 'moderation-property-detail__gallery-item--active' : ''
              }`}
              onClick={() => setCurrentImageIndex(index)}
            >
              <img src={img} alt={`${property.title} ${index + 1}`} />
              <div className="moderation-property-detail__gallery-overlay">
                <span>Фото {index + 1}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {property.documents && property.documents.length > 0 && (
        <div className="moderation-property-detail__documents-section">
          <h2 className="moderation-property-detail__documents-title">
            <FiFileText size={24} />
            Документы на недвижимость
          </h2>
          <div className="moderation-property-detail__documents-grid">
            {property.documents.map((doc, index) => {
              const documentName = typeof doc === 'string' ? doc : doc.name;
              const documentUrl = typeof doc === 'object' && doc.url ? doc.url : null;
              const documentType = typeof doc === 'object' && doc.type ? doc.type : 'image';
              
              return (
                <div 
                  key={index} 
                  className="moderation-property-detail__document-card"
                  onClick={() => {
                    if (documentType === 'pdf' && documentUrl) {
                      setSelectedDocument({ type: 'pdf', url: documentUrl, name: documentName });
                    } else {
                      setSelectedDocument({ type: 'image', url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80', name: documentName });
                    }
                  }}
                >
                  <div className="moderation-property-detail__document-icon">
                    <FiFileText size={32} />
                  </div>
                  <div className="moderation-property-detail__document-info">
                    <h3 className="moderation-property-detail__document-name">{documentName}</h3>
                    <span className="moderation-property-detail__document-type">
                      {documentType === 'pdf' ? 'PDF документ' : 'Изображение'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedDocument && (
        <div 
          className="moderation-property-detail__document-modal"
          onClick={() => setSelectedDocument(null)}
        >
          <div className="moderation-property-detail__document-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="moderation-property-detail__document-modal-close"
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
                className="moderation-property-detail__document-pdf"
                title={selectedDocument.name}
              />
            ) : (
              <img src={selectedDocument.url} alt={selectedDocument.name} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModerationPropertyDetail;


