-- Добавление поля test_drive в таблицу properties
-- Это поле хранит статус наличия тест-драйва (0 или 1)

ALTER TABLE properties ADD COLUMN test_drive INTEGER DEFAULT 0;
