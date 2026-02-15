-- Создание таблицы для запросов на покупку недвижимости

CREATE TABLE IF NOT EXISTS purchase_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Данные покупателя
  buyer_id TEXT,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT,
  buyer_phone TEXT,
  
  -- Данные владельца объекта
  seller_id TEXT,
  seller_name TEXT,
  seller_email TEXT,
  seller_phone TEXT,
  
  -- Данные объекта недвижимости
  property_id INTEGER,
  property_title TEXT NOT NULL,
  property_description TEXT,
  property_price REAL,
  property_currency TEXT DEFAULT 'USD',
  property_location TEXT,
  property_type TEXT,
  property_area TEXT,
  property_rooms INTEGER,
  property_bedrooms INTEGER,
  property_bathrooms INTEGER,
  property_floor INTEGER,
  property_total_floors INTEGER,
  property_year_built INTEGER,
  property_living_area TEXT,
  property_land_area TEXT,
  property_building_type TEXT,
  property_renovation TEXT,
  property_condition TEXT,
  property_heating TEXT,
  property_water_supply TEXT,
  property_sewerage TEXT,
  property_balcony INTEGER DEFAULT 0,
  property_parking INTEGER DEFAULT 0,
  property_elevator INTEGER DEFAULT 0,
  property_garage INTEGER DEFAULT 0,
  property_pool INTEGER DEFAULT 0,
  property_garden INTEGER DEFAULT 0,
  property_electricity INTEGER DEFAULT 0,
  property_internet INTEGER DEFAULT 0,
  property_security INTEGER DEFAULT 0,
  property_furniture INTEGER DEFAULT 0,
  property_commercial_type TEXT,
  property_business_hours TEXT,
  
  -- Информация о запросе
  request_date TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, cancelled
  admin_notes TEXT, -- Заметки администратора
  
  -- Временные метки
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_purchase_requests_buyer_id ON purchase_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_seller_id ON purchase_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_property_id ON purchase_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_created_at ON purchase_requests(created_at);

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER IF NOT EXISTS update_purchase_requests_timestamp 
AFTER UPDATE ON purchase_requests
BEGIN
  UPDATE purchase_requests SET updated_at = datetime('now') WHERE id = NEW.id;
END;
