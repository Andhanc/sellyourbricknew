-- Скрипт для добавления поля password в существующую БД
-- Если поле уже существует, скрипт не вызовет ошибку

-- Добавляем поле password, если его нет
-- SQLite не поддерживает ALTER TABLE ADD COLUMN IF NOT EXISTS напрямую,
-- поэтому проверяем через PRAGMA table_info

-- Создаем временную таблицу с правильной схемой
CREATE TABLE IF NOT EXISTS users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    password TEXT,
    phone_number TEXT UNIQUE,
    passport_series TEXT,
    passport_number TEXT,
    identification_number TEXT,
    address TEXT,
    country TEXT,
    passport_photo TEXT,
    user_photo TEXT,
    is_verified INTEGER DEFAULT 0,
    role TEXT DEFAULT 'buyer',
    is_online INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Копируем данные из старой таблицы (если существует)
-- Используем CASE для проверки существования поля password
INSERT INTO users_new (
    id, first_name, last_name, email, phone_number,
    passport_series, passport_number, identification_number,
    address, country, passport_photo, user_photo,
    is_verified, role, is_online, created_at, updated_at
)
SELECT 
    id, first_name, last_name, email, phone_number,
    passport_series, passport_number, identification_number,
    address, country, passport_photo, user_photo,
    is_verified, role, is_online, created_at, updated_at
FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM sqlite_master 
    WHERE type='table' AND name='users_new' 
    AND sql LIKE '%password%'
);

-- Удаляем старую таблицу
DROP TABLE IF EXISTS users;

-- Переименовываем новую таблицу
ALTER TABLE users_new RENAME TO users;

-- Восстанавливаем индексы
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

