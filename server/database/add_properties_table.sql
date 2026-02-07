-- Создание таблицы недвижимости
CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    property_type TEXT NOT NULL, -- 'apartment', 'house', 'villa', 'commercial'
    title TEXT NOT NULL,
    description TEXT,
    price REAL,
    currency TEXT DEFAULT 'USD',
    is_auction INTEGER DEFAULT 0, -- 0 для false, 1 для true
    auction_start_date TEXT,
    auction_end_date TEXT,
    auction_starting_price REAL,
    
    -- Общие характеристики
    area REAL,
    rooms INTEGER,
    bedrooms INTEGER,
    bathrooms INTEGER,
    floor INTEGER,
    total_floors INTEGER,
    year_built INTEGER,
    location TEXT,
    
    -- Дополнительные поля для квартиры
    balcony INTEGER DEFAULT 0,
    parking INTEGER DEFAULT 0,
    elevator INTEGER DEFAULT 0,
    
    -- Дополнительные поля для дома/виллы
    land_area REAL,
    garage INTEGER DEFAULT 0,
    pool INTEGER DEFAULT 0,
    garden INTEGER DEFAULT 0,
    
    -- Дополнительные поля для коммерческой
    commercial_type TEXT,
    business_hours TEXT,
    
    -- Общие дополнительные характеристики
    renovation TEXT,
    condition TEXT,
    heating TEXT,
    water_supply TEXT,
    sewerage TEXT,
    electricity INTEGER DEFAULT 0,
    internet INTEGER DEFAULT 0,
    security INTEGER DEFAULT 0,
    furniture INTEGER DEFAULT 0,
    
    -- Медиа
    photos TEXT, -- JSON массив URL фото
    videos TEXT, -- JSON массив объектов видео
    additional_documents TEXT, -- JSON массив дополнительных документов
    
    -- Документы для публикации
    ownership_document TEXT, -- Путь к документу о праве собственности
    no_debts_document TEXT, -- Путь к справке об отсутствии долгов
    
    -- Тест-драйв данные
    test_drive INTEGER DEFAULT 0, -- 0 для нет, 1 для да
    test_drive_data TEXT, -- JSON данные тест-драйва
    
    -- Статус модерации
    moderation_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reviewed_by TEXT, -- admin или manager ID/name
    reviewed_at DATETIME,
    rejection_reason TEXT, -- Причина отклонения
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_moderation_status ON properties(moderation_status);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_user_status ON properties(user_id, moderation_status);
