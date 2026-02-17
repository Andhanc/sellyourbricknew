import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Путь к файлу базы данных
const DB_PATH = join(__dirname, '..', 'database.sqlite');

// Создаем или открываем базу данных
let db = null;

// Настройки для стабильной работы БД
const DB_CONFIG = {
  // Включаем WAL режим для лучшего параллелизма чтения/записи
  // WAL позволяет множественным читателям работать одновременно с писателем
  // Это значительно улучшает производительность при множественных запросах
  wal: true,
  
  // Время ожидания при блокировке БД (в миллисекундах)
  // Если БД заблокирована другим процессом, будем ждать до 10 секунд
  // вместо немедленного возврата ошибки
  busyTimeout: 10000,
  
  // Включаем строгий режим для лучшей валидации данных
  strict: false,
  
  // Включаем журналирование SQL для отладки (в production можно отключить)
  verbose: null
};

// Константы для retry логики
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 100, // миллисекунды
  retryableErrors: [
    'SQLITE_BUSY',
    'SQLITE_LOCKED',
    'database is locked',
    'database disk image is malformed'
  ]
};

/**
 * Проверяет, нужно ли обновить схему БД
 */
function checkAndUpdateSchema(dbInstance) {
  try {
    // Проверяем, существует ли таблица users
    const tableInfo = dbInstance.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    
    if (tableInfo) {
      // Таблица существует, проверяем структуру
      const pragmaInfo = dbInstance.prepare("PRAGMA table_info(users)").all();
      const emailColumn = pragmaInfo.find(col => col.name === 'email');
      const passwordColumn = pragmaInfo.find(col => col.name === 'password');
      
      let needsUpdate = false;
      
      // Если email имеет ограничение NOT NULL, обновляем схему
      if (emailColumn && emailColumn.notnull === 1) {
        console.log('🔄 Обновление схемы БД: делаем email nullable...');
        needsUpdate = true;
      }
      
      // Если поле password отсутствует, добавляем его
      if (!passwordColumn) {
        console.log('🔄 Обновление схемы БД: добавляем поле password...');
        needsUpdate = true;
      }
      
      // Проверяем, есть ли поле is_blocked
      const isBlockedColumn = pragmaInfo.find(col => col.name === 'is_blocked');
      if (!isBlockedColumn) {
        console.log('🔄 Обновление схемы БД: добавляем поле is_blocked...');
        needsUpdate = true;
      }
      
      // Проверяем, есть ли поля для карты и депозита
      const hasCardColumn = pragmaInfo.find(col => col.name === 'has_card');
      const depositAmountColumn = pragmaInfo.find(col => col.name === 'deposit_amount');
      if (!hasCardColumn || !depositAmountColumn) {
        console.log('🔄 Обновление схемы БД: добавляем поля для карты и депозита...');
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        try {
          // Если нет поля password, добавляем его
          if (!passwordColumn) {
            dbInstance.exec("ALTER TABLE users ADD COLUMN password TEXT");
            console.log('✅ Поле password добавлено в таблицу users');
          }
          
          // Если нет поля is_blocked, добавляем его
          if (!isBlockedColumn) {
            try {
              dbInstance.exec("ALTER TABLE users ADD COLUMN is_blocked INTEGER DEFAULT 0");
              console.log('✅ Поле is_blocked добавлено в таблицу users');
              // Создаем индекс
              dbInstance.exec("CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users(is_blocked)");
              console.log('✅ Индекс idx_users_is_blocked создан');
            } catch (blockedError) {
              console.warn('⚠️ Не удалось добавить поле is_blocked:', blockedError.message);
            }
          }
          
          // Добавляем поля для карты и депозита, если их нет
          if (!hasCardColumn) {
            try {
              dbInstance.exec("ALTER TABLE users ADD COLUMN has_card INTEGER DEFAULT 0");
              console.log('✅ Поле has_card добавлено в таблицу users');
            } catch (cardError) {
              console.warn('⚠️ Не удалось добавить поле has_card:', cardError.message);
            }
          }
          if (!depositAmountColumn) {
            try {
              dbInstance.exec("ALTER TABLE users ADD COLUMN deposit_amount REAL DEFAULT 0");
              console.log('✅ Поле deposit_amount добавлено в таблицу users');
            } catch (depositError) {
              console.warn('⚠️ Не удалось добавить поле deposit_amount:', depositError.message);
            }
          }
          // Добавляем остальные поля карты
          const cardNumberColumn = pragmaInfo.find(col => col.name === 'card_number');
          const cardTypeColumn = pragmaInfo.find(col => col.name === 'card_type');
          const cardCvvColumn = pragmaInfo.find(col => col.name === 'card_cvv');
          if (!cardNumberColumn) {
            try {
              dbInstance.exec("ALTER TABLE users ADD COLUMN card_number TEXT");
              console.log('✅ Поле card_number добавлено в таблицу users');
            } catch (e) {
              console.warn('⚠️ Не удалось добавить поле card_number:', e.message);
            }
          }
          if (!cardTypeColumn) {
            try {
              dbInstance.exec("ALTER TABLE users ADD COLUMN card_type TEXT");
              console.log('✅ Поле card_type добавлено в таблицу users');
            } catch (e) {
              console.warn('⚠️ Не удалось добавить поле card_type:', e.message);
            }
          }
          if (!cardCvvColumn) {
            try {
              dbInstance.exec("ALTER TABLE users ADD COLUMN card_cvv TEXT");
              console.log('✅ Поле card_cvv добавлено в таблицу users');
            } catch (e) {
              console.warn('⚠️ Не удалось добавить поле card_cvv:', e.message);
            }
          }
          // Создаем индекс для has_card
          try {
            dbInstance.exec("CREATE INDEX IF NOT EXISTS idx_users_has_card ON users(has_card)");
            console.log('✅ Индекс idx_users_has_card создан');
          } catch (e) {
            // Индекс может уже существовать
          }
          
          // Если email NOT NULL, исправляем
          if (emailColumn && emailColumn.notnull === 1) {
            const fixSql = readFileSync(join(__dirname, 'fix_email_nullable.sql'), 'utf8');
            dbInstance.exec(fixSql);
            console.log('✅ Схема БД успешно обновлена (email nullable)');
          }
        } catch (fixError) {
          console.warn('⚠️ Не удалось обновить схему автоматически:', fixError.message);
          console.warn('   Выполните вручную: sqlite3 database.sqlite < server/database/add_password_field.sql');
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Ошибка при проверке схемы БД:', error.message);
  }
}

/**
 * Retry обертка для операций с БД
 * Повторяет операцию при возникновении ошибок блокировки
 */
function withRetry(operation, maxRetries = RETRY_CONFIG.maxRetries) {
  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return operation();
    } catch (error) {
      lastError = error;
      
      // Проверяем, является ли ошибка перезапускаемой
      const isRetryable = RETRY_CONFIG.retryableErrors.some(retryableError => 
        error.message?.includes(retryableError) || 
        error.code?.includes(retryableError)
      );
      
      if (!isRetryable || attempt >= maxRetries) {
        throw error;
      }
      
      // Задержка перед повтором (экспоненциальный backoff)
      const delay = RETRY_CONFIG.retryDelay * Math.pow(2, attempt);
      console.warn(`⚠️ Ошибка БД (попытка ${attempt + 1}/${maxRetries + 1}):`, error.message);
      console.log(`   Повтор через ${delay}мс...`);
      
      // Синхронная задержка (простая реализация для better-sqlite3)
      const start = Date.now();
      while (Date.now() - start < delay) {
        // Busy wait
      }
    }
  }
  
  throw lastError;
}

/**
 * Выполняет периодическое обслуживание БД (VACUUM, ANALYZE)
 */
function performMaintenance(dbInstance) {
  try {
    console.log('🔧 Выполняю обслуживание БД (VACUUM, ANALYZE)...');
    
    // VACUUM освобождает неиспользуемое пространство и оптимизирует БД
    dbInstance.exec('VACUUM;');
    
    // ANALYZE обновляет статистику для оптимизатора запросов
    dbInstance.exec('ANALYZE;');
    
    console.log('✅ Обслуживание БД завершено');
  } catch (error) {
    // Не критично, просто логируем
    console.warn('⚠️ Ошибка при обслуживании БД:', error.message);
  }
}

/**
 * Инициализация базы данных
 */
export function initDatabase() {
  try {
    // Создаем соединение с БД с улучшенными настройками
    db = new Database(DB_PATH, {
      timeout: DB_CONFIG.busyTimeout,
      verbose: DB_CONFIG.verbose
    });
    
    // Включаем WAL режим для лучшего параллелизма
    // WAL (Write-Ahead Logging) позволяет множественным читателям работать
    // одновременно с одним писателем, что значительно улучшает производительность
    db.pragma('journal_mode = WAL');
    console.log('✅ WAL режим включен для лучшей производительности');
    
    // Устанавливаем busy timeout - БД будет ждать до 10 секунд при блокировке
    db.pragma(`busy_timeout = ${DB_CONFIG.busyTimeout}`);
    console.log(`✅ Busy timeout установлен: ${DB_CONFIG.busyTimeout}мс`);
    
    // Включаем внешние ключи для целостности данных
    db.pragma('foreign_keys = ON');
    console.log('✅ Внешние ключи включены');
    
    // Дополнительные оптимизации для производительности
    // synchronous = NORMAL - хороший баланс между производительностью и надежностью
    db.pragma('synchronous = NORMAL');
    
    // Увеличиваем кэш страниц для лучшей производительности (16MB)
    db.pragma('cache_size = -16384'); // отрицательное значение = килобайты
    
    // Включаем temp_store в памяти для временных таблиц (быстрее)
    db.pragma('temp_store = MEMORY');
    
    console.log('✅ Оптимизации производительности применены');
    
    // ВАЖНО: Сначала проверяем и обновляем схему существующих таблиц,
    // чтобы добавить недостающие колонки ПЕРЕД выполнением init.sql
    // (который может пытаться создавать индексы на этих колонках)
    checkAndUpdateSchema(db);
    
    // Читаем и выполняем SQL-скрипт инициализации
    // Используем try-catch, чтобы игнорировать ошибки, если таблицы/индексы уже существуют
    try {
      const initSql = readFileSync(join(__dirname, 'init.sql'), 'utf8');
      db.exec(initSql);
    } catch (initError) {
      // Игнорируем ошибки "already exists", но логируем другие
      if (!initError.message.includes('already exists') && 
          !initError.message.includes('duplicate column name')) {
        console.warn('⚠️ Ошибка при выполнении init.sql (это нормально для существующих БД):', initError.message);
      }
    }
    
    // Проверяем и обновляем схему документов для верификации
    try {
      const pragmaInfo = db.prepare("PRAGMA table_info(documents)").all();
      const hasVerificationStatus = pragmaInfo.some(col => col.name === 'verification_status');
      const hasRejectionReason = pragmaInfo.some(col => col.name === 'rejection_reason');
      
      if (!hasVerificationStatus || !hasRejectionReason) {
        console.log('🔄 Обновление схемы БД: добавляем поля верификации документов...');
        const migrationSql = readFileSync(join(__dirname, 'add_verification_status.sql'), 'utf8');
        db.exec(migrationSql);
        console.log('✅ Поля верификации документов добавлены');
      }
      
      // Создаем индексы для оптимизации запросов по verification_status
      try {
        db.exec(`
          CREATE INDEX IF NOT EXISTS idx_documents_verification_status ON documents(verification_status);
          CREATE INDEX IF NOT EXISTS idx_documents_user_status ON documents(user_id, verification_status);
        `);
        console.log('✅ Индексы для документов созданы');
      } catch (indexError) {
        // Индексы могут уже существовать, это нормально
        if (!indexError.message.includes('already exists')) {
          console.warn('⚠️ Не удалось создать индексы:', indexError.message);
        }
      }
      
      // Создаем таблицу уведомлений, если её нет
      try {
        const notificationsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'").get();
        if (!notificationsTable) {
          console.log('🔄 Создание таблицы уведомлений...');
          db.exec(`
            CREATE TABLE IF NOT EXISTS notifications (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              type TEXT NOT NULL,
              title TEXT NOT NULL,
              message TEXT,
              data TEXT,
              is_read INTEGER DEFAULT 0,
              view_count INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
            CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
            CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
          `);
          console.log('✅ Таблица уведомлений создана');
        }
      } catch (notifError) {
        console.warn('⚠️ Не удалось создать таблицу уведомлений:', notifError.message);
      }

      // Создаем таблицу администраторов, если её нет
      try {
        const administratorsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='administrators'").get();
        if (!administratorsTable) {
          console.log('🔄 Создание таблицы администраторов...');
          db.exec(`
            CREATE TABLE IF NOT EXISTS administrators (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT UNIQUE NOT NULL,
              password TEXT NOT NULL,
              email TEXT,
              full_name TEXT,
              is_super_admin INTEGER DEFAULT 0,
              can_access_statistics INTEGER DEFAULT 0,
              can_access_users INTEGER DEFAULT 0,
              can_access_moderation INTEGER DEFAULT 0,
              can_access_chat INTEGER DEFAULT 0,
              can_access_objects INTEGER DEFAULT 0,
              can_access_access_management INTEGER DEFAULT 0,
              created_by INTEGER,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (created_by) REFERENCES administrators(id) ON DELETE SET NULL
            );
            CREATE INDEX IF NOT EXISTS idx_administrators_username ON administrators(username);
            CREATE INDEX IF NOT EXISTS idx_administrators_is_super_admin ON administrators(is_super_admin);
            CREATE INDEX IF NOT EXISTS idx_administrators_email ON administrators(email);
          `);
          console.log('✅ Таблица администраторов создана');
        } else {
          // Если таблица уже существует, проверяем и создаем индекс для email, если его нет
          try {
            db.exec('CREATE INDEX IF NOT EXISTS idx_administrators_email ON administrators(email)');
          } catch (indexError) {
            // Индекс может уже существовать, это нормально
            if (!indexError.message.includes('already exists')) {
              console.warn('⚠️ Не удалось создать индекс для email администраторов:', indexError.message);
            }
          }
        }
      } catch (adminError) {
        console.warn('⚠️ Не удалось создать таблицу администраторов:', adminError.message);
      }

      // Создаем таблицу недвижимости, если её нет
      try {
        const propertiesTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='properties'").get();
        if (!propertiesTable) {
          console.log('🔄 Создание таблицы недвижимости...');
          const propertiesSql = readFileSync(join(__dirname, 'add_properties_table.sql'), 'utf8');
          db.exec(propertiesSql);
          console.log('✅ Таблица недвижимости создана');
        } else {
          // Таблица существует, проверяем и добавляем недостающие поля
          const pragmaInfo = db.prepare("PRAGMA table_info(properties)").all();
          const hasLivingArea = pragmaInfo.some(col => col.name === 'living_area');
          const hasBuildingType = pragmaInfo.some(col => col.name === 'building_type');
          const hasAdditionalAmenities = pragmaInfo.some(col => col.name === 'additional_amenities');
          const hasTestDrive = pragmaInfo.some(col => col.name === 'test_drive');
          
          if (!hasLivingArea || !hasBuildingType || !hasAdditionalAmenities) {
            console.log('🔄 Обновление схемы БД: добавляем поля living_area, building_type и additional_amenities...');
            try {
              const migrationSql = readFileSync(join(__dirname, 'add_properties_fields.sql'), 'utf8');
              db.exec(migrationSql);
              console.log('✅ Поля living_area, building_type и additional_amenities добавлены в таблицу properties');
            } catch (migrationError) {
              // Игнорируем ошибки "duplicate column name" (поле уже существует)
              if (!migrationError.message.includes('duplicate column name')) {
                console.warn('⚠️ Не удалось выполнить миграцию properties:', migrationError.message);
              }
            }
          }
          
          // Проверяем и добавляем поле test_drive, если его нет
          if (!hasTestDrive) {
            console.log('🔄 Обновление схемы БД: добавляем поле test_drive...');
            try {
              const migrationSql = readFileSync(join(__dirname, 'add_test_drive_field.sql'), 'utf8');
              db.exec(migrationSql);
              console.log('✅ Поле test_drive добавлено в таблицу properties');
            } catch (migrationError) {
              // Игнорируем ошибки "duplicate column name" (поле уже существует)
              if (!migrationError.message.includes('duplicate column name')) {
                console.warn('⚠️ Не удалось добавить поле test_drive:', migrationError.message);
              }
            }
          }
          
          // Проверяем и добавляем поле test_timer_end_date, если его нет
          const hasTestTimer = pragmaInfo.some(col => col.name === 'test_timer_end_date');
          if (!hasTestTimer) {
            console.log('🔄 Обновление схемы БД: добавляем поле test_timer_end_date...');
            try {
              const migrationSql = readFileSync(join(__dirname, 'add_test_timer_field.sql'), 'utf8');
              db.exec(migrationSql);
              console.log('✅ Поле test_timer_end_date добавлено в таблицу properties');
            } catch (migrationError) {
              // Игнорируем ошибки "duplicate column name" (поле уже существует)
              if (!migrationError.message.includes('duplicate column name')) {
                console.warn('⚠️ Не удалось добавить поле test_timer_end_date:', migrationError.message);
              }
            }
          }
        }
      } catch (propertiesError) {
        console.warn('⚠️ Не удалось создать таблицу недвижимости:', propertiesError.message);
        // Если файл миграции не найден, создаем таблицу напрямую
        if (propertiesError.code === 'ENOENT') {
          try {
            const initSql = readFileSync(join(__dirname, 'init.sql'), 'utf8');
            // Извлекаем только часть с таблицей properties
            const propertiesMatch = initSql.match(/CREATE TABLE IF NOT EXISTS properties[\s\S]*?\);[\s\S]*?CREATE INDEX IF NOT EXISTS idx_properties[\s\S]*?;/g);
            if (propertiesMatch) {
              db.exec(propertiesMatch[0]);
              console.log('✅ Таблица недвижимости создана из init.sql');
            }
          } catch (fallbackError) {
            console.warn('⚠️ Не удалось создать таблицу недвижимости из init.sql:', fallbackError.message);
          }
        }
      }

      // Создаем таблицу WhatsApp пользователей, если её нет
      try {
        const whatsappUsersTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='whatsapp_users'").get();
        if (!whatsappUsersTable) {
          console.log('🔄 Создание таблицы WhatsApp пользователей...');
          const whatsappSql = readFileSync(join(__dirname, 'add_whatsapp_users_table.sql'), 'utf8');
          db.exec(whatsappSql);
          console.log('✅ Таблица WhatsApp пользователей создана');
        }
      } catch (whatsappError) {
        console.warn('⚠️ Не удалось создать таблицу WhatsApp пользователей:', whatsappError.message);
      }

      // Создаем таблицу транзакций, если её нет
      try {
        const transactionsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'").get();
        if (!transactionsTable) {
          console.log('🔄 Создание таблицы транзакций...');
          db.exec(`
            CREATE TABLE IF NOT EXISTS transactions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              type TEXT NOT NULL, -- 'deposit', 'withdrawal'
              amount REAL NOT NULL,
              description TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
            CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
            CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
          `);
          console.log('✅ Таблица транзакций создана');
        }
      } catch (transactionsError) {
        console.warn('⚠️ Не удалось создать таблицу транзакций:', transactionsError.message);
      }

      // Создаем таблицу ставок (bids), если её нет
      try {
        const bidsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='bids'").get();
        if (!bidsTable) {
          console.log('🔄 Создание таблицы ставок...');
          const bidsSql = readFileSync(join(__dirname, 'add_bids_table.sql'), 'utf8');
          db.exec(bidsSql);
          console.log('✅ Таблица ставок создана');
        }
      } catch (bidsError) {
        // Если файл не найден, создаем таблицу напрямую
        if (bidsError.code === 'ENOENT') {
          try {
            db.exec(`
              CREATE TABLE IF NOT EXISTS bids (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                property_id INTEGER NOT NULL,
                bid_amount REAL NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
              );
              CREATE INDEX IF NOT EXISTS idx_bids_user_id ON bids(user_id);
              CREATE INDEX IF NOT EXISTS idx_bids_property_id ON bids(property_id);
              CREATE INDEX IF NOT EXISTS idx_bids_created_at ON bids(created_at);
              CREATE INDEX IF NOT EXISTS idx_bids_user_property ON bids(user_id, property_id);
            `);
            console.log('✅ Таблица ставок создана');
          } catch (fallbackError) {
            console.warn('⚠️ Не удалось создать таблицу ставок:', fallbackError.message);
          }
        } else {
          console.warn('⚠️ Не удалось создать таблицу ставок:', bidsError.message);
        }
      }

      // Проверяем и добавляем поле auction_minimum_bid в таблицу properties
      try {
        const propertiesTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='properties'").get();
        if (propertiesTable) {
          const pragmaInfo = db.prepare("PRAGMA table_info(properties)").all();
          const hasAuctionMinimumBid = pragmaInfo.some(col => col.name === 'auction_minimum_bid');
          
          if (!hasAuctionMinimumBid) {
            console.log('🔄 Обновление схемы БД: добавляем поле auction_minimum_bid...');
            try {
              db.exec('ALTER TABLE properties ADD COLUMN auction_minimum_bid REAL');
              console.log('✅ Поле auction_minimum_bid добавлено в таблицу properties');
            } catch (migrationError) {
              // Игнорируем ошибки "duplicate column name" (поле уже существует)
              if (!migrationError.message.includes('duplicate column name')) {
                console.warn('⚠️ Не удалось добавить поле auction_minimum_bid:', migrationError.message);
              }
            }
          }
        }
      } catch (auctionBidError) {
        console.warn('⚠️ Не удалось проверить/добавить поле auction_minimum_bid:', auctionBidError.message);
      }
<<<<<<< HEAD
=======

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
                  seller_id TEXT,
                  seller_name TEXT,
                  seller_email TEXT,
                  seller_phone TEXT,
                  property_id INTEGER,
                  property_title TEXT NOT NULL,
                  property_description TEXT,
                  property_price REAL,
                  property_currency TEXT DEFAULT 'USD',
                  property_location TEXT,
                  property_type TEXT,
                  property_area TEXT,
                  property_rooms INTEGER,
                  property_bedrooms INTEGER,
                  property_bathrooms INTEGER,
                  property_floor INTEGER,
                  property_total_floors INTEGER,
                  property_year_built INTEGER,
                  property_living_area TEXT,
                  property_land_area TEXT,
                  property_building_type TEXT,
                  property_renovation TEXT,
                  property_condition TEXT,
                  property_heating TEXT,
                  property_water_supply TEXT,
                  property_sewerage TEXT,
                  property_balcony INTEGER DEFAULT 0,
                  property_parking INTEGER DEFAULT 0,
                  property_elevator INTEGER DEFAULT 0,
                  property_garage INTEGER DEFAULT 0,
                  property_pool INTEGER DEFAULT 0,
                  property_garden INTEGER DEFAULT 0,
                  property_electricity INTEGER DEFAULT 0,
                  property_internet INTEGER DEFAULT 0,
                  property_security INTEGER DEFAULT 0,
                  property_furniture INTEGER DEFAULT 0,
                  property_commercial_type TEXT,
                  property_business_hours TEXT,
                  request_date TEXT NOT NULL,
                  status TEXT DEFAULT 'pending',
                  admin_notes TEXT,
                  created_at TEXT DEFAULT (datetime('now')),
                  updated_at TEXT DEFAULT (datetime('now'))
                );
                CREATE INDEX IF NOT EXISTS idx_purchase_requests_buyer_id ON purchase_requests(buyer_id);
                CREATE INDEX IF NOT EXISTS idx_purchase_requests_seller_id ON purchase_requests(seller_id);
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
        } else {
          // Таблица существует, проверяем и добавляем недостающие поля
          const pragmaInfo = db.prepare("PRAGMA table_info(purchase_requests)").all();
          const columnNames = pragmaInfo.map(col => col.name);
          
          // Список всех полей, которые должны быть
          const allFields = [
            { name: 'seller_id', type: 'TEXT' },
            { name: 'seller_name', type: 'TEXT' },
            { name: 'seller_email', type: 'TEXT' },
            { name: 'seller_phone', type: 'TEXT' },
            { name: 'property_description', type: 'TEXT' },
            { name: 'property_rooms', type: 'INTEGER' },
            { name: 'property_bedrooms', type: 'INTEGER' },
            { name: 'property_bathrooms', type: 'INTEGER' },
            { name: 'property_floor', type: 'INTEGER' },
            { name: 'property_total_floors', type: 'INTEGER' },
            { name: 'property_year_built', type: 'INTEGER' },
            { name: 'property_living_area', type: 'TEXT' },
            { name: 'property_land_area', type: 'TEXT' },
            { name: 'property_building_type', type: 'TEXT' },
            { name: 'property_renovation', type: 'TEXT' },
            { name: 'property_condition', type: 'TEXT' },
            { name: 'property_heating', type: 'TEXT' },
            { name: 'property_water_supply', type: 'TEXT' },
            { name: 'property_sewerage', type: 'TEXT' },
            { name: 'property_balcony', type: 'INTEGER' },
            { name: 'property_parking', type: 'INTEGER' },
            { name: 'property_elevator', type: 'INTEGER' },
            { name: 'property_garage', type: 'INTEGER' },
            { name: 'property_pool', type: 'INTEGER' },
            { name: 'property_garden', type: 'INTEGER' },
            { name: 'property_electricity', type: 'INTEGER' },
            { name: 'property_internet', type: 'INTEGER' },
            { name: 'property_security', type: 'INTEGER' },
            { name: 'property_furniture', type: 'INTEGER' },
            { name: 'property_commercial_type', type: 'TEXT' },
            { name: 'property_business_hours', type: 'TEXT' }
          ];
          
          for (const field of allFields) {
            if (!columnNames.includes(field.name)) {
              try {
                db.exec(`ALTER TABLE purchase_requests ADD COLUMN ${field.name} ${field.type}`);
                console.log(`✅ Добавлено поле ${field.name} в таблицу purchase_requests`);
              } catch (alterError) {
                if (alterError.message.includes('duplicate column name')) {
                  console.log(`⚠️ Поле ${field.name} уже существует`);
                } else {
                  console.warn(`⚠️ Не удалось добавить поле ${field.name}:`, alterError.message);
                }
              }
            }
          }
          
          // Создаем индекс для seller_id, если его нет
          try {
            db.exec('CREATE INDEX IF NOT EXISTS idx_purchase_requests_seller_id ON purchase_requests(seller_id)');
          } catch (indexError) {
            if (!indexError.message.includes('already exists')) {
              console.warn('⚠️ Не удалось создать индекс idx_purchase_requests_seller_id:', indexError.message);
            }
          }
        }
      } catch (purchaseRequestsError) {
        console.warn('⚠️ Не удалось создать/обновить таблицу запросов на покупку:', purchaseRequestsError.message);
      }
      
      // Создаем таблицы для квартир/апартаментов и домов/вилл
      try {
        const apartmentsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='properties_apartments'").get();
        if (!apartmentsTable) {
          console.log('📋 Создаем таблицу properties_apartments...');
          const sqlPath = join(__dirname, 'create_separate_property_tables.sql');
          if (existsSync(sqlPath)) {
            const sql = readFileSync(sqlPath, 'utf8');
            // Выполняем только CREATE TABLE для apartments
            const apartmentsSQL = sql.split('-- ============================================')[0] + sql.split('-- ============================================')[1].split('-- ============================================')[0];
            db.exec(apartmentsSQL);
          } else {
            // Если файл не найден, создаем таблицу напрямую
            db.exec(`
              CREATE TABLE IF NOT EXISTS properties_apartments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                property_type TEXT NOT NULL CHECK(property_type IN ('apartment', 'commercial')),
                title TEXT NOT NULL,
                description TEXT,
                price REAL,
                currency TEXT DEFAULT 'USD',
                is_auction INTEGER DEFAULT 0,
                auction_start_date TEXT,
                auction_end_date TEXT,
                auction_starting_price REAL,
                area REAL,
                living_area REAL,
                building_type TEXT,
                rooms INTEGER,
                bathrooms INTEGER,
                floor INTEGER,
                total_floors INTEGER,
                year_built INTEGER,
                location TEXT,
                address TEXT,
                apartment TEXT,
                country TEXT,
                city TEXT,
                coordinates TEXT,
                amenities TEXT,
                renovation TEXT,
                condition TEXT,
                heating TEXT,
                water_supply TEXT,
                sewerage TEXT,
                balcony INTEGER DEFAULT 0,
                parking INTEGER DEFAULT 0,
                elevator INTEGER DEFAULT 0,
                electricity INTEGER DEFAULT 0,
                internet INTEGER DEFAULT 0,
                security INTEGER DEFAULT 0,
                furniture INTEGER DEFAULT 0,
                commercial_type TEXT,
                business_hours TEXT,
                additional_amenities TEXT,
                photos TEXT,
                videos TEXT,
                additional_documents TEXT,
                ownership_document TEXT,
                no_debts_document TEXT,
                test_drive INTEGER DEFAULT 0,
                test_drive_data TEXT,
                moderation_status TEXT DEFAULT 'pending',
                reviewed_by TEXT,
                reviewed_at TEXT,
                rejection_reason TEXT,
                is_shared_ownership INTEGER DEFAULT 0,
                total_shares INTEGER,
                shares_sold INTEGER DEFAULT 0,
                reserved_until TEXT,
                reserved_by INTEGER,
                purchase_request_id INTEGER,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
              );
              CREATE INDEX IF NOT EXISTS idx_apartments_user_id ON properties_apartments(user_id);
              CREATE INDEX IF NOT EXISTS idx_apartments_moderation_status ON properties_apartments(moderation_status);
              CREATE INDEX IF NOT EXISTS idx_apartments_property_type ON properties_apartments(property_type);
              CREATE INDEX IF NOT EXISTS idx_apartments_user_status ON properties_apartments(user_id, moderation_status);
              CREATE INDEX IF NOT EXISTS idx_apartments_city ON properties_apartments(city);
              CREATE INDEX IF NOT EXISTS idx_apartments_country ON properties_apartments(country);
            `);
          }
          console.log('✅ Таблица properties_apartments создана');
        } else {
          // Проверяем и добавляем недостающие поля
          const apartmentsPragma = db.prepare("PRAGMA table_info(properties_apartments)").all();
          const existingFields = apartmentsPragma.map(f => f.name);
          const requiredFields = {
            'reserved_until': 'TEXT',
            'reserved_by': 'INTEGER',
            'purchase_request_id': 'INTEGER',
            'is_shared_ownership': 'INTEGER DEFAULT 0',
            'total_shares': 'INTEGER',
            'shares_sold': 'INTEGER DEFAULT 0'
          };
          
          for (const [fieldName, fieldType] of Object.entries(requiredFields)) {
            if (!existingFields.includes(fieldName)) {
              try {
                db.exec(`ALTER TABLE properties_apartments ADD COLUMN ${fieldName} ${fieldType}`);
                console.log(`✅ Добавлено поле ${fieldName} в properties_apartments`);
              } catch (alterError) {
                console.warn(`⚠️ Не удалось добавить поле ${fieldName}:`, alterError.message);
              }
            }
          }
        }
        
        const housesTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='properties_houses'").get();
        if (!housesTable) {
          console.log('📋 Создаем таблицу properties_houses...');
          db.exec(`
            CREATE TABLE IF NOT EXISTS properties_houses (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              property_type TEXT NOT NULL CHECK(property_type IN ('house', 'villa')),
              title TEXT NOT NULL,
              description TEXT,
              price REAL,
              currency TEXT DEFAULT 'USD',
              is_auction INTEGER DEFAULT 0,
              auction_start_date TEXT,
              auction_end_date TEXT,
              auction_starting_price REAL,
              area REAL,
              living_area REAL,
              land_area REAL,
              building_type TEXT,
              bedrooms INTEGER,
              bathrooms INTEGER,
              floors INTEGER,
              year_built INTEGER,
              location TEXT,
              address TEXT,
              country TEXT,
              city TEXT,
              coordinates TEXT,
              amenities TEXT,
              renovation TEXT,
              condition TEXT,
              heating TEXT,
              water_supply TEXT,
              sewerage TEXT,
              pool INTEGER DEFAULT 0,
              garden INTEGER DEFAULT 0,
              garage INTEGER DEFAULT 0,
              parking INTEGER DEFAULT 0,
              electricity INTEGER DEFAULT 0,
              internet INTEGER DEFAULT 0,
              security INTEGER DEFAULT 0,
              furniture INTEGER DEFAULT 0,
              additional_amenities TEXT,
              photos TEXT,
              videos TEXT,
              additional_documents TEXT,
              ownership_document TEXT,
              no_debts_document TEXT,
              test_drive INTEGER DEFAULT 0,
              test_drive_data TEXT,
              moderation_status TEXT DEFAULT 'pending',
              reviewed_by TEXT,
              reviewed_at TEXT,
              rejection_reason TEXT,
              is_shared_ownership INTEGER DEFAULT 0,
              total_shares INTEGER,
              shares_sold INTEGER DEFAULT 0,
              reserved_until TEXT,
              reserved_by INTEGER,
              purchase_request_id INTEGER,
              created_at TEXT DEFAULT (datetime('now')),
              updated_at TEXT DEFAULT (datetime('now')),
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_houses_user_id ON properties_houses(user_id);
            CREATE INDEX IF NOT EXISTS idx_houses_moderation_status ON properties_houses(moderation_status);
            CREATE INDEX IF NOT EXISTS idx_houses_property_type ON properties_houses(property_type);
            CREATE INDEX IF NOT EXISTS idx_houses_user_status ON properties_houses(user_id, moderation_status);
            CREATE INDEX IF NOT EXISTS idx_houses_city ON properties_houses(city);
            CREATE INDEX IF NOT EXISTS idx_houses_country ON properties_houses(country);
          `);
          console.log('✅ Таблица properties_houses создана');
        } else {
          // Проверяем и добавляем недостающие поля
          const housesPragma = db.prepare("PRAGMA table_info(properties_houses)").all();
          const existingFields = housesPragma.map(f => f.name);
          const requiredFields = {
            'reserved_until': 'TEXT',
            'reserved_by': 'INTEGER',
            'purchase_request_id': 'INTEGER',
            'is_shared_ownership': 'INTEGER DEFAULT 0',
            'total_shares': 'INTEGER',
            'shares_sold': 'INTEGER DEFAULT 0'
          };
          
          for (const [fieldName, fieldType] of Object.entries(requiredFields)) {
            if (!existingFields.includes(fieldName)) {
              try {
                db.exec(`ALTER TABLE properties_houses ADD COLUMN ${fieldName} ${fieldType}`);
                console.log(`✅ Добавлено поле ${fieldName} в properties_houses`);
              } catch (alterError) {
                console.warn(`⚠️ Не удалось добавить поле ${fieldName}:`, alterError.message);
              }
            }
          }
        }
        
        // Создаем таблицу property_shares, если её нет
        try {
          const sharesTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='property_shares'").get();
          if (!sharesTable) {
            db.exec(`
              CREATE TABLE IF NOT EXISTS property_shares (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                property_id INTEGER NOT NULL,
                property_type TEXT NOT NULL CHECK(property_type IN ('apartment', 'commercial', 'house', 'villa')),
                buyer_id INTEGER NOT NULL,
                shares_count INTEGER NOT NULL,
                price_per_share REAL NOT NULL,
                total_price REAL NOT NULL,
                currency TEXT DEFAULT 'USD',
                purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'completed',
                FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
              );
              CREATE INDEX IF NOT EXISTS idx_shares_property ON property_shares(property_id, property_type);
              CREATE INDEX IF NOT EXISTS idx_shares_buyer ON property_shares(buyer_id);
              CREATE INDEX IF NOT EXISTS idx_shares_status ON property_shares(status);
              CREATE INDEX IF NOT EXISTS idx_shares_property_buyer ON property_shares(property_id, property_type, buyer_id);
            `);
            console.log('✅ Таблица property_shares создана');
          }
        } catch (sharesError) {
          console.warn('⚠️ Не удалось создать таблицу property_shares:', sharesError.message);
        }
      } catch (propertiesTablesError) {
        console.error('❌ Не удалось создать/обновить таблицы недвижимости:', propertiesTablesError.message);
        console.error('❌ Stack:', propertiesTablesError.stack);
        // Пытаемся создать таблицу напрямую в случае ошибки
        try {
          console.log('🔄 Попытка создать таблицу properties_apartments напрямую...');
          db.exec(`
            CREATE TABLE IF NOT EXISTS properties_apartments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              property_type TEXT NOT NULL CHECK(property_type IN ('apartment', 'commercial')),
              title TEXT NOT NULL,
              description TEXT,
              price REAL,
              currency TEXT DEFAULT 'USD',
              is_auction INTEGER DEFAULT 0,
              auction_start_date TEXT,
              auction_end_date TEXT,
              auction_starting_price REAL,
              area REAL,
              living_area REAL,
              building_type TEXT,
              rooms INTEGER,
              bathrooms INTEGER,
              floor INTEGER,
              total_floors INTEGER,
              year_built INTEGER,
              location TEXT,
              address TEXT,
              apartment TEXT,
              country TEXT,
              city TEXT,
              coordinates TEXT,
              amenities TEXT,
              renovation TEXT,
              condition TEXT,
              heating TEXT,
              water_supply TEXT,
              sewerage TEXT,
              balcony INTEGER DEFAULT 0,
              parking INTEGER DEFAULT 0,
              elevator INTEGER DEFAULT 0,
              electricity INTEGER DEFAULT 0,
              internet INTEGER DEFAULT 0,
              security INTEGER DEFAULT 0,
              furniture INTEGER DEFAULT 0,
              commercial_type TEXT,
              business_hours TEXT,
              additional_amenities TEXT,
              photos TEXT,
              videos TEXT,
              additional_documents TEXT,
              ownership_document TEXT,
              no_debts_document TEXT,
              test_drive INTEGER DEFAULT 0,
              test_drive_data TEXT,
              moderation_status TEXT DEFAULT 'pending',
              reviewed_by TEXT,
              reviewed_at TEXT,
              rejection_reason TEXT,
              is_shared_ownership INTEGER DEFAULT 0,
              total_shares INTEGER,
              shares_sold INTEGER DEFAULT 0,
              reserved_until TEXT,
              reserved_by INTEGER,
              purchase_request_id INTEGER,
              created_at TEXT DEFAULT (datetime('now')),
              updated_at TEXT DEFAULT (datetime('now')),
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_apartments_user_id ON properties_apartments(user_id);
            CREATE INDEX IF NOT EXISTS idx_apartments_moderation_status ON properties_apartments(moderation_status);
            CREATE INDEX IF NOT EXISTS idx_apartments_property_type ON properties_apartments(property_type);
            CREATE INDEX IF NOT EXISTS idx_apartments_user_status ON properties_apartments(user_id, moderation_status);
            CREATE INDEX IF NOT EXISTS idx_apartments_city ON properties_apartments(city);
            CREATE INDEX IF NOT EXISTS idx_apartments_country ON properties_apartments(country);
          `);
          console.log('✅ Таблица properties_apartments создана напрямую');
        } catch (fallbackError) {
          console.error('❌ Критическая ошибка: не удалось создать таблицу properties_apartments:', fallbackError.message);
        }
      }
