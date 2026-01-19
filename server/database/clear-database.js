import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', 'database.sqlite');

console.log('🧹 Начинаю очистку базы данных...');

try {
  const db = new Database(DB_PATH);
  
  // Очищаем все таблицы в правильном порядке (учитывая внешние ключи)
  console.log('🗑️ Удаление данных из таблиц...');
  
  // Отключаем внешние ключи временно для очистки
  db.pragma('foreign_keys = OFF');
  
  // Очищаем таблицы
  db.exec('DELETE FROM notifications');
  db.exec('DELETE FROM documents');
  db.exec('DELETE FROM users');
  db.exec(`DELETE FROM administrators WHERE username != 'admin'`);
  
  // Включаем обратно внешние ключи
  db.pragma('foreign_keys = ON');
  
  // Сбрасываем автоинкременты
  db.exec(`DELETE FROM sqlite_sequence WHERE name IN ('users', 'documents', 'notifications', 'administrators')`);
  
  db.close();
  
  console.log('✅ База данных успешно очищена!');
  console.log('   - Все пользователи удалены');
  console.log('   - Все документы удалены');
  console.log('   - Все уведомления удалены');
  console.log('   - Все администраторы (кроме admin) удалены');
  console.log('   - Автоинкременты сброшены');
  
} catch (error) {
  console.error('❌ Ошибка при очистке базы данных:', error.message);
  process.exit(1);
}

