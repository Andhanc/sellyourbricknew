# 🔧 Исправление ошибки "no such table: purchase_requests"

## Проблема
Таблица `purchase_requests` не создается автоматически при запуске сервера.

## Решение

### Вариант 1: Добавить код в database.js (рекомендуется)

Откройте файл `server/database/database.js` и найдите строку **405**:
```javascript
        console.warn('⚠️ Не удалось создать таблицу WhatsApp пользователей:', whatsappError.message);
      }
```

**ДОБАВЬТЕ** сразу после этой строки (перед `} catch (migrationError) {`) следующий код:

```javascript
      // Создаем таблицу запросов на покупку, если её нет
      try {
        const purchaseRequestsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='purchase_requests'").get();
        if (!purchaseRequestsTable) {
          console.log('🔄 Создание таблицы запросов на покупку...');
          try {
            const purchaseRequestsSql = readFileSync(join(__dirname, 'create_purchase_requests.sql'), 'utf8');
            db.exec(purchaseRequestsSql);
            console.log('✅ Таблица запросов на покупку создана');
          } catch (sqlError) {
            // Если файл не найден, создаем таблицу напрямую
            if (sqlError.code === 'ENOENT') {
              console.log('⚠️ Файл create_purchase_requests.sql не найден, создаю таблицу напрямую...');
              db.exec(`
                CREATE TABLE IF NOT EXISTS purchase_requests (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  buyer_id TEXT,
                  buyer_name TEXT NOT NULL,
                  buyer_email TEXT,
                  buyer_phone TEXT,
                  property_id INTEGER,
                  property_title TEXT NOT NULL,
                  property_price REAL,
                  property_currency TEXT DEFAULT 'USD',
                  property_location TEXT,
                  property_type TEXT,
                  property_area TEXT,
                  request_date TEXT NOT NULL,
                  status TEXT DEFAULT 'pending',
                  admin_notes TEXT,
                  created_at TEXT DEFAULT (datetime('now')),
                  updated_at TEXT DEFAULT (datetime('now'))
                );
                CREATE INDEX IF NOT EXISTS idx_purchase_requests_buyer_id ON purchase_requests(buyer_id);
                CREATE INDEX IF NOT EXISTS idx_purchase_requests_property_id ON purchase_requests(property_id);
                CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);
                CREATE INDEX IF NOT EXISTS idx_purchase_requests_created_at ON purchase_requests(created_at);
                CREATE TRIGGER IF NOT EXISTS update_purchase_requests_timestamp 
                AFTER UPDATE ON purchase_requests
                BEGIN
                  UPDATE purchase_requests SET updated_at = datetime('now') WHERE id = NEW.id;
                END;
              `);
              console.log('✅ Таблица запросов на покупку создана напрямую');
            } else {
              throw sqlError;
            }
          }
        }
      } catch (purchaseRequestsError) {
        console.warn('⚠️ Не удалось создать таблицу запросов на покупку:', purchaseRequestsError.message);
      }
```

### Вариант 2: Создать таблицу вручную через SQL

Если не хотите редактировать код, можно создать таблицу напрямую:

1. Откройте базу данных:
```bash
sqlite3 database.sqlite
```

2. Выполните SQL из файла `server/database/create_purchase_requests.sql`

Или скопируйте и выполните:

```sql
CREATE TABLE IF NOT EXISTS purchase_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  buyer_id TEXT,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT,
  buyer_phone TEXT,
  property_id INTEGER,
  property_title TEXT NOT NULL,
  property_price REAL,
  property_currency TEXT DEFAULT 'USD',
  property_location TEXT,
  property_type TEXT,
  property_area TEXT,
  request_date TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_buyer_id ON purchase_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_property_id ON purchase_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_created_at ON purchase_requests(created_at);

CREATE TRIGGER IF NOT EXISTS update_purchase_requests_timestamp 
AFTER UPDATE ON purchase_requests
BEGIN
  UPDATE purchase_requests SET updated_at = datetime('now') WHERE id = NEW.id;
END;
```

## После исправления

1. **Перезапустите сервер**
2. При запуске вы должны увидеть в консоли:
   ```
   🔄 Создание таблицы запросов на покупку...
   ✅ Таблица запросов на покупку создана
   ```
3. Попробуйте снова отправить запрос на покупку

## Проверка

После перезапуска сервера проверьте, что таблица создана:

```bash
sqlite3 database.sqlite "SELECT name FROM sqlite_master WHERE type='table' AND name='purchase_requests';"
```

Должно вернуть: `purchase_requests`