>>>>>>> 9834624ce85afa7fe9aa397716cd67d8da737a39
    } catch (migrationError) {
      console.warn('⚠️ Не удалось обновить схему документов:', migrationError.message);
    }
    
    // Выполняем начальное обслуживание БД
    performMaintenance(db);
    
    // Настраиваем периодическое обслуживание БД (каждые 24 часа)
    // В production можно использовать более сложный планировщик
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        performMaintenance(db);
      }, 24 * 60 * 60 * 1000); // 24 часа
      console.log('✅ Периодическое обслуживание БД настроено (каждые 24 часа)');
    }
    
    console.log('✅ База данных успешно инициализирована:', DB_PATH);
    return db;
  } catch (error) {
    console.error('❌ Ошибка при инициализации базы данных:', error);
    
    // Если это ошибка блокировки, даем рекомендацию
    if (error.message?.includes('locked') || error.code?.includes('SQLITE_BUSY')) {
      console.error('💡 Рекомендация: Убедитесь, что другой процесс не использует БД.');
      console.error('   Закройте другие экземпляры сервера или другие инструменты работы с БД.');
    }
    
    throw error;
  }
}

/**
 * Получить экземпляр базы данных
 * С проверкой работоспособности соединения
 */
export function getDatabase() {
  if (!db) {
    db = initDatabase();
  }
  
  // Проверяем, что соединение все еще активно
  try {
    // Простая проверка - выполняем простой запрос
    db.prepare('SELECT 1').get();
  } catch (error) {
    // Если соединение потеряно, пересоздаем его
    console.warn('⚠️ Соединение с БД потеряно, пересоздаю...');
    try {
      db.close();
    } catch (closeError) {
      // Игнорируем ошибки закрытия
    }
    db = initDatabase();
  }
  
  return db;
}

