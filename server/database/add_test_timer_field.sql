-- Миграция: добавление поля test_timer_end_date в таблицу properties
-- Это поле используется для тестирования аукционов в админ панели

-- Добавляем поле test_timer_end_date, если его нет
ALTER TABLE properties ADD COLUMN test_timer_end_date TEXT;

