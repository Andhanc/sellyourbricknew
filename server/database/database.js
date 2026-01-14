import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Путь к файлу базы данных
const DB_PATH = join(__dirname, '..', 'database.sqlite');

// Создаем или открываем базу данных
let db = null;

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
      
      if (needsUpdate) {
        try {
          // Если нет поля password, добавляем его
          if (!passwordColumn) {
            dbInstance.exec("ALTER TABLE users ADD COLUMN password TEXT");
            console.log('✅ Поле password добавлено в таблицу users');
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
 * Инициализация базы данных
 */
export function initDatabase() {
  try {
    db = new Database(DB_PATH);
    
    // Включаем внешние ключи
    db.pragma('foreign_keys = ON');
    
    // Читаем и выполняем SQL-скрипт инициализации
    const initSql = readFileSync(join(__dirname, 'init.sql'), 'utf8');
    db.exec(initSql);
    
    // Проверяем и обновляем схему, если нужно (передаем db напрямую, чтобы избежать рекурсии)
    checkAndUpdateSchema(db);
    
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
          `);
          console.log('✅ Таблица администраторов создана');
        }
      } catch (adminError) {
        console.warn('⚠️ Не удалось создать таблицу администраторов:', adminError.message);
      }
    } catch (migrationError) {
      console.warn('⚠️ Не удалось обновить схему документов:', migrationError.message);
    }
    
    console.log('✅ База данных успешно инициализирована:', DB_PATH);
    return db;
  } catch (error) {
    console.error('❌ Ошибка при инициализации базы данных:', error);
    throw error;
  }
}

/**
 * Получить экземпляр базы данных
 */
export function getDatabase() {
  if (!db) {
    db = initDatabase();
  }
  return db;
}

/**
 * Закрыть соединение с базой данных
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('✅ Соединение с базой данных закрыто');
  }
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
      'is_verified', 'role', 'is_online'
    ];
    
    Object.keys(userData).forEach(key => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        if (key === 'is_verified' || key === 'is_online') {
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
        user_email: results[0].email
      });
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

