-- Миграция: добавление поля is_blocked в таблицу users
-- Выполнить: sqlite3 database.sqlite < server/database/add_is_blocked_field.sql

-- Добавляем поле is_blocked, если его еще нет
ALTER TABLE users ADD COLUMN is_blocked INTEGER DEFAULT 0;

-- Создаем индекс для оптимизации запросов по is_blocked
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users(is_blocked);






