import { useState, useEffect, useRef } from 'react'
import { FiChevronDown } from 'react-icons/fi'

// Популярные коды стран
const COUNTRY_CODES = [
  { code: '375', name: 'Беларусь', flag: '🇧🇾' },
  { code: '7', name: 'Россия/Казахстан', flag: '🇷🇺' },
  { code: '380', name: 'Украина', flag: '🇺🇦' },
  { code: '1', name: 'США/Канада', flag: '🇺🇸' },
  { code: '44', name: 'Великобритания', flag: '🇬🇧' },
  { code: '49', name: 'Германия', flag: '🇩🇪' },
  { code: '33', name: 'Франция', flag: '🇫🇷' },
  { code: '39', name: 'Италия', flag: '🇮🇹' },
  { code: '34', name: 'Испания', flag: '🇪🇸' },
  { code: '971', name: 'ОАЭ', flag: '🇦🇪' },
  { code: '90', name: 'Турция', flag: '🇹🇷' },
  { code: '86', name: 'Китай', flag: '🇨🇳' },
  { code: '81', name: 'Япония', flag: '🇯🇵' },
  { code: '82', name: 'Южная Корея', flag: '🇰🇷' },
  { code: '91', name: 'Индия', flag: '🇮🇳' },
  { code: '55', name: 'Бразилия', flag: '🇧🇷' },
  { code: '52', name: 'Мексика', flag: '🇲🇽' },
  { code: '61', name: 'Австралия', flag: '🇦🇺' },
  { code: '27', name: 'ЮАР', flag: '🇿🇦' },
  { code: '20', name: 'Египет', flag: '🇪🇬' },
  { code: '370', name: 'Литва', flag: 'lt' },
]

