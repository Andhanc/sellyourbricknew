import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'server', 'database.sqlite');
const userId = 9;

try {
  if (!existsSync(DB_PATH)) {
    console.error('❌ База данных не найдена:', DB_PATH);
    console.error('   Убедитесь, что сервер был запущен хотя бы один раз.');
    process.exit(1);
  }
  
  const db = new Database(DB_PATH);
  
  // Проверяем, существует ли пользователь
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  
  if (!user) {
    console.log('❌ Пользователь с id=' + userId + ' не найден в базе данных');
    db.close();
    process.exit(1);
  }
  
  console.log('📋 Найден пользователь:');
  console.log('  ID:', user.id);
  console.log('  Имя:', user.first_name, user.last_name || '');
  console.log('  Email:', user.email || '(не указан)');
  console.log('  Телефон:', user.phone_number || '(не указан)');
  
  // Удаляем пользователя
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  
  if (result.changes > 0) {
    console.log('\n✅ Пользователь с id=' + userId + ' успешно удален из базы данных');
    console.log('   Удалено записей:', result.changes);
  } else {
    console.log('\n❌ Не удалось удалить пользователя с id=' + userId);
  }
  
  db.close();
} catch (error) {
  console.error('❌ Ошибка при удалении пользователя:', error.message);
  process.exit(1);
}

