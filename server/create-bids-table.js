import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'database.sqlite');

try {
  const db = new Database(DB_PATH);
  
  // Проверяем, существует ли таблица
  const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='bids'").get();
  
  if (table) {
    console.log('✅ Таблица bids уже существует');
  } else {
    console.log('🔄 Создание таблицы bids...');
    
    // Создаем таблицу
    db.exec(`
      CREATE TABLE IF NOT EXISTS bids (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        property_id INTEGER NOT NULL,
        bid_amount REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
      );
    `);
    
    // Создаем индексы
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_bids_user_id ON bids(user_id);
      CREATE INDEX IF NOT EXISTS idx_bids_property_id ON bids(property_id);
      CREATE INDEX IF NOT EXISTS idx_bids_created_at ON bids(created_at);
      CREATE INDEX IF NOT EXISTS idx_bids_user_property ON bids(user_id, property_id);
    `);
    
    console.log('✅ Таблица bids успешно создана!');
  }
  
  // Проверяем и добавляем поле auction_minimum_bid в properties
  try {
    const pragmaInfo = db.prepare("PRAGMA table_info(properties)").all();
    const hasAuctionMinimumBid = pragmaInfo.some(col => col.name === 'auction_minimum_bid');
    
    if (!hasAuctionMinimumBid) {
      console.log('🔄 Добавление поля auction_minimum_bid в таблицу properties...');
      db.exec('ALTER TABLE properties ADD COLUMN auction_minimum_bid REAL');
      console.log('✅ Поле auction_minimum_bid добавлено');
    } else {
      console.log('✅ Поле auction_minimum_bid уже существует');
    }
  } catch (error) {
    console.warn('⚠️ Ошибка при проверке/добавлении поля auction_minimum_bid:', error.message);
  }
  
  db.close();
  console.log('✅ Готово!');
} catch (error) {
  console.error('❌ Ошибка:', error);
  process.exit(1);
}

