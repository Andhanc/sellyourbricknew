import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'database.sqlite');

try {
  const db = new Database(DB_PATH);
  
  console.log('📊 Проверка ставок в базе данных:\n');
  
  // Проверяем все ставки
  const bids = db.prepare("SELECT * FROM bids ORDER BY created_at DESC LIMIT 10").all();
  
  if (bids.length === 0) {
    console.log('⚠️ В таблице bids нет записей');
    console.log('Это означает, что ставки не сохраняются в БД');
  } else {
    console.log(`✅ Найдено ${bids.length} ставок:\n`);
    bids.forEach((bid, index) => {
      console.log(`${index + 1}. Ставка ID: ${bid.id}`);
      console.log(`   Пользователь: ${bid.user_id}`);
      console.log(`   Объект: ${bid.property_id}`);
      console.log(`   Сумма: ${bid.bid_amount}`);
      console.log(`   Дата: ${bid.created_at}`);
      console.log('');
    });
  }
  
  db.close();
} catch (error) {
  console.error('❌ Ошибка:', error);
  process.exit(1);
}

