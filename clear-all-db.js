import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'server', 'database.sqlite');

console.log('🧹 Начинаю ПОЛНУЮ очистку базы данных...\n');

try {
  // Проверяем размер БД до очистки
  if (fs.existsSync(DB_PATH)) {
    const stats = fs.statSync(DB_PATH);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 Текущий размер БД: ${sizeMB} МБ\n`);
  }

  const db = new Database(DB_PATH);
  
  console.log('📊 Текущее состояние базы:');
  
  // Функция для подсчета записей
  const getCount = (tableName) => {
    try {
      const result = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      return result ? result.count : 0;
    } catch (error) {
      return 0; // Таблица не существует
    }
  };
  
  // Список всех таблиц
  const tables = [
    'notifications',
    'documents',
    'bids',
    'purchase_requests',
    'property_shares',
    'transactions',
    'properties_apartments',
    'properties_houses',
    'properties',
    'whatsapp_users',
    'users',
    'administrators'
  ];
  
  // Подсчитываем записи перед очисткой
  const counts = {};
  tables.forEach(table => {
    counts[table] = getCount(table);
    if (counts[table] > 0) {
      console.log(`  - ${table}: ${counts[table]}`);
    }
  });
  
  const totalCount = Object.values(counts).reduce((sum, count) => sum + count, 0);
  
  if (totalCount === 0) {
    console.log('\n✅ База данных уже пуста.');
    db.close();
    process.exit(0);
  }
  
  console.log(`\n⚠️  ВНИМАНИЕ: Все данные будут удалены!`);
  console.log(`   Всего записей: ${totalCount}\n`);
  
  // Отключаем внешние ключи временно для очистки
  db.pragma('foreign_keys = OFF');
  
  console.log('🔄 Удаление данных...\n');
  
  // Очищаем таблицы в правильном порядке (сначала зависимые, потом основные)
  const deleteOrder = [
    'notifications',
    'documents',
    'bids',
    'purchase_requests',
    'property_shares',
    'transactions',
    'properties_apartments',
    'properties_houses',
    'properties',
    'whatsapp_users',
    'users',
    'administrators'
  ];
  
  let totalDeleted = 0;
  
  deleteOrder.forEach(table => {
    try {
      const result = db.prepare(`DELETE FROM ${table}`).run();
      if (result.changes > 0) {
        console.log(`  ✅ ${table}: удалено ${result.changes} записей`);
        totalDeleted += result.changes;
      }
    } catch (error) {
      // Игнорируем ошибки для несуществующих таблиц
      if (!error.message.includes('no such table')) {
        console.log(`  ⚠️  ${table}: ${error.message}`);
      }
    }
  });
  
  // Удаляем всех администраторов кроме admin (если нужно оставить)
  try {
    const result = db.prepare("DELETE FROM administrators WHERE username != 'admin'").run();
    if (result.changes > 0) {
      console.log(`  ✅ administrators (кроме admin): удалено ${result.changes} записей`);
    }
  } catch (error) {
    // Игнорируем если таблицы нет
  }
  
  // Включаем обратно внешние ключи
  db.pragma('foreign_keys = ON');
  
  // Сбрасываем автоинкременты для всех таблиц
  console.log('\n🔄 Сброс автоинкрементов...');
  try {
    const sequenceTables = deleteOrder.filter(t => t !== 'administrators');
    const placeholders = sequenceTables.map(() => '?').join(',');
    db.prepare(`DELETE FROM sqlite_sequence WHERE name IN (${placeholders})`).run(...sequenceTables);
    console.log('  ✅ Автоинкременты сброшены');
  } catch (error) {
    console.log(`  ⚠️  Ошибка при сбросе автоинкрементов: ${error.message}`);
  }
  
  // Проверяем результат
  console.log('\n📊 Состояние после очистки:');
  let allEmpty = true;
  tables.forEach(table => {
    const count = getCount(table);
    if (count > 0 && table !== 'administrators') {
      console.log(`  - ${table}: ${count} (осталось)`);
      allEmpty = false;
    }
  });
  
  if (allEmpty) {
    console.log('  ✅ Все таблицы пусты (кроме administrators)');
  }
  
  // Выполняем VACUUM для освобождения места и уменьшения размера файла
  console.log('\n🔧 Оптимизация базы данных (VACUUM)...');
  db.exec('VACUUM');
  console.log('  ✅ Оптимизация завершена');
  
  db.close();
  
  // Проверяем размер БД после очистки
  if (fs.existsSync(DB_PATH)) {
    const stats = fs.statSync(DB_PATH);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`\n📊 Размер БД после очистки: ${sizeMB} МБ`);
    
    if (parseFloat(sizeMB) > 80) {
      console.log(`\n⚠️  ВНИМАНИЕ: Размер БД (${sizeMB} МБ) превышает 80 МБ!`);
      console.log('   Возможно, нужно удалить файлы из папки uploads или проверить другие данные.');
    } else {
      console.log(`\n✅ Размер БД (${sizeMB} МБ) в пределах нормы (< 80 МБ)`);
    }
  }
  
  console.log('\n✅ База данных успешно очищена!');
  process.exit(0);
  
} catch (error) {
  console.error('\n❌ Ошибка при очистке базы данных:', error.message);
  console.error('   Убедитесь, что сервер остановлен и файл базы данных доступен.');
  process.exit(1);
}
