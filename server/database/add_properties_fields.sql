-- Миграция: добавление полей living_area, building_type и additional_amenities в таблицу properties
-- Выполнить если таблица уже существует

-- Добавляем поле living_area (жилая площадь), если его нет
ALTER TABLE properties ADD COLUMN living_area REAL;

-- Добавляем поле building_type (тип дома/здания), если его нет
ALTER TABLE properties ADD COLUMN building_type TEXT;

-- Добавляем поле additional_amenities (дополнительные удобства), если его нет
ALTER TABLE properties ADD COLUMN additional_amenities TEXT;
