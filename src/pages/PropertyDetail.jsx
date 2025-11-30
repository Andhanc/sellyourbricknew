import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { properties } from '../data/properties'
import CountdownTimer from '../components/CountdownTimer'
import Footer from '../components/Footer'
import './PropertyDetail.css'

const PropertyDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const property = properties.find(p => p.id === parseInt(id))
  const [selectedImage, setSelectedImage] = useState(0)
  const [bidAmount, setBidAmount] = useState('')

  if (!property) {
    return (
      <div className="property-detail">
        <div className="not-found">
          <h2>Объект не найден</h2>
          <Link to="/" className="btn btn-primary">Вернуться на главную</Link>
        </div>
      </div>
    )
  }

  const formatPrice = (price) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} млн Р`
    }
    return `${price.toLocaleString('ru-RU')} Р/мес`
  }

  const handleBid = (e) => {
    e.preventDefault()
    if (bidAmount && parseFloat(bidAmount) > property.currentBid) {
      alert(`Ставка ${formatPrice(parseFloat(bidAmount))} принята!`)
      setBidAmount('')
    } else {
      alert('Ставка должна быть выше текущей!')
    }
  }

  return (
    <div className="property-detail-page">
      <div className="property-detail">
        <div className="detail-header">
          <button onClick={() => navigate(-1)} className="back-button">
            ← Назад
          </button>
          <div className="detail-nav">
            <Link to="/">Результаты поиска</Link>
            <span> / </span>
            <span>{property.title}</span>
          </div>
        </div>

        <div className="detail-content">
          <div className="detail-left">
            <div className="detail-images">
              <div className="main-image">
                <img 
                  src={property.images[selectedImage]} 
                  alt={property.title}
                />
                <div className="image-controls">
                  <button 
                    className="image-btn"
                    onClick={() => setSelectedImage(Math.max(0, selectedImage - 1))}
                    disabled={selectedImage === 0}
                  >
                    ←
                  </button>
                  <button 
                    className="image-btn"
                    onClick={() => setSelectedImage(Math.min(property.images.length - 1, selectedImage + 1))}
                    disabled={selectedImage === property.images.length - 1}
                  >
                    →
                  </button>
                </div>
              </div>
              <div className="image-thumbnails">
                {property.images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`${property.title} ${index + 1}`}
                    className={selectedImage === index ? 'active' : ''}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </div>
            </div>

            <div className="detail-main">
              <h1 className="detail-title">{property.title}</h1>
              <p className="detail-location">{property.location}</p>
              
              <div className="detail-specs">
                <div className="spec-item">
                  <span className="spec-label">Площадь:</span>
                  <span className="spec-value">{property.area} м²</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Комнат:</span>
                  <span className="spec-value">{property.rooms || 'Студия'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Этаж:</span>
                  <span className="spec-value">{property.floor}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Продавец:</span>
                  <span className="spec-value">{property.seller}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">ID:</span>
                  <span className="spec-value">{property.sellerId}</span>
                </div>
              </div>

              <div className="detail-description">
                <h3>Описание</h3>
                <p>{property.description}</p>
              </div>
            </div>
          </div>

          <div className="detail-sidebar">
            <div className="auction-info">
              <div className="auction-status active">
                Активный аукцион в процессе
              </div>
              
              <CountdownTimer endTime={property.endTime} />

              <div className="current-bid">
                <div className="bid-label">Текущая ставка</div>
                <div className="bid-amount">{formatPrice(property.currentBid)}</div>
              </div>

              <form onSubmit={handleBid} className="bid-form">
                <div className="bid-input-group">
                  <label>Ваша ставка</label>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Минимум ${formatPrice(property.currentBid + (property.currentBid * 0.05))}`}
                    min={property.currentBid + (property.currentBid * 0.05)}
                    step="1000"
                  />
                </div>
                <button type="submit" className="btn btn-bid">
                  Сделать ставку сейчас
                </button>
              </form>

              <div className="bid-warning">
                Все ставки и продажи финальные и не подлежат отмене.
              </div>

              <div className="bid-status">
                <div className="status-item">
                  <span className="status-label">Статус ставки:</span>
                  <span className="status-value">У ВАС НЕТ СТАВОК</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Статус участника:</span>
                  <span className="status-value link">Проверить сейчас &gt;</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Статус продажи:</span>
                  <span className="status-value">Чистая продажа</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default PropertyDetail

