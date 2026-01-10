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
    const stmt = db.prepare('SELECT * FROM documents WHERE is_reviewed = 0 ORDER BY created_at ASC');
    return stmt.all();
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
    const stmt = db.prepare(`
      UPDATE documents 
      SET is_reviewed = 1, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    return stmt.run(reviewedBy, documentId);
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

