import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'server', 'database.sqlite');

console.log('🧹 Начинаю очистку объектов недвижимости из базы данных...\n');

try {
  const db = new Database(DB_PATH);
  
  console.log('📊 Текущее состояние базы:');
  
  // Подсчитываем записи перед очисткой
  const getCount = (tableName) => {
    try {
      const result = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      return result ? result.count : 0;
    } catch (error) {
      return 0; // Таблица не существует
    }
  };
  
  const propertiesCount = getCount('properties');
  const apartmentsCount = getCount('properties_apartments');
  const housesCount = getCount('properties_houses');
  const sharesCount = getCount('property_shares');
  const bidsCount = getCount('bids');
  const purchaseRequestsCount = getCount('purchase_requests');
  const transactionsCount = getCount('transactions');
  
  console.log(`  - Объектов (properties): ${propertiesCount}`);
  console.log(`  - Квартир (properties_apartments): ${apartmentsCount}`);
  console.log(`  - Домов (properties_houses): ${housesCount}`);
  console.log(`  - Долей (property_shares): ${sharesCount}`);
  console.log(`  - Ставок (bids): ${bidsCount}`);
  console.log(`  - Запросов на покупку (purchase_requests): ${purchaseRequestsCount}`);
  console.log(`  - Транзакций (transactions): ${transactionsCount}\n`);
  
  const totalCount = propertiesCount + apartmentsCount + housesCount + sharesCount + 
                     bidsCount + purchaseRequestsCount + transactionsCount;
  
  if (totalCount === 0) {
    console.log('✅ База данных уже не содержит объектов недвижимости.');
    db.close();
    process.exit(0);
  }
  
  console.log('⚠️  ВНИМАНИЕ: Все объекты недвижимости и связанные данные будут удалены!');
  console.log('   Начинаю очистку...\n');
  
  // Отключаем внешние ключи временно для очистки
  db.pragma('foreign_keys = OFF');
  
  // Очищаем таблицы в правильном порядке (сначала зависимые, потом основные)
  console.log('🔄 Удаление данных...\n');
  
  // Удаляем ставки (зависят от properties)
  try {
    const deletedBids = db.prepare('DELETE FROM bids').run();
    console.log(`  ✅ Удалено ставок: ${deletedBids.changes}`);
  } catch (error) {
    console.log(`  ⚠️  Таблица bids не существует или ошибка: ${error.message}`);
  }
  
  // Удаляем запросы на покупку (зависят от properties)
  try {
    const deletedPurchaseRequests = db.prepare('DELETE FROM purchase_requests').run();
    console.log(`  ✅ Удалено запросов на покупку: ${deletedPurchaseRequests.changes}`);
  } catch (error) {
    console.log(`  ⚠️  Таблица purchase_requests не существует или ошибка: ${error.message}`);
  }
  
  // Удаляем доли в объектах (зависят от properties)
  try {
    const deletedShares = db.prepare('DELETE FROM property_shares').run();
    console.log(`  ✅ Удалено долей: ${deletedShares.changes}`);
  } catch (error) {
    console.log(`  ⚠️  Таблица property_shares не существует или ошибка: ${error.message}`);
  }
  
  // Удаляем транзакции (могут быть связаны с объектами)
  try {
    const deletedTransactions = db.prepare('DELETE FROM transactions').run();
    console.log(`  ✅ Удалено транзакций: ${deletedTransactions.changes}`);
  } catch (error) {
    console.log(`  ⚠️  Таблица transactions не существует или ошибка: ${error.message}`);
  }
  
  // Удаляем квартиры
  try {
    const deletedApartments = db.prepare('DELETE FROM properties_apartments').run();
    console.log(`  ✅ Удалено квартир: ${deletedApartments.changes}`);
  } catch (error) {
    console.log(`  ⚠️  Таблица properties_apartments не существует или ошибка: ${error.message}`);
  }
  
  // Удаляем дома
  try {
    const deletedHouses = db.prepare('DELETE FROM properties_houses').run();
    console.log(`  ✅ Удалено домов: ${deletedHouses.changes}`);
  } catch (error) {
    console.log(`  ⚠️  Таблица properties_houses не существует или ошибка: ${error.message}`);
  }
  
  // Удаляем основные объекты
  try {
    const deletedProperties = db.prepare('DELETE FROM properties').run();
    console.log(`  ✅ Удалено объектов: ${deletedProperties.changes}`);
  } catch (error) {
    console.log(`  ⚠️  Таблица properties не существует или ошибка: ${error.message}`);
  }
  
  // Включаем обратно внешние ключи
  db.pragma('foreign_keys = ON');
  
  // Сбрасываем автоинкременты
  try {
    db.exec(`DELETE FROM sqlite_sequence WHERE name IN (
      'properties', 
      'properties_apartments', 
      'properties_houses', 
      'property_shares', 
      'bids', 
      'purchase_requests',
      'transactions'
    )`);
    console.log(`  ✅ Автоинкременты сброшены`);
  } catch (error) {
    console.log(`  ⚠️  Ошибка при сбросе автоинкрементов: ${error.message}`);
  }
  
  // Проверяем результат
  console.log('\n📊 Состояние после очистки:');
  console.log(`  - Объектов (properties): ${getCount('properties')}`);
  console.log(`  - Квартир (properties_apartments): ${getCount('properties_apartments')}`);
  console.log(`  - Домов (properties_houses): ${getCount('properties_houses')}`);
  console.log(`  - Долей (property_shares): ${getCount('property_shares')}`);
  console.log(`  - Ставок (bids): ${getCount('bids')}`);
  console.log(`  - Запросов на покупку (purchase_requests): ${getCount('purchase_requests')}`);
  console.log(`  - Транзакций (transactions): ${getCount('transactions')}`);
  
  // Выполняем VACUUM для освобождения места и уменьшения размера файла
  console.log('\n🔧 Оптимизация базы данных (VACUUM)...');
  db.exec('VACUUM');
  console.log('  ✅ Оптимизация завершена');
  
  db.close();
  
  console.log('\n✅ Объекты недвижимости успешно удалены из базы данных!');
  console.log('   Размер файла базы данных должен уменьшиться.');
  process.exit(0);
  
} catch (error) {
  console.error('\n❌ Ошибка при очистке базы данных:', error.message);
  console.error('   Убедитесь, что сервер остановлен и файл базы данных доступен.');
  process.exit(1);
}
