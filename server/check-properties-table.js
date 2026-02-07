import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'database.sqlite');

try {
  const db = new Database(DB_PATH);
  
  console.log('📊 Проверка таблицы properties:\n');
  
  // Проверяем структуру таблицы
  const tableInfo = db.prepare("PRAGMA table_info(properties)").all();
  console.log('Поля таблицы properties:');
  const hasAuctionMinimumBid = tableInfo.some(col => col.name === 'auction_minimum_bid');
  
  tableInfo.forEach(col => {
    if (col.name === 'auction_minimum_bid') {
      console.log(`  ✅ ${col.name} (${col.type}) - существует`);
    } else {
      console.log(`  - ${col.name} (${col.type})`);
    }
  });
  
  if (!hasAuctionMinimumBid) {
    console.log('\n⚠️ Поле auction_minimum_bid НЕ найдено! Добавляю...');
    db.exec('ALTER TABLE properties ADD COLUMN auction_minimum_bid REAL');
    console.log('✅ Поле auction_minimum_bid добавлено');
  } else {
    console.log('\n✅ Поле auction_minimum_bid существует');
  }
  
  db.close();
  console.log('\n✅ Готово!');
} catch (error) {
  console.error('❌ Ошибка:', error);
  process.exit(1);
}

