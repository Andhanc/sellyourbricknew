-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT, -- Email может быть NULL (для WhatsApp регистрации)
    password TEXT, -- Хешированный пароль (может быть NULL для WhatsApp регистрации)
    phone_number TEXT UNIQUE,
    passport_series TEXT,
    passport_number TEXT,
    identification_number TEXT,
    address TEXT,
    country TEXT,
    passport_photo TEXT,
    user_photo TEXT,
    is_verified INTEGER DEFAULT 0, -- 0 для false, 1 для true
    role TEXT DEFAULT 'buyer', -- 'buyer', 'seller', 'admin', 'manager'
    is_online INTEGER DEFAULT 0, -- 0 для offline, 1 для online
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы документов
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    document_type TEXT, -- e.g., 'passport_scan', 'utility_bill', 'other'
    document_photo TEXT NOT NULL,
    is_reviewed INTEGER DEFAULT 0, -- 0 для false, 1 для true
    reviewed_by TEXT, -- admin или manager ID/name
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

