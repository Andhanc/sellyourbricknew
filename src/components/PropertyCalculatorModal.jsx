import { useState } from 'react'
import { FiX, FiHome, FiMapPin, FiDollarSign, FiTrendingUp } from 'react-icons/fi'
import { MdBed, MdOutlineBathtub } from 'react-icons/md'
import { BiArea } from 'react-icons/bi'
import './PropertyCalculatorModal.css'

const PropertyCalculatorModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    propertyType: 'apartment',
    area: '',
    rooms: '1',
    bathrooms: '1',
    location: 'costa-adeje',
    floor: '',
    condition: 'good',
    year: new Date().getFullYear(),
    hasParking: false,
    hasBalcony: false
  })

  const [calculatedPrice, setCalculatedPrice] = useState(null)
  const [showResult, setShowResult] = useState(false)

  if (!isOpen) return null

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const calculatePrice = () => {
    // Базовые цены за м² по местоположению (в USD)
    const basePrices = {
      'costa-adeje': 3500,
      'playa-americas': 3200,
      'los-cristianos': 3000,
      'puerto-cruz': 2800,
      'santa-cruz': 2500,
      'other': 2200
    }

    // Множители по типу недвижимости
    const typeMultipliers = {
      'apartment': 1.0,
      'house': 1.3,
      'villa': 1.8,
      'studio': 0.85,
      'penthouse': 1.5
    }

    // Множители по состоянию
    const conditionMultipliers = {
      'excellent': 1.2,
      'good': 1.0,
      'average': 0.85,
      'needs-renovation': 0.7
    }

    // Расчет базовой стоимости
    const area = parseFloat(formData.area) || 0
    const basePrice = basePrices[formData.location] || basePrices.other
    const typeMultiplier = typeMultipliers[formData.propertyType] || 1.0
    const conditionMultiplier = conditionMultipliers[formData.condition] || 1.0

    let price = area * basePrice * typeMultiplier * conditionMultiplier

    // Бонусы за дополнительные опции
    if (formData.hasParking) price *= 1.05
    if (formData.hasBalcony) price *= 1.03

    // Корректировка по возрасту
    const currentYear = new Date().getFullYear()
    const age = currentYear - parseInt(formData.year || currentYear)
    if (age > 0) {
      price *= Math.max(0.7, 1 - (age * 0.01)) // -1% за каждый год
    }

    // Корректировка по количеству комнат
    const rooms = parseInt(formData.rooms) || 1
    if (rooms >= 4) price *= 1.1
    else if (rooms === 3) price *= 1.05

    setCalculatedPrice(Math.round(price))
    setShowResult(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    calculatePrice()
  }

  const handleReset = () => {
    setFormData({
      propertyType: 'apartment',
      area: '',
      rooms: '1',
      bathrooms: '1',
      location: 'costa-adeje',
      floor: '',
      condition: 'good',
      year: new Date().getFullYear(),
      hasParking: false,
      hasBalcony: false
    })
    setCalculatedPrice(null)
    setShowResult(false)
  }

  return (
    <div className="property-calculator-overlay" onClick={onClose}>
      <div className="property-calculator-modal" onClick={(e) => e.stopPropagation()}>
        <button 
          className="property-calculator-modal__close" 
          onClick={onClose}
          aria-label="Закрыть"
        >
          <FiX size={24} />
        </button>

        <div className="property-calculator-modal__content">
          <div className="property-calculator-modal__header">
            <h2 className="property-calculator-modal__title">
              <FiDollarSign size={28} />
              Калькулятор стоимости недвижимости
            </h2>
            <p className="property-calculator-modal__subtitle">
              Заполните данные о вашей недвижимости для получения ориентировочной стоимости
            </p>
          </div>

          {!showResult ? (
            <form className="property-calculator-form" onSubmit={handleSubmit}>
              <div className="property-calculator-form__section">
                <h3 className="property-calculator-form__section-title">
                  <FiHome size={20} />
                  Основная информация
                </h3>
                <div className="property-calculator-form__grid">
                  <div className="property-calculator-form__field">
                    <label className="property-calculator-form__label">Тип недвижимости</label>
                    <select 
                      name="propertyType" 
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      className="property-calculator-form__select"
                    >
                      <option value="apartment">Квартира</option>
                      <option value="house">Дом</option>
                      <option value="villa">Вилла</option>
                      <option value="studio">Студия</option>
                      <option value="penthouse">Пентхаус</option>
                    </select>
                  </div>

                  <div className="property-calculator-form__field">
                    <label className="property-calculator-form__label">
                      Площадь (м²)
                    </label>
                    <input
                      type="number"
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      placeholder="Например, 80"
                      className="property-calculator-form__input"
                      min="1"
                      required
                    />
                  </div>

                  <div className="property-calculator-form__field">
                    <label className="property-calculator-form__label">
                      <MdBed size={18} />
                      Комнат
                    </label>
                    <select 
                      name="rooms" 
                      value={formData.rooms}
                      onChange={handleInputChange}
                      className="property-calculator-form__select"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5+">5+</option>
                    </select>
                  </div>

                  <div className="property-calculator-form__field">
                    <label className="property-calculator-form__label">
                      <MdOutlineBathtub size={18} />
                      Ванных комнат
                    </label>
                    <select 
                      name="bathrooms" 
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      className="property-calculator-form__select"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4+">4+</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="property-calculator-form__section">
                <h3 className="property-calculator-form__section-title">
                  <FiMapPin size={20} />
                  Местоположение
                </h3>
                <div className="property-calculator-form__field">
                  <label className="property-calculator-form__label">Район</label>
                  <select 
                    name="location" 
                    value={formData.location}
                    onChange={handleInputChange}
                    className="property-calculator-form__select"
                  >
                    <option value="costa-adeje">Costa Adeje</option>
                    <option value="playa-americas">Playa de las Américas</option>
                    <option value="los-cristianos">Los Cristianos</option>
                    <option value="puerto-cruz">Puerto de la Cruz</option>
                    <option value="santa-cruz">Santa Cruz de Tenerife</option>
                    <option value="other">Другое</option>
                  </select>
                </div>
              </div>

              <div className="property-calculator-form__section">
                <h3 className="property-calculator-form__section-title">
                  <FiTrendingUp size={20} />
                  Дополнительные характеристики
                </h3>
                <div className="property-calculator-form__grid">
                  <div className="property-calculator-form__field">
                    <label className="property-calculator-form__label">Этаж</label>
                    <input
                      type="number"
                      name="floor"
                      value={formData.floor}
                      onChange={handleInputChange}
                      placeholder="Не указано"
                      className="property-calculator-form__input"
                      min="0"
                    />
                  </div>

                  <div className="property-calculator-form__field">
                    <label className="property-calculator-form__label">Год постройки</label>
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      className="property-calculator-form__input"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>

                  <div className="property-calculator-form__field">
                    <label className="property-calculator-form__label">Состояние</label>
                    <select 
                      name="condition" 
                      value={formData.condition}
                      onChange={handleInputChange}
                      className="property-calculator-form__select"
                    >
                      <option value="excellent">Отличное</option>
                      <option value="good">Хорошее</option>
                      <option value="average">Среднее</option>
                      <option value="needs-renovation">Требует ремонта</option>
                    </select>
                  </div>
                </div>

                <div className="property-calculator-form__checkboxes">
                  <label className="property-calculator-form__checkbox">
                    <input
                      type="checkbox"
                      name="hasParking"
                      checked={formData.hasParking}
                      onChange={handleInputChange}
                    />
                    <span>Парковочное место</span>
                  </label>

                  <label className="property-calculator-form__checkbox">
                    <input
                      type="checkbox"
                      name="hasBalcony"
                      checked={formData.hasBalcony}
                      onChange={handleInputChange}
                    />
                    <span>Балкон / Терраса</span>
                  </label>
                </div>
              </div>

              <div className="property-calculator-form__actions">
                <button 
                  type="button"
                  className="property-calculator-form__button property-calculator-form__button--secondary"
                  onClick={onClose}
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  className="property-calculator-form__button property-calculator-form__button--primary"
                >
                  Рассчитать стоимость
                </button>
              </div>
            </form>
          ) : (
            <div className="property-calculator-result">
              <div className="property-calculator-result__icon">
                <FiDollarSign size={48} />
              </div>
              <h3 className="property-calculator-result__title">Ориентировочная стоимость</h3>
              <div className="property-calculator-result__price">
                ${calculatedPrice.toLocaleString('ru-RU')}
              </div>
              <p className="property-calculator-result__note">
                * Расчет является приблизительным и основан на среднерыночных данных. 
                Точная стоимость может отличаться в зависимости от множества факторов.
              </p>
              <div className="property-calculator-result__actions">
                <button 
                  className="property-calculator-form__button property-calculator-form__button--secondary"
                  onClick={handleReset}
                >
                  Новый расчет
                </button>
                <button 
                  className="property-calculator-form__button property-calculator-form__button--primary"
                  onClick={onClose}
                >
                  Закрыть
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PropertyCalculatorModal
