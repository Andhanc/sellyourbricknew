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
    is_blocked INTEGER DEFAULT 0, -- 0 для false, 1 для true
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы документов
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    document_type TEXT, -- e.g., 'passport', 'passport_with_face', 'utility_bill', 'other'
    document_photo TEXT NOT NULL,
    is_reviewed INTEGER DEFAULT 0, -- 0 для false, 1 для true
    verification_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reviewed_by TEXT, -- admin или manager ID/name
    reviewed_at DATETIME,
    rejection_reason TEXT, -- Причина отклонения
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users(is_blocked);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_verification_status ON documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_documents_user_status ON documents(user_id, verification_status);

-- Создание таблицы уведомлений
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'verification_success', 'verification_rejected', 'property_found', etc.
    title TEXT NOT NULL,
    message TEXT,
    data TEXT, -- JSON данные (например, property_id для уведомлений о недвижимости)
    is_read INTEGER DEFAULT 0, -- 0 для false, 1 для true
    view_count INTEGER DEFAULT 0, -- Количество просмотров
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Создание индексов для уведомлений
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Создание таблицы администраторов и их прав доступа
CREATE TABLE IF NOT EXISTS administrators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Хешированный пароль
    email TEXT,
    full_name TEXT,
    is_super_admin INTEGER DEFAULT 0, -- 1 для супер-админа (admin, admin), 0 для обычного админа
    -- Права доступа к разделам админ-панели
    can_access_statistics INTEGER DEFAULT 0,
    can_access_users INTEGER DEFAULT 0,
    can_access_moderation INTEGER DEFAULT 0,
    can_access_chat INTEGER DEFAULT 0,
    can_access_objects INTEGER DEFAULT 0,
    can_access_access_management INTEGER DEFAULT 0, -- Только для супер-админа
    created_by INTEGER, -- ID администратора, который создал этого админа
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES administrators(id) ON DELETE SET NULL
);

-- Создание индексов для администраторов
CREATE INDEX IF NOT EXISTS idx_administrators_username ON administrators(username);
CREATE INDEX IF NOT EXISTS idx_administrators_is_super_admin ON administrators(is_super_admin);
CREATE INDEX IF NOT EXISTS idx_administrators_email ON administrators(email);

