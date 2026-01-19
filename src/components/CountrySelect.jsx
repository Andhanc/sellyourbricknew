import React, { useState, useRef, useEffect } from 'react';
import './CountrySelect.css';

// Список стран с флагами (emoji флаги)
// Экспортируем список стран для использования в других компонентах
export const countries = [
  { code: 'RU', name: 'Россия', flag: '🇷🇺' },
  { code: 'BY', name: 'Беларусь', flag: '🇧🇾' },
  { code: 'UA', name: 'Украина', flag: '🇺🇦' },
  { code: 'KZ', name: 'Казахстан', flag: '🇰🇿' },
  { code: 'US', name: 'США', flag: '🇺🇸' },
  { code: 'GB', name: 'Великобритания', flag: '🇬🇧' },
  { code: 'DE', name: 'Германия', flag: '🇩🇪' },
  { code: 'FR', name: 'Франция', flag: '🇫🇷' },
  { code: 'IT', name: 'Италия', flag: '🇮🇹' },
  { code: 'ES', name: 'Испания', flag: '🇪🇸' },
  { code: 'PL', name: 'Польша', flag: '🇵🇱' },
  { code: 'NL', name: 'Нидерланды', flag: '🇳🇱' },
  { code: 'BE', name: 'Бельгия', flag: '🇧🇪' },
  { code: 'CH', name: 'Швейцария', flag: '🇨🇭' },
  { code: 'AT', name: 'Австрия', flag: '🇦🇹' },
  { code: 'CZ', name: 'Чехия', flag: '🇨🇿' },
  { code: 'SE', name: 'Швеция', flag: '🇸🇪' },
  { code: 'NO', name: 'Норвегия', flag: '🇳🇴' },
  { code: 'DK', name: 'Дания', flag: '🇩🇰' },
  { code: 'FI', name: 'Финляндия', flag: '🇫🇮' },
  { code: 'GR', name: 'Греция', flag: '🇬🇷' },
  { code: 'PT', name: 'Португалия', flag: '🇵🇹' },
  { code: 'TR', name: 'Турция', flag: '🇹🇷' },
  { code: 'CN', name: 'Китай', flag: '🇨🇳' },
  { code: 'JP', name: 'Япония', flag: '🇯🇵' },
  { code: 'KR', name: 'Южная Корея', flag: '🇰🇷' },
  { code: 'IN', name: 'Индия', flag: '🇮🇳' },
  { code: 'BR', name: 'Бразилия', flag: '🇧🇷' },
  { code: 'AR', name: 'Аргентина', flag: '🇦🇷' },
  { code: 'MX', name: 'Мексика', flag: '🇲🇽' },
  { code: 'CA', name: 'Канада', flag: '🇨🇦' },
  { code: 'AU', name: 'Австралия', flag: '🇦🇺' },
  { code: 'NZ', name: 'Новая Зеландия', flag: '🇳🇿' },
  { code: 'IL', name: 'Израиль', flag: '🇮🇱' },
  { code: 'AE', name: 'ОАЭ', flag: '🇦🇪' },
  { code: 'SA', name: 'Саудовская Аравия', flag: '🇸🇦' },
  { code: 'EG', name: 'Египет', flag: '🇪🇬' },
  { code: 'ZA', name: 'ЮАР', flag: '🇿🇦' },
  { code: 'TH', name: 'Таиланд', flag: '🇹🇭' },
  { code: 'SG', name: 'Сингапур', flag: '🇸🇬' },
  { code: 'MY', name: 'Малайзия', flag: '🇲🇾' },
  { code: 'ID', name: 'Индонезия', flag: '🇮🇩' },
  { code: 'PH', name: 'Филиппины', flag: '🇵🇭' },
  { code: 'VN', name: 'Вьетнам', flag: '🇻🇳' },
];

const CountrySelect = ({ value, onChange, placeholder = 'Выберите страну', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Закрываем выпадающий список при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Фильтруем страны по запросу поиска
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Получаем выбранную страну
  const selectedCountry = countries.find(c => c.name === value);

  // Обработка выбора страны
  const handleSelect = (country) => {
    onChange(country.name);
    setSearchQuery('');
    setIsOpen(false);
  };

  // Обработка открытия/закрытия
  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Фокусируемся на поле поиска при открытии
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
    }
  };

  return (
    <div className={`country-select ${className}`} ref={containerRef}>
      <div 
        className={`country-select__trigger ${isOpen ? 'country-select__trigger--open' : ''}`}
        onClick={handleToggle}
      >
        <div className="country-select__value">
          {selectedCountry ? (
            <>
              <span className="country-select__flag">{selectedCountry.flag}</span>
              <span className="country-select__name">{selectedCountry.name}</span>
            </>
          ) : (
            <span className="country-select__placeholder">{placeholder}</span>
          )}
        </div>
        <svg 
          className={`country-select__arrow ${isOpen ? 'country-select__arrow--open' : ''}`}
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="none"
        >
          <path 
            d="M4 6L8 10L12 6" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {isOpen && (
        <div className="country-select__dropdown">
          <div className="country-select__search">
            <svg 
              className="country-select__search-icon" 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              fill="none"
            >
              <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              className="country-select__search-input"
              placeholder="Поиск страны..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="country-select__list">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <div
                  key={country.code}
                  className={`country-select__option ${
                    selectedCountry?.code === country.code ? 'country-select__option--selected' : ''
                  }`}
                  onClick={() => handleSelect(country)}
                >
                  <span className="country-select__flag">{country.flag}</span>
                  <span className="country-select__name">{country.name}</span>
                  {selectedCountry?.code === country.code && (
                    <svg 
                      className="country-select__check" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 16 16" 
                      fill="none"
                    >
                      <path 
                        d="M13.5 4L6 11.5L2.5 8" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              ))
            ) : (
              <div className="country-select__no-results">
                Страны не найдены
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelect;