/**
 * Закрыть соединение с базой данных
 * С безопасным завершением всех операций
 */
export function closeDatabase() {
  if (db) {
    try {
      // Выполняем финальное обслуживание перед закрытием
      console.log('🔧 Выполняю финальное обслуживание БД...');
      performMaintenance(db);
      
      // Закрываем соединение
      db.close();
      db = null;
      console.log('✅ Соединение с базой данных закрыто');
    } catch (error) {
      console.error('❌ Ошибка при закрытии БД:', error.message);
      // Всё равно обнуляем переменную
      db = null;
    }
  }
}

/**
 * Выполняет операцию с автоматическим retry при ошибках блокировки
 * Используйте эту функцию для критичных операций
 */
export function executeWithRetry(operation) {
  return withRetry(() => {
    const database = getDatabase();
    return operation(database);
  });
}

// Экспортируем функции для работы с пользователями
export const userQueries = {
  /**
   * Создать нового пользователя
   */
  create: (userData) => {
    const db = getDatabase();
    
    // Проверяем, есть ли поле password в таблице
    const pragmaInfo = db.prepare("PRAGMA table_info(users)").all();
    const hasPasswordColumn = pragmaInfo.some(col => col.name === 'password');
    
    if (hasPasswordColumn) {
      // Таблица имеет поле password
      // Проверяем, есть ли поле is_blocked
      const pragmaInfo = db.prepare("PRAGMA table_info(users)").all();
      const hasIsBlocked = pragmaInfo.some(col => col.name === 'is_blocked');
      
      if (hasIsBlocked) {
        const stmt = db.prepare(`
          INSERT INTO users (
            first_name, last_name, email, password, phone_number,
            passport_series, passport_number, identification_number,
            address, country, passport_photo, user_photo,
            is_verified, role, is_online, is_blocked
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        return stmt.run(
          userData.first_name,
          userData.last_name,
          userData.email || null,
          userData.password || null, // Пароль может быть null (для WhatsApp)
          userData.phone_number,
          userData.passport_series || null,
          userData.passport_number || null,
          userData.identification_number || null,
          userData.address || null,
          userData.country || null,
          userData.passport_photo || null,
          userData.user_photo || null,
          userData.is_verified ? 1 : 0,
          userData.role || 'buyer',
          userData.is_online ? 1 : 0,
          userData.is_blocked ? 1 : 0
        );
      } else {
        const stmt = db.prepare(`
          INSERT INTO users (
            first_name, last_name, email, password, phone_number,
            passport_series, passport_number, identification_number,
            address, country, passport_photo, user_photo,
            is_verified, role, is_online
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        return stmt.run(
          userData.first_name,
          userData.last_name,
          userData.email || null,
          userData.password || null, // Пароль может быть null (для WhatsApp)
          userData.phone_number,
          userData.passport_series || null,
          userData.passport_number || null,
          userData.identification_number || null,
          userData.address || null,
          userData.country || null,
          userData.passport_photo || null,
          userData.user_photo || null,
          userData.is_verified ? 1 : 0,
          userData.role || 'buyer',
          userData.is_online ? 1 : 0
        );
      }
    } else {
      // Старая схема без password (для обратной совместимости)
      const stmt = db.prepare(`
        INSERT INTO users (
          first_name, last_name, email, phone_number,
          passport_series, passport_number, identification_number,
          address, country, passport_photo, user_photo,
          is_verified, role, is_online
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      return stmt.run(
        userData.first_name,
        userData.last_name,
        userData.email || null,
        userData.phone_number,
        userData.passport_series || null,
        userData.passport_number || null,
        userData.identification_number || null,
        userData.address || null,
        userData.country || null,
        userData.passport_photo || null,
        userData.user_photo || null,
        userData.is_verified ? 1 : 0,
        userData.role || 'buyer',
        userData.is_online ? 1 : 0
      );
    }
  },

  /**
   * Получить пользователя по ID
   */
  getById: (id) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  },

  /**
   * Получить пользователя по email
   */
  getByEmail: (email) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },

  /**
   * Получить пользователя по номеру телефона
   */
  getByPhone: (phone) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE phone_number = ?');
    return stmt.get(phone);
  },

  /**
   * Обновить данные пользователя
   */
  update: (id, userData) => {
    const db = getDatabase();
    const fields = [];
    const values = [];
    
    const allowedFields = [
      'first_name', 'last_name', 'email', 'password', 'phone_number',
      'passport_series', 'passport_number', 'identification_number',
      'address', 'country', 'passport_photo', 'user_photo',
      'is_verified', 'role', 'is_online', 'is_blocked'
    ];
    
    Object.keys(userData).forEach(key => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        if (key === 'is_verified' || key === 'is_online' || key === 'is_blocked') {
          values.push(userData[key] ? 1 : 0);
        } else if (key === 'password') {
          // Пароль может быть пустой строкой, но если передан - сохраняем
          values.push(userData[key] || null);
        } else {
          values.push(userData[key] || null);
        }
      }
    });
    
    if (fields.length === 0) {
      return { changes: 0 };
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    return stmt.run(...values);
  },

  /**
   * Получить всех пользователей (с пагинацией)
   */
  getAll: (limit = 100, offset = 0) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?');
    return stmt.all(limit, offset);
  },

  /**
   * Получить количество всех пользователей
   */
  getCount: () => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
    const result = stmt.get();
    return result ? result.count : 0;
  },

  /**
   * Получить пользователей по роли
   */
  getByRole: (role) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE role = ? ORDER BY created_at DESC');
    return stmt.all(role);
  },

  /**
   * Удалить пользователя
   */
  delete: (id) => {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    return stmt.run(id);
  },

  /**
   * Получить статистику по странам (национальностям)
   */
  getCountryStats: () => {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT 
        COALESCE(country, 'Не указано') as country,
        COUNT(*) as count
      FROM users
      GROUP BY country
      ORDER BY count DESC
    `);
    return stmt.all();
  },

  /**
   * Получить статистику по ролям (продавцы/покупатели)
   */
  getRoleStats: () => {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT 
        COALESCE(role, 'buyer') as role,
        COUNT(*) as count
      FROM users
      GROUP BY role
    `);
    return stmt.all();
  }
};

// Экспортируем функции для работы с документами
export const documentQueries = {
  /**
   * Создать новый документ
   */
  create: (documentData) => {
    const db = getDatabase();
    
    // Проверяем, есть ли поле verification_status в таблице
    const pragmaInfo = db.prepare("PRAGMA table_info(documents)").all();
    const hasVerificationStatus = pragmaInfo.some(col => col.name === 'verification_status');
    
    if (hasVerificationStatus) {
      const stmt = db.prepare(`
        INSERT INTO documents (user_id, document_type, document_photo, is_reviewed, verification_status)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const verificationStatus = documentData.verification_status || 'pending';
      console.log('💾 Сохранение документа в БД:', {
        user_id: documentData.user_id,
        document_type: documentData.document_type,
        verification_status: verificationStatus,
        is_reviewed: documentData.is_reviewed ? 1 : 0
      });
      
      const result = stmt.run(
        documentData.user_id,
        documentData.document_type || null,
        documentData.document_photo,
        documentData.is_reviewed ? 1 : 0,
        verificationStatus
      );
      
      // Проверяем, что документ действительно сохранен с правильным статусом
      const savedDoc = db.prepare('SELECT * FROM documents WHERE id = ?').get(result.lastInsertRowid);
      console.log('✅ Документ сохранен в БД:', {
        id: savedDoc.id,
        verification_status: savedDoc.verification_status,
        is_reviewed: savedDoc.is_reviewed
      });
      
      return result;
    } else {
      // Старая схема без verification_status
      const stmt = db.prepare(`
        INSERT INTO documents (user_id, document_type, document_photo, is_reviewed)
        VALUES (?, ?, ?, ?)
      `);
      
      return stmt.run(
        documentData.user_id,
        documentData.document_type || null,
        documentData.document_photo,
        documentData.is_reviewed ? 1 : 0
      );
    }
  },

  /**
   * Получить документ по ID
   */
  getById: (id) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM documents WHERE id = ?');
    return stmt.get(id);
  },

  /**
   * Получить все документы пользователя
   */
  getByUserId: (userId) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId);
  },

  /**
   * Получить непросмотренные документы
   */
  getUnreviewed: () => {
    const db = getDatabase();
    // Проверяем, есть ли поле verification_status
    const pragmaInfo = db.prepare("PRAGMA table_info(documents)").all();
    const hasVerificationStatus = pragmaInfo.some(col => col.name === 'verification_status');
    
    if (hasVerificationStatus) {
      const stmt = db.prepare(`
        SELECT d.*, u.first_name, u.last_name, u.email, u.phone_number 
        FROM documents d 
        LEFT JOIN users u ON d.user_id = u.id 
        WHERE d.verification_status = 'pending' 
        ORDER BY d.created_at ASC
      `);
      return stmt.all();
    } else {
      const stmt = db.prepare('SELECT * FROM documents WHERE is_reviewed = 0 ORDER BY created_at ASC');
      return stmt.all();
    }
  },
  
  /**
   * Получить документы на верификацию с информацией о пользователе
   * Упрощенная версия - всегда используем verification_status
   */
  getPendingVerification: () => {
    const db = getDatabase();
    
    // Простой и надежный запрос - получаем все документы со статусом 'pending' с информацией о пользователе
    const stmt = db.prepare(`
      SELECT 
        d.id,
        d.user_id,
        d.document_type,
        d.document_photo,
        d.verification_status,
        d.is_reviewed,
        d.reviewed_by,
        d.reviewed_at,
        d.rejection_reason,
        d.created_at,
        u.id as user_db_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        u.role
      FROM documents d 
      INNER JOIN users u ON d.user_id = u.id 
      WHERE d.verification_status = 'pending' 
      ORDER BY d.created_at ASC
    `);
    
    const results = stmt.all();
    
    // Логирование для отладки
    console.log('🔍 getPendingVerification:');
    console.log('  - Найдено документов со статусом pending:', results.length);
    
    if (results.length > 0) {
      console.log('  - Первый документ:', {
        id: results[0].id,
        user_id: results[0].user_id,
        document_type: results[0].document_type,
        verification_status: results[0].verification_status,
        user_name: `${results[0].first_name} ${results[0].last_name}`,
        user_email: results[0].email,
        user_role: results[0].role || 'не указана'
      });
      
      // Логируем роли всех пользователей для диагностики
      const rolesCount = {};
      results.forEach(doc => {
        const role = doc.role || 'не указана';
        rolesCount[role] = (rolesCount[role] || 0) + 1;
      });
      console.log('  - Распределение по ролям:', rolesCount);
    } else {
      // Проверим, есть ли вообще документы в БД
      const allDocsCount = db.prepare('SELECT COUNT(*) as count FROM documents').get();
      const pendingDocsCount = db.prepare("SELECT COUNT(*) as count FROM documents WHERE verification_status = 'pending'").get();
      console.log('  - Всего документов в БД:', allDocsCount.count);
      console.log('  - Документов со статусом pending:', pendingDocsCount.count);
    }
    
    return results;
  },

  /**
   * Получить все документы (с пагинацией)
   */
  getAll: (limit = 100, offset = 0) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM documents ORDER BY created_at DESC LIMIT ? OFFSET ?');
    return stmt.all(limit, offset);
  },

  /**
   * Отметить документ как просмотренный
   */
  markAsReviewed: (documentId, reviewedBy) => {
    const db = getDatabase();
    const pragmaInfo = db.prepare("PRAGMA table_info(documents)").all();
    const hasVerificationStatus = pragmaInfo.some(col => col.name === 'verification_status');
    
    if (hasVerificationStatus) {
      const stmt = db.prepare(`
        UPDATE documents 
        SET is_reviewed = 1, verification_status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      return stmt.run(reviewedBy, documentId);
    } else {
      const stmt = db.prepare(`
        UPDATE documents 
        SET is_reviewed = 1, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      return stmt.run(reviewedBy, documentId);
    }
  },
  
  /**
   * Одобрить документ (верификация успешна)
   */
  approveDocument: (documentId, reviewedBy) => {
    const db = getDatabase();
    const pragmaInfo = db.prepare("PRAGMA table_info(documents)").all();
    const hasVerificationStatus = pragmaInfo.some(col => col.name === 'verification_status');
    
    if (hasVerificationStatus) {
      const stmt = db.prepare(`
        UPDATE documents 
        SET is_reviewed = 1, verification_status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, rejection_reason = NULL
        WHERE id = ?
      `);
      return stmt.run(reviewedBy, documentId);
    } else {
      // Fallback для старой схемы
      const stmt = db.prepare(`
        UPDATE documents 
        SET is_reviewed = 1, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      return stmt.run(reviewedBy, documentId);
    }
  },
  
  /**
   * Обновить статус документа (универсальная функция)
   */
  updateStatus: (documentId, status, reviewedBy = null, rejectionReason = null) => {
    const db = getDatabase();
    const pragmaInfo = db.prepare("PRAGMA table_info(documents)").all();
    const hasVerificationStatus = pragmaInfo.some(col => col.name === 'verification_status');
    const hasRejectionReason = pragmaInfo.some(col => col.name === 'rejection_reason');
    
    if (hasVerificationStatus) {
      if (hasRejectionReason) {
        const stmt = db.prepare(`
          UPDATE documents 
          SET is_reviewed = 1, verification_status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, rejection_reason = ?
          WHERE id = ?
        `);
        return stmt.run(status, reviewedBy, rejectionReason || null, documentId);
      } else {
        const stmt = db.prepare(`
          UPDATE documents 
          SET is_reviewed = 1, verification_status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        return stmt.run(status, reviewedBy, documentId);
      }
    } else {
      // Fallback для старой схемы
      const stmt = db.prepare(`
        UPDATE documents 
        SET is_reviewed = 1, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      return stmt.run(reviewedBy, documentId);
    }
  },

  /**
   * Отклонить документ
   */
  rejectDocument: (documentId, reviewedBy, rejectionReason = null) => {
    const db = getDatabase();
    const pragmaInfo = db.prepare("PRAGMA table_info(documents)").all();
    const hasVerificationStatus = pragmaInfo.some(col => col.name === 'verification_status');
    const hasRejectionReason = pragmaInfo.some(col => col.name === 'rejection_reason');
    
    if (hasVerificationStatus) {
      if (hasRejectionReason) {
        const stmt = db.prepare(`
          UPDATE documents 
          SET is_reviewed = 1, verification_status = 'rejected', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, rejection_reason = ?
          WHERE id = ?
        `);
        return stmt.run(reviewedBy, rejectionReason || null, documentId);
      } else {
        const stmt = db.prepare(`
          UPDATE documents 
          SET is_reviewed = 1, verification_status = 'rejected', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);
        return stmt.run(reviewedBy, documentId);
      }
    } else {
      // Fallback для старой схемы
      const stmt = db.prepare(`
        UPDATE documents 
        SET is_reviewed = 1, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      return stmt.run(reviewedBy, documentId);
    }
  },

  /**
   * Удалить документ
   */
  delete: (id) => {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM documents WHERE id = ?');
    return stmt.run(id);
  }
};

// Экспортируем функции для работы с уведомлениями
export const notificationQueries = {
  /**
   * Создать новое уведомление
   */
  create: (notificationData) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, data, is_read, view_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      notificationData.user_id,
      notificationData.type,
      notificationData.title,
      notificationData.message || null,
      notificationData.data ? JSON.stringify(notificationData.data) : null,
      notificationData.is_read ? 1 : 0,
      notificationData.view_count || 0
    );
  },

  /**
   * Получить все уведомления пользователя
   */
  getByUserId: (userId) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `);
    return stmt.all(userId);
  },

  /**
   * Получить непрочитанные уведомления пользователя
   */
  getUnreadByUserId: (userId) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? AND is_read = 0 
      ORDER BY created_at DESC
    `);
    return stmt.all(userId);
  },

  /**
   * Отметить уведомление как прочитанное и увеличить счетчик просмотров
   * Если просмотрено 2 раза, удаляет уведомление
   */
  markAsViewed: (notificationId) => {
    const db = getDatabase();
    
    // Получаем полную информацию об уведомлении
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(notificationId);
    if (!notification) {
      return { changes: 0 };
    }
    
    const newViewCount = (notification.view_count || 0) + 1;
    const isRead = 1; // Mark as read after first view
    
    // Если это уведомление о верификации, удаляем его после первого просмотра
    if (notification.type === 'verification_success' && newViewCount >= 1) {
      console.log(`🗑️ Удаление уведомления о верификации ${notificationId} после первого просмотра`);
      db.prepare('DELETE FROM notifications WHERE id = ?').run(notificationId);
      return { changes: 1 };
    }
    
    // Для остальных уведомлений удаляем после 2 просмотров
    if (newViewCount >= 2) {
      console.log(`🗑️ Удаление уведомления ${notificationId} после ${newViewCount} просмотров`);
      db.prepare('DELETE FROM notifications WHERE id = ?').run(notificationId);
      return { changes: 1 };
    }
    
    // Иначе увеличиваем счетчик просмотров и отмечаем как прочитанное
    const stmt = db.prepare(`
      UPDATE notifications 
      SET is_read = ?, view_count = ?
      WHERE id = ?
    `);
    return stmt.run(isRead, newViewCount, notificationId);
  },

  /**
   * Удалить уведомление
   */
  delete: (id) => {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM notifications WHERE id = ?');
    return stmt.run(id);
  },

  /**
   * Удалить все уведомления пользователя
   */
  deleteByUserId: (userId) => {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM notifications WHERE user_id = ?');
    return stmt.run(userId);
  }
};

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С АДМИНИСТРАТОРАМИ ==========

export const administratorQueries = {
  /**
   * Создать нового администратора
   */
  create: (adminData) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO administrators (
        username, password, email, full_name, is_super_admin,
        can_access_statistics, can_access_users, can_access_moderation,
        can_access_chat, can_access_objects, can_access_access_management,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      adminData.username,
      adminData.password,
      adminData.email || null,
      adminData.full_name || null,
      adminData.is_super_admin ? 1 : 0,
      adminData.can_access_statistics ? 1 : 0,
      adminData.can_access_users ? 1 : 0,
      adminData.can_access_moderation ? 1 : 0,
      adminData.can_access_chat ? 1 : 0,
      adminData.can_access_objects ? 1 : 0,
      adminData.can_access_access_management ? 1 : 0,
      adminData.created_by || null
    );
  },

  /**
   * Получить администратора по ID
   */
  getById: (id) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM administrators WHERE id = ?');
    const admin = stmt.get(id);
    if (!admin) return null;
    
    return {
      ...admin,
      is_super_admin: admin.is_super_admin === 1,
      can_access_statistics: admin.can_access_statistics === 1,
      can_access_users: admin.can_access_users === 1,
      can_access_moderation: admin.can_access_moderation === 1,
      can_access_chat: admin.can_access_chat === 1,
      can_access_objects: admin.can_access_objects === 1,
      can_access_access_management: admin.can_access_access_management === 1
    };
  },

  /**
   * Получить администратора по username
   */
  getByUsername: (username) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM administrators WHERE username = ?');
    const admin = stmt.get(username);
    if (!admin) return null;
    
    return {
      ...admin,
      is_super_admin: admin.is_super_admin === 1,
      can_access_statistics: admin.can_access_statistics === 1,
      can_access_users: admin.can_access_users === 1,
      can_access_moderation: admin.can_access_moderation === 1,
      can_access_chat: admin.can_access_chat === 1,
      can_access_objects: admin.can_access_objects === 1,
      can_access_access_management: admin.can_access_access_management === 1
    };
  },

  /**
   * Получить администратора по email (без учета регистра)
   */
  getByEmail: (email) => {
    const db = getDatabase();
    // Используем LOWER() для сравнения email без учета регистра
    const stmt = db.prepare('SELECT * FROM administrators WHERE LOWER(email) = LOWER(?)');
    const admin = stmt.get(email);
    if (!admin) return null;
    
    return {
      ...admin,
      is_super_admin: admin.is_super_admin === 1,
      can_access_statistics: admin.can_access_statistics === 1,
      can_access_users: admin.can_access_users === 1,
      can_access_moderation: admin.can_access_moderation === 1,
      can_access_chat: admin.can_access_chat === 1,
      can_access_objects: admin.can_access_objects === 1,
      can_access_access_management: admin.can_access_access_management === 1
    };
  },

  /**
   * Получить всех администраторов
   */
  getAll: () => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM administrators ORDER BY created_at DESC');
    const admins = stmt.all();
    
    return admins.map(admin => ({
      ...admin,
      is_super_admin: admin.is_super_admin === 1,
      can_access_statistics: admin.can_access_statistics === 1,
      can_access_users: admin.can_access_users === 1,
      can_access_moderation: admin.can_access_moderation === 1,
      can_access_chat: admin.can_access_chat === 1,
      can_access_objects: admin.can_access_objects === 1,
      can_access_access_management: admin.can_access_access_management === 1
    }));
  },

  /**
   * Обновить администратора
   */
  update: (id, adminData) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE administrators SET
        email = ?,
        full_name = ?,
        can_access_statistics = ?,
        can_access_users = ?,
        can_access_moderation = ?,
        can_access_chat = ?,
        can_access_objects = ?,
        can_access_access_management = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(
      adminData.email || null,
      adminData.full_name || null,
      adminData.can_access_statistics ? 1 : 0,
      adminData.can_access_users ? 1 : 0,
      adminData.can_access_moderation ? 1 : 0,
      adminData.can_access_chat ? 1 : 0,
      adminData.can_access_objects ? 1 : 0,
      adminData.can_access_access_management ? 1 : 0,
      id
    );
  },

  /**
   * Обновить пароль администратора
   */
  updatePassword: (id, hashedPassword) => {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE administrators SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(hashedPassword, id);
  },

  /**
   * Удалить администратора
   */
  delete: (id) => {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM administrators WHERE id = ?');
    return stmt.run(id);
  }
};

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С WHATSAPP ПОЛЬЗОВАТЕЛЯМИ ==========

export const whatsappUserQueries = {
  /**
   * Создать или обновить WhatsApp пользователя
   */
  createOrUpdate: (userData) => {
    const db = getDatabase();
    
    // Проверяем, существует ли пользователь
    const existing = db.prepare('SELECT * FROM whatsapp_users WHERE phone_number = ?').get(userData.phone_number);
    
    if (existing) {
      // Обновляем существующего пользователя
      // ВАЖНО: Если язык уже был определен ранее (не 'ru' по умолчанию), сохраняем его
      // Обновляем язык только если передан новый язык И существующий язык был 'ru' (по умолчанию)
      const existingLanguage = existing.language || 'ru';
      const newLanguage = userData.language || 'ru';
      
      // Если существующий язык не 'ru' (был определен ранее), сохраняем его
      // Если существующий язык 'ru' и передан новый язык, обновляем
      const languageToSave = (existingLanguage !== 'ru') 
        ? existingLanguage  // Сохраняем существующий определенный язык
        : newLanguage;      // Или используем новый, если существующий был 'ru'
      
      const stmt = db.prepare(`
        UPDATE whatsapp_users SET
          phone_number_clean = COALESCE(?, phone_number_clean),
          first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          country = COALESCE(?, country),
          language = ?,
          last_message_at = CURRENT_TIMESTAMP,
          message_count = message_count + 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE phone_number = ?
      `);
      
      console.log(`🔄 Обновление пользователя ${userData.phone_number}: существующий язык=${existingLanguage}, новый язык=${newLanguage}, сохраняем=${languageToSave}`);
      
      return stmt.run(
        userData.phone_number_clean || null,
        userData.first_name || null,
        userData.last_name || null,
        userData.country || null,
        languageToSave,
        userData.phone_number
      );
    } else {
      // Создаем нового пользователя
      const stmt = db.prepare(`
        INSERT INTO whatsapp_users (
          phone_number, phone_number_clean, first_name, last_name,
          country, language, last_message_at, message_count, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 1, 1)
      `);
      return stmt.run(
        userData.phone_number,
        userData.phone_number_clean || null,
        userData.first_name || null,
        userData.last_name || null,
        userData.country || null,
        userData.language || 'ru'
      );
    }
  },

  /**
   * Получить WhatsApp пользователя по номеру телефона
   */
  getByPhone: (phoneNumber) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM whatsapp_users WHERE phone_number = ?');
    return stmt.get(phoneNumber);
  },

  /**
   * Получить всех WhatsApp пользователей (с пагинацией)
   */
  getAll: (limit = 100, offset = 0) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM whatsapp_users 
      ORDER BY last_message_at DESC, created_at DESC 
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset);
  },

  /**
   * Получить количество всех WhatsApp пользователей
   */
  getCount: () => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM whatsapp_users');
    const result = stmt.get();
    return result ? result.count : 0;
  },

  /**
   * Получить активных WhatsApp пользователей
   */
  getActive: (limit = 100, offset = 0) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM whatsapp_users 
      WHERE is_active = 1 
      ORDER BY last_message_at DESC 
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset);
  },

  /**
   * Поиск WhatsApp пользователей по имени, телефону или стране
   */
  search: (query, limit = 100, offset = 0) => {
    const db = getDatabase();
    const searchTerm = `%${query}%`;
    const stmt = db.prepare(`
      SELECT * FROM whatsapp_users 
      WHERE 
        phone_number LIKE ? OR 
        phone_number_clean LIKE ? OR 
        first_name LIKE ? OR 
        last_name LIKE ? OR 
        country LIKE ?
      ORDER BY last_message_at DESC 
      LIMIT ? OFFSET ?
    `);
    return stmt.all(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit, offset);
  },

  /**
   * Обновить статус активности пользователя
   */
  updateActiveStatus: (phoneNumber, isActive) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE whatsapp_users 
      SET is_active = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE phone_number = ?
    `);
    return stmt.run(isActive ? 1 : 0, phoneNumber);
  },

  /**
   * Удалить WhatsApp пользователя
   */
  delete: (phoneNumber) => {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM whatsapp_users WHERE phone_number = ?');
    return stmt.run(phoneNumber);
  }
};

