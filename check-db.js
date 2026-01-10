import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'server', 'database.sqlite');

try {
  if (!existsSync(DB_PATH)) {
    console.error('❌ База данных не найдена:', DB_PATH);
    console.error('   Убедитесь, что сервер был запущен хотя бы один раз.');
    process.exit(1);
  }
  
  const db = new Database(DB_PATH);
  
  console.log('📊 Проверка базы данных...\n');
  console.log('=' .repeat(60));
  
  // Получаем всех пользователей
  const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT 10').all();
  
  if (users.length === 0) {
    console.log('❌ В базе данных нет пользователей');
  } else {
    console.log(`✅ Найдено пользователей: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`\n👤 Пользователь #${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Имя: ${user.first_name || 'Не указано'}`);
      console.log(`   Фамилия: ${user.last_name || 'Не указано'}`);
      console.log(`   Email: ${user.email || '(не указан - регистрация через WhatsApp)'}`);
      console.log(`   Телефон: ${user.phone_number || 'Не указан'}`);
      console.log(`   Страна: ${user.country || 'Не указана'}`);
      console.log(`   Роль: ${user.role || 'buyer'}`);
      console.log(`   Верифицирован: ${user.is_verified ? 'Да' : 'Нет'}`);
      console.log(`   Онлайн: ${user.is_online ? 'Да' : 'Нет'}`);
      console.log(`   Создан: ${new Date(user.created_at).toLocaleString('ru-RU')}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  db.close();
} catch (error) {
  console.error('❌ Ошибка при проверке базы данных:', error.message);
  if (error.message.includes('no such file')) {
    console.error('   База данных не найдена. Убедитесь, что сервер был запущен хотя бы один раз.');
  }
  process.exit(1);
}

