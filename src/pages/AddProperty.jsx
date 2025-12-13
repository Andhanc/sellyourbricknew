import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FiUpload, 
  FiX, 
  FiChevronLeft, 
  FiChevronRight,
  FiEye,
  FiDollarSign,
  FiHome,
  FiMapPin
} from 'react-icons/fi'
import { PiBuildingApartment, PiBuildings, PiWarehouse } from 'react-icons/pi'
import { MdBed, MdOutlineBathtub } from 'react-icons/md'
import { BiArea } from 'react-icons/bi'
import PropertyPreviewModal from '../components/PropertyPreviewModal'
import DateRangePicker from '../components/DateRangePicker'
import TestDriveModal from '../components/TestDriveModal'
import DocumentsModal from '../components/DocumentsModal'
import './AddProperty.css'

const AddProperty = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  
  const [photos, setPhotos] = useState([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showCarousel, setShowCarousel] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showTestDriveModal, setShowTestDriveModal] = useState(false)
  const [showDocumentsModal, setShowDocumentsModal] = useState(false)
  const [testDriveData, setTestDriveData] = useState(null)
  
  const [formData, setFormData] = useState({
    propertyType: '', // Сначала выбираем тип
    title: '',
    description: '',
    price: '',
    isAuction: false,
    auctionStartDate: '',
    auctionEndDate: '',
    bidStep: '',
    // Общие поля
    area: '',
    rooms: '',
    bedrooms: '',
    bathrooms: '',
    floor: '',
    totalFloors: '',
    yearBuilt: '',
    location: '',
    // Дополнительные поля для квартиры
    balcony: false,
    parking: false,
    elevator: false,
    // Дополнительные поля для дома/виллы
    landArea: '',
    garage: false,
    pool: false,
    garden: false,
    // Дополнительные поля для коммерческой
    commercialType: '',
    businessHours: '',
    // Общие дополнительные
    renovation: '',
    condition: '',
    heating: '',
    waterSupply: '',
    sewerage: '',
    electricity: false,
    internet: false,
    security: false,
    furniture: false,
    // 12 новых чекбоксов
    feature1: false,
    feature2: false,
    feature3: false,
    feature4: false,
    feature5: false,
    feature6: false,
    feature7: false,
    feature8: false,
    feature9: false,
    feature10: false,
    feature11: false,
    feature12: false
  })

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files)
    const remainingSlots = 10 - photos.length
    
    if (files.length > remainingSlots) {
      alert(`Можно загрузить максимум ${remainingSlots} фото`)
      return
    }

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPhotos(prev => [...prev, {
            id: Date.now() + Math.random(),
            url: reader.result,
            file: file
          }])
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const handleRemovePhoto = (id) => {
    setPhotos(photos.filter(photo => photo.id !== id))
    if (currentPhotoIndex >= photos.length - 1) {
      setCurrentPhotoIndex(Math.max(0, photos.length - 2))
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleDetailChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePreview = () => {
    if (!formData.title || photos.length === 0) {
      alert('Пожалуйста, заполните заголовок и загрузите хотя бы одно фото')
      return
    }
    setShowPreview(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Валидация основных полей
    if (!formData.title || photos.length === 0) {
      alert('Пожалуйста, заполните заголовок и загрузите хотя бы одно фото')
      return
    }
    // Открываем второй шаг (модальное окно тест-драйва)
    setShowTestDriveModal(true)
  }

  const handleTestDriveNext = (data) => {
    setTestDriveData(data)
    setShowTestDriveModal(false)
    // Открываем третий шаг (модальное окно документов)
    setShowDocumentsModal(true)
  }

  const handleDocumentsComplete = (documents) => {
    // Здесь будет логика сохранения объявления со всеми данными
    console.log('Объявление сохранено:', { 
      ...formData, 
      photos,
      testDrive: testDriveData,
      documents
    })
    alert('Объявление успешно опубликовано!')
    setShowDocumentsModal(false)
    navigate('/owner')
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  return (
    <div className="add-property-page">
      <div className="add-property-container">
        <div className="add-property-header">
          <button 
            className="back-btn"
            onClick={() => navigate('/owner')}
          >
            <FiChevronLeft size={20} />
            Назад
          </button>
          <h1 className="page-title">Добавить объявление</h1>
        </div>

        {/* Выбор типа недвижимости */}
        <section className="form-section">
          <h2 className="section-title">Выберите тип недвижимости</h2>
          <div className="property-type-selector">
            <button
              type="button"
              className={`property-type-card ${formData.propertyType === 'apartment' ? 'property-type-card--active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, propertyType: 'apartment' }))}
            >
              <PiBuildingApartment size={48} />
              <span>Квартира</span>
            </button>
            <button
              type="button"
              className={`property-type-card ${formData.propertyType === 'house' ? 'property-type-card--active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, propertyType: 'house' }))}
            >
              <FiHome size={48} />
              <span>Дом</span>
            </button>
            <button
              type="button"
              className={`property-type-card ${formData.propertyType === 'villa' ? 'property-type-card--active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, propertyType: 'villa' }))}
            >
              <PiBuildings size={48} />
              <span>Вилла</span>
            </button>
            <button
              type="button"
              className={`property-type-card ${formData.propertyType === 'commercial' ? 'property-type-card--active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, propertyType: 'commercial' }))}
            >
              <PiWarehouse size={48} />
              <span>Коммерческая</span>
            </button>
          </div>
        </section>

        {formData.propertyType && (
          <form onSubmit={handleSubmit} className="add-property-form">
            {/* Загрузка фото */}
            <section className="form-section">
            <h2 className="section-title">Фотографии (до 10 шт.)</h2>
            <div className="photos-upload-area">
              {photos.length < 10 && (
                <div 
                  className="photo-upload-box"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiUpload size={32} />
                  <p>Добавить фото</p>
                  <span>{photos.length}/10</span>
                </div>
              )}
              
              <div className="photos-grid">
                {photos.map((photo, index) => (
                  <div key={photo.id} className="photo-item">
                    <img src={photo.url} alt={`Фото ${index + 1}`} />
                    <button
                      type="button"
                      className="photo-remove"
                      onClick={() => handleRemovePhoto(photo.id)}
                    >
                      <FiX size={16} />
                    </button>
                    <div className="photo-number">{index + 1}</div>
                  </div>
                ))}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </div>
            
            {photos.length > 0 && (
              <button
                type="button"
                className="view-carousel-btn"
                onClick={() => setShowCarousel(true)}
              >
                <FiEye size={18} />
                Просмотреть карусель
              </button>
            )}
          </section>

          {/* Заголовок */}
          <section className="form-section">
            <h2 className="section-title">Заголовок</h2>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Введите заголовок объявления"
              required
            />
          </section>

          {/* Описание */}
          <section className="form-section">
            <h2 className="section-title">Описание</h2>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-textarea"
              placeholder="Опишите объект недвижимости"
              rows="6"
              required
            />
          </section>

          {/* Подробная информация */}
          <section className="form-section">
            <h2 className="section-title">Подробная информация</h2>
            <div className="details-grid">
              {/* Общие поля */}
              <div className="detail-field">
                <label className="detail-label">
                  <BiArea size={18} />
                  Площадь (м²)
                </label>
                <input
                  type="number"
                  value={formData.area}
                  onChange={(e) => handleDetailChange('area', e.target.value)}
                  className="detail-input"
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div className="detail-field">
                <label className="detail-label">
                  <MdBed size={18} />
                  Спальные места
                </label>
                <input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleDetailChange('bedrooms', e.target.value)}
                  className="detail-input"
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div className="detail-field">
                <label className="detail-label">Количество комнат</label>
                <input
                  type="number"
                  value={formData.rooms}
                  onChange={(e) => handleDetailChange('rooms', e.target.value)}
                  className="detail-input"
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div className="detail-field">
                <label className="detail-label">
                  <MdOutlineBathtub size={18} />
                  Санузлы
                </label>
                <input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => handleDetailChange('bathrooms', e.target.value)}
                  className="detail-input"
                  placeholder="0"
                  min="0"
                />
              </div>
              
              {(formData.propertyType === 'apartment' || formData.propertyType === 'commercial') && (
                <>
                  <div className="detail-field">
                    <label className="detail-label">Этаж</label>
                    <input
                      type="number"
                      value={formData.floor}
                      onChange={(e) => handleDetailChange('floor', e.target.value)}
                      className="detail-input"
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="detail-field">
                    <label className="detail-label">Всего этажей</label>
                    <input
                      type="number"
                      value={formData.totalFloors}
                      onChange={(e) => handleDetailChange('totalFloors', e.target.value)}
                      className="detail-input"
                      placeholder="0"
                    />
                  </div>
                </>
              )}
              
              <div className="detail-field">
                <label className="detail-label">Год постройки</label>
                <input
                  type="number"
                  value={formData.yearBuilt}
                  onChange={(e) => handleDetailChange('yearBuilt', e.target.value)}
                  className="detail-input"
                  placeholder="2024"
                  min="1900"
                  max="2024"
                />
              </div>
              
              <div className="detail-field detail-field--full">
                <label className="detail-label">
                  <FiMapPin size={18} />
                  Локация
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleDetailChange('location', e.target.value)}
                  className="detail-input"
                  placeholder="Адрес или район"
                />
              </div>
            </div>
            
            {/* Две колонки: слева чекбоксы, справа выпадающие списки */}
            <div className="two-columns-layout">
              {/* Левая колонка: все чекбоксы */}
              <div className="checkboxes-column">
                <div className="checkboxes-section">
                {/* Первый ряд: 3 чекбокса + количество комнат */}
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature1"
                    checked={formData.feature1}
                    onChange={(e) => handleDetailChange('feature1', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature1" className="detail-checkbox-label">Особенность 1</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature2"
                    checked={formData.feature2}
                    onChange={(e) => handleDetailChange('feature2', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature2" className="detail-checkbox-label">Особенность 2</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature3"
                    checked={formData.feature3}
                    onChange={(e) => handleDetailChange('feature3', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature3" className="detail-checkbox-label">Особенность 3</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="garage"
                    checked={formData.garage}
                    onChange={(e) => handleDetailChange('garage', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="garage" className="detail-checkbox-label">Гараж</label>
                </div>

                {/* Второй ряд: 4 чекбокса */}
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature4"
                    checked={formData.feature4}
                    onChange={(e) => handleDetailChange('feature4', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature4" className="detail-checkbox-label">Особенность 4</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature5"
                    checked={formData.feature5}
                    onChange={(e) => handleDetailChange('feature5', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature5" className="detail-checkbox-label">Особенность 5</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature6"
                    checked={formData.feature6}
                    onChange={(e) => handleDetailChange('feature6', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature6" className="detail-checkbox-label">Особенность 6</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature7"
                    checked={formData.feature7}
                    onChange={(e) => handleDetailChange('feature7', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature7" className="detail-checkbox-label">Особенность 7</label>
                </div>

                {/* Третий ряд: 4 чекбокса */}
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature8"
                    checked={formData.feature8}
                    onChange={(e) => handleDetailChange('feature8', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature8" className="detail-checkbox-label">Особенность 8</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature9"
                    checked={formData.feature9}
                    onChange={(e) => handleDetailChange('feature9', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature9" className="detail-checkbox-label">Особенность 9</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature10"
                    checked={formData.feature10}
                    onChange={(e) => handleDetailChange('feature10', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature10" className="detail-checkbox-label">Особенность 10</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="feature11"
                    checked={formData.feature11}
                    onChange={(e) => handleDetailChange('feature11', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="feature11" className="detail-checkbox-label">Особенность 11</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="pool"
                    checked={formData.pool}
                    onChange={(e) => handleDetailChange('pool', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="pool" className="detail-checkbox-label">Бассейн</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="security"
                    checked={formData.security}
                    onChange={(e) => handleDetailChange('security', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="security" className="detail-checkbox-label">Охрана</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="furniture"
                    checked={formData.furniture}
                    onChange={(e) => handleDetailChange('furniture', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="furniture" className="detail-checkbox-label">Мебель</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="electricity"
                    checked={formData.electricity}
                    onChange={(e) => handleDetailChange('electricity', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="electricity" className="detail-checkbox-label">Электричество</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="internet"
                    checked={formData.internet}
                    onChange={(e) => handleDetailChange('internet', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="internet" className="detail-checkbox-label">Интернет</label>
                </div>
                
                {/* Чекбоксы для квартиры */}
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="balcony"
                    checked={formData.balcony}
                    onChange={(e) => handleDetailChange('balcony', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="balcony" className="detail-checkbox-label">Балкон</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="parking"
                    checked={formData.parking}
                    onChange={(e) => handleDetailChange('parking', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="parking" className="detail-checkbox-label">Парковка</label>
                </div>
                
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="elevator"
                    checked={formData.elevator}
                    onChange={(e) => handleDetailChange('elevator', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="elevator" className="detail-checkbox-label">Лифт</label>
                </div>
                
                {/* Чекбокс для дома/виллы */}
                <div className="detail-field detail-field--checkbox">
                  <input
                    type="checkbox"
                    id="garden"
                    checked={formData.garden}
                    onChange={(e) => handleDetailChange('garden', e.target.checked)}
                    className="detail-checkbox"
                  />
                  <label htmlFor="garden" className="detail-checkbox-label">Сад</label>
                </div>
              </div>
              </div>
              
              {/* Правая колонка: все выпадающие списки */}
              <div className="dropdowns-column">
                <div className="dropdowns-section">
                  <div className="detail-field">
                    <label className="detail-label">Ремонт</label>
                    <select
                      value={formData.renovation}
                      onChange={(e) => handleDetailChange('renovation', e.target.value)}
                      className="detail-input"
                    >
                      <option value="">Выберите</option>
                      <option value="excellent">Отличный</option>
                      <option value="good">Хороший</option>
                      <option value="satisfactory">Удовлетворительный</option>
                      <option value="needs">Требуется ремонт</option>
                    </select>
                  </div>
                  
                  <div className="detail-field">
                    <label className="detail-label">Состояние</label>
                    <select
                      value={formData.condition}
                      onChange={(e) => handleDetailChange('condition', e.target.value)}
                      className="detail-input"
                    >
                      <option value="">Выберите</option>
                      <option value="new">Новостройка</option>
                      <option value="excellent">Отличное</option>
                      <option value="good">Хорошее</option>
                      <option value="satisfactory">Удовлетворительное</option>
                    </select>
                  </div>
                  
                  <div className="detail-field">
                    <label className="detail-label">Отопление</label>
                    <select
                      value={formData.heating}
                      onChange={(e) => handleDetailChange('heating', e.target.value)}
                      className="detail-input"
                    >
                      <option value="">Выберите</option>
                      <option value="central">Центральное</option>
                      <option value="individual">Индивидуальное</option>
                      <option value="gas">Газовое</option>
                      <option value="electric">Электрическое</option>
                      <option value="none">Нет</option>
                    </select>
                  </div>
                  
                  <div className="detail-field">
                    <label className="detail-label">Водоснабжение</label>
                    <select
                      value={formData.waterSupply}
                      onChange={(e) => handleDetailChange('waterSupply', e.target.value)}
                      className="detail-input"
                    >
                      <option value="">Выберите</option>
                      <option value="central">Центральное</option>
                      <option value="well">Скважина</option>
                      <option value="none">Нет</option>
                    </select>
                  </div>
                  
                  <div className="detail-field">
                    <label className="detail-label">Канализация</label>
                    <select
                      value={formData.sewerage}
                      onChange={(e) => handleDetailChange('sewerage', e.target.value)}
                      className="detail-input"
                    >
                      <option value="">Выберите</option>
                      <option value="central">Центральная</option>
                      <option value="septic">Септик</option>
                      <option value="none">Нет</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="details-grid">
              {/* Поля для дома/виллы */}
              {(formData.propertyType === 'house' || formData.propertyType === 'villa') && (
                <>
                  <div className="detail-field">
                    <label className="detail-label">Площадь участка (м²)</label>
                    <input
                      type="number"
                      value={formData.landArea}
                      onChange={(e) => handleDetailChange('landArea', e.target.value)}
                      className="detail-input"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </>
              )}

              {/* Поля для коммерческой */}
              {formData.propertyType === 'commercial' && (
                <>
                  <div className="detail-field">
                    <label className="detail-label">Тип коммерческой недвижимости</label>
                    <select
                      value={formData.commercialType}
                      onChange={(e) => handleDetailChange('commercialType', e.target.value)}
                      className="detail-input"
                    >
                      <option value="">Выберите тип</option>
                      <option value="office">Офис</option>
                      <option value="shop">Магазин</option>
                      <option value="warehouse">Склад</option>
                      <option value="restaurant">Ресторан</option>
                      <option value="other">Другое</option>
                    </select>
                  </div>
                  
                  <div className="detail-field">
                    <label className="detail-label">Часы работы</label>
                    <input
                      type="text"
                      value={formData.businessHours}
                      onChange={(e) => handleDetailChange('businessHours', e.target.value)}
                      className="detail-input"
                      placeholder="9:00 - 18:00"
                    />
                  </div>
                </>
              )}

            </div>
          </section>

          {/* Цена */}
          <section className="form-section">
            <h2 className="section-title">Цена для покупки</h2>
            <div className="price-input-wrapper">
              <FiDollarSign className="price-icon" size={20} />
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="form-input price-input"
                placeholder="0"
                min="0"
                required
              />
            </div>
          </section>

          {/* Аукцион */}
          <section className="form-section">
            <div className="auction-checkbox-wrapper">
              <input
                type="checkbox"
                id="isAuction"
                name="isAuction"
                checked={formData.isAuction}
                onChange={handleInputChange}
                className="auction-checkbox"
              />
              <label htmlFor="isAuction" className="auction-label">
                Выставить объект на аукцион
              </label>
            </div>

            {formData.isAuction && (
              <div className="auction-fields">
                <DateRangePicker
                  label="Период проведения аукциона"
                  startDate={formData.auctionStartDate}
                  endDate={formData.auctionEndDate}
                  onStartDateChange={(date) => setFormData(prev => ({ ...prev, auctionStartDate: date }))}
                  onEndDateChange={(date) => setFormData(prev => ({ ...prev, auctionEndDate: date }))}
                />
                
                <div className="bid-step-group">
                  <label className="bid-step-label">Шаг ставки</label>
                  <div className="bid-step-input-wrapper">
                    <FiDollarSign className="price-icon" size={18} />
                    <input
                      type="number"
                      name="bidStep"
                      value={formData.bidStep}
                      onChange={handleInputChange}
                      className="form-input bid-step-input"
                      placeholder="1000"
                      min="0"
                      required={formData.isAuction}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Кнопки */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-preview"
              onClick={handlePreview}
            >
              <FiEye size={18} />
              Предпросмотр
            </button>
            <button
              type="submit"
              className="btn-submit"
            >
              Опубликовать объявление
            </button>
          </div>
          </form>
        )}
      </div>

      {/* Карусель фото */}
      {showCarousel && photos.length > 0 && (
        <div className="carousel-overlay" onClick={() => setShowCarousel(false)}>
          <div className="carousel-container" onClick={(e) => e.stopPropagation()}>
            <button 
              className="carousel-close"
              onClick={() => setShowCarousel(false)}
            >
              <FiX size={24} />
            </button>
            <button 
              className="carousel-nav carousel-nav--prev"
              onClick={prevPhoto}
            >
              <FiChevronLeft size={24} />
            </button>
            <div className="carousel-image-wrapper">
              <img 
                src={photos[currentPhotoIndex].url} 
                alt={`Фото ${currentPhotoIndex + 1}`}
                className="carousel-image"
              />
              <div className="carousel-counter">
                {currentPhotoIndex + 1} / {photos.length}
              </div>
            </div>
            <button 
              className="carousel-nav carousel-nav--next"
              onClick={nextPhoto}
            >
              <FiChevronRight size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно предпросмотра */}
      <PropertyPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        propertyData={{ ...formData, photos: photos.map(p => p.url) }}
      />

      <TestDriveModal
        isOpen={showTestDriveModal}
        onClose={() => setShowTestDriveModal(false)}
        onNext={handleTestDriveNext}
      />

      <DocumentsModal
        isOpen={showDocumentsModal}
        onClose={() => setShowDocumentsModal(false)}
        onComplete={handleDocumentsComplete}
      />
    </div>
  )
}

export default AddProperty
