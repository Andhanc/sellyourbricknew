# Инструкции по добавлению queries для недвижимости

## Что нужно сделать:

### 1. Добавить создание таблиц в checkAndUpdateSchema

В файле `database.js`, после строки 717 (после `purchaseRequestsError`), добавьте следующий код:

```javascript
      // Создаем таблицы для раздельного хранения квартир и домов
      try {
        const apartmentsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='properties_apartments'").get();
        const housesTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='properties_houses'").get();
        
        if (!apartmentsTable || !housesTable) {
          console.log('🔄 Создание таблиц для квартир и домов...');
          const separateTablesSql = readFileSync(join(__dirname, 'create_separate_property_tables.sql'), 'utf8');
          db.exec(separateTablesSql);
          console.log('✅ Таблицы для квартир и домов созданы');
        }
        
        // Проверяем и добавляем поля бронирования, если их нет
        if (apartmentsTable) {
          const apartmentsPragma = db.prepare("PRAGMA table_info(properties_apartments)").all();
          const hasReservedUntil = apartmentsPragma.some(col => col.name === 'reserved_until');
          
          if (!hasReservedUntil) {
            console.log('🔄 Обновление схемы БД: добавляем поля бронирования...');
            try {
              const reservationSql = readFileSync(join(__dirname, 'add_reservation_fields.sql'), 'utf8');
              db.exec(reservationSql);
              console.log('✅ Поля бронирования добавлены в таблицы недвижимости');
            } catch (reservationError) {
              if (!reservationError.message.includes('duplicate column name') && !reservationError.message.includes('ENOENT')) {
                console.warn('⚠️ Не удалось добавить поля бронирования:', reservationError.message);
              }
            }
          }
        }
      } catch (separateTablesError) {
        console.warn('⚠️ Не удалось создать раздельные таблицы недвижимости:', separateTablesError.message);
      }
```

### 2. Добавить queries в конец файла database.js

После строки 1989 (после `purchaseRequestQueries`), добавьте все queries из файла `C:\Проекты\sell15.02\sellyourbricknew\server\database\database.js`, начиная со строки 1954.

Нужно скопировать:
- `apartmentQueries` (строки 1954-2338)
- `propertyQueries` (строки 2348-3062)
- `houseQueries` (строки 3064-3444)

### 3. Проверить server.js

Убедитесь, что в `server.js` есть импорты:
```javascript
import { userQueries, documentQueries, notificationQueries, administratorQueries, whatsappUserQueries, purchaseRequestQueries, apartmentQueries, houseQueries, propertyQueries } from './database/database.js';
```

### 4. Обновить POST /api/properties endpoint

В `server.js` нужно обновить endpoint `POST /api/properties`, чтобы он использовал `apartmentQueries` и `houseQueries` вместо старой таблицы `properties`.
