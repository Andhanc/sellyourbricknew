/**
 * Валидация номера карты по алгоритму Луна
 * @param {string} cardNumber - Номер карты (только цифры)
 * @returns {boolean} - true если номер валиден
 */
export const validateLuhn = (cardNumber) => {
  // Удаляем все пробелы и нецифровые символы
  const cleaned = cardNumber.replace(/\D/g, '');
  
  // Проверяем, что есть хотя бы одна цифра
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }
  
  let sum = 0;
  let isEven = false;
  
  // Проходим по цифрам справа налево
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

/**
 * Определяет тип карты по номеру
 * @param {string} cardNumber - Номер карты
 * @returns {string} - Тип карты (VISA, MASTERCARD, или UNKNOWN)
 */
export const detectCardType = (cardNumber) => {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  // VISA начинается с 4
  if (cleaned.startsWith('4')) {
    return 'VISA';
  }
  
  // MASTERCARD начинается с 51-55 или 2221-2720
  if (cleaned.startsWith('5') && cleaned[1] >= '1' && cleaned[1] <= '5') {
    return 'MASTERCARD';
  }
  
  if (cleaned.startsWith('2') && cleaned.length >= 4) {
    const firstFour = parseInt(cleaned.substring(0, 4), 10);
    if (firstFour >= 2221 && firstFour <= 2720) {
      return 'MASTERCARD';
    }
  }
  
  return 'UNKNOWN';
};

/**
 * Форматирует номер карты с пробелами (XXXX XXXX XXXX XXXX)
 * @param {string} cardNumber - Номер карты
 * @returns {string} - Отформатированный номер
 */
export const formatCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/\D/g, '');
  const formatted = cleaned.match(/.{1,4}/g);
  return formatted ? formatted.join(' ') : cleaned;
};

/**
 * Маскирует номер карты, оставляя только последние 4 цифры
 * @param {string} cardNumber - Номер карты
 * @returns {string} - Замаскированный номер
 */
export const maskCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 4) {
    return cardNumber;
  }
  const lastFour = cleaned.slice(-4);
  return `**** **** **** ${lastFour}`;
};


