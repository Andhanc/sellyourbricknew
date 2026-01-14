-- Скрипт для обновления существующей БД
-- Делает поле email nullable (разрешает NULL)

-- Удаляем ограничение NOT NULL с поля email (если оно есть)
-- В SQLite нельзя напрямую изменить колонку, нужно пересоздать таблицу

-- Создаем временную таблицу с правильной схемой
CREATE TABLE IF NOT EXISTS users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT, -- Теперь может быть NULL
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

-- Копируем данные из старой таблицы
INSERT INTO users_new 
SELECT * FROM users;

-- Удаляем старую таблицу
DROP TABLE IF EXISTS users;

-- Переименовываем новую таблицу
ALTER TABLE users_new RENAME TO users;

-- Восстанавливаем индексы
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);