<<<<<<< HEAD
=======
// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ЗАПРОСАМИ НА ПОКУПКУ ==========

export const purchaseRequestQueries = {
  /**
   * Создать новый запрос на покупку
   */
  create: (requestData) => {
    const db = getDatabase();
    
    // Проверяем, какие поля существуют в таблице
    const pragmaInfo = db.prepare("PRAGMA table_info(purchase_requests)").all();
    const columnNames = pragmaInfo.map(col => col.name);
    
    // Базовые поля (всегда должны быть)
    const baseFields = [
      'buyer_id', 'buyer_name', 'buyer_email', 'buyer_phone',
      'seller_id', 'seller_name', 'seller_email', 'seller_phone',
      'property_id', 'property_title', 'property_price', 'property_currency',
      'property_location', 'property_type', 'property_area',
      'request_date', 'status'
    ];
    
    // Дополнительные поля (могут отсутствовать в старых БД)
    const additionalFields = [
      'property_description', 'property_rooms', 'property_bedrooms', 'property_bathrooms',
      'property_floor', 'property_total_floors', 'property_year_built',
      'property_living_area', 'property_land_area', 'property_building_type',
      'property_renovation', 'property_condition', 'property_heating',
      'property_water_supply', 'property_sewerage',
      'property_balcony', 'property_parking', 'property_elevator',
      'property_garage', 'property_pool', 'property_garden',
      'property_electricity', 'property_internet', 'property_security', 'property_furniture',
      'property_commercial_type', 'property_business_hours'
    ];
    
    // Формируем список полей и значений динамически
    const fieldsToInsert = [];
    const valuesToInsert = [];
    
    // Добавляем базовые поля
    baseFields.forEach(field => {
      if (columnNames.includes(field)) {
        fieldsToInsert.push(field);
      }
    });
    
    // Добавляем дополнительные поля, если они существуют
    additionalFields.forEach(field => {
      if (columnNames.includes(field)) {
        fieldsToInsert.push(field);
      }
    });
    
    // Формируем значения для базовых полей
    if (columnNames.includes('buyer_id')) valuesToInsert.push(requestData.buyerId || null);
    if (columnNames.includes('buyer_name')) valuesToInsert.push(requestData.buyerName);
    if (columnNames.includes('buyer_email')) valuesToInsert.push(requestData.buyerEmail || null);
    if (columnNames.includes('buyer_phone')) valuesToInsert.push(requestData.buyerPhone || null);
    if (columnNames.includes('seller_id')) valuesToInsert.push(requestData.sellerId || null);
    if (columnNames.includes('seller_name')) valuesToInsert.push(requestData.sellerName || null);
    if (columnNames.includes('seller_email')) valuesToInsert.push(requestData.sellerEmail || null);
    if (columnNames.includes('seller_phone')) valuesToInsert.push(requestData.sellerPhone || null);
    if (columnNames.includes('property_id')) valuesToInsert.push(requestData.propertyId || null);
    if (columnNames.includes('property_title')) valuesToInsert.push(requestData.propertyTitle);
    if (columnNames.includes('property_price')) valuesToInsert.push(requestData.propertyPrice || null);
    if (columnNames.includes('property_currency')) valuesToInsert.push(requestData.propertyCurrency || 'USD');
    if (columnNames.includes('property_location')) valuesToInsert.push(requestData.propertyLocation || null);
    if (columnNames.includes('property_type')) valuesToInsert.push(requestData.propertyType || null);
    if (columnNames.includes('property_area')) valuesToInsert.push(requestData.propertyArea || null);
    if (columnNames.includes('request_date')) valuesToInsert.push(requestData.requestDate);
    if (columnNames.includes('status')) valuesToInsert.push(requestData.status || 'pending');
    
    // Формируем значения для дополнительных полей
    if (columnNames.includes('property_description')) valuesToInsert.push(requestData.propertyDescription || null);
    if (columnNames.includes('property_rooms')) valuesToInsert.push(requestData.propertyRooms || null);
    if (columnNames.includes('property_bedrooms')) valuesToInsert.push((requestData.propertyBedrooms !== undefined && requestData.propertyBedrooms !== null && requestData.propertyBedrooms !== '') ? requestData.propertyBedrooms : null);
    if (columnNames.includes('property_bathrooms')) valuesToInsert.push(requestData.propertyBathrooms || null);
    if (columnNames.includes('property_floor')) valuesToInsert.push(requestData.propertyFloor !== undefined && requestData.propertyFloor !== null ? requestData.propertyFloor : null);
    if (columnNames.includes('property_total_floors')) valuesToInsert.push(requestData.propertyTotalFloors !== undefined && requestData.propertyTotalFloors !== null ? requestData.propertyTotalFloors : null);
    if (columnNames.includes('property_year_built')) valuesToInsert.push(requestData.propertyYearBuilt !== undefined && requestData.propertyYearBuilt !== null ? requestData.propertyYearBuilt : null);
    if (columnNames.includes('property_living_area')) valuesToInsert.push(requestData.propertyLivingArea || null);
    if (columnNames.includes('property_land_area')) valuesToInsert.push(requestData.propertyLandArea || null);
    if (columnNames.includes('property_building_type')) valuesToInsert.push(requestData.propertyBuildingType || null);
    if (columnNames.includes('property_renovation')) valuesToInsert.push(requestData.propertyRenovation || null);
    if (columnNames.includes('property_condition')) valuesToInsert.push(requestData.propertyCondition || null);
    if (columnNames.includes('property_heating')) valuesToInsert.push(requestData.propertyHeating || null);
    if (columnNames.includes('property_water_supply')) valuesToInsert.push(requestData.propertyWaterSupply || null);
    if (columnNames.includes('property_sewerage')) valuesToInsert.push(requestData.propertySewerage || null);
    if (columnNames.includes('property_balcony')) valuesToInsert.push(requestData.propertyBalcony === 1 || requestData.propertyBalcony === true ? 1 : 0);
    if (columnNames.includes('property_parking')) valuesToInsert.push(requestData.propertyParking === 1 || requestData.propertyParking === true ? 1 : 0);
    if (columnNames.includes('property_elevator')) valuesToInsert.push(requestData.propertyElevator === 1 || requestData.propertyElevator === true ? 1 : 0);
    if (columnNames.includes('property_garage')) valuesToInsert.push(requestData.propertyGarage === 1 || requestData.propertyGarage === true ? 1 : 0);
    if (columnNames.includes('property_pool')) valuesToInsert.push(requestData.propertyPool === 1 || requestData.propertyPool === true ? 1 : 0);
    if (columnNames.includes('property_garden')) valuesToInsert.push(requestData.propertyGarden === 1 || requestData.propertyGarden === true ? 1 : 0);
    if (columnNames.includes('property_electricity')) valuesToInsert.push(requestData.propertyElectricity === 1 || requestData.propertyElectricity === true ? 1 : 0);
    if (columnNames.includes('property_internet')) valuesToInsert.push(requestData.propertyInternet === 1 || requestData.propertyInternet === true ? 1 : 0);
    if (columnNames.includes('property_security')) valuesToInsert.push(requestData.propertySecurity === 1 || requestData.propertySecurity === true ? 1 : 0);
    if (columnNames.includes('property_furniture')) valuesToInsert.push(requestData.propertyFurniture === 1 || requestData.propertyFurniture === true ? 1 : 0);
    if (columnNames.includes('property_commercial_type')) valuesToInsert.push(requestData.propertyCommercialType || null);
    if (columnNames.includes('property_business_hours')) valuesToInsert.push(requestData.propertyBusinessHours || null);
    
    const placeholders = fieldsToInsert.map(() => '?').join(', ');
    const stmt = db.prepare(`
      INSERT INTO purchase_requests (${fieldsToInsert.join(', ')})
      VALUES (${placeholders})
    `);
    
    return stmt.run(...valuesToInsert);
  },

  /**
   * Получить все запросы на покупку
   */
  getAll: (limit = 100, offset = 0) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM purchase_requests 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset);
  },

  /**
   * Получить запрос по ID
   */
  getById: (id) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM purchase_requests WHERE id = ?');
    return stmt.get(id);
  },

  /**
   * Получить запросы конкретного покупателя
   */
  getByBuyerId: (buyerId, limit = 50, offset = 0) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM purchase_requests 
      WHERE buyer_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    return stmt.all(buyerId, limit, offset);
  },

  /**
   * Получить запросы по статусу
   */
  getByStatus: (status, limit = 100, offset = 0) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM purchase_requests 
      WHERE status = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    return stmt.all(status, limit, offset);
  },

  /**
   * Обновить статус запроса
   */
  updateStatus: (id, status, adminNotes = null) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE purchase_requests 
      SET status = ?, admin_notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    return stmt.run(status, adminNotes, id);
  },

  /**
   * Получить количество запросов
   */
  getCount: () => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM purchase_requests');
    const result = stmt.get();
    return result ? result.count : 0;
  },

  /**
   * Получить количество запросов по статусу
   */
  getCountByStatus: (status) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM purchase_requests WHERE status = ?');
    const result = stmt.get(status);
    return result ? result.count : 0;
  },

  /**
   * Удалить запрос
   */
  delete: (id) => {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM purchase_requests WHERE id = ?');
    return stmt.run(id);
  }
};

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С КВАРТИРАМИ/АПАРТАМЕНТАМИ ==========

