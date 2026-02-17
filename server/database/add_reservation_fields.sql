-- Миграция: добавление полей для бронирования объектов недвижимости
-- Дата создания: 2026-02-12
-- Описание: Добавляет поля для 72-часового бронирования при запросе на покупку

-- ============================================
-- Добавление полей бронирования в таблицу apartments
-- ============================================

-- Дата и время окончания бронирования
ALTER TABLE properties_apartments ADD COLUMN reserved_until DATETIME DEFAULT NULL;

-- ID пользователя, который забронировал объект
ALTER TABLE properties_apartments ADD COLUMN reserved_by INTEGER DEFAULT NULL;

-- ID запроса на покупку, связанного с бронированием
ALTER TABLE properties_apartments ADD COLUMN purchase_request_id INTEGER DEFAULT NULL;

-- ============================================
-- Добавление полей бронирования в таблицу houses
-- ============================================

-- Дата и время окончания бронирования
ALTER TABLE properties_houses ADD COLUMN reserved_until DATETIME DEFAULT NULL;

-- ID пользователя, который забронировал объект
ALTER TABLE properties_houses ADD COLUMN reserved_by INTEGER DEFAULT NULL;

-- ID запроса на покупку, связанного с бронированием
ALTER TABLE properties_houses ADD COLUMN purchase_request_id INTEGER DEFAULT NULL;

-- ============================================
-- Создание индексов для оптимизации запросов
-- ============================================

-- Индексы для apartments
CREATE INDEX IF NOT EXISTS idx_apartments_reserved_until ON properties_apartments(reserved_until);
CREATE INDEX IF NOT EXISTS idx_apartments_reserved_by ON properties_apartments(reserved_by);
CREATE INDEX IF NOT EXISTS idx_apartments_purchase_request_id ON properties_apartments(purchase_request_id);

-- Индексы для houses
CREATE INDEX IF NOT EXISTS idx_houses_reserved_until ON properties_houses(reserved_until);
CREATE INDEX IF NOT EXISTS idx_houses_reserved_by ON properties_houses(reserved_by);
CREATE INDEX IF NOT EXISTS idx_houses_purchase_request_id ON properties_houses(purchase_request_id);
