-- Миграция для добавления полей карты и депозита в таблицу users
-- Добавляем поля для хранения информации о карте и депозите

-- Добавляем поле has_card (есть ли у пользователя карта)
ALTER TABLE users ADD COLUMN has_card INTEGER DEFAULT 0;

-- Добавляем поле card_number (номер карты, зашифрованный)
ALTER TABLE users ADD COLUMN card_number TEXT;

-- Добавляем поле card_type (тип карты: VISA, MASTERCARD, etc.)
ALTER TABLE users ADD COLUMN card_type TEXT;

-- Добавляем поле card_cvv (CVV код, зашифрованный)
ALTER TABLE users ADD COLUMN card_cvv TEXT;

-- Добавляем поле deposit_amount (сумма депозита в евро)
ALTER TABLE users ADD COLUMN deposit_amount REAL DEFAULT 0;

-- Создаем индекс для оптимизации запросов по has_card
CREATE INDEX IF NOT EXISTS idx_users_has_card ON users(has_card);



