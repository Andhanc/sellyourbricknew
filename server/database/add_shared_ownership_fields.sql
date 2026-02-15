-- Миграция: добавление полей для долевой продажи
-- Дата создания: 2026-02-12

-- Добавляем поля для долевой продажи в таблицу properties_apartments
ALTER TABLE properties_apartments ADD COLUMN is_shared_ownership INTEGER DEFAULT 0;
ALTER TABLE properties_apartments ADD COLUMN total_shares INTEGER;
ALTER TABLE properties_apartments ADD COLUMN shares_sold INTEGER DEFAULT 0;

-- Добавляем поля для долевой продажи в таблицу properties_houses
ALTER TABLE properties_houses ADD COLUMN is_shared_ownership INTEGER DEFAULT 0;
ALTER TABLE properties_houses ADD COLUMN total_shares INTEGER;
ALTER TABLE properties_houses ADD COLUMN shares_sold INTEGER DEFAULT 0;

-- Создаем таблицу для отслеживания покупок долей
CREATE TABLE IF NOT EXISTS property_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    property_type TEXT NOT NULL CHECK(property_type IN ('apartment', 'commercial', 'house', 'villa')),
    buyer_id INTEGER NOT NULL,
    shares_count INTEGER NOT NULL, -- Количество купленных долей
    price_per_share REAL NOT NULL, -- Цена за одну долю на момент покупки
    total_price REAL NOT NULL, -- Общая сумма покупки
    currency TEXT DEFAULT 'USD',
    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'cancelled'
    
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Индексы для таблицы property_shares
CREATE INDEX IF NOT EXISTS idx_shares_property ON property_shares(property_id, property_type);
CREATE INDEX IF NOT EXISTS idx_shares_buyer ON property_shares(buyer_id);
CREATE INDEX IF NOT EXISTS idx_shares_status ON property_shares(status);
CREATE INDEX IF NOT EXISTS idx_shares_property_buyer ON property_shares(property_id, property_type, buyer_id);