const PhoneInput = ({ value, onChange, onCountryChange, error, disabled }) => {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]) // Беларусь по умолчанию
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    // Если значение пришло извне, парсим его
    if (value && value.trim() !== '') {
      const parsed = parsePhoneNumber(value)
      if (parsed.country) {
        setSelectedCountry(parsed.country)
        setPhoneNumber(parsed.number)
      } else {
        // Если не удалось определить страну через parsePhoneNumber, пытаемся найти код страны в цифрах
        const digits = value.replace(/\D/g, '')
        
        // Если значение равно только коду страны - игнорируем (это происходит при смене страны)
        const isOnlyCountryCode = COUNTRY_CODES.some(country => digits === country.code)
        if (isOnlyCountryCode) {
          setPhoneNumber('')
          return
        }
        
        let found = false
        
        // Проверяем коды стран от самых длинных к коротким (чтобы правильно определить)
        const sortedCountries = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length)
        
        for (const country of sortedCountries) {
          if (digits.startsWith(country.code) && digits.length > country.code.length) {
            setSelectedCountry(country)
            setPhoneNumber(digits.substring(country.code.length))
            found = true
            break
          }
        }
        
        if (!found) {
          // Если не нашли код страны, просто сохраняем цифры
          setPhoneNumber(digits)
        }
      }
    } else {
      setPhoneNumber('')
    }
  }, [value])

  // Закрытие dropdown при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const parsePhoneNumber = (phone) => {
    // Удаляем все нецифровые символы, кроме +
    const cleaned = phone.replace(/[^\d+]/g, '')
    
    // Получаем только цифры (убираем +)
    const digits = cleaned.replace(/\+/g, '')
    
    // Пытаемся найти код страны (проверяем от самых длинных к коротким)
    const sortedCountries = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length)
    
    for (const country of sortedCountries) {
      if (digits.startsWith(country.code) && digits.length > country.code.length) {
        return {
          country,
          number: digits.substring(country.code.length)
        }
      }
    }
    
    return { country: null, number: digits }
  }

  const handleCountrySelect = (country) => {
    // Очищаем поле при смене страны
    setPhoneNumber('')
    setSelectedCountry(country)
    setIsDropdownOpen(false)
    if (onCountryChange) {
      onCountryChange(country.code)
    }
    // НЕ отправляем код страны в onChange - поле должно быть пустым
    // Пользователь должен ввести номер с нуля
    if (onChange) {
      onChange({ target: { value: '' } })
    }
  }

  const handlePhoneChange = (e) => {
    const inputValue = e.target.value
    // Удаляем все нецифровые символы (только цифры)
    const digitsOnly = inputValue.replace(/\D/g, '')
    
    // Ограничиваем длину в зависимости от страны
    let maxLength = 15 // максимальная длина по стандарту
    if (selectedCountry.code === '375') {
      maxLength = 9 // Беларусь: 9 цифр после кода страны
    } else if (selectedCountry.code === '7') {
      maxLength = 10 // Россия: 10 цифр после кода страны
    } else if (selectedCountry.code === '1') {
      maxLength = 10 // США/Канада: 10 цифр
    }
    
    const limitedDigits = digitsOnly.substring(0, maxLength)
    
    setPhoneNumber(limitedDigits)
    
    // Формируем полный номер с кодом страны
    const fullNumber = selectedCountry.code + limitedDigits
    if (onChange) {
      onChange({ target: { value: fullNumber } })
    }
  }

  const formatPhoneDisplay = (number) => {
    if (!number) return ''
    
    // Форматируем только номер без кода страны (phoneNumber уже без кода)
    const digits = number.replace(/\D/g, '')
    
    if (selectedCountry.code === '375') {
      // Беларусь: (XX) XXX-XX-XX
      // Пример: 291803372 -> (29) 180-33-72
      if (digits.length === 0) return ''
      if (digits.length <= 2) return digits
      if (digits.length <= 5) return `(${digits.substring(0, 2)}) ${digits.substring(2)}`
      if (digits.length <= 7) return `(${digits.substring(0, 2)}) ${digits.substring(2, 5)}-${digits.substring(5)}`
      return `(${digits.substring(0, 2)}) ${digits.substring(2, 5)}-${digits.substring(5, 7)}-${digits.substring(7)}`
    } else if (selectedCountry.code === '7') {
      // Россия/Казахстан: (XXX) XXX-XX-XX
      // Пример: 9991234567 -> (999) 123-45-67
      if (digits.length === 0) return ''
      if (digits.length <= 3) return digits
      if (digits.length <= 6) return `(${digits.substring(0, 3)}) ${digits.substring(3)}`
      if (digits.length <= 8) return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`
      return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6, 8)}-${digits.substring(8)}`
    } else if (selectedCountry.code === '1') {
      // США/Канада: (XXX) XXX-XXXX
      // Пример: 5551234567 -> (555) 123-4567
      if (digits.length === 0) return ''
      if (digits.length <= 3) return digits
      if (digits.length <= 6) return `(${digits.substring(0, 3)}) ${digits.substring(3)}`
      return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`
    }
    
    // Общий формат для остальных стран - просто цифры с пробелами каждые 3 цифры
    if (digits.length === 0) return ''
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.substring(0, 3)} ${digits.substring(3)}`
    return `${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`
  }

  return (
    <div className="phone-input-container" ref={containerRef}>
      <div className="phone-input-wrapper">
        <div 
          className="phone-input-country-selector"
          onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
        >
          <span className="phone-input-flag">{selectedCountry.flag}</span>
          <span className="phone-input-code">+{selectedCountry.code}</span>
          <FiChevronDown className="phone-input-chevron" />
        </div>
        
        {isDropdownOpen && (
          <div className="phone-input-dropdown">
            {COUNTRY_CODES.map((country) => (
              <div
                key={country.code}
                className={`phone-input-dropdown-item ${selectedCountry.code === country.code ? 'selected' : ''}`}
                onClick={() => handleCountrySelect(country)}
              >
                <span className="phone-input-flag">{country.flag}</span>
                <span className="phone-input-country-name">{country.name}</span>
                <span className="phone-input-country-code">+{country.code}</span>
              </div>
            ))}
          </div>
        )}
        
        <input
          type="tel"
          className={`phone-input-field ${error ? 'error' : ''}`}
          value={formatPhoneDisplay(phoneNumber)}
          onChange={handlePhoneChange}
          placeholder="Введите номер"
          disabled={disabled}
          maxLength={20}
        />
      </div>
      {error && <div className="phone-input-error">{error}</div>}
    </div>
  )
}

export default PhoneInput

