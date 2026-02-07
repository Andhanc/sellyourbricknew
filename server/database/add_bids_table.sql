-- Создание таблицы ставок (bids)
CREATE TABLE IF NOT EXISTS bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    property_id INTEGER NOT NULL,
    bid_amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_bids_user_id ON bids(user_id);
CREATE INDEX IF NOT EXISTS idx_bids_property_id ON bids(property_id);
CREATE INDEX IF NOT EXISTS idx_bids_created_at ON bids(created_at);
CREATE INDEX IF NOT EXISTS idx_bids_user_property ON bids(user_id, property_id);

-- Добавление поля auction_minimum_bid в таблицу properties (если его еще нет)
-- Это поле будет хранить минимальную сумму следующей ставки
-- Если поле уже существует, команда не выполнится (SQLite не поддерживает IF NOT EXISTS для ALTER TABLE)
-- Поэтому используем отдельный скрипт для добавления поля

