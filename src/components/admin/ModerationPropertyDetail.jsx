import React, { useState, useRef } from 'react';
import { FiArrowLeft, FiChevronLeft, FiChevronRight, FiCheck, FiXCircle, FiFileText, FiVideo, FiImage } from 'react-icons/fi';
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
  const [mediaType, setMediaType] = useState('photos'); // 'photos' или 'videos'
  
  // Функция для определения типа документа
  const getDocumentType = (docUrl, docName) => {
    if (!docUrl) return 'image';
    
    // Проверяем имя файла
    if (docName && (docName.toLowerCase().endsWith('.pdf') || docName.toLowerCase().includes('.pdf'))) {
      return 'pdf';
    }
    
    // Проверяем URL на .pdf
    if (typeof docUrl === 'string') {
      if (docUrl.toLowerCase().endsWith('.pdf') || docUrl.toLowerCase().includes('.pdf')) {
        return 'pdf';
      }
      // Проверяем MIME тип в base64
      if (docUrl.startsWith('data:application/pdf') || docUrl.startsWith('data:application/octet-stream')) {
        return 'pdf';
      }
    }
    
    return 'image';
  };
  
  // Получаем реальные фотографии из property
  let images = [];
  if (property.photos && Array.isArray(property.photos) && property.photos.length > 0) {
    images = property.photos;
  } else if (property.imageUrls && Array.isArray(property.imageUrls)) {
    images = property.imageUrls;
  } else {
    images = mockPropertyImages.slice(0, property.images || 5);
  }
  
  // Парсим photos если это JSON строка
  if (images.length === 0 && property.photos && typeof property.photos === 'string') {
    try {
      const parsed = JSON.parse(property.photos);
      if (Array.isArray(parsed)) {
        images = parsed;
      }
    } catch (e) {
      console.warn('Ошибка парсинга photos:', e);
    }
  }
  
  // Получаем видео из property
  let videos = [];
  if (property.videos && Array.isArray(property.videos) && property.videos.length > 0) {
    videos = property.videos;
  } else if (property.videos && typeof property.videos === 'string') {
    try {
      const parsed = JSON.parse(property.videos);
      if (Array.isArray(parsed)) {
        videos = parsed;
      }
    } catch (e) {
      console.warn('Ошибка парсинга videos:', e);
    }
  }
  
  // Объединяем фото и видео для галереи
  const allMedia = [
    ...images.map((img, idx) => ({ type: 'photo', url: img, index: idx })),
    ...videos.map((video, idx) => ({ 
      type: 'video', 
      url: typeof video === 'string' ? video : (video.url || video.embedUrl || video.videoId),
      videoId: typeof video === 'object' ? video.videoId : null,
      videoType: typeof video === 'object' ? video.type : null,
      thumbnail: typeof video === 'object' ? video.thumbnail : null,
      index: images.length + idx 
    }))
  ];

  const handlePrevMedia = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1));
  };

  const handleNextMedia = () => {
    setCurrentImageIndex((prev) => (prev === allMedia.length - 1 ? 0 : prev + 1));
  };
  
  const getYouTubeEmbedUrl = (videoId) => {
    return `https://www.youtube.com/embed/${videoId}`;
  };
  
  const getGoogleDriveEmbedUrl = (fileId) => {
    return `https://drive.google.com/file/d/${fileId}/preview`;
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
            {allMedia.length > 0 && allMedia[currentImageIndex] && (
              allMedia[currentImageIndex].type === 'video' ? (
                <div style={{ width: '100%', height: '100%', position: 'relative', paddingBottom: '56.25%' }}>
                  <iframe
                    src={
                      allMedia[currentImageIndex].videoType === 'youtube' 
                        ? getYouTubeEmbedUrl(allMedia[currentImageIndex].videoId || allMedia[currentImageIndex].url)
                        : allMedia[currentImageIndex].videoType === 'googledrive'
                          ? getGoogleDriveEmbedUrl(allMedia[currentImageIndex].videoId || allMedia[currentImageIndex].url)
                          : allMedia[currentImageIndex].url
                    }
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <img src={allMedia[currentImageIndex].url} alt={property.title} />
              )
            )}
            
            {allMedia.length > 1 && (
              <>
                <button
                  className="moderation-property-detail__nav-btn moderation-property-detail__nav-btn--prev"
                  onClick={handlePrevMedia}
                  aria-label="Предыдущее"
                >
                  <FiChevronLeft size={24} />
                </button>
                <button
                  className="moderation-property-detail__nav-btn moderation-property-detail__nav-btn--next"
                  onClick={handleNextMedia}
                  aria-label="Следующее"
                >
                  <FiChevronRight size={24} />
                </button>
                
                <div className="moderation-property-detail__image-counter">
                  {currentImageIndex + 1} / {allMedia.length}
                </div>
              </>
            )}
          </div>

          <div className="moderation-property-detail__gallery-info">
            <p className="moderation-property-detail__gallery-info-title">Галерея</p>
            <p className="moderation-property-detail__gallery-info-text">
              {images.length} {images.length === 1 ? 'фотография' : images.length < 5 ? 'фотографии' : 'фотографий'}
              {videos.length > 0 && `, ${videos.length} ${videos.length === 1 ? 'видео' : videos.length < 5 ? 'видео' : 'видео'}`}
            </p>
          </div>
        </div>

        <div className="moderation-property-detail__info">
          <div className="moderation-property-detail__header">
            <h1 className="moderation-property-detail__title">{property.title || 'Без названия'}</h1>
            <div className="moderation-property-detail__badge">
              {getTypeLabel(property.property_type || property.type)}
            </div>
          </div>

          <div className="moderation-property-detail__location">
            <IoLocation size={20} />
            <span>{property.location || property.address || 'Локация не указана'}</span>
          </div>

          <div className="moderation-property-detail__features">
            {property.area && (
              <div className="moderation-property-detail__feature">
                <BiArea size={20} />
                <span>{property.area} м²</span>
              </div>
            )}
            {property.bedrooms && (
              <div className="moderation-property-detail__feature">
                <MdBed size={20} />
                <span>{property.bedrooms}</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="moderation-property-detail__feature">
                <MdOutlineBathtub size={20} />
                <span>{property.bathrooms}</span>
              </div>
            )}
            {property.rooms && (
              <div className="moderation-property-detail__feature">
                <span>Комнат: {property.rooms}</span>
              </div>
            )}
          </div>

          <div className="moderation-property-detail__price">
            {property.price ? `${property.price.toLocaleString('ru-RU')} ${property.currency || 'USD'}` : 'Цена не указана'}
            {property.is_auction === 1 || property.isAuction ? (
              <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                <strong>Аукцион:</strong> Да
                {property.auction_start_date && (
                  <div>Начало: {new Date(property.auction_start_date).toLocaleDateString('ru-RU')}</div>
                )}
                {property.auction_end_date && (
                  <div>Окончание: {new Date(property.auction_end_date).toLocaleDateString('ru-RU')}</div>
                )}
                {property.auction_starting_price && (
                  <div>Стартовая цена: {property.auction_starting_price.toLocaleString('ru-RU')} {property.currency || 'USD'}</div>
                )}
              </div>
            ) : null}
          </div>

          {property.description && (
            <div className="moderation-property-detail__description">
              <h3>Описание объекта</h3>
              <p>{property.description}</p>
            </div>
          )}
          
          {/* Дополнительная информация */}
          <div className="moderation-property-detail__additional-info">
            <h3>Дополнительная информация</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
              {property.floor && (
                <div><strong>Этаж:</strong> {property.floor}</div>
              )}
              {property.total_floors && (
                <div><strong>Всего этажей:</strong> {property.total_floors}</div>
              )}
              {property.year_built && (
                <div><strong>Год постройки:</strong> {property.year_built}</div>
              )}
              {property.land_area && (
                <div><strong>Площадь участка:</strong> {property.land_area} м²</div>
              )}
              {property.renovation && (
                <div><strong>Ремонт:</strong> {property.renovation}</div>
              )}
              {property.condition && (
                <div><strong>Состояние:</strong> {property.condition}</div>
              )}
              {property.heating && (
                <div><strong>Отопление:</strong> {property.heating}</div>
              )}
              {property.water_supply && (
                <div><strong>Водоснабжение:</strong> {property.water_supply}</div>
              )}
              {property.sewerage && (
                <div><strong>Канализация:</strong> {property.sewerage}</div>
              )}
              {property.commercial_type && (
                <div><strong>Тип коммерческой:</strong> {property.commercial_type}</div>
              )}
              {property.business_hours && (
                <div><strong>Часы работы:</strong> {property.business_hours}</div>
              )}
              {(property.test_drive === 1 || property.testDrive === true) && (
                <div style={{ gridColumn: '1 / -1', color: '#0ABAB5', fontWeight: 'bold' }}>
                  ✓ Тест-драйв доступен
                </div>
              )}
            </div>
          </div>
          
          {/* Удобства */}
          <div className="moderation-property-detail__amenities">
            <h3>Удобства</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
              {(property.balcony === 1 || property.balcony === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Балкон</span>
              )}
              {(property.parking === 1 || property.parking === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Парковка</span>
              )}
              {(property.elevator === 1 || property.elevator === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Лифт</span>
              )}
              {(property.garage === 1 || property.garage === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Гараж</span>
              )}
              {(property.pool === 1 || property.pool === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Бассейн</span>
              )}
              {(property.garden === 1 || property.garden === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Сад</span>
              )}
              {(property.electricity === 1 || property.electricity === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Электричество</span>
              )}
              {(property.internet === 1 || property.internet === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Интернет</span>
              )}
              {(property.security === 1 || property.security === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Охрана</span>
              )}
              {(property.furniture === 1 || property.furniture === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Мебель</span>
              )}
              {(property.feature1 === 1 || property.feature1 === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Удобство 1</span>
              )}
              {(property.feature2 === 1 || property.feature2 === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Удобство 2</span>
              )}
              {(property.feature3 === 1 || property.feature3 === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Удобство 3</span>
              )}
              {(property.feature4 === 1 || property.feature4 === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Удобство 4</span>
              )}
              {(property.feature5 === 1 || property.feature5 === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Удобство 5</span>
              )}
              {(property.feature6 === 1 || property.feature6 === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Удобство 6</span>
              )}
              {(property.feature7 === 1 || property.feature7 === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Удобство 7</span>
              )}
              {(property.feature8 === 1 || property.feature8 === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Удобство 8</span>
              )}
              {(property.feature9 === 1 || property.feature9 === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Удобство 9</span>
              )}
              {(property.feature10 === 1 || property.feature10 === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Удобство 10</span>
              )}
              {(property.feature11 === 1 || property.feature11 === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Удобство 11</span>
              )}
              {(property.feature12 === 1 || property.feature12 === true) && (
                <span style={{ padding: '5px 10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>Удобство 12</span>
              )}
            </div>
          </div>

          <div className="moderation-property-detail__owner">
            <h3>Информация о владельце</h3>
            <p><strong>Имя:</strong> {property.first_name || property.ownerName || 'Не указано'} {property.last_name || ''}</p>
            <p><strong>Email:</strong> {property.email || property.ownerEmail || 'Не указано'}</p>
            <p><strong>Телефон:</strong> {property.phone_number || 'Не указано'}</p>
            <p><strong>Дата подачи:</strong> {
              property.created_at 
                ? new Date(property.created_at).toLocaleDateString('ru-RU')
                : property.submittedDate 
                  ? new Date(property.submittedDate).toLocaleDateString('ru-RU')
                  : 'Не указано'
            }</p>
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
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setMediaType('photos')}
            style={{
              padding: '8px 16px',
              backgroundColor: mediaType === 'photos' ? '#0ABAB5' : '#f0f0f0',
              color: mediaType === 'photos' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <FiImage size={18} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
            Фотографии ({images.length})
          </button>
          {videos.length > 0 && (
            <button
              onClick={() => setMediaType('videos')}
              style={{
                padding: '8px 16px',
                backgroundColor: mediaType === 'videos' ? '#0ABAB5' : '#f0f0f0',
                color: mediaType === 'videos' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <FiVideo size={18} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              Видео ({videos.length})
            </button>
          )}
        </div>
        
        {mediaType === 'photos' && (
          <>
            <h2 className="moderation-property-detail__gallery-title">Фотографии объекта</h2>
            <div className="moderation-property-detail__gallery-grid">
              {images.map((img, index) => (
                <div
                  key={index}
                  className={`moderation-property-detail__gallery-item ${
                    currentImageIndex === index && allMedia[currentImageIndex]?.type === 'photo' ? 'moderation-property-detail__gallery-item--active' : ''
                  }`}
                  onClick={() => {
                    const mediaIndex = allMedia.findIndex(m => m.type === 'photo' && m.index === index);
                    if (mediaIndex !== -1) setCurrentImageIndex(mediaIndex);
                  }}
                >
                  <img src={img} alt={`${property.title} ${index + 1}`} />
                  <div className="moderation-property-detail__gallery-overlay">
                    <span>Фото {index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        {mediaType === 'videos' && videos.length > 0 && (
          <>
            <h2 className="moderation-property-detail__gallery-title">Видео объекта</h2>
            <div className="moderation-property-detail__gallery-grid">
              {videos.map((video, index) => {
                const videoUrl = typeof video === 'string' ? video : (video.url || video.embedUrl || video.videoId);
                const videoId = typeof video === 'object' ? video.videoId : null;
                const videoType = typeof video === 'object' ? video.type : null;
                const thumbnail = typeof video === 'object' ? video.thumbnail : null;
                const embedUrl = videoType === 'youtube' 
                  ? getYouTubeEmbedUrl(videoId || videoUrl)
                  : videoType === 'googledrive'
                    ? getGoogleDriveEmbedUrl(videoId || videoUrl)
                    : videoUrl;
                
                return (
                  <div
                    key={index}
                    className="moderation-property-detail__gallery-item"
                    onClick={() => {
                      const mediaIndex = allMedia.findIndex(m => m.type === 'video' && m.index === images.length + index);
                      if (mediaIndex !== -1) setCurrentImageIndex(mediaIndex);
                    }}
                  >
                    {thumbnail ? (
                      <img src={thumbnail} alt={`Видео ${index + 1}`} />
                    ) : (
                      <div style={{ width: '100%', height: '200px', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiVideo size={48} color="#fff" />
                      </div>
                    )}
                    <div className="moderation-property-detail__gallery-overlay">
                      <span>Видео {index + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Документы на недвижимость */}
      {(property.documents || property.ownership_document || property.no_debts_document || 
        property.ownershipDocument || property.noDebtsDocument || 
        property.additional_documents) && (
        <div className="moderation-property-detail__documents-section">
          <h2 className="moderation-property-detail__documents-title">
            <FiFileText size={24} />
            Документы на недвижимость
          </h2>
          <div className="moderation-property-detail__documents-grid">
            {/* Документ о праве собственности */}
            {(property.ownership_document || property.ownershipDocument) && (() => {
              const docUrl = property.ownership_document || property.ownershipDocument;
              const docName = property.ownership_document_name || property.ownershipDocumentName || 'Документ о праве собственности';
              const docType = getDocumentType(docUrl, docName);
              
              return (
                <div 
                  className="moderation-property-detail__document-card"
                  onClick={() => {
                    setSelectedDocument({ type: docType, url: docUrl, name: docName });
                  }}
                >
                  <div className="moderation-property-detail__document-icon">
                    <FiFileText size={32} />
                  </div>
                  <div className="moderation-property-detail__document-info">
                    <h3 className="moderation-property-detail__document-name">
                      {docName}
                    </h3>
                    <span className="moderation-property-detail__document-type">
                      {docType === 'pdf' ? 'PDF документ' : 'Изображение'}
                    </span>
                  </div>
                </div>
              );
            })()}
            
            {/* Справка об отсутствии долгов */}
            {(property.no_debts_document || property.noDebtsDocument) && (() => {
              const docUrl = property.no_debts_document || property.noDebtsDocument;
              const docName = property.no_debts_document_name || property.noDebtsDocumentName || 'Справка об отсутствии долгов';
              const docType = getDocumentType(docUrl, docName);
              
              return (
                <div 
                  className="moderation-property-detail__document-card"
                  onClick={() => {
                    setSelectedDocument({ type: docType, url: docUrl, name: docName });
                  }}
                >
                  <div className="moderation-property-detail__document-icon">
                    <FiFileText size={32} />
                  </div>
                  <div className="moderation-property-detail__document-info">
                    <h3 className="moderation-property-detail__document-name">
                      {docName}
                    </h3>
                    <span className="moderation-property-detail__document-type">
                      {docType === 'pdf' ? 'PDF документ' : 'Изображение'}
                    </span>
                  </div>
                </div>
              );
            })()}
            
            {/* Дополнительные документы */}
            {property.documents && Array.isArray(property.documents) && property.documents.length > 0 && property.documents.map((doc, index) => {
              const documentName = typeof doc === 'string' ? doc : doc.name;
              const documentUrl = typeof doc === 'object' && doc.url ? doc.url : null;
              const documentType = typeof doc === 'object' && doc.type 
                ? doc.type 
                : getDocumentType(documentUrl, documentName);
              
              return (
                <div 
                  key={index} 
                  className="moderation-property-detail__document-card"
                  onClick={() => {
                    setSelectedDocument({ 
                      type: documentType, 
                      url: documentUrl || 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80', 
                      name: documentName 
                    });
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
            
            {/* Дополнительные документы из JSON */}
            {property.additional_documents && (() => {
              let additionalDocs = [];
              if (typeof property.additional_documents === 'string') {
                try {
                  additionalDocs = JSON.parse(property.additional_documents);
                } catch (e) {
                  console.warn('Ошибка парсинга additional_documents:', e);
                }
              } else if (Array.isArray(property.additional_documents)) {
                additionalDocs = property.additional_documents;
              }
              
              return additionalDocs.map((doc, index) => {
                const documentName = typeof doc === 'string' ? doc : (doc.name || `Документ ${index + 1}`);
                const documentUrl = typeof doc === 'object' && doc.url ? doc.url : null;
                const documentType = typeof doc === 'object' && doc.type 
                  ? doc.type 
                  : getDocumentType(documentUrl, documentName);
                
                return (
                  <div 
                    key={`additional_${index}`} 
                    className="moderation-property-detail__document-card"
                    onClick={() => {
                      setSelectedDocument({ 
                        type: documentType, 
                        url: documentUrl || 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80', 
                        name: documentName 
                      });
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
              });
            })()}
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
              selectedDocument.url.startsWith('data:') ? (
                // Для base64 PDF используем embed или object
                <embed
                  src={selectedDocument.url}
                  type="application/pdf"
                  className="moderation-property-detail__document-pdf"
                  style={{ width: '95vw', maxWidth: '1600px', height: '90vh' }}
                />
              ) : (
                <iframe
                  src={`${selectedDocument.url}#toolbar=0`}
                  className="moderation-property-detail__document-pdf"
                  title={selectedDocument.name}
                  style={{ width: '95vw', maxWidth: '1600px', height: '90vh', border: 'none' }}
                />
              )
            ) : (
              <img 
                src={selectedDocument.url} 
                alt={selectedDocument.name}
                style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain' }}
                onError={(e) => {
                  console.error('Ошибка загрузки изображения:', selectedDocument.url);
                  e.target.src = 'https://via.placeholder.com/800x600?text=Ошибка+загрузки+изображения';
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModerationPropertyDetail;