/**
 * Вспомогательная функция для проверки и создания таблицы properties_apartments
 */
function ensureApartmentsTable() {
  const db = getDatabase();
  try {
    // Проверяем существование таблицы
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='properties_apartments'").get();
    const tableExists = result !== undefined && result !== null;
    
    console.log('🔍 Проверка таблицы properties_apartments:', { result, tableExists });
    
    if (!tableExists) {
      console.log('⚠️ Таблица properties_apartments не найдена, создаю...');
      
      // Создаем таблицу
      db.exec(`
        CREATE TABLE IF NOT EXISTS properties_apartments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          property_type TEXT NOT NULL CHECK(property_type IN ('apartment', 'commercial')),
          title TEXT NOT NULL,
          description TEXT,
          price REAL,
          currency TEXT DEFAULT 'USD',
          is_auction INTEGER DEFAULT 0,
          auction_start_date TEXT,
          auction_end_date TEXT,
          auction_starting_price REAL,
          area REAL,
          living_area REAL,
          building_type TEXT,
          rooms INTEGER,
          bathrooms INTEGER,
          floor INTEGER,
          total_floors INTEGER,
          year_built INTEGER,
          location TEXT,
          address TEXT,
          apartment TEXT,
          country TEXT,
          city TEXT,
          coordinates TEXT,
          amenities TEXT,
          renovation TEXT,
          condition TEXT,
          heating TEXT,
          water_supply TEXT,
          sewerage TEXT,
          balcony INTEGER DEFAULT 0,
          parking INTEGER DEFAULT 0,
          elevator INTEGER DEFAULT 0,
          electricity INTEGER DEFAULT 0,
          internet INTEGER DEFAULT 0,
          security INTEGER DEFAULT 0,
          furniture INTEGER DEFAULT 0,
          commercial_type TEXT,
          business_hours TEXT,
          additional_amenities TEXT,
          photos TEXT,
          videos TEXT,
          additional_documents TEXT,
          ownership_document TEXT,
          no_debts_document TEXT,
          test_drive INTEGER DEFAULT 0,
          test_drive_data TEXT,
          moderation_status TEXT DEFAULT 'pending',
          reviewed_by TEXT,
          reviewed_at TEXT,
          rejection_reason TEXT,
          is_shared_ownership INTEGER DEFAULT 0,
          total_shares INTEGER,
          shares_sold INTEGER DEFAULT 0,
          reserved_until TEXT,
          reserved_by INTEGER,
          purchase_request_id INTEGER,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      
      // Создаем индексы отдельно
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_apartments_user_id ON properties_apartments(user_id);
        CREATE INDEX IF NOT EXISTS idx_apartments_moderation_status ON properties_apartments(moderation_status);
        CREATE INDEX IF NOT EXISTS idx_apartments_property_type ON properties_apartments(property_type);
        CREATE INDEX IF NOT EXISTS idx_apartments_user_status ON properties_apartments(user_id, moderation_status);
        CREATE INDEX IF NOT EXISTS idx_apartments_city ON properties_apartments(city);
        CREATE INDEX IF NOT EXISTS idx_apartments_country ON properties_apartments(country);
      `);
      
      // Проверяем, что таблица действительно создана
      const verifyResult = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='properties_apartments'").get();
      if (verifyResult) {
        console.log('✅ Таблица properties_apartments успешно создана и проверена');
      } else {
        console.error('❌ Таблица properties_apartments не была создана!');
        throw new Error('Не удалось создать таблицу properties_apartments');
      }
    } else {
      console.log('✅ Таблица properties_apartments уже существует');
    }
  } catch (tableError) {
    console.error('❌ Ошибка при проверке/создании таблицы properties_apartments:', tableError.message);
    console.error('❌ Stack:', tableError.stack);
    throw tableError;
  }
}

