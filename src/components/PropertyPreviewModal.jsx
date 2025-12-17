import { useState } from 'react'
import { FiX, FiChevronLeft, FiChevronRight, FiMapPin, FiDollarSign, FiCalendar } from 'react-icons/fi'
import { MdBed, MdOutlineBathtub } from 'react-icons/md'
import { BiArea } from 'react-icons/bi'
import './PropertyPreviewModal.css'

const PropertyPreviewModal = ({ isOpen, onClose, propertyData }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!isOpen || !propertyData) return null

  const images = propertyData.photos || []
  const hasImages = images.length > 0

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        <button 
          className="preview-modal__close" 
          onClick={onClose}
          aria-label="Закрыть"
        >
          <FiX size={24} />
        </button>

        <div className="preview-modal__content">
          <h2 className="preview-modal__title">Предпросмотр объявления</h2>

          {/* Изображения */}
          {hasImages && (
            <div className="preview-images">
              <div className="preview-main-image">
                {images.length > 1 && (
                  <>
                    <button 
                      className="preview-nav preview-nav--prev"
                      onClick={prevImage}
                    >
                      <FiChevronLeft size={20} />
                    </button>
                    <button 
                      className="preview-nav preview-nav--next"
                      onClick={nextImage}
                    >
                      <FiChevronRight size={20} />
                    </button>
                  </>
                )}
                <img 
                  src={images[currentImageIndex]} 
                  alt={`Фото ${currentImageIndex + 1}`}
                />
                {images.length > 1 && (
                  <div className="preview-image-counter">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </div>
              
              {images.length > 1 && (
                <div className="preview-thumbnails">
                  {images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Миниатюра ${index + 1}`}
                      className={index === currentImageIndex ? 'active' : ''}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Информация */}
          <div className="preview-info">
            <h1 className="preview-title">{propertyData.title || 'Без названия'}</h1>
            
            {propertyData.location && (
              <div className="preview-location">
                <FiMapPin size={18} />
                <span>{propertyData.location}</span>
              </div>
            )}

            {propertyData.description && (
              <div className="preview-description">
                <h3>Описание</h3>
                <p>{propertyData.description}</p>
              </div>
            )}

            {/* Характеристики */}
            <div className="preview-features">
              {propertyData.area && (
                <div className="preview-feature">
                  <BiArea size={20} />
                  <span>{propertyData.area} м²</span>
                </div>
              )}
              {propertyData.bedrooms && (
                <div className="preview-feature">
                  <MdBed size={20} />
                  <span>{propertyData.bedrooms} спален</span>
                </div>
              )}
              {propertyData.bathrooms && (
                <div className="preview-feature">
                  <MdOutlineBathtub size={20} />
                  <span>{propertyData.bathrooms} санузлов</span>
                </div>
              )}
              {propertyData.rooms && (
                <div className="preview-feature">
                  <span>{propertyData.rooms} комнат</span>
                </div>
              )}
            </div>

            {/* Дополнительная информация */}
            <div className="preview-details">
              {propertyData.floor && (
                <div className="preview-detail-item">
                  <strong>Этаж:</strong> {propertyData.floor}
                  {propertyData.totalFloors && ` из ${propertyData.totalFloors}`}
                </div>
              )}
              {propertyData.yearBuilt && (
                <div className="preview-detail-item">
                  <strong>Год постройки:</strong> {propertyData.yearBuilt}
                </div>
              )}
              {propertyData.propertyType && (
                <div className="preview-detail-item">
                  <strong>Тип:</strong> {
                    propertyData.propertyType === 'apartment' ? 'Квартира' :
                    propertyData.propertyType === 'house' ? 'Дом' :
                    propertyData.propertyType === 'villa' ? 'Вилла' :
                    propertyData.propertyType === 'commercial' ? 'Коммерческая' :
                    propertyData.propertyType
                  }
                </div>
              )}
            </div>

            {/* Цена */}
            {propertyData.price && (
              <div className="preview-price">
                <FiDollarSign size={24} />
                <span className="price-amount">
                  {parseInt(propertyData.price).toLocaleString('ru-RU')} $
                </span>
              </div>
            )}

            {/* Информация об аукционе */}
            {propertyData.isAuction && (
              <div className="preview-auction">
                <div className="auction-badge">Аукцион</div>
                {propertyData.auctionStartDate && propertyData.auctionEndDate && (
                  <div className="auction-dates">
                    <FiCalendar size={18} />
                    <span>
                      {new Date(propertyData.auctionStartDate).toLocaleDateString('ru-RU')} - 
                      {' '}{new Date(propertyData.auctionEndDate).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertyPreviewModal
