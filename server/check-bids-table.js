import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'database.sqlite');

try {
  const db = new Database(DB_PATH);
  
  console.log('📊 Проверка таблицы bids:\n');
  
  // Проверяем структуру таблицы
  const tableInfo = db.prepare("PRAGMA table_info(bids)").all();
  console.log('Структура таблицы bids:');
  console.table(tableInfo);
  
  // Проверяем индексы
  const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='bids'").all();
  console.log('\nИндексы таблицы bids:');
  indexes.forEach(idx => console.log(`  - ${idx.name}`));
  
  // Проверяем количество записей
  const count = db.prepare("SELECT COUNT(*) as count FROM bids").get();
  console.log(`\nКоличество записей в таблице: ${count.count}`);
  
  // Показываем все таблицы в БД
  const allTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('\nВсе таблицы в базе данных:');
  allTables.forEach(t => console.log(`  - ${t.name}`));
  
  db.close();
} catch (error) {
  console.error('❌ Ошибка:', error);
  process.exit(1);
}