export const apartmentQueries = {
  /**
   * Создать новое объявление о квартире/апартаменте
   */
  create: (propertyData) => {
    // Проверяем существование таблицы и создаем её, если её нет
    // ВАЖНО: это должно быть ПЕРВЫМ действием
    ensureApartmentsTable();
    
    const db = getDatabase();
    
    // Формируем JSON массив удобств из отдельных полей
    // ВАЖНО: Добавляем в массив ТОЛЬКО те удобства, которые явно выбраны пользователем (равны 1 или true)
    const amenities = [];
    
    // Основные удобства - проверяем строго (только 1 или true, не 0, не undefined, не '0')
    if (propertyData.balcony === 1 || propertyData.balcony === true || propertyData.balcony === '1') {
      amenities.push('balcony');
    }
    if (propertyData.parking === 1 || propertyData.parking === true || propertyData.parking === '1') {
      amenities.push('parking');
    }
    if (propertyData.elevator === 1 || propertyData.elevator === true || propertyData.elevator === '1') {
      amenities.push('elevator');
    }
    if (propertyData.electricity === 1 || propertyData.electricity === true || propertyData.electricity === '1') {
      amenities.push('electricity');
    }
    if (propertyData.internet === 1 || propertyData.internet === true || propertyData.internet === '1') {
      amenities.push('internet');
    }
    if (propertyData.security === 1 || propertyData.security === true || propertyData.security === '1') {
      amenities.push('security');
    }
    if (propertyData.furniture === 1 || propertyData.furniture === true || propertyData.furniture === '1') {
      amenities.push('furniture');
    }
    
    // Добавляем feature поля в массив удобств - проверяем строго
    for (let i = 1; i <= 26; i++) {
      const featureKey = `feature${i}`;
      const featureValue = propertyData[featureKey];
      if (featureValue === 1 || featureValue === true || featureValue === '1') {
        amenities.push(featureKey);
      }
    }
    
    // Пытаемся выполнить INSERT, если таблицы нет - создаем её и повторяем
    let stmt;
    try {
      stmt = db.prepare(`
        INSERT INTO properties_apartments (
          user_id, property_type, title, description, price, currency,
          is_auction, auction_start_date, auction_end_date, auction_starting_price,
          area, living_area, building_type, rooms, bathrooms, floor, total_floors, year_built,
          location, address, apartment, country, city, coordinates,
          amenities, renovation, condition, heating, water_supply, sewerage,
          commercial_type, business_hours, additional_amenities,
          photos, videos, additional_documents,
          ownership_document, no_debts_document,
          test_drive, test_drive_data,
          moderation_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
    } catch (prepareError) {
      if (prepareError.message && prepareError.message.includes('no such table: properties_apartments')) {
        console.log('⚠️ Таблица не найдена при prepare, создаю...');
        ensureApartmentsTable();
        // Повторяем попытку
        stmt = db.prepare(`
          INSERT INTO properties_apartments (
            user_id, property_type, title, description, price, currency,
            is_auction, auction_start_date, auction_end_date, auction_starting_price,
            area, living_area, building_type, rooms, bathrooms, floor, total_floors, year_built,
            location, address, apartment, country, city, coordinates,
            amenities, renovation, condition, heating, water_supply, sewerage,
            commercial_type, business_hours, additional_amenities,
            photos, videos, additional_documents,
            ownership_document, no_debts_document,
            test_drive, test_drive_data,
            moderation_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
      } else {
        throw prepareError;
      }
    }
    
    return stmt.run(
      propertyData.user_id,
      propertyData.property_type,
      propertyData.title,
      propertyData.description || null,
      propertyData.price || null,
      propertyData.currency || 'USD',
      propertyData.is_auction ? 1 : 0,
      propertyData.auction_start_date || null,
      propertyData.auction_end_date || null,
      propertyData.auction_starting_price || null,
      propertyData.area || null,
      propertyData.living_area || null,
      propertyData.building_type || null,
      propertyData.rooms || null,
      propertyData.bathrooms || null,
      propertyData.floor || null,
      propertyData.total_floors || null,
      propertyData.year_built || null,
      propertyData.location || null,
      propertyData.address || null,
      propertyData.apartment || null,
      propertyData.country || null,
      propertyData.city || null,
      propertyData.coordinates ? JSON.stringify(propertyData.coordinates) : null,
      JSON.stringify(amenities),
      propertyData.renovation || null,
      propertyData.condition || null,
      propertyData.heating || null,
      propertyData.water_supply || null,
      propertyData.sewerage || null,
      propertyData.commercial_type || null,
      propertyData.business_hours || null,
      propertyData.additional_amenities || null,
      propertyData.photos ? JSON.stringify(propertyData.photos) : null,
      propertyData.videos ? JSON.stringify(propertyData.videos) : null,
      propertyData.additional_documents ? JSON.stringify(propertyData.additional_documents) : null,
      propertyData.ownership_document || null,
      propertyData.no_debts_document || null,
      propertyData.test_drive ? 1 : 0,
      propertyData.test_drive_data ? JSON.stringify(propertyData.test_drive_data) : null,
      propertyData.moderation_status || 'pending'
    );
  },

  /**
   * Получить квартиру по ID
   */
  getById: (id) => {
    ensureApartmentsTable();
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM properties_apartments WHERE id = ?');
    const property = stmt.get(id);
    
    if (property) {
      // Парсим JSON поля с безопасной обработкой ошибок
      if (property.amenities) {
        try {
          property.amenities = JSON.parse(property.amenities);
        } catch (e) {
          console.warn('⚠️ Ошибка парсинга amenities для property ID', id, ':', e.message);
          property.amenities = [];
        }
      }
      if (property.coordinates) {
        try {
          property.coordinates = JSON.parse(property.coordinates);
        } catch (e) {
          console.warn('⚠️ Ошибка парсинга coordinates для property ID', id, ':', e.message);
          property.coordinates = null;
        }
      }
      if (property.photos) {
        try {
          property.photos = JSON.parse(property.photos);
        } catch (e) {
          console.warn('⚠️ Ошибка парсинга photos для property ID', id, ':', e.message);
          property.photos = [];
        }
      }
      if (property.videos) {
        try {
          property.videos = JSON.parse(property.videos);
        } catch (e) {
          console.warn('⚠️ Ошибка парсинга videos для property ID', id, ':', e.message);
          property.videos = [];
        }
      }
      if (property.additional_documents) {
        try {
          property.additional_documents = JSON.parse(property.additional_documents);
        } catch (e) {
          console.warn('⚠️ Ошибка парсинга additional_documents для property ID', id, ':', e.message);
          console.warn('⚠️ Содержимое additional_documents:', property.additional_documents);
          property.additional_documents = [];
        }
      }
      if (property.test_drive_data) {
        try {
          property.test_drive_data = JSON.parse(property.test_drive_data);
        } catch (e) {
          console.warn('⚠️ Ошибка парсинга test_drive_data для property ID', id, ':', e.message);
          property.test_drive_data = null;
        }
      }
    }
    
    return property;
  },

  /**
   * Получить все квартиры/апартаменты пользователя
   */
  getByUserId: (userId, limit = 50, offset = 0) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM properties_apartments 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    const properties = stmt.all(userId, limit, offset);
    
    // Парсим JSON поля для каждого объекта безопасно
    return properties.map(property => {
      if (property.amenities && typeof property.amenities === 'string') {
        try {
          property.amenities = JSON.parse(property.amenities);
        } catch (e) {
          property.amenities = [];
        }
      } else if (!property.amenities) {
        property.amenities = [];
      }
      if (property.coordinates && typeof property.coordinates === 'string') {
        try {
          property.coordinates = JSON.parse(property.coordinates);
        } catch (e) {
          property.coordinates = null;
        }
      }
      if (property.photos && typeof property.photos === 'string') {
        try {
          property.photos = JSON.parse(property.photos);
        } catch (e) {
          property.photos = [];
        }
      } else if (!property.photos) {
        property.photos = [];
      }
      if (property.videos && typeof property.videos === 'string') {
        try {
          property.videos = JSON.parse(property.videos);
        } catch (e) {
          property.videos = [];
        }
      } else if (!property.videos) {
        property.videos = [];
      }
      if (property.additional_documents && typeof property.additional_documents === 'string') {
        try {
          property.additional_documents = JSON.parse(property.additional_documents);
        } catch (e) {
          property.additional_documents = [];
        }
      } else if (!property.additional_documents) {
        property.additional_documents = [];
      }
      if (property.test_drive_data && typeof property.test_drive_data === 'string') {
        try {
          property.test_drive_data = JSON.parse(property.test_drive_data);
        } catch (e) {
          property.test_drive_data = null;
        }
      }
      return property;
    });
  },

  /**
   * Получить все квартиры/апартаменты с фильтрами
   */
  getAll: (filters = {}, limit = 100, offset = 0) => {
    ensureApartmentsTable();
    const db = getDatabase();
    let query = 'SELECT * FROM properties_apartments WHERE 1=1';
    const params = [];
    
    if (filters.moderation_status) {
      query += ' AND moderation_status = ?';
      params.push(filters.moderation_status);
    }
    
    if (filters.property_type) {
      query += ' AND property_type = ?';
      params.push(filters.property_type);
    }
    
    if (filters.city) {
      query += ' AND city = ?';
      params.push(filters.city);
    }
    
    if (filters.country) {
      query += ' AND country = ?';
      params.push(filters.country);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const stmt = db.prepare(query);
    const properties = stmt.all(...params);
    
    // Парсим JSON поля
    return properties.map(property => {
      if (property.amenities) property.amenities = JSON.parse(property.amenities);
      if (property.coordinates) property.coordinates = JSON.parse(property.coordinates);
      if (property.photos) property.photos = JSON.parse(property.photos);
      if (property.videos) property.videos = JSON.parse(property.videos);
      if (property.additional_documents) property.additional_documents = JSON.parse(property.additional_documents);
      if (property.test_drive_data) property.test_drive_data = JSON.parse(property.test_drive_data);
      return property;
    });
  },

  /**
   * Обновить квартиру/апартамент
   */
  update: (id, propertyData) => {
    const db = getDatabase();
    
    // Формируем JSON массив удобств
    const amenities = [];
    if (propertyData.balcony) amenities.push('balcony');
    if (propertyData.parking) amenities.push('parking');
    if (propertyData.elevator) amenities.push('elevator');
    if (propertyData.electricity) amenities.push('electricity');
    if (propertyData.internet) amenities.push('internet');
    if (propertyData.security) amenities.push('security');
    if (propertyData.furniture) amenities.push('furniture');
    
    for (let i = 1; i <= 26; i++) {
      const featureKey = `feature${i}`;
      if (propertyData[featureKey]) {
        amenities.push(featureKey);
      }
    }
    
    const stmt = db.prepare(`
      UPDATE properties_apartments SET
        title = ?, description = ?, price = ?, currency = ?,
        is_auction = ?, auction_start_date = ?, auction_end_date = ?, auction_starting_price = ?,
        area = ?, living_area = ?, building_type = ?, rooms = ?, bathrooms = ?, 
        floor = ?, total_floors = ?, year_built = ?,
        location = ?, address = ?, apartment = ?, country = ?, city = ?, coordinates = ?,
        amenities = ?, renovation = ?, condition = ?, heating = ?, water_supply = ?, sewerage = ?,
        commercial_type = ?, business_hours = ?, additional_amenities = ?,
        photos = ?, videos = ?, additional_documents = ?,
        ownership_document = ?, no_debts_document = ?,
        test_drive = ?, test_drive_data = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(
      propertyData.title,
      propertyData.description || null,
      propertyData.price || null,
      propertyData.currency || 'USD',
      propertyData.is_auction ? 1 : 0,
      propertyData.auction_start_date || null,
      propertyData.auction_end_date || null,
      propertyData.auction_starting_price || null,
      propertyData.area || null,
      propertyData.living_area || null,
      propertyData.building_type || null,
      propertyData.rooms || null,
      propertyData.bathrooms || null,
      propertyData.floor || null,
      propertyData.total_floors || null,
      propertyData.year_built || null,
      propertyData.location || null,
      propertyData.address || null,
      propertyData.apartment || null,
      propertyData.country || null,
      propertyData.city || null,
      propertyData.coordinates ? JSON.stringify(propertyData.coordinates) : null,
      JSON.stringify(amenities),
      propertyData.renovation || null,
      propertyData.condition || null,
      propertyData.heating || null,
      propertyData.water_supply || null,
      propertyData.sewerage || null,
      propertyData.commercial_type || null,
      propertyData.business_hours || null,
      propertyData.additional_amenities || null,
      propertyData.photos ? JSON.stringify(propertyData.photos) : null,
      propertyData.videos ? JSON.stringify(propertyData.videos) : null,
      propertyData.additional_documents ? JSON.stringify(propertyData.additional_documents) : null,
      propertyData.ownership_document || null,
      propertyData.no_debts_document || null,
      propertyData.test_drive ? 1 : 0,
      propertyData.test_drive_data ? JSON.stringify(propertyData.test_drive_data) : null,
      id
    );
  },

  /**
   * Удалить квартиру/апартамент
   */
  delete: (id) => {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM properties_apartments WHERE id = ?');
    return stmt.run(id);
  },

  /**
   * Обновить статус модерации
   */
  updateModerationStatus: (id, status, reviewedBy = null, rejectionReason = null) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE properties_apartments 
      SET moderation_status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, rejection_reason = ?
      WHERE id = ?
    `);
    return stmt.run(status, reviewedBy, rejectionReason, id);
  },

  /**
   * Забронировать объект на 72 часа
   */
  reserve: (id, userId, purchaseRequestId) => {
    const db = getDatabase();
    const reservedUntil = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(); // +72 часа
    const stmt = db.prepare(`
      UPDATE properties_apartments 
      SET reserved_until = ?, reserved_by = ?, purchase_request_id = ?
      WHERE id = ?
    `);
    return stmt.run(reservedUntil, userId, purchaseRequestId, id);
  },

  /**
   * Снять бронь с объекта
   */
  unreserve: (id) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE properties_apartments 
      SET reserved_until = NULL, reserved_by = NULL, purchase_request_id = NULL
      WHERE id = ?
    `);
    return stmt.run(id);
  },

  /**
   * Проверить, забронирован ли объект
   */
  isReserved: (id) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT reserved_until, reserved_by, purchase_request_id 
      FROM properties_apartments 
      WHERE id = ?
    `);
    const result = stmt.get(id);
    
    if (!result || !result.reserved_until) {
      return { isReserved: false };
    }
    
    const reservedUntil = new Date(result.reserved_until);
    const now = new Date();
    
    // Если бронь истекла, автоматически снимаем её
    if (reservedUntil < now) {
      apartmentQueries.unreserve(id);
      return { isReserved: false };
    }
    
    return {
      isReserved: true,
      reservedUntil: result.reserved_until,
      reservedBy: result.reserved_by,
      purchaseRequestId: result.purchase_request_id,
      timeRemaining: reservedUntil - now
    };
  }
};

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ДОМАМИ/ВИЛЛАМИ ==========

