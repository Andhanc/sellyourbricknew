-- Миграция: добавление полей verification_status и rejection_reason в таблицу documents
-- Выполнить если таблица уже существует

-- Добавляем поле verification_status, если его нет
ALTER TABLE documents ADD COLUMN verification_status TEXT DEFAULT 'pending';

-- Добавляем поле rejection_reason, если его нет
ALTER TABLE documents ADD COLUMN rejection_reason TEXT;

-- Обновляем существующие записи: если is_reviewed = 1, то verification_status = 'approved'
UPDATE documents SET verification_status = 'approved' WHERE is_reviewed = 1 AND verification_status IS NULL;

-- Обновляем существующие записи: если is_reviewed = 0, то verification_status = 'pending'
UPDATE documents SET verification_status = 'pending' WHERE is_reviewed = 0 AND verification_status IS NULL;


