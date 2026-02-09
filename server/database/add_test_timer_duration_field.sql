-- Миграция: добавление поля test_timer_duration в таблицу properties
-- Это поле хранит исходную длительность тестового таймера в миллисекундах
-- Используется для сброса таймера до исходного значения после каждой ставки

-- Добавляем поле test_timer_duration, если его нет
ALTER TABLE properties ADD COLUMN test_timer_duration INTEGER;

