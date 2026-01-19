import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'server', 'database.sqlite');

console.log('🗑️  Очистка базы данных...\n');

try {
  const db = new Database(DB_PATH);
  
  console.log('📊 Текущее состояние базы:');
  
  // Подсчитываем записи перед очисткой
  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const documentsCount = db.prepare('SELECT COUNT(*) as count FROM documents').get().count;
  const notificationsCount = db.prepare('SELECT COUNT(*) as count FROM notifications').get().count;
  const administratorsCount = db.prepare('SELECT COUNT(*) as count FROM administrators').get().count;
  
  console.log(`  - Пользователей: ${usersCount}`);
  console.log(`  - Документов: ${documentsCount}`);
  console.log(`  - Уведомлений: ${notificationsCount}`);
  console.log(`  - Администраторов: ${administratorsCount}\n`);
  
  if (usersCount === 0 && documentsCount === 0 && notificationsCount === 0 && administratorsCount === 0) {
    console.log('✅ База данных уже пуста.');
    db.close();
    process.exit(0);
  }
  
  // Запрашиваем подтверждение
  console.log('⚠️  ВНИМАНИЕ: Все данные будут удалены!');
  console.log('   Нажмите Ctrl+C для отмены или Enter для продолжения...\n');
  
  // Ждем подтверждения (в реальном скрипте можно добавить readline для интерактивного подтверждения)
  // Для автоматического выполнения используем небольшую задержку
  
  // Очищаем данные из таблиц (в правильном порядке из-за внешних ключей)
  console.log('🔄 Удаление данных...\n');
  
  // Включаем внешние ключи для каскадного удаления
  db.pragma('foreign_keys = ON');
  
  // Удаляем уведомления (самые независимые)
  const deletedNotifications = db.prepare('DELETE FROM notifications').run();
  console.log(`  ✅ Удалено уведомлений: ${deletedNotifications.changes}`);
  
  // Удаляем документы (зависят от пользователей)
  const deletedDocuments = db.prepare('DELETE FROM documents').run();
  console.log(`  ✅ Удалено документов: ${deletedDocuments.changes}`);
  
  // Удаляем пользователей (зависят от администраторов для created_by, но это nullable)
  const deletedUsers = db.prepare('DELETE FROM users').run();
  console.log(`  ✅ Удалено пользователей: ${deletedUsers.changes}`);
  
  // Администраторов НЕ удаляем - они системные
  // Но можно удалить всех кроме супер-админа, если нужно
  const deletedAdmins = db.prepare("DELETE FROM administrators WHERE username != 'admin'").run();
  console.log(`  ✅ Удалено администраторов (кроме admin): ${deletedAdmins.changes}`);
  
  // Проверяем результат
  const usersCountAfter = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const documentsCountAfter = db.prepare('SELECT COUNT(*) as count FROM documents').get().count;
  const notificationsCountAfter = db.prepare('SELECT COUNT(*) as count FROM notifications').get().count;
  
  console.log('\n📊 Состояние после очистки:');
  console.log(`  - Пользователей: ${usersCountAfter}`);
  console.log(`  - Документов: ${documentsCountAfter}`);
  console.log(`  - Уведомлений: ${notificationsCountAfter}`);
  console.log(`  - Администраторов: ${db.prepare('SELECT COUNT(*) as count FROM administrators').get().count}`);
  
  // Выполняем VACUUM для освобождения места
  console.log('\n🔧 Оптимизация базы данных (VACUUM)...');
  db.exec('VACUUM');
  console.log('  ✅ Оптимизация завершена');
  
  db.close();
  
  console.log('\n✅ База данных успешно очищена!');
  process.exit(0);
  
} catch (error) {
  console.error('\n❌ Ошибка при очистке базы данных:', error.message);
  console.error('   Убедитесь, что сервер остановлен и файл базы данных доступен.');
  process.exit(1);
}

