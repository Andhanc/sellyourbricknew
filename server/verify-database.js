import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'database.sqlite');

console.log('🔍 Проверка базы данных для аукциона\n');
console.log('=' .repeat(50));

try {
  const db = new Database(DB_PATH);
  
  // 1. Проверка таблицы bids
  console.log('\n1️⃣ Проверка таблицы BIDS:');
  const bidsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='bids'").get();
  if (bidsTable) {
    console.log('   ✅ Таблица bids существует');
    
    const bidsStructure = db.prepare("PRAGMA table_info(bids)").all();
    console.log('   Структура:');
    bidsStructure.forEach(col => {
      console.log(`      - ${col.name} (${col.type})`);
    });
    
    const bidsCount = db.prepare("SELECT COUNT(*) as count FROM bids").get();
    console.log(`   Записей в таблице: ${bidsCount.count}`);
    
    const bidsIndexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='bids'").all();
    console.log('   Индексы:');
    bidsIndexes.forEach(idx => console.log(`      - ${idx.name}`));
  } else {
    console.log('   ❌ Таблица bids НЕ найдена!');
  }
  
  // 2. Проверка поля auction_minimum_bid
  console.log('\n2️⃣ Проверка поля auction_minimum_bid в таблице properties:');
  const propertiesInfo = db.prepare("PRAGMA table_info(properties)").all();
  const hasAuctionMinimumBid = propertiesInfo.some(col => col.name === 'auction_minimum_bid');
  
  if (hasAuctionMinimumBid) {
    console.log('   ✅ Поле auction_minimum_bid существует');
    const field = propertiesInfo.find(col => col.name === 'auction_minimum_bid');
    console.log(`   Тип: ${field.type}`);
  } else {
    console.log('   ❌ Поле auction_minimum_bid НЕ найдено!');
  }
  
  // 3. Список всех таблиц
  console.log('\n3️⃣ Все таблицы в базе данных:');
  const allTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  allTables.forEach(t => {
    if (t.name === 'bids') {
      console.log(`   ✅ ${t.name} (новая таблица для аукциона)`);
    } else {
      console.log(`   - ${t.name}`);
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Проверка завершена!');
  
  if (bidsTable && hasAuctionMinimumBid) {
    console.log('✅ Всё готово для работы аукциона!');
  } else {
    console.log('⚠️ Некоторые компоненты отсутствуют. Запустите create-bids-table.js для создания.');
  }
  
  db.close();
} catch (error) {
  console.error('❌ Ошибка:', error);
  process.exit(1);
}