export const houseQueries = {
  /**
   * Создать новое объявление о доме/вилле
   */
  create: (propertyData) => {
    const db = getDatabase();
    
    // Формируем JSON массив удобств
    // ВАЖНО: Добавляем в массив ТОЛЬКО те удобства, которые явно выбраны пользователем (равны 1 или true)
    const amenities = [];
    
    // Основные удобства - проверяем строго (только 1 или true, не 0, не undefined, не '0')
    if (propertyData.pool === 1 || propertyData.pool === true || propertyData.pool === '1') {
      amenities.push('pool');
    }
    if (propertyData.garden === 1 || propertyData.garden === true || propertyData.garden === '1') {
      amenities.push('garden');
    }
    if (propertyData.garage === 1 || propertyData.garage === true || propertyData.garage === '1') {
      amenities.push('garage');
    }
    if (propertyData.parking === 1 || propertyData.parking === true || propertyData.parking === '1') {
      amenities.push('parking');
    }
    if (propertyData.electricity === 1 || propertyData.electricity === true || propertyData.electricity === '1') {
      amenities.push('electricity');
    }
    if (propertyData.internet === 1 || propertyData.internet === true || propertyData.internet === '1') {
      amenities.push('internet');
    }
    if (propertyData.security === 1 || propertyData.security === true || propertyData.security === '1') {
      amenities.push('security');
    }
    if (propertyData.furniture === 1 || propertyData.furniture === true || propertyData.furniture === '1') {
      amenities.push('furniture');
    }
    
    // Добавляем feature поля в массив удобств - проверяем строго
    for (let i = 1; i <= 26; i++) {
      const featureKey = `feature${i}`;
      const featureValue = propertyData[featureKey];
      if (featureValue === 1 || featureValue === true || featureValue === '1') {
        amenities.push(featureKey);
      }
    }
    
    const stmt = db.prepare(`
      INSERT INTO properties_houses (
        user_id, property_type, title, description, price, currency,
        is_auction, auction_start_date, auction_end_date, auction_starting_price,
        area, living_area, land_area, building_type, bedrooms, bathrooms, floors, year_built,
        location, address, country, city, coordinates,
        amenities, renovation, condition, heating, water_supply, sewerage,
        additional_amenities,
        photos, videos, additional_documents,
        ownership_document, no_debts_document,
        test_drive, test_drive_data,
        moderation_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      propertyData.user_id,
      propertyData.property_type,
      propertyData.title,
      propertyData.description || null,
      propertyData.price || null,
      propertyData.currency || 'USD',
      propertyData.is_auction ? 1 : 0,
      propertyData.auction_start_date || null,
      propertyData.auction_end_date || null,
      propertyData.auction_starting_price || null,
      propertyData.area || null,
      propertyData.living_area || null,
      propertyData.land_area || null,
      propertyData.building_type || null,
      (() => {
        // Обрабатываем bedrooms: проверяем на валидность и преобразуем в число
        if (propertyData.bedrooms !== undefined && propertyData.bedrooms !== null && propertyData.bedrooms !== '') {
          const parsedBedrooms = typeof propertyData.bedrooms === 'number' 
            ? propertyData.bedrooms 
            : parseInt(propertyData.bedrooms, 10);
          // Проверяем, что это валидное число (не NaN и конечное)
          if (!isNaN(parsedBedrooms) && isFinite(parsedBedrooms)) {
            return parsedBedrooms;
          }
        }
        return null;
      })(),
      propertyData.bathrooms || null,
      propertyData.floors || null, // Количество этажей дома
      propertyData.year_built || null,
      propertyData.location || null,
      propertyData.address || null,
      propertyData.country || null,
      propertyData.city || null,
      propertyData.coordinates ? JSON.stringify(propertyData.coordinates) : null,
      JSON.stringify(amenities),
      propertyData.renovation || null,
      propertyData.condition || null,
      propertyData.heating || null,
      propertyData.water_supply || null,
      propertyData.sewerage || null,
      propertyData.additional_amenities || null,
      propertyData.photos ? JSON.stringify(propertyData.photos) : null,
      propertyData.videos ? JSON.stringify(propertyData.videos) : null,
      propertyData.additional_documents ? JSON.stringify(propertyData.additional_documents) : null,
      propertyData.ownership_document || null,
      propertyData.no_debts_document || null,
      propertyData.test_drive ? 1 : 0,
      propertyData.test_drive_data ? JSON.stringify(propertyData.test_drive_data) : null,
      propertyData.moderation_status || 'pending'
    );
  },

  /**
   * Получить дом/виллу по ID
   */
  getById: (id) => {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM properties_houses WHERE id = ?');
    const property = stmt.get(id);
    
    if (property) {
      // Парсим JSON поля с безопасной обработкой ошибок
      if (property.amenities) {
        try {
          property.amenities = JSON.parse(property.amenities);
        } catch (e) {
          console.warn('⚠️ Ошибка парсинга amenities для property ID', id, ':', e.message);
          property.amenities = [];
        }
      }
      if (property.coordinates) {
        try {
          property.coordinates = JSON.parse(property.coordinates);
        } catch (e) {
          console.warn('⚠️ Ошибка парсинга coordinates для property ID', id, ':', e.message);
          property.coordinates = null;
        }
      }
      if (property.photos) {
        try {
          property.photos = JSON.parse(property.photos);
        } catch (e) {
          console.warn('⚠️ Ошибка парсинга photos для property ID', id, ':', e.message);
          property.photos = [];
        }
      }
      if (property.videos) {
        try {
          property.videos = JSON.parse(property.videos);
        } catch (e) {
          console.warn('⚠️ Ошибка парсинга videos для property ID', id, ':', e.message);
          property.videos = [];
        }
      }
      if (property.additional_documents) {
        try {
          property.additional_documents = JSON.parse(property.additional_documents);
        } catch (e) {
          console.warn('⚠️ Ошибка парсинга additional_documents для property ID', id, ':', e.message);
          console.warn('⚠️ Содержимое additional_documents:', property.additional_documents);
          property.additional_documents = [];
        }
      }
      if (property.test_drive_data) {
        try {
          property.test_drive_data = JSON.parse(property.test_drive_data);
        } catch (e) {
          console.warn('⚠️ Ошибка парсинга test_drive_data для property ID', id, ':', e.message);
          property.test_drive_data = null;
        }
      }
    }
    
    return property;
  },

  /**
   * Получить все дома/виллы пользователя
   */
  getByUserId: (userId, limit = 50, offset = 0) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM properties_houses 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    const properties = stmt.all(userId, limit, offset);
    
    // Парсим JSON поля
    return properties.map(property => {
      if (property.amenities) property.amenities = JSON.parse(property.amenities);
      if (property.coordinates) property.coordinates = JSON.parse(property.coordinates);
      if (property.photos) property.photos = JSON.parse(property.photos);
      if (property.videos) property.videos = JSON.parse(property.videos);
      if (property.additional_documents) property.additional_documents = JSON.parse(property.additional_documents);
      if (property.test_drive_data) property.test_drive_data = JSON.parse(property.test_drive_data);
      return property;
    });
  },

  /**
   * Получить все дома/виллы с фильтрами
   */
  getAll: (filters = {}, limit = 100, offset = 0) => {
    const db = getDatabase();
    let query = 'SELECT * FROM properties_houses WHERE 1=1';
    const params = [];
    
    if (filters.moderation_status) {
      query += ' AND moderation_status = ?';
      params.push(filters.moderation_status);
    }
    
    if (filters.property_type) {
      query += ' AND property_type = ?';
      params.push(filters.property_type);
    }
    
    if (filters.city) {
      query += ' AND city = ?';
      params.push(filters.city);
    }
    
    if (filters.country) {
      query += ' AND country = ?';
      params.push(filters.country);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const stmt = db.prepare(query);
    const properties = stmt.all(...params);
    
    // Парсим JSON поля
    return properties.map(property => {
      if (property.amenities) property.amenities = JSON.parse(property.amenities);
      if (property.coordinates) property.coordinates = JSON.parse(property.coordinates);
      if (property.photos) property.photos = JSON.parse(property.photos);
      if (property.videos) property.videos = JSON.parse(property.videos);
      if (property.additional_documents) property.additional_documents = JSON.parse(property.additional_documents);
      if (property.test_drive_data) property.test_drive_data = JSON.parse(property.test_drive_data);
      return property;
    });
  },

  /**
   * Обновить дом/виллу
   */
  update: (id, propertyData) => {
    const db = getDatabase();
    
    // Формируем JSON массив удобств
    // ВАЖНО: Добавляем в массив ТОЛЬКО те удобства, которые явно выбраны пользователем (равны 1 или true)
    const amenities = [];
    
    // Основные удобства - проверяем строго (только 1 или true, не 0, не undefined, не '0')
    if (propertyData.pool === 1 || propertyData.pool === true || propertyData.pool === '1') {
      amenities.push('pool');
    }
    if (propertyData.garden === 1 || propertyData.garden === true || propertyData.garden === '1') {
      amenities.push('garden');
    }
    if (propertyData.garage === 1 || propertyData.garage === true || propertyData.garage === '1') {
      amenities.push('garage');
    }
    if (propertyData.parking === 1 || propertyData.parking === true || propertyData.parking === '1') {
      amenities.push('parking');
    }
    if (propertyData.electricity === 1 || propertyData.electricity === true || propertyData.electricity === '1') {
      amenities.push('electricity');
    }
    if (propertyData.internet === 1 || propertyData.internet === true || propertyData.internet === '1') {
      amenities.push('internet');
    }
    if (propertyData.security === 1 || propertyData.security === true || propertyData.security === '1') {
      amenities.push('security');
    }
    if (propertyData.furniture === 1 || propertyData.furniture === true || propertyData.furniture === '1') {
      amenities.push('furniture');
    }
    
    // Добавляем feature поля в массив удобств - проверяем строго
    for (let i = 1; i <= 26; i++) {
      const featureKey = `feature${i}`;
      const featureValue = propertyData[featureKey];
      if (featureValue === 1 || featureValue === true || featureValue === '1') {
        amenities.push(featureKey);
      }
    }
    
    const stmt = db.prepare(`
      UPDATE properties_houses SET
        title = ?, description = ?, price = ?, currency = ?,
        is_auction = ?, auction_start_date = ?, auction_end_date = ?, auction_starting_price = ?,
        area = ?, living_area = ?, land_area = ?, building_type = ?, bedrooms = ?, bathrooms = ?, 
        floors = ?, year_built = ?,
        location = ?, address = ?, country = ?, city = ?, coordinates = ?,
        amenities = ?, renovation = ?, condition = ?, heating = ?, water_supply = ?, sewerage = ?,
        additional_amenities = ?,
        photos = ?, videos = ?, additional_documents = ?,
        ownership_document = ?, no_debts_document = ?,
        test_drive = ?, test_drive_data = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(
      propertyData.title,
      propertyData.description || null,
      propertyData.price || null,
      propertyData.currency || 'USD',
      propertyData.is_auction ? 1 : 0,
      propertyData.auction_start_date || null,
      propertyData.auction_end_date || null,
      propertyData.auction_starting_price || null,
      propertyData.area || null,
      propertyData.living_area || null,
      propertyData.land_area || null,
      propertyData.building_type || null,
      (() => {
        // Обрабатываем bedrooms: проверяем на валидность и преобразуем в число
        if (propertyData.bedrooms !== undefined && propertyData.bedrooms !== null && propertyData.bedrooms !== '') {
          const parsedBedrooms = typeof propertyData.bedrooms === 'number' 
            ? propertyData.bedrooms 
            : parseInt(propertyData.bedrooms, 10);
          // Проверяем, что это валидное число (не NaN и конечное)
          if (!isNaN(parsedBedrooms) && isFinite(parsedBedrooms)) {
            return parsedBedrooms;
          }
        }
        return null;
      })(),
      propertyData.bathrooms || null,
      propertyData.floors || null,
      propertyData.year_built || null,
      propertyData.location || null,
      propertyData.address || null,
      propertyData.country || null,
      propertyData.city || null,
      propertyData.coordinates ? JSON.stringify(propertyData.coordinates) : null,
      JSON.stringify(amenities),
      propertyData.renovation || null,
      propertyData.condition || null,
      propertyData.heating || null,
      propertyData.water_supply || null,
      propertyData.sewerage || null,
      propertyData.additional_amenities || null,
      propertyData.photos ? JSON.stringify(propertyData.photos) : null,
      propertyData.videos ? JSON.stringify(propertyData.videos) : null,
      propertyData.additional_documents ? JSON.stringify(propertyData.additional_documents) : null,
      propertyData.ownership_document || null,
      propertyData.no_debts_document || null,
      propertyData.test_drive ? 1 : 0,
      propertyData.test_drive_data ? JSON.stringify(propertyData.test_drive_data) : null,
      id
    );
  },

  /**
   * Удалить дом/виллу
   */
  delete: (id) => {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM properties_houses WHERE id = ?');
    return stmt.run(id);
  },

  /**
   * Обновить статус модерации
   */
  updateModerationStatus: (id, status, reviewedBy = null, rejectionReason = null) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE properties_houses 
      SET moderation_status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, rejection_reason = ?
      WHERE id = ?
    `);
    return stmt.run(status, reviewedBy, rejectionReason, id);
  },

  /**
   * Забронировать объект на 72 часа
   */
  reserve: (id, userId, purchaseRequestId) => {
    const db = getDatabase();
    const reservedUntil = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(); // +72 часа
    const stmt = db.prepare(`
      UPDATE properties_houses 
      SET reserved_until = ?, reserved_by = ?, purchase_request_id = ?
      WHERE id = ?
    `);
    return stmt.run(reservedUntil, userId, purchaseRequestId, id);
  },

  /**
   * Снять бронь с объекта
   */
  unreserve: (id) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE properties_houses 
      SET reserved_until = NULL, reserved_by = NULL, purchase_request_id = NULL
      WHERE id = ?
    `);
    return stmt.run(id);
  },

  /**
   * Проверить, забронирован ли объект
   */
  isReserved: (id) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT reserved_until, reserved_by, purchase_request_id 
      FROM properties_houses 
      WHERE id = ?
    `);
    const result = stmt.get(id);
    
    if (!result || !result.reserved_until) {
      return { isReserved: false };
    }
    
    const reservedUntil = new Date(result.reserved_until);
    const now = new Date();
    
    // Если бронь истекла, автоматически снимаем её
    if (reservedUntil < now) {
      houseQueries.unreserve(id);
      return { isReserved: false };
    }
    
    return {
      isReserved: true,
      reservedUntil: result.reserved_until,
      reservedBy: result.reserved_by,
      purchaseRequestId: result.purchase_request_id,
      timeRemaining: reservedUntil - now
    };
  }
};

// ========== УНИВЕРСАЛЬНЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ СО ВСЕЙ НЕДВИЖИМОСТЬЮ ==========

/**
 * Получить всю недвижимость из обеих таблиц (apartments и houses)
 * Объединяет результаты и возвращает в едином формате
 */
export const propertyQueries = {
  /**
   * Получить все объекты недвижимости с фильтрами
   */
  getAll: (filters = {}, limit = 100, offset = 0) => {
    const db = getDatabase();
    
    // Проверяем существование новых таблиц
    let useNewTables = false;
    try {
      db.prepare('SELECT 1 FROM properties_apartments LIMIT 1').get();
      db.prepare('SELECT 1 FROM properties_houses LIMIT 1').get();
      useNewTables = true;
    } catch (e) {
      useNewTables = false;
    }
    
    if (useNewTables) {
      // Используем новые таблицы
      const apartments = apartmentQueries.getAll(filters, limit, offset);
      const houses = houseQueries.getAll(filters, limit, offset);
      
      // Объединяем и сортируем по дате создания
      const allProperties = [...apartments, ...houses].sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      return allProperties.slice(0, limit);
    } else {
      // Fallback на старую таблицу
      let query = 'SELECT * FROM properties WHERE 1=1';
      const params = [];
      
      if (filters.moderation_status) {
        query += ' AND moderation_status = ?';
        params.push(filters.moderation_status);
      }
      
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const stmt = db.prepare(query);
      return stmt.all(...params);
    }
  },

  /**
   * Получить количество всех объектов
   */
  getCount: (filters = {}) => {
    const db = getDatabase();
    
    // Проверяем существование новых таблиц
    let useNewTables = false;
    try {
      db.prepare('SELECT 1 FROM properties_apartments LIMIT 1').get();
      db.prepare('SELECT 1 FROM properties_houses LIMIT 1').get();
      useNewTables = true;
    } catch (e) {
      useNewTables = false;
    }
    
    if (useNewTables) {
      let apartmentQuery = 'SELECT COUNT(*) as count FROM properties_apartments WHERE 1=1';
      let houseQuery = 'SELECT COUNT(*) as count FROM properties_houses WHERE 1=1';
      const params = [];
      
      if (filters.moderation_status) {
        apartmentQuery += ' AND moderation_status = ?';
        houseQuery += ' AND moderation_status = ?';
        params.push(filters.moderation_status);
      }
      
      const apartmentCount = db.prepare(apartmentQuery).get(...params).count || 0;
      const houseCount = db.prepare(houseQuery).get(...params).count || 0;
      
      return apartmentCount + houseCount;
    } else {
      // Fallback на старую таблицу
      let query = 'SELECT COUNT(*) as count FROM properties WHERE 1=1';
      const params = [];
      
      if (filters.moderation_status) {
        query += ' AND moderation_status = ?';
        params.push(filters.moderation_status);
      }
      
      const result = db.prepare(query).get(...params);
      return result.count || 0;
    }
  },

  /**
   * Получить объекты конкретного пользователя
   */
  getByUserId: (userId, limit = 50, offset = 0) => {
    const db = getDatabase();
    
    // Проверяем существование новых таблиц
    let useNewTables = false;
    try {
      db.prepare('SELECT 1 FROM properties_apartments LIMIT 1').get();
      db.prepare('SELECT 1 FROM properties_houses LIMIT 1').get();
      useNewTables = true;
    } catch (e) {
      useNewTables = false;
    }
    
    if (useNewTables) {
      const apartments = apartmentQueries.getByUserId(userId, limit, offset);
      const houses = houseQueries.getByUserId(userId, limit, offset);
      
      // Объединяем и сортируем
      const allProperties = [...apartments, ...houses].sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      return allProperties.slice(0, limit);
    } else {
      // Fallback на старую таблицу
      const stmt = db.prepare('SELECT * FROM properties WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?');
      return stmt.all(userId, limit, offset);
    }
  },

  /**
   * Получить объект по ID (ищет в обеих таблицах)
   */
  getById: (id, propertyType = null) => {
    const db = getDatabase();
    
    // Проверяем существование новых таблиц
    let useNewTables = false;
    try {
      db.prepare('SELECT 1 FROM properties_apartments LIMIT 1').get();
      db.prepare('SELECT 1 FROM properties_houses LIMIT 1').get();
      useNewTables = true;
    } catch (e) {
      useNewTables = false;
    }
    
    if (useNewTables) {
      // Если известен тип, ищем в конкретной таблице
      if (propertyType === 'apartment' || propertyType === 'commercial') {
        const property = apartmentQueries.getById(id);
        if (property) {
          property.source_table = 'apartments';
        }
        return property;
      } else if (propertyType === 'house' || propertyType === 'villa') {
        const property = houseQueries.getById(id);
        if (property) {
          property.source_table = 'houses';
        }
        return property;
      }
      
      // Если тип неизвестен, ищем в обеих таблицах
      // ВАЖНО: Сначала проверяем houses, так как ID могут совпадать между таблицами
      // Но правильнее искать в обеих таблицах параллельно и проверять property_type
      let property = houseQueries.getById(id);
      if (property) {
        // Проверяем, что это действительно дом или вилла
        if (property.property_type === 'house' || property.property_type === 'villa') {
          property.source_table = 'houses';
          return property;
        }
      }
      
      property = apartmentQueries.getById(id);
      if (property) {
        // Проверяем, что это действительно квартира или коммерческая недвижимость
        if (property.property_type === 'apartment' || property.property_type === 'commercial') {
          property.source_table = 'apartments';
          return property;
        }
      }
      
      // Если не нашли ни в одной таблице, возвращаем null
      return null;
    } else {
      // Fallback на старую таблицу
      const stmt = db.prepare('SELECT * FROM properties WHERE id = ?');
      return stmt.get(id);
    }
  },

  /**
   * Обновить статус модерации (работает с обеими таблицами)
   */
  updateModerationStatus: (id, status, reviewedBy = null, rejectionReason = null) => {
    const db = getDatabase();
    
    // Проверяем существование новых таблиц
    let useNewTables = false;
    try {
      db.prepare('SELECT 1 FROM properties_apartments LIMIT 1').get();
      db.prepare('SELECT 1 FROM properties_houses LIMIT 1').get();
      useNewTables = true;
    } catch (e) {
      useNewTables = false;
    }
    
    if (useNewTables) {
      console.log(`🔍 updateModerationStatus: обновление ID=${id}, status=${status}`);
      
      // ВАЖНО: Сначала определяем, в какой таблице находится объект, проверяя property_type
      // Это предотвращает обновление объекта в неправильной таблице
      let propertyInHouses = null;
      let propertyInApartments = null;
      
      try {
        propertyInHouses = db.prepare('SELECT id, property_type FROM properties_houses WHERE id = ?').get(id);
      } catch (e) {
        // Игнорируем ошибку
      }
      
      try {
        propertyInApartments = db.prepare('SELECT id, property_type FROM properties_apartments WHERE id = ?').get(id);
      } catch (e) {
        // Игнорируем ошибку
      }
      
      console.log(`🔍 updateModerationStatus: проверка наличия объекта ID=${id}:`, {
        in_houses: !!propertyInHouses,
        in_apartments: !!propertyInApartments,
        houses_type: propertyInHouses?.property_type,
        apartments_type: propertyInApartments?.property_type
      });
      
      // Если объект найден в обеих таблицах (дубликат ID), определяем правильную таблицу по property_type
      if (propertyInHouses && propertyInApartments) {
        console.warn(`⚠️ updateModerationStatus: объект ID=${id} найден в обеих таблицах! Это дубликат ID.`);
        // Определяем правильную таблицу по property_type
        if (propertyInHouses.property_type === 'house' || propertyInHouses.property_type === 'villa') {
          console.log(`✅ updateModerationStatus: используем houses (property_type=${propertyInHouses.property_type})`);
          propertyInApartments = null; // Игнорируем apartments
        } else if (propertyInApartments.property_type === 'apartment' || propertyInApartments.property_type === 'commercial') {
          console.log(`✅ updateModerationStatus: используем apartments (property_type=${propertyInApartments.property_type})`);
          propertyInHouses = null; // Игнорируем houses
        }
      }
      
      // Обновляем в правильной таблице
      let result = null;
      
      // Если объект в houses (house или villa)
      if (propertyInHouses && (propertyInHouses.property_type === 'house' || propertyInHouses.property_type === 'villa')) {
        try {
          result = houseQueries.updateModerationStatus(id, status, reviewedBy, rejectionReason);
          console.log(`📊 updateModerationStatus houses: changes=${result?.changes || 0}`);
          if (result && result.changes > 0) {
            console.log(`✅ updateModerationStatus: обновлено в houses, ID=${id}, type=${propertyInHouses.property_type}`);
            return result;
          }
        } catch (e) {
          console.error(`❌ updateModerationStatus: ошибка при обновлении houses, ID=${id}:`, e.message);
          throw new Error(`Ошибка при обновлении статуса модерации для объявления ID ${id} в houses: ${e.message}`);
        }
      }
      
      // Если объект в apartments (apartment или commercial)
      if (propertyInApartments && (propertyInApartments.property_type === 'apartment' || propertyInApartments.property_type === 'commercial')) {
        try {
          result = apartmentQueries.updateModerationStatus(id, status, reviewedBy, rejectionReason);
          console.log(`📊 updateModerationStatus apartments: changes=${result?.changes || 0}`);
          if (result && result.changes > 0) {
            console.log(`✅ updateModerationStatus: обновлено в apartments, ID=${id}, type=${propertyInApartments.property_type}`);
            return result;
          }
        } catch (e) {
          console.error(`❌ updateModerationStatus: ошибка при обновлении apartments, ID=${id}:`, e.message);
          throw new Error(`Ошибка при обновлении статуса модерации для объявления ID ${id} в apartments: ${e.message}`);
        }
      }
      
      // Если объект не найден ни в одной таблице
      console.error(`❌ updateModerationStatus: объект ID=${id} не найден ни в одной таблице`);
      throw new Error(`Объявление с ID ${id} не найдено ни в одной таблице`);
    } else {
      // Fallback на старую таблицу
      const stmt = db.prepare(`
        UPDATE properties 
        SET moderation_status = ?, 
            reviewed_by = ?, 
            reviewed_at = CURRENT_TIMESTAMP,
            rejection_reason = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      return stmt.run(status, reviewedBy, rejectionReason, id);
    }
  },

  /**
   * Удалить объявление (работает с обеими таблицами)
   */
  delete: (id) => {
    const db = getDatabase();
    
    // Проверяем существование новых таблиц
    let useNewTables = false;
    try {
      db.prepare('SELECT 1 FROM properties_apartments LIMIT 1').get();
      db.prepare('SELECT 1 FROM properties_houses LIMIT 1').get();
      useNewTables = true;
    } catch (e) {
      useNewTables = false;
    }
    
    if (useNewTables) {
      // Сначала пытаемся удалить из apartments
      try {
        const result = db.prepare('DELETE FROM properties_apartments WHERE id = ?').run(id);
        if (result.changes > 0) {
          return result;
        }
      } catch (e) {
        console.log('Не найдено в apartments, пробуем houses');
      }
      
      // Если не нашли в apartments, пробуем houses
      try {
        return db.prepare('DELETE FROM properties_houses WHERE id = ?').run(id);
      } catch (e) {
        throw new Error(`Объявление с ID ${id} не найдено ни в одной таблице`);
      }
    } else {
      // Fallback на старую таблицу
      return db.prepare('DELETE FROM properties WHERE id = ?').run(id);
    }
  },

  /**
   * Обновить объявление (работает с обеими таблицами)
   */
  update: (id, propertyData) => {
    // Сначала определяем тип объявления
    const property = propertyQueries.getById(id);
    if (!property) {
      throw new Error(`Объявление с ID ${id} не найдено`);
    }
    
    // В зависимости от типа вызываем соответствующий метод
    if (property.property_type === 'apartment' || property.property_type === 'commercial') {
      return apartmentQueries.update(id, propertyData);
    } else if (property.property_type === 'house' || property.property_type === 'villa') {
      return houseQueries.update(id, propertyData);
    } else {
      throw new Error(`Неизвестный тип объявления: ${property.property_type}`);
    }
  },

  /**
   * Получить объекты пользователя с информацией о пользователе
   */
  getUserProperties: (userId) => {
    const db = getDatabase();
    
    // Проверяем существование новых таблиц
    let useNewTables = false;
    try {
      db.prepare('SELECT 1 FROM properties_apartments LIMIT 1').get();
      db.prepare('SELECT 1 FROM properties_houses LIMIT 1').get();
      useNewTables = true;
    } catch (e) {
      useNewTables = false;
    }
    
    if (useNewTables) {
      // Получаем из обеих таблиц
      const apartmentsStmt = db.prepare(`
        SELECT 
          p.*,
          u.first_name,
          u.last_name,
          u.email,
          u.phone_number,
          u.role,
          'apartments' as source_table
        FROM properties_apartments p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
      `);
      
      const housesStmt = db.prepare(`
        SELECT 
          p.*,
          u.first_name,
          u.last_name,
          u.email,
          u.phone_number,
          u.role,
          'houses' as source_table
        FROM properties_houses p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
      `);
      
      const apartments = apartmentsStmt.all(userId);
      const houses = housesStmt.all(userId);
      
      // Объединяем и сортируем
      const allProperties = [...apartments, ...houses].sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      // Парсим JSON поля
      return allProperties.map(property => {
        if (property.amenities) {
          try {
            property.amenities = JSON.parse(property.amenities);
          } catch (e) {
            property.amenities = [];
          }
        }
        if (property.coordinates) {
          try {
            property.coordinates = JSON.parse(property.coordinates);
          } catch (e) {
            property.coordinates = null;
          }
        }
        if (property.photos) {
          try {
            property.photos = JSON.parse(property.photos);
          } catch (e) {
            property.photos = [];
          }
        }
        if (property.videos) {
          try {
            property.videos = JSON.parse(property.videos);
          } catch (e) {
            property.videos = [];
          }
        }
        if (property.additional_documents) {
          try {
            property.additional_documents = JSON.parse(property.additional_documents);
          } catch (e) {
            property.additional_documents = [];
          }
        }
        if (property.test_drive_data) {
          try {
            property.test_drive_data = JSON.parse(property.test_drive_data);
          } catch (e) {
            property.test_drive_data = null;
          }
        }
        return property;
      });
    } else {
      // Fallback на старую таблицу
      const stmt = db.prepare(`
        SELECT 
          p.*,
          u.first_name,
          u.last_name,
          u.email,
          u.phone_number,
          u.role
        FROM properties p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
      `);
      return stmt.all(userId);
    }
  },

  /**
   * Получить одобренные объекты без аукциона
   */
  getApproved: (propertyType = null) => {
    const db = getDatabase();
    
    // Проверяем существование новых таблиц
    let useNewTables = false;
    try {
      db.prepare('SELECT 1 FROM properties_apartments LIMIT 1').get();
      db.prepare('SELECT 1 FROM properties_houses LIMIT 1').get();
      useNewTables = true;
    } catch (e) {
      useNewTables = false;
    }
    
    if (useNewTables) {
      let apartmentsQuery = `
        SELECT 
          p.*,
          u.first_name,
          u.last_name,
          u.email,
          u.phone_number,
          u.role,
          'apartments' as source_table
        FROM properties_apartments p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.moderation_status = 'approved' AND (p.is_auction = 0 OR p.is_auction IS NULL OR p.is_auction = '0')
      `;
      
      let housesQuery = `
        SELECT 
          p.*,
          u.first_name,
          u.last_name,
          u.email,
          u.phone_number,
          u.role,
          'houses' as source_table
        FROM properties_houses p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.moderation_status = 'approved' AND (p.is_auction = 0 OR p.is_auction IS NULL OR p.is_auction = '0')
      `;
      
      const params = [];
      if (propertyType) {
        apartmentsQuery += ' AND p.property_type = ?';
        housesQuery += ' AND p.property_type = ?';
        params.push(propertyType);
      }
      
      apartmentsQuery += ' ORDER BY p.reviewed_at DESC, p.created_at DESC';
      housesQuery += ' ORDER BY p.reviewed_at DESC, p.created_at DESC';
      
      const apartments = db.prepare(apartmentsQuery).all(...params);
      const houses = db.prepare(housesQuery).all(...params);
      
      console.log(`📊 getApproved: найдено apartments=${apartments.length}, houses=${houses.length}, фильтр type=${propertyType || 'null'}`);
      
      // Логируем запросы для отладки
      if (propertyType === 'house' || propertyType === 'villa') {
        console.log('🔍 SQL запрос для houses:', housesQuery);
        console.log('🔍 Параметры запроса:', params);
      }
      
      if (houses.length > 0) {
        console.log('📊 Пример дома/виллы:', {
          id: houses[0].id,
          property_type: houses[0].property_type,
          title: houses[0].title,
          moderation_status: houses[0].moderation_status,
          is_auction: houses[0].is_auction,
          is_auction_type: typeof houses[0].is_auction
        });
      } else if (propertyType === 'house' || propertyType === 'villa') {
        // Если не найдено, проверяем, есть ли вообще дома/виллы с approved статусом
        const allHouses = db.prepare('SELECT id, property_type, title, moderation_status, is_auction FROM properties_houses WHERE moderation_status = ?').all('approved');
        console.log('🔍 Всего домов/вилл со статусом approved:', allHouses.length);
        if (allHouses.length > 0) {
          console.log('🔍 Примеры домов/вилл:', allHouses.slice(0, 3).map(h => ({
            id: h.id,
            property_type: h.property_type,
            title: h.title,
            moderation_status: h.moderation_status,
            is_auction: h.is_auction,
            is_auction_type: typeof h.is_auction
          })));
        }
      }
      
      // Объединяем и сортируем
      const allProperties = [...apartments, ...houses].sort((a, b) => {
        const dateA = new Date(a.reviewed_at || a.created_at);
        const dateB = new Date(b.reviewed_at || b.created_at);
        return dateB - dateA;
      });
      
      // Парсим JSON поля безопасно
      return allProperties.map(property => {
        if (property.amenities && typeof property.amenities === 'string') {
          try {
            property.amenities = JSON.parse(property.amenities);
          } catch (e) {
            property.amenities = [];
          }
        } else if (!property.amenities) {
          property.amenities = [];
        }
        if (property.coordinates && typeof property.coordinates === 'string') {
          try {
            property.coordinates = JSON.parse(property.coordinates);
          } catch (e) {
            property.coordinates = null;
          }
        }
        if (property.photos && typeof property.photos === 'string') {
          try {
            property.photos = JSON.parse(property.photos);
          } catch (e) {
            property.photos = [];
          }
        } else if (!property.photos) {
          property.photos = [];
        }
        if (property.videos && typeof property.videos === 'string') {
          try {
            property.videos = JSON.parse(property.videos);
          } catch (e) {
            property.videos = [];
          }
        } else if (!property.videos) {
          property.videos = [];
        }
        if (property.additional_documents && typeof property.additional_documents === 'string') {
          try {
            property.additional_documents = JSON.parse(property.additional_documents);
          } catch (e) {
            property.additional_documents = [];
          }
        } else if (!property.additional_documents) {
          property.additional_documents = [];
        }
        if (property.test_drive_data && typeof property.test_drive_data === 'string') {
          try {
            property.test_drive_data = JSON.parse(property.test_drive_data);
          } catch (e) {
            property.test_drive_data = null;
          }
        }
        return property;
      });
    } else {
      // Fallback на старую таблицу
      let query = `
        SELECT p.*, 
               u.first_name, u.last_name, u.email, u.phone_number
        FROM properties p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.moderation_status = 'approved' 
          AND (p.is_auction = 0 OR p.is_auction IS NULL)
      `;
      
      const params = [];
      if (propertyType) {
        query += ' AND p.property_type = ?';
        params.push(propertyType);
      }
      
      query += ' ORDER BY p.reviewed_at DESC, p.created_at DESC';
      
      return db.prepare(query).all(...params);
    }
  },

  /**
   * Получить объекты-аукционы
   */
  getAuctions: (propertyType = null) => {
    const db = getDatabase();
    
    // Проверяем существование новых таблиц
    let useNewTables = false;
    try {
      db.prepare('SELECT 1 FROM properties_apartments LIMIT 1').get();
      db.prepare('SELECT 1 FROM properties_houses LIMIT 1').get();
      useNewTables = true;
    } catch (e) {
      useNewTables = false;
    }
    
    if (useNewTables) {
      let apartmentsQuery = `
        SELECT 
          p.*,
          u.first_name,
          u.last_name,
          u.email,
          u.phone_number,
          u.role,
          'apartments' as source_table
        FROM properties_apartments p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.moderation_status = 'approved' 
          AND (p.is_auction = 1 OR p.is_auction = '1')
          AND p.auction_end_date IS NOT NULL
          AND p.auction_end_date != ''
      `;
      
      let housesQuery = `
        SELECT 
          p.*,
          u.first_name,
          u.last_name,
          u.email,
          u.phone_number,
          u.role,
          'houses' as source_table
        FROM properties_houses p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.moderation_status = 'approved' 
          AND (p.is_auction = 1 OR p.is_auction = '1')
          AND p.auction_end_date IS NOT NULL
          AND p.auction_end_date != ''
      `;
      
      const params = [];
      if (propertyType) {
        apartmentsQuery += ' AND p.property_type = ?';
        housesQuery += ' AND p.property_type = ?';
        params.push(propertyType);
      }
      
      apartmentsQuery += ' ORDER BY p.auction_end_date ASC';
      housesQuery += ' ORDER BY p.auction_end_date ASC';
      
      const apartments = db.prepare(apartmentsQuery).all(...params);
      const houses = db.prepare(housesQuery).all(...params);
      
      console.log(`📊 getAuctions: найдено apartments=${apartments.length}, houses=${houses.length}, фильтр type=${propertyType || 'null'}`);
      
      // Если не найдено, проверяем, есть ли вообще аукционные объекты
      if (houses.length === 0 && (propertyType === 'house' || propertyType === 'villa' || !propertyType)) {
        const allAuctionHouses = db.prepare(`
          SELECT id, property_type, title, moderation_status, is_auction, auction_end_date 
          FROM properties_houses 
          WHERE moderation_status = 'approved' AND (is_auction = 1 OR is_auction = '1')
        `).all();
        console.log(`🔍 Всего аукционных домов/вилл со статусом approved: ${allAuctionHouses.length}`);
        if (allAuctionHouses.length > 0) {
          console.log('🔍 Примеры аукционных домов/вилл:', allAuctionHouses.slice(0, 3).map(h => ({
            id: h.id,
            property_type: h.property_type,
            title: h.title,
            moderation_status: h.moderation_status,
            is_auction: h.is_auction,
            is_auction_type: typeof h.is_auction,
            auction_end_date: h.auction_end_date
          })));
        }
      }
      
      if (houses.length > 0) {
        console.log('📊 Пример аукционного дома/виллы:', {
          id: houses[0].id,
          property_type: houses[0].property_type,
          title: houses[0].title,
          moderation_status: houses[0].moderation_status,
          is_auction: houses[0].is_auction,
          is_auction_type: typeof houses[0].is_auction,
          auction_end_date: houses[0].auction_end_date
        });
      }
      
      // Объединяем и сортируем по дате окончания аукциона
      const allProperties = [...apartments, ...houses].sort((a, b) => {
        return new Date(a.auction_end_date) - new Date(b.auction_end_date);
      });
      
      // Парсим JSON поля безопасно
      return allProperties.map(property => {
        if (property.amenities && typeof property.amenities === 'string') {
          try {
            property.amenities = JSON.parse(property.amenities);
          } catch (e) {
            property.amenities = [];
          }
        } else if (!property.amenities) {
          property.amenities = [];
        }
        if (property.coordinates && typeof property.coordinates === 'string') {
          try {
            property.coordinates = JSON.parse(property.coordinates);
          } catch (e) {
            property.coordinates = null;
          }
        }
        if (property.photos && typeof property.photos === 'string') {
          try {
            property.photos = JSON.parse(property.photos);
          } catch (e) {
            property.photos = [];
          }
        } else if (!property.photos) {
          property.photos = [];
        }
        if (property.videos && typeof property.videos === 'string') {
          try {
            property.videos = JSON.parse(property.videos);
          } catch (e) {
            property.videos = [];
          }
        } else if (!property.videos) {
          property.videos = [];
        }
        if (property.additional_documents && typeof property.additional_documents === 'string') {
          try {
            property.additional_documents = JSON.parse(property.additional_documents);
          } catch (e) {
            property.additional_documents = [];
          }
        } else if (!property.additional_documents) {
          property.additional_documents = [];
        }
        if (property.test_drive_data && typeof property.test_drive_data === 'string') {
          try {
            property.test_drive_data = JSON.parse(property.test_drive_data);
          } catch (e) {
            property.test_drive_data = null;
          }
        }
        return property;
      });
    } else {
      // Fallback на старую таблицу
      let query = `
        SELECT p.*, 
               u.first_name, u.last_name, u.email, u.phone_number
        FROM properties p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.moderation_status = 'approved' 
          AND p.is_auction = 1
          AND p.auction_end_date IS NOT NULL
          AND p.auction_end_date != ''
      `;
      
      const params = [];
      if (propertyType) {
        query += ' AND p.property_type = ?';
        params.push(propertyType);
      }
      
      query += ' ORDER BY p.auction_end_date ASC';
      
      return db.prepare(query).all(...params);
    }
  },

  /**
   * Получить объекты на модерации с информацией о пользователе
   */
  getPending: () => {
    const db = getDatabase();
    
    // Проверяем существование новых таблиц
    let useNewTables = false;
    try {
      db.prepare('SELECT 1 FROM properties_apartments LIMIT 1').get();
      db.prepare('SELECT 1 FROM properties_houses LIMIT 1').get();
      useNewTables = true;
    } catch (e) {
      useNewTables = false;
    }
    
    if (useNewTables) {
      // Получаем из обеих таблиц
      const apartmentsStmt = db.prepare(`
        SELECT 
          p.*,
          u.first_name,
          u.last_name,
          u.email,
          u.phone_number,
          u.role,
          'apartments' as source_table
        FROM properties_apartments p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.moderation_status = 'pending'
        ORDER BY p.created_at DESC
      `);
      
      const housesStmt = db.prepare(`
        SELECT 
          p.*,
          u.first_name,
          u.last_name,
          u.email,
          u.phone_number,
          u.role,
          'houses' as source_table
        FROM properties_houses p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.moderation_status = 'pending'
        ORDER BY p.created_at DESC
      `);
      
      const apartments = apartmentsStmt.all();
      const houses = housesStmt.all();
      
      // Объединяем и сортируем
      const allProperties = [...apartments, ...houses].sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      // Парсим JSON поля
      return allProperties.map(property => {
        if (property.amenities) {
          try {
            property.amenities = JSON.parse(property.amenities);
          } catch (e) {
            property.amenities = [];
          }
        }
        if (property.coordinates) {
          try {
            property.coordinates = JSON.parse(property.coordinates);
          } catch (e) {
            property.coordinates = null;
          }
        }
        if (property.photos) {
          try {
            property.photos = JSON.parse(property.photos);
          } catch (e) {
            property.photos = [];
          }
        }
        if (property.videos) {
          try {
            property.videos = JSON.parse(property.videos);
          } catch (e) {
            property.videos = [];
          }
        }
        if (property.additional_documents) {
          try {
            property.additional_documents = JSON.parse(property.additional_documents);
          } catch (e) {
            property.additional_documents = [];
          }
        }
        if (property.test_drive_data) {
          try {
            property.test_drive_data = JSON.parse(property.test_drive_data);
          } catch (e) {
            property.test_drive_data = null;
          }
        }
        return property;
      });
    } else {
      // Fallback на старую таблицу
      const stmt = db.prepare(`
        SELECT 
          p.*,
          u.first_name,
          u.last_name,
          u.email,
          u.phone_number,
          u.role
        FROM properties p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.moderation_status = 'pending'
        ORDER BY p.created_at DESC
      `);
      return stmt.all();
    }
  },

  /**
   * Алиас для getPending (для обратной совместимости)
   */
  getPendingProperties: function() {
    return this.getPending();
  }
};

>>>>>>> 9834624ce85afa7fe9aa397716cd67d8da737a39
