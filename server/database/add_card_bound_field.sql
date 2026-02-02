-- Миграция: добавление поля card_bound в таблицу users
-- Выполнить: sqlite3 database.sqlite < server/database/add_card_bound_field.sql

-- Добавляем поле card_bound, если его еще нет
ALTER TABLE users ADD COLUMN card_bound INTEGER DEFAULT 0;

-- Создаем индекс для оптимизации запросов по card_bound
CREATE INDEX IF NOT EXISTS idx_users_card_bound ON users(card_bound);
