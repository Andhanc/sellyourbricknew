import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { initDatabase, closeDatabase, getDatabase } from './database/database.js';
import { userQueries, documentQueries, notificationQueries, administratorQueries, whatsappUserQueries } from './database/database.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import fs from 'fs';
import crypto from 'crypto';
import qrcode from 'qrcode-terminal';
import whatsappPkg from 'whatsapp-web.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client, LocalAuth } = whatsappPkg;

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Валидация пароля
 * Проверяет наличие заглавной буквы, спецсимволов и цифр
 * @param {string} password - Пароль для проверки
 * @returns {object} - { valid: boolean, errors: string[], missing: string[] }
 */
function validatePassword(password) {
  const errors = [];
  const missing = [];
  const present = [];

  // Проверка наличия заглавной буквы
  if (!/[A-ZА-Я]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну заглавную букву');
    missing.push('заглавную букву');
  } else {
    present.push('заглавную букву');
  }

  // Проверка наличия спецсимволов
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы один спецсимвол (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    missing.push('спецсимвол');
  } else {
    present.push('спецсимвол');
  }

  // Проверка наличия цифры
  if (!/[0-9]/.test(password)) {
    errors.push('Пароль должен содержать хотя бы одну цифру');
    missing.push('цифру');
  } else {
    present.push('цифру');
  }

  return {
    valid: errors.length === 0,
    errors,
    missing,
    present,
    message: errors.length > 0 
      ? `Пароль не соответствует требованиям. Добавьте: ${missing.join(', ')}. ${present.length > 0 ? `Уже есть: ${present.join(', ')}.` : ''}`
      : 'Пароль соответствует всем требованиям'
  };
}

// Настройка middleware
// CORS с поддержкой dev tunnels и других доменов
app.use(cors({
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, Postman, мобильные приложения)
    if (!origin) return callback(null, true);
    
    // Разрешаем localhost для локальной разработки
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Разрешаем dev tunnels домены
    if (origin.includes('devtunnels.ms') || origin.includes('devtunnels')) {
      return callback(null, true);
    }
    
    // Разрешаем все остальные домены (для тестирования)
    // В production здесь нужно указать конкретные домены
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Папка для загрузки файлов
const uploadsDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB максимум для файлов
    fieldSize: 50 * 1024 * 1024, // 50MB максимум для текстовых полей (JSON с большими массивами URL)
    fieldNameSize: 100, // Максимальная длина имени поля
    fields: 100, // Максимальное количество полей
    files: 20 // Максимальное количество файлов
  }
});

// Статическая папка для загрузок
app.use('/uploads', express.static(uploadsDir));

// Инициализация базы данных
initDatabase();

// ========== НАСТРОЙКА WHATSAPP WEB КЛИЕНТА ==========
let waClientReady = false;
let currentQRCode = null; // Сохраняем текущий QR-код для отображения в футере

const waClient = new Client({
  authStrategy: new LocalAuth({
    dataPath: join(__dirname, '.wwebjs_auth')
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
    // Увеличиваем таймаут для протокольных операций (по умолчанию 180000мс)
    // Это решает ошибку "Runtime.callFunctionOn timed out"
    protocolTimeout: 300000, // 5 минут вместо 3 минут по умолчанию
    // Дополнительные настройки для стабильности
    defaultViewport: {
      width: 1280,
      height: 720
    },
    // Игнорируем ошибки HTTPS (если есть проблемы с сертификатами)
    ignoreHTTPSErrors: true
  },
  // Фиксация версии веб-клиента WhatsApp, чтобы избежать ошибок
  // вида "Cannot read properties of undefined (reading 'markedUnread')"
  // из-за изменения внутреннего кода WhatsApp Web.
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
  }
});

waClient.on('qr', (qr) => {
  console.log('📲 Отсканируйте этот QR-код в WhatsApp (телефон, который будет отправлять коды):');
  // Сохраняем QR-код для отображения в футере
  currentQRCode = qr;
  try {
    qrcode.generate(qr, { small: true });
  } catch (e) {
    console.log('QR-код (текстом):', qr);
  }
});

// Обработчик события authenticated - клиент успешно авторизован
waClient.on('authenticated', () => {
  console.log('✅ WhatsApp клиент успешно авторизован');
  // Очищаем QR-код после авторизации
  currentQRCode = null;
  // Не устанавливаем waClientReady здесь, ждем события 'ready'
});

// Функция для применения патча sendSeen (обход бага markedUnread)
const applySendSeenPatch = async () => {
  try {
    if (waClient && waClient.pupPage) {
      await waClient.pupPage.evaluate(() => {
        // Более агрессивный патч - переопределяем sendSeen на всех уровнях
        if (window.WWebJS) {
          // Сохраняем оригинальную функцию, если она существует
          const originalSendSeen = window.WWebJS.sendSeen;
          
          // Переопределяем sendSeen на безопасную функцию
          window.WWebJS.sendSeen = async function(...args) {
            try {
              // Пытаемся вызвать оригинальную функцию, если она существует и работает
              if (originalSendSeen && typeof originalSendSeen === 'function') {
                try {
                  return await originalSendSeen.apply(this, args);
                } catch (e) {
                  // Если оригинальная функция падает с ошибкой markedUnread, просто игнорируем
                  if (e.message && e.message.includes('markedUnread')) {
                    console.warn('⚠️ Обход ошибки markedUnread в sendSeen');
                    return;
                  }
                  throw e;
                }
              }
              // Если оригинальной функции нет, просто возвращаемся
              return;
            } catch (error) {
              // Игнорируем все ошибки в sendSeen
              if (error.message && error.message.includes('markedUnread')) {
                return;
              }
              // Для других ошибок тоже возвращаемся без ошибки
              return;
            }
          };
          
          // Также патчим возможные другие места, где может быть sendSeen
          if (window.Store && window.Store.Msg) {
            const originalMarkRead = window.Store.Msg.markRead;
            if (originalMarkRead) {
              window.Store.Msg.markRead = async function(...args) {
                try {
                  return await originalMarkRead.apply(this, args);
                } catch (e) {
                  if (e.message && e.message.includes('markedUnread')) {
                    return;
                  }
                  throw e;
                }
              };
            }
          }
        }
      });
      console.log('✅ Патч sendSeen применён успешно');
      return true;
    }
  } catch (patchError) {
    console.warn('⚠️ Не удалось применить патч sendSeen:', patchError.message);
    return false;
  }
  return false;
};

waClient.on('ready', async () => {
  waClientReady = true;
  // Очищаем QR-код после готовности клиента
  currentQRCode = null;
  console.log('✅ WhatsApp клиент готов к отправке сообщений');

  // Применяем патч sendSeen при готовности клиента
  await applySendSeenPatch();
});

waClient.on('auth_failure', (msg) => {
  waClientReady = false;
  console.error('❌ Ошибка авторизации WhatsApp:', msg);
});

waClient.on('disconnected', (reason) => {
  waClientReady = false;
  console.warn('⚠️ WhatsApp клиент отключен. Причина:', reason);
  console.log('🔄 Пытаемся переподключиться через 5 секунд...');
  
  // Задержка перед переподключением для избежания быстрых циклов переподключения
  setTimeout(() => {
    try {
      waClient.initialize();
    } catch (error) {
      console.error('❌ Ошибка при переподключении WhatsApp:', error.message);
    }
  }, 5000);
});

// Функция для проверки состояния клиента
const checkClientState = async () => {
  try {
    if (waClient && waClient.info) {
      const info = waClient.info;
      console.log('📊 Состояние WhatsApp клиента:', {
        wid: info.wid ? info.wid.user : 'не определен',
        platform: info.platform || 'не определен',
        pushname: info.pushname || 'не определен'
      });
      
      // Если клиент имеет информацию, значит он авторизован
      if (info.wid) {
        console.log('✅ Клиент уже авторизован, проверяем готовность...');
        // Проверяем, можем ли мы отправить тестовое сообщение
        try {
          // Просто проверяем наличие pupPage как индикатор готовности
          if (waClient.pupPage) {
            waClientReady = true;
            console.log('✅ WhatsApp клиент готов (определено через проверку состояния)');
            // Применяем патч sendSeen при обнаружении готовности
            await applySendSeenPatch();
          }
        } catch (checkError) {
          console.warn('⚠️ Не удалось проверить готовность клиента:', checkError.message);
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Ошибка при проверке состояния клиента:', error.message);
  }
};

// Инициализируем WhatsApp клиент с обработкой ошибок
// Используем try-catch для перехвата ошибок инициализации
try {
  waClient.initialize().then(() => {
    // После инициализации проверяем состояние через небольшую задержку
    setTimeout(() => {
      checkClientState();
    }, 2000); // 2 секунды задержка для завершения инициализации
  }).catch((error) => {
    console.error('❌ Ошибка при инициализации WhatsApp клиента:', error.message);
    console.log('💡 Это нормально, если WhatsApp Web еще не авторизован.');
    console.log('   Отсканируйте QR-код, который появится в консоли, чтобы подключить WhatsApp.');
  });
} catch (error) {
  console.error('❌ Критическая ошибка при инициализации WhatsApp:', error.message);
  console.log('⚠️ WhatsApp клиент будет недоступен до перезапуска сервера.');
}

/**
 * Удаляет пароль из объекта пользователя (для безопасности)
 */
const removePasswordFromUser = (user) => {
  if (!user) return null;
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Удаляет пароли из массива пользователей
 */
const removePasswordsFromUsers = (users) => {
  return users.map(user => removePasswordFromUser(user));
};

// ========== РОУТЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ==========

/**
 * GET /api/users - Получить всех пользователей
 */
app.get('/api/users', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const users = userQueries.getAll(limit, offset);
    // Удаляем пароли из всех пользователей перед отправкой
    const usersWithoutPasswords = removePasswordsFromUsers(users);
    res.json({ success: true, data: usersWithoutPasswords });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/users/:id - Получить пользователя по ID
 */
app.get('/api/users/:id', (req, res) => {
  try {
    const user = userQueries.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    // Удаляем пароль перед отправкой (для безопасности)
    const userWithoutPassword = removePasswordFromUser(user);
    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/users/:id/verification-status - Получить статус готовности к верификации
 * Возвращает информацию о том, какие поля заполнены и что нужно для готовности
 */
app.get('/api/users/:id/verification-status', (req, res) => {
  try {
    const userId = req.params.id;
    const user = userQueries.getById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    
    // Получаем документы пользователя
    const documents = documentQueries.getByUserId(userId);
    const pendingDocuments = documents.filter(doc => doc.verification_status === 'pending');
    
    // Создаем объект для проверки готовности
    const userForCheck = {
      ...user,
      documents: pendingDocuments
    };
    
    // Проверяем готовность
    const readiness = checkUserReadinessForModeration(userForCheck);
    
    // Подсчитываем прогресс заполнения
    const totalFields = 8; // Всего полей
    let filledFields = 0;
    if (readiness.missingFields.firstName === false) filledFields++;
    if (readiness.missingFields.lastName === false) filledFields++;
    if (readiness.missingFields.emailOrPhone === false) filledFields++;
    if (readiness.missingFields.country === false) filledFields++;
    if (readiness.missingFields.address === false) filledFields++;
    if (readiness.missingFields.passportSeries === false) filledFields++;
    if (readiness.missingFields.passportNumber === false) filledFields++;
    if (readiness.missingFields.identificationNumber === false) filledFields++;
    
    const progress = Math.round((filledFields / totalFields) * 100);
    
    res.json({
      success: true,
      data: {
        isReady: readiness.isReady,
        hasDocuments: readiness.hasDocuments,
        documentsCount: pendingDocuments.length,
        progress,
        filledFields,
        totalFields,
        missingFields: readiness.missingFields,
        isVerified: user.is_verified === 1 || user.is_verified === true,
        cardBound: user.card_bound === 1 || user.card_bound === true // Добавляем статус привязки карты
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/users/:id/card-bound - Установить статус привязки карты
 */
app.put('/api/users/:id/card-bound', (req, res) => {
  try {
    const userId = req.params.id;
    const { cardBound } = req.body;
    
    const db = getDatabase();
    
    // Проверяем, существует ли поле card_bound
    const pragmaInfo = db.prepare("PRAGMA table_info(users)").all();
    const hasCardBound = pragmaInfo.some(col => col.name === 'card_bound');
    
    if (!hasCardBound) {
      // Если поля нет, добавляем его
      try {
        db.prepare("ALTER TABLE users ADD COLUMN card_bound INTEGER DEFAULT 0").run();
        console.log('✅ Добавлено поле card_bound в таблицу users');
      } catch (alterError) {
        // Поле уже существует или другая ошибка
        console.warn('⚠️ Не удалось добавить поле card_bound:', alterError.message);
      }
    }
    
    // Обновляем статус привязки карты
    const stmt = db.prepare('UPDATE users SET card_bound = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(cardBound ? 1 : 0, userId);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    
    const updatedUser = userQueries.getById(userId);
    
    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        cardBound: updatedUser.card_bound === 1 || updatedUser.card_bound === true
      }
    });
  } catch (error) {
    console.error('Ошибка при обновлении статуса привязки карты:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/users/email/:email - Получить пользователя по email
 */
app.get('/api/users/email/:email', (req, res) => {
  try {
    const user = userQueries.getByEmail(req.params.email);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    // Удаляем пароль перед отправкой (для безопасности)
    const userWithoutPassword = removePasswordFromUser(user);
    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/users/phone/:phone - Получить пользователя по номеру телефона
 */
app.get('/api/users/phone/:phone', (req, res) => {
  try {
    // Декодируем номер телефона из URL
    const phone = decodeURIComponent(req.params.phone);
    const user = userQueries.getByPhone(phone);
    if (!user) {
      // 404 - это нормально, пользователь просто не существует (для регистрации)
      return res.status(404).json({ 
        success: false, 
        error: 'Пользователь не найден',
        exists: false
      });
    }
    // Удаляем пароль перед отправкой (для безопасности)
    const userWithoutPassword = removePasswordFromUser(user);
    res.json({ 
      success: true, 
      data: userWithoutPassword,
      exists: true
    });
  } catch (error) {
    console.error('Ошибка при получении пользователя по телефону:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/users/role/:role - Получить пользователей по роли
 */
app.get('/api/users/role/:role', (req, res) => {
  try {
    const { role } = req.params;
    if (!['buyer', 'seller', 'admin', 'manager'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Недопустимая роль' });
    }
    const users = userQueries.getByRole(role);
    // Удаляем пароли из всех пользователей перед отправкой
    const usersWithoutPasswords = removePasswordsFromUsers(users);
    res.json({ success: true, data: usersWithoutPasswords });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/users - Создать нового пользователя
 */
app.post('/api/users', (req, res) => {
  try {
    const userData = { ...req.body };
    
    // Валидация обязательных полей
    if (!userData.first_name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Необходимо указать имя (first_name)' 
      });
    }
    
    // Проверяем, что указан хотя бы email или phone_number
    if (!userData.email && !userData.phone_number) {
      return res.status(400).json({ 
        success: false, 
        error: 'Необходимо указать email или номер телефона' 
      });
    }
    
    // Если пароль передан, хешируем его перед сохранением
    if (userData.password && userData.password.trim() !== '') {
      userData.password = crypto
        .createHash('sha256')
        .update(userData.password)
        .digest('hex');
    }
    
    const result = userQueries.create(userData);
    const newUser = userQueries.getById(result.lastInsertRowid);
    
    // Удаляем пароль перед отправкой (для безопасности)
    const userWithoutPassword = removePasswordFromUser(newUser);
    res.status(201).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ 
        success: false, 
        error: 'Пользователь с таким email или номером телефона уже существует' 
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/users/:id/approve - Одобрить пользователя (верифицировать)
 * Одобряет все pending документы пользователя и устанавливает is_verified = 1
 */
app.put('/api/users/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewed_by } = req.body;

    if (!reviewed_by) {
      return res.status(400).json({ success: false, error: 'Необходимо указать reviewed_by' });
    }

    const user = userQueries.getById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }

    // Получаем все pending документы пользователя
    const userDocuments = documentQueries.getByUserId(id);
    const pendingDocuments = userDocuments.filter(doc => doc.verification_status === 'pending');

    if (pendingDocuments.length === 0) {
      return res.status(400).json({ success: false, error: 'У пользователя нет документов на верификацию' });
    }

    // Одобряем все pending документы
    pendingDocuments.forEach(doc => {
      documentQueries.updateStatus(doc.id, 'approved', reviewed_by, null);
    });

    // Устанавливаем пользователя как верифицированного
    userQueries.update(id, { is_verified: 1 });

    // Создаем уведомление в БД
    try {
      console.log('📝 Создание уведомления для пользователя:', id);
      const result = notificationQueries.create({
        user_id: id,
        type: 'verification_success',
        title: 'Поздравляем с успешной верификацией!',
        message: '🎉 Ваши документы были одобрены. Теперь вы можете полноценно пользоваться сервисом.',
        is_read: 0,
        view_count: 0
      });
      console.log('✅ Уведомление о верификации создано в БД, ID:', result.lastInsertRowid);
      
      // Проверяем, что уведомление действительно создано
      const createdNotif = notificationQueries.getByUserId(id);
      console.log('📋 Всего уведомлений у пользователя:', createdNotif ? createdNotif.length : 0);
      if (createdNotif && createdNotif.length > 0) {
        console.log('📄 Последнее уведомление:', {
          id: createdNotif[0].id,
          type: createdNotif[0].type,
          title: createdNotif[0].title
        });
      }
    } catch (notifError) {
      console.error('❌ Не удалось создать уведомление в БД:', notifError);
      console.error('   Ошибка:', notifError.message);
      console.error('   Stack:', notifError.stack);
    }

    // Отправляем уведомление через WhatsApp (если доступно)
    if (user.phone_number && waClientReady) {
      try {
        const chatId = `${user.phone_number}@c.us`;
        await waClient.sendMessage(chatId, '🎉 Поздравляем с успешной верификацией! Теперь вы можете полноценно пользоваться сервисом.');
      } catch (notifError) {
        console.warn('⚠️ Не удалось отправить уведомление через WhatsApp:', notifError.message);
      }
    }

    const updatedUser = userQueries.getById(id);
    res.json({ 
      success: true, 
      data: updatedUser,
      message: `Пользователь верифицирован. Одобрено документов: ${pendingDocuments.length}`
    });
  } catch (error) {
    console.error('Ошибка при одобрении пользователя:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/users/:id/reject - Отклонить пользователя
 * Отклоняет все pending документы пользователя
 */
app.put('/api/users/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewed_by, rejection_reason } = req.body;

    if (!reviewed_by) {
      return res.status(400).json({ success: false, error: 'Необходимо указать reviewed_by' });
    }

    const user = userQueries.getById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }

    // Получаем все pending документы пользователя
    const userDocuments = documentQueries.getByUserId(id);
    const pendingDocuments = userDocuments.filter(doc => doc.verification_status === 'pending');

    if (pendingDocuments.length === 0) {
      return res.status(400).json({ success: false, error: 'У пользователя нет документов на верификацию' });
    }

    // Отклоняем все pending документы
    pendingDocuments.forEach(doc => {
      documentQueries.updateStatus(doc.id, 'rejected', reviewed_by, rejection_reason || 'Документы не прошли проверку');
    });

    // Отправляем уведомление пользователю
    if (user.phone_number && waClientReady) {
      try {
        const chatId = `${user.phone_number}@c.us`;
        const message = rejection_reason 
          ? `❌ Ваши документы были отклонены по причине: ${rejection_reason}. Пожалуйста, загрузите их снова.`
          : '❌ Ваши документы были отклонены. Пожалуйста, загрузите их снова.';
        await waClient.sendMessage(chatId, message);
      } catch (notifError) {
        console.warn('⚠️ Не удалось отправить уведомление через WhatsApp:', notifError.message);
      }
    }

    const updatedUser = userQueries.getById(id);
    res.json({ 
      success: true, 
      data: updatedUser,
      message: `Пользователь отклонен. Отклонено документов: ${pendingDocuments.length}`
    });
  } catch (error) {
    console.error('Ошибка при отклонении пользователя:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/users/:id/block - Заблокировать пользователя
 */
app.put('/api/users/:id/block', (req, res) => {
  try {
    const userId = req.params.id;
    const user = userQueries.getById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    
    userQueries.update(userId, { is_blocked: 1 });
    const updatedUser = userQueries.getById(userId);
    const userWithoutPassword = removePasswordFromUser(updatedUser);
    
    res.json({ 
      success: true, 
      data: userWithoutPassword,
      message: 'Пользователь заблокирован'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/users/:id/unblock - Разблокировать пользователя
 */
app.put('/api/users/:id/unblock', (req, res) => {
  try {
    const userId = req.params.id;
    const user = userQueries.getById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    
    userQueries.update(userId, { is_blocked: 0 });
    const updatedUser = userQueries.getById(userId);
    const userWithoutPassword = removePasswordFromUser(updatedUser);
    
    res.json({ 
      success: true, 
      data: userWithoutPassword,
      message: 'Пользователь разблокирован'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/users/:id - Обновить данные пользователя
 */
app.put('/api/users/:id', (req, res) => {
  try {
    const updateData = { ...req.body };
    const userId = req.params.id;
    
    console.log(`📥 PUT /api/users/${userId} - Получен запрос на обновление:`, {
      userId,
      updateData: { ...updateData, password: updateData.password ? '***скрыт***' : undefined }
    });
    
    // Получаем текущего пользователя
    const currentUser = userQueries.getById(userId);
    if (!currentUser) {
      console.error(`❌ Пользователь с ID ${userId} не найден`);
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    
    // Проверяем, обновляется ли email и требуется ли его подтверждение
    if (updateData.email && updateData.email !== currentUser.email) {
      const emailLower = updateData.email.toLowerCase();
      
      // Проверяем, не занят ли email другим пользователем
      const existingUser = userQueries.getByEmail(emailLower);
      if (existingUser && existingUser.id !== parseInt(userId)) {
        return res.status(409).json({ 
          success: false, 
          error: 'Пользователь с таким email уже существует' 
        });
      }
      
      // Если пользователь зарегистрирован через WhatsApp (есть phone_number, но email был null или is_verified = 0)
      // и email изменился, требуем подтверждение
      const isWhatsAppUser = currentUser.phone_number && 
                            (!currentUser.email || currentUser.is_verified === 0);
      
      if (isWhatsAppUser) {
        // Если email изменился и пользователь WhatsApp, требуем подтверждение
        // Возвращаем специальный ответ, указывающий на необходимость подтверждения
        return res.status(200).json({ 
          success: false, 
          requiresVerification: true,
          message: 'Для подтверждения email необходим код подтверждения. Пожалуйста, используйте /api/users/:id/verify-email',
          error: 'Требуется подтверждение email' 
        });
      } else if (currentUser.is_verified === 0 && emailLower !== currentUser.email?.toLowerCase()) {
        // Если email изменился и ранее не был подтвержден, тоже требуем подтверждение
        return res.status(200).json({ 
          success: false, 
          requiresVerification: true,
          message: 'Для подтверждения email необходим код подтверждения. Пожалуйста, используйте /api/users/:id/verify-email',
          error: 'Требуется подтверждение email' 
        });
      }
      
      // Если email уже подтвержден и просто обновляется, не меняем статус верификации документов.
      // is_verified используется только для статуса KYC (одобрение документов администратором).
    }
    
    // Если пароль передан, валидируем и хешируем его перед сохранением
    if (updateData.password && updateData.password.trim() !== '') {
      // Валидация пароля
      const passwordValidation = validatePassword(updateData.password);
      if (!passwordValidation.valid) {
        return res.status(400).json({
          success: false,
          error: passwordValidation.message,
          passwordValidation: {
            missing: passwordValidation.missing,
            present: passwordValidation.present
          }
        });
      }
      
      // Хешируем пароль тем же способом, что и при регистрации
      updateData.password = crypto
        .createHash('sha256')
        .update(updateData.password)
        .digest('hex');
      console.log('🔐 Пароль обновлен (захеширован)');
    } else {
      // Если пароль пустой, не обновляем его (удаляем из данных)
      delete updateData.password;
    }
    
    // Нормализуем email в нижний регистр
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }
    
    console.log(`💾 Обновление пользователя ${userId} с данными:`, {
      fields: Object.keys(updateData),
      updateData: { ...updateData, password: updateData.password ? '***скрыт***' : undefined }
    });
    
    const result = userQueries.update(userId, updateData);
    
    if (result.changes === 0) {
      console.warn(`⚠️ Пользователь ${userId} не обновлен (changes = 0)`);
      return res.status(404).json({ success: false, error: 'Пользователь не найден или данные не изменились' });
    }
    
    console.log(`✅ Пользователь ${userId} успешно обновлен (changes: ${result.changes})`);
    
    const updatedUser = userQueries.getById(userId);
    
    // Не возвращаем пароль в ответе (даже захешированный)
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error(`❌ Ошибка при обновлении пользователя ${req.params.id}:`, error);
    console.error('   Тип ошибки:', error.name);
    console.error('   Сообщение:', error.message);
    console.error('   Stack:', error.stack);
    
    if (error.message && error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ 
        success: false, 
        error: 'Пользователь с таким email или номером телефона уже существует' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Внутренняя ошибка сервера при обновлении пользователя' 
    });
  }
});

/**
 * DELETE /api/users/:id - Удалить пользователя
 */
app.delete('/api/users/:id', (req, res) => {
  try {
    const result = userQueries.delete(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    res.json({ success: true, message: 'Пользователь успешно удален' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/users/:id/upload-photo - Загрузить фото пользователя
 */
app.post('/api/users/:id/upload-photo', upload.single('user_photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Файл не загружен' });
    }
    
    const filePath = `/uploads/${req.file.filename}`;
    const result = userQueries.update(req.params.id, { user_photo: filePath });
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    
    res.json({ success: true, data: { user_photo: filePath } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/users/:id/upload-passport - Загрузить фото паспорта
 */
app.post('/api/users/:id/upload-passport', upload.single('passport_photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Файл не загружен' });
    }
    
    const filePath = `/uploads/${req.file.filename}`;
    const result = userQueries.update(req.params.id, { passport_photo: filePath });
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    
    res.json({ success: true, data: { passport_photo: filePath } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== РОУТЫ ДЛЯ РАСПОЗНАВАНИЯ ПАСПОРТА ==========

const AI_API_URL = "https://api.intelligence.io.solutions/api/v1/chat/completions";
const AI_MODEL = "deepseek-ai/DeepSeek-V3.2";
const AI_API_KEY = "io-v2-eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJvd25lciI6ImE5YzAwNjc4LTFjNzEtNDY5Ny1hY2NiLTliYTU0NTdhMWU4NSIsImV4cCI6NDkyMTI0NDg2NX0.E92VNc-ri_VH1bRLZfJ4seHnvr_hdL0vzgBbRC97WYDaENrvqU-jV1gYxqG128Tvyf8yfEczZ9hfpdKeZ2E0UA";

/**
 * POST /api/passport/extract - Извлечь данные из распознанного текста паспорта с помощью AI
 * Принимает распознанный текст (OCR сделан на клиенте) и извлекает структурированные данные
 */
app.post('/api/passport/extract', async (req, res) => {
  try {
    const { recognizedText } = req.body;

    if (!recognizedText || !recognizedText.trim()) {
      return res.status(400).json({ success: false, error: 'Распознанный текст не предоставлен' });
    }

    console.log('🤖 Извлечение данных из текста паспорта...');

    const systemPrompt = `Ты специалист по извлечению данных из документов. Твоя задача - проанализировать распознанный текст с фото паспорта и извлечь структурированные данные.

**ТВОЯ РОЛЬ:**
- Анализируй предоставленный текст, распознанный с фото паспорта
- Извлекай максимально много информации для заполнения полей формы пользователя
- Будь точным и аккуратным при извлечении данных

**ПОЛЯ ДЛЯ ИЗВЛЕЧЕНИЯ:**
1. firstName (Имя) - имя владельца паспорта
2. lastName (Фамилия) - фамилия владельца паспорта
3. middleName (Отчество) - отчество, если есть
4. passportSeries (Серия паспорта) - первые 2 цифры серии паспорта
5. passportNumber (Номер паспорта) - номер паспорта (обычно 7 цифр)
6. identificationNumber (Идентификационный номер) - персональный идентификационный номер
7. address (Адрес) - адрес регистрации/проживания
8. email (Email) - если есть в документе

**ВАЖНО:**
- Извлекай только данные, которые точно присутствуют в тексте
- Если поле не найдено, оставляй его пустым (null)
- Для passportSeries извлекай только первые 2 цифры
- Для passportNumber извлекай только цифры (без серии)
- Нормализуй имена и фамилии (первая буква заглавная, остальные строчные)
- Если текст не содержит данных паспорта, верни объект с null значениями

**ФОРМАТ ОТВЕТА:**
Отвечай ТОЛЬКО в формате JSON (без дополнительного текста):
{
  "firstName": "Имя или null",
  "lastName": "Фамилия или null",
  "middleName": "Отчество или null",
  "passportSeries": "XX или null",
  "passportNumber": "XXXXXXX или null",
  "identificationNumber": "XXXXXXXXXXXXX или null",
  "address": "Адрес или null",
  "email": "email@example.com или null"
}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { 
        role: "user", 
        content: `Распознанный текст с фото паспорта:\n\n${recognizedText}\n\nИзвлеки данные в формате JSON.`
      }
    ];

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${AI_API_KEY}`
    };

    const payload = {
      "model": AI_MODEL,
      "messages": messages,
      "temperature": 0.1 // Низкая температура для более точного извлечения
    };

    const aiResponse = await fetch(AI_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`AI API Error ${aiResponse.status}: ${errorText}`);
      throw new Error(`AI API Error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();

    if (aiData.choices && aiData.choices.length > 0) {
      let messageContent = aiData.choices[0].message?.content || "";

      // Удаляем возможные служебные метки
      while (messageContent.includes("</think>")) {
        messageContent = messageContent.split("</think>").pop().trim();
      }
      messageContent = messageContent.replace(/<\/?redacted_reasoning>/g, "").trim();
      messageContent = messageContent.replace(/<\/?think>/g, "").trim();

      // Пытаемся распарсить JSON из ответа
      try {
        let jsonText = messageContent;
        jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Валидация и нормализация данных
          const extractedData = {
            firstName: parsed.firstName && parsed.firstName !== 'null' ? parsed.firstName.trim() : null,
            lastName: parsed.lastName && parsed.lastName !== 'null' ? parsed.lastName.trim() : null,
            middleName: parsed.middleName && parsed.middleName !== 'null' ? parsed.middleName.trim() : null,
            passportSeries: parsed.passportSeries && parsed.passportSeries !== 'null' ? parsed.passportSeries.trim() : null,
            passportNumber: parsed.passportNumber && parsed.passportNumber !== 'null' ? parsed.passportNumber.trim() : null,
            identificationNumber: parsed.identificationNumber && parsed.identificationNumber !== 'null' ? parsed.identificationNumber.trim() : null,
            address: parsed.address && parsed.address !== 'null' ? parsed.address.trim() : null,
            email: parsed.email && parsed.email !== 'null' ? parsed.email.trim() : null
          };

          console.log('✅ Данные успешно извлечены:', extractedData);
          
          res.json({
            success: true,
            data: extractedData
          });
        } else {
          throw new Error("AI не вернул валидный JSON");
        }
      } catch (parseError) {
        console.error("Ошибка парсинга JSON от AI:", parseError);
        throw new Error("Не удалось распарсить ответ от AI");
      }
    } else {
      throw new Error("Неожиданный формат ответа от AI");
    }
  } catch (error) {
    console.error('❌ Ошибка при извлечении данных из паспорта:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== РОУТЫ ДЛЯ ДОКУМЕНТОВ ==========

/**
 * GET /api/documents - Получить все документы
 */
app.get('/api/documents', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const documents = documentQueries.getAll(limit, offset);
    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/documents/unreviewed - Получить непросмотренные документы
 */
app.get('/api/documents/unreviewed', (req, res) => {
  try {
    const documents = documentQueries.getUnreviewed();
    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/documents/user/:userId - Получить документы пользователя
 */
app.get('/api/documents/user/:userId', (req, res) => {
  try {
    const documents = documentQueries.getByUserId(req.params.userId);
    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Проверяет готовность пользователя к модерации
 * Пользователь готов, если:
 * 1. Загружены документы на верификацию
 * 2. Заполнены все обязательные поля: имя, фамилия, email/телефон, страна, адрес, паспортные данные
 */
function checkUserReadinessForModeration(user) {
  // Проверяем наличие документов
  const hasDocuments = user.documents && user.documents.length > 0;
  
  // Проверяем обязательные поля (базовые для всех)
  const hasFirstName = user.first_name && user.first_name.trim() !== '';
  const hasLastName = user.last_name && user.last_name.trim() !== '';
  const hasEmailOrPhone = (user.email && user.email.trim() !== '') || 
                         (user.phone_number && user.phone_number.trim() !== '');
  
  // Базовые поля обязательны для всех ролей
  const basicFieldsFilled = hasFirstName && hasLastName && hasEmailOrPhone;
  
  // Определяем роль пользователя (по умолчанию 'buyer')
  const userRole = user.role || 'buyer';
  
  // Для покупателей (buyer) требуются дополнительные поля: паспортные данные, адрес, страна
  // Для продавцов (seller) достаточно базовых полей + документы
  let allFieldsFilled = basicFieldsFilled;
  let missingFields = {
    firstName: !hasFirstName,
    lastName: !hasLastName,
    emailOrPhone: !hasEmailOrPhone,
    country: false,
    address: false,
    passportSeries: false,
    passportNumber: false,
    identificationNumber: false
  };
  
  if (userRole === 'buyer') {
    // Для покупателей требуем все поля
    const hasCountry = user.country && user.country.trim() !== '';
    const hasAddress = user.address && user.address.trim() !== '';
    const hasPassportSeries = user.passport_series && user.passport_series.trim() !== '';
    const hasPassportNumber = user.passport_number && user.passport_number.trim() !== '';
    const hasIdentificationNumber = user.identification_number && user.identification_number.trim() !== '';
    
    allFieldsFilled = basicFieldsFilled && hasCountry && hasAddress && 
                     hasPassportSeries && hasPassportNumber && hasIdentificationNumber;
    
    missingFields.country = !hasCountry;
    missingFields.address = !hasAddress;
    missingFields.passportSeries = !hasPassportSeries;
    missingFields.passportNumber = !hasPassportNumber;
    missingFields.identificationNumber = !hasIdentificationNumber;
  } else if (userRole === 'seller') {
    // Для продавцов достаточно базовых полей + документы
    // Дополнительные поля (паспорт, адрес) желательны, но не обязательны для отправки на модерацию
    allFieldsFilled = basicFieldsFilled;
  }
  
  const isReady = hasDocuments && allFieldsFilled;
  
  // Логирование для отладки
  if (!isReady) {
    console.log(`⚠️ Пользователь ${user.id} (${userRole}) не готов к модерации:`, {
      hasDocuments,
      allFieldsFilled,
      missingFields
    });
  }
  
  // Возвращаем детальную информацию о готовности
  return {
    isReady,
    hasDocuments,
    missingFields,
    allFieldsFilled,
    role: userRole
  };
}

/**
 * GET /api/documents/pending - Получить документы на верификацию
 * ВАЖНО: Этот маршрут должен быть ПЕРЕД /api/documents/:id, иначе "pending" будет интерпретирован как ID
 * Возвращает только пользователей, которые полностью заполнили все поля
 */
app.get('/api/documents/pending', (req, res) => {
  try {
    console.log('📥 Запрос на получение документов на верификацию');
    
    // Получаем все документы на верификацию
    const documents = documentQueries.getPendingVerification();
    
    console.log('📄 Найдено документов:', documents.length);
    
    // Группируем документы по пользователям и проверяем готовность
    const readyUsers = [];
    const userMap = {};
    
    documents.forEach(doc => {
      const userId = doc.user_id;
      
      if (!userMap[userId]) {
        // Создаем объект пользователя с данными из документа
        userMap[userId] = {
          id: userId,
          user_id: userId,
          first_name: doc.first_name,
          last_name: doc.last_name,
          email: doc.email,
          phone_number: doc.phone_number,
          role: doc.role,
          country: null, // Нужно будет загрузить отдельно
          address: null,
          passport_series: null,
          passport_number: null,
          identification_number: null,
          documents: []
        };
      }
      
      userMap[userId].documents.push({
        id: doc.id,
        document_type: doc.document_type,
        document_photo: doc.document_photo,
        verification_status: doc.verification_status,
        created_at: doc.created_at
      });
    });
    
    // Загружаем полные данные пользователей из БД для проверки готовности
    const usersArray = Object.values(userMap);
    const readyDocuments = [];
    
    usersArray.forEach(user => {
      try {
        // Загружаем полные данные пользователя
        const fullUser = userQueries.getById(user.id);
        
        if (fullUser) {
          // Обновляем данные пользователя
          user.country = fullUser.country;
          user.address = fullUser.address;
          user.passport_series = fullUser.passport_series;
          user.passport_number = fullUser.passport_number;
          user.identification_number = fullUser.identification_number;
          
          // Убеждаемся, что роль правильно установлена из полных данных пользователя
          if (fullUser.role) {
            user.role = fullUser.role;
          }
          
          console.log(`🔍 Проверка готовности пользователя ${user.id} (роль: ${user.role}):`, {
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            phone: user.phone_number,
            hasDocuments: user.documents.length,
            role: user.role
          });
          
          // Проверяем готовность
          const readiness = checkUserReadinessForModeration(user);
          
          // ИЗМЕНЕНИЕ:
          //  - Документы должны попадать в модерацию, как только они отправлены,
          //    даже если профиль заполнен не полностью.
          //  - Поле is_verified используется только после одобрения документов админом.
          // Поэтому здесь проверяем прежде всего наличие документов.
          if (readiness.hasDocuments) {
            // Пользователь имеет документы - добавляем их на модерацию
            user.documents.forEach(doc => {
              readyDocuments.push({
                ...doc,
                user_id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone_number: user.phone_number,
                role: user.role || fullUser.role || 'buyer', // Используем роль из полных данных
                user_db_id: user.id
              });
            });
            
            if (readiness.isReady) {
              console.log(`✅ Пользователь ${user.id} (${user.role || 'buyer'}) готов к модерации (профиль заполнен)`);
            } else {
              console.log(`⚠️ Пользователь ${user.id} (${user.role || 'buyer'}) добавлен на модерацию, но профиль заполнен не полностью. Пропущенные поля:`, readiness.missingFields);
            }
          } else {
            console.log(`⚠️ Пользователь ${user.id} (${user.role || 'buyer'}) не добавлен на модерацию — нет документов`);
          }
        }
      } catch (error) {
        console.error(`❌ Ошибка при проверке пользователя ${user.id}:`, error.message);
      }
    });
    
    console.log('✅ Отправляем готовых к модерации:', readyDocuments.length);
    
    res.json({ success: true, data: readyDocuments });
  } catch (error) {
    console.error('❌ Ошибка при получении документов на верификацию:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/documents/:id - Получить документ по ID
 */
app.get('/api/documents/:id', (req, res) => {
  try {
    const document = documentQueries.getById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Документ не найден' });
    }
    res.json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/documents - Создать новый документ
 */
app.post('/api/documents', upload.single('document_photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Файл документа не загружен' });
    }
    
    if (!req.body.user_id) {
      return res.status(400).json({ success: false, error: 'Необходимо указать user_id' });
    }
    
    const filePath = `/uploads/${req.file.filename}`;
    const documentData = {
      user_id: req.body.user_id,
      document_type: req.body.document_type || null,
      document_photo: filePath,
      is_reviewed: false,
      verification_status: 'pending' // Явно указываем статус 'pending' для верификации
    };
    
    console.log('📄 Создание документа:', documentData);
    
    const result = documentQueries.create(documentData);
    const newDocument = documentQueries.getById(result.lastInsertRowid);
    
    console.log('✅ Документ создан:', {
      id: newDocument.id,
      user_id: newDocument.user_id,
      document_type: newDocument.document_type,
      verification_status: newDocument.verification_status,
      is_reviewed: newDocument.is_reviewed
    });
    
    // Проверяем, что документ действительно имеет статус 'pending'
    if (newDocument.verification_status !== 'pending') {
      console.warn('⚠️ ВНИМАНИЕ: Документ создан со статусом', newDocument.verification_status, 'вместо pending!');
    }
    
    res.status(201).json({ success: true, data: newDocument });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/documents/:id/review - Отметить документ как просмотренный
 */
app.put('/api/documents/:id/review', (req, res) => {
  try {
    if (!req.body.reviewed_by) {
      return res.status(400).json({ success: false, error: 'Необходимо указать reviewed_by (ID админа/менеджера)' });
    }
    
    const result = documentQueries.markAsReviewed(req.params.id, req.body.reviewed_by);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Документ не найден' });
    }
    
    const updatedDocument = documentQueries.getById(req.params.id);
    res.json({ success: true, data: updatedDocument });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/documents/:id/approve - Одобрить документ (верификация успешна)
 */
app.put('/api/documents/:id/approve', async (req, res) => {
  try {
    if (!req.body.reviewed_by) {
      return res.status(400).json({ success: false, error: 'Необходимо указать reviewed_by (ID админа/менеджера)' });
    }
    
    const document = documentQueries.getById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Документ не найден' });
    }
    
    // Одобряем документ
    const result = documentQueries.approveDocument(req.params.id, req.body.reviewed_by);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Документ не найден' });
    }
    
    // Получаем пользователя
    const user = userQueries.getById(document.user_id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    
    // Проверяем, все ли документы пользователя одобрены
    const userDocuments = documentQueries.getByUserId(document.user_id);
    const allApproved = userDocuments.every(doc => 
      doc.verification_status === 'approved' || doc.id === parseInt(req.params.id)
    );
    
    // Если все документы одобрены, обновляем статус пользователя
    if (allApproved) {
      userQueries.update(document.user_id, { is_verified: 1 });
    }
    
    // Отправляем уведомление пользователю
    try {
      if (user.phone_number && waClientReady) {
        const digits = String(user.phone_number).replace(/\D/g, '');
        const chatId = `${digits}@c.us`;
        const message = `✅ Поздравляем с успешной верификацией!\n\nВаши документы были проверены и одобрены. Давайте познакомим вас с сервисом.`;
        
        await waClient.sendMessage(chatId, message);
      }
    } catch (notifError) {
      console.warn('⚠️ Не удалось отправить уведомление через WhatsApp:', notifError.message);
    }
    
    const updatedDocument = documentQueries.getById(req.params.id);
    res.json({ success: true, data: updatedDocument, message: 'Документ одобрен' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/documents/:id/reject - Отклонить документ
 */
app.put('/api/documents/:id/reject', async (req, res) => {
  try {
    if (!req.body.reviewed_by) {
      return res.status(400).json({ success: false, error: 'Необходимо указать reviewed_by (ID админа/менеджера)' });
    }
    
    const document = documentQueries.getById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Документ не найден' });
    }
    
    // Отклоняем документ
    const rejectionReason = req.body.rejection_reason || null;
    const result = documentQueries.rejectDocument(req.params.id, req.body.reviewed_by, rejectionReason);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Документ не найден' });
    }
    
    // Получаем пользователя
    const user = userQueries.getById(document.user_id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    
    // Отправляем уведомление пользователю
    try {
      if (user.phone_number && waClientReady) {
        const digits = String(user.phone_number).replace(/\D/g, '');
        const chatId = `${digits}@c.us`;
        const message = `❌ Ваши документы были отклонены.\n\nПожалуйста, загрузите документы заново, убедившись, что они четкие и соответствуют требованиям.`;
        
        await waClient.sendMessage(chatId, message);
      }
    } catch (notifError) {
      console.warn('⚠️ Не удалось отправить уведомление через WhatsApp:', notifError.message);
    }
    
    const updatedDocument = documentQueries.getById(req.params.id);
    res.json({ success: true, data: updatedDocument, message: 'Документ отклонен' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/documents/:id - Удалить документ
 */
app.delete('/api/documents/:id', (req, res) => {
  try {
    const document = documentQueries.getById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Документ не найден' });
    }
    
    // Удаляем файл с диска
    if (document.document_photo) {
      const filePath = join(__dirname, document.document_photo);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    const result = documentQueries.delete(req.params.id);
    res.json({ success: true, message: 'Документ успешно удален' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== РОУТЫ ДЛЯ АВТОРИЗАЦИИ ==========

/**
 * POST /api/auth/whatsapp - Регистрация/Авторизация через WhatsApp
 * mode: 'login' | 'register'
 *  - login: только вход, без создания нового пользователя
 *  - register: создаем пользователя, если его еще нет
 */
app.post('/api/auth/whatsapp', async (req, res) => {
  try {
    const { phone, code, mode = 'register', role } = req.body;
    
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Необходимо указать номер телефона' });
    }
    
    // Проверяем, существует ли пользователь с таким номером
    let user = userQueries.getByPhone(phone);
    
    if (user) {
      // Проверяем, заблокирован ли пользователь
      if (user.is_blocked === 1) {
        return res.status(403).json({ 
          success: false, 
          error: 'Пользователь заблокирован',
          is_blocked: true
        });
      }
      
      // Пользователь существует - авторизуем и обновляем статус онлайн
      userQueries.update(user.id, { is_online: 1 });
      const updatedUser = userQueries.getById(user.id);
      return res.json({ 
        success: true, 
        user: {
          id: updatedUser.id,
          name: `${updatedUser.first_name} ${updatedUser.last_name}`.trim() || updatedUser.phone_number,
          phone: updatedUser.phone_number,
          phoneFormatted: req.body.phoneFormatted || updatedUser.phone_number,
          email: updatedUser.email,
          role: updatedUser.role,
          country: updatedUser.country,
          countryFlag: req.body.countryFlag || '',
          is_online: 1,
          is_blocked: updatedUser.is_blocked === 1
        }
      });
    }

    // Если пользователь не найден и это режим входа — не регистрируем, а возвращаем ошибку
    if (mode === 'login') {
      return res.status(404).json({
        success: false,
        error: 'Пользователь с таким номером не найден. Сначала зарегистрируйтесь через WhatsApp.'
      });
    }
    
    // Режим регистрации: создаем нового пользователя
    const country = phone.startsWith('375') ? 'Беларусь' : 
                   phone.startsWith('7') ? 'Россия' : 
                   phone.startsWith('380') ? 'Украина' : 'Неизвестно';
    
    // Разбиваем имя из номера (будет обновлено позже)
    const nameParts = (req.body.name || `Пользователь ${phone.substring(phone.length - 4)}`).split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const newUser = {
      first_name: firstName,
      last_name: lastName,
      email: null, // Email не требуется для WhatsApp
      phone_number: phone,
      country: country,
      role: role || 'buyer', // Используем переданную роль или 'buyer' по умолчанию
      is_verified: 0,
      is_online: 1
    };
    
    const result = userQueries.create(newUser);
    const createdUser = userQueries.getById(result.lastInsertRowid);
    
    return res.status(201).json({ 
      success: true, 
      user: {
        id: createdUser.id,
        name: `${createdUser.first_name} ${createdUser.last_name}`.trim(),
        phone: createdUser.phone_number,
        phoneFormatted: req.body.phoneFormatted || phone,
        email: createdUser.email,
        role: createdUser.role,
        country: createdUser.country,
        countryFlag: req.body.countryFlag || '',
        picture: null
      }
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ 
        success: false, 
        error: 'Пользователь с таким номером телефона уже существует' 
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/whatsapp/send-code - Отправка кода верификации через WhatsApp (whatsapp-web.js)
 */
app.post('/api/auth/whatsapp/send-code', async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо указать номер телефона и код'
      });
    }

    // Проверяем готовность клиента перед отправкой
    if (!waClientReady) {
      // Попытка проверить состояние клиента еще раз
      try {
        if (waClient && waClient.info && waClient.info.wid) {
          console.log('⚠️ waClientReady = false, но клиент авторизован. Устанавливаем готовность...');
          waClientReady = true;
        } else {
          console.warn('⚠️ Попытка отправить код через WhatsApp, но клиент не готов. Статус waClientReady:', waClientReady);
          return res.status(503).json({
            success: false,
            error: 'WhatsApp сервис временно недоступен. Пожалуйста, подождите несколько секунд и попробуйте снова. Если проблема сохраняется, убедитесь, что WhatsApp Web авторизован на сервере.',
            code: 'WHATSAPP_NOT_READY'
          });
        }
      } catch (checkError) {
        console.warn('⚠️ Попытка отправить код через WhatsApp, но клиент не готов. Статус waClientReady:', waClientReady);
        return res.status(503).json({
          success: false,
          error: 'WhatsApp сервис временно недоступен. Пожалуйста, подождите несколько секунд и попробуйте снова. Если проблема сохраняется, убедитесь, что WhatsApp Web авторизован на сервере.',
          code: 'WHATSAPP_NOT_READY'
        });
      }
    }

    const digits = String(phone).replace(/\D/g, '');
    if (!digits) {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат номера телефона'
      });
    }

    const chatId = `${digits}@c.us`;
    const message = `🔐 Ваш код авторизации: ${code}\n\nКод действителен в течение 10 минут.\n\nЕсли вы не запрашивали этот код, просто проигнорируйте это сообщение.`;

    let contactName = null;
    let profilePicUrl = null;

    try {
      const contact = await waClient.getContactById(chatId);
      if (contact) {
        contactName = contact.pushname || contact.name || contact.number || null;
        try {
          profilePicUrl = await contact.getProfilePicUrl();
        } catch {
          profilePicUrl = null;
        }
      }
    } catch {
      // Если контакт не найден, просто продолжаем отправку сообщения
    }

    // Применяем патч sendSeen перед отправкой (на случай, если он не был применен ранее)
    await applySendSeenPatch();
    
    // Отправляем сообщение с дополнительной диагностикой
    try {
      await waClient.sendMessage(chatId, message);
    } catch (sendError) {
      const errorMessage = sendError.message || '';
      const errorStack = sendError.stack || '';
      const isMarkedUnreadError = 
        errorMessage.includes('markedUnread') || 
        errorStack.includes('markedUnread') ||
        errorMessage.includes('Cannot read properties of undefined');
      
      if (isMarkedUnreadError) {
        // Это известная ошибка библиотеки. Пытаемся применить патч еще раз и повторить отправку
        console.warn('⚠️ Обнаружена ошибка markedUnread, применяем патч и повторяем отправку...');
        await applySendSeenPatch();
        
        try {
          // Повторная попытка отправки после применения патча
          await waClient.sendMessage(chatId, message);
          console.log('✅ Сообщение отправлено после применения патча');
        } catch (retryError) {
          // Если повторная попытка тоже не удалась, проверяем, было ли сообщение отправлено
          // Иногда сообщение отправляется, но ошибка возникает в sendSeen
          const retryErrorMessage = retryError.message || '';
          const retryErrorStack = retryError.stack || '';
          const isStillMarkedUnreadError = 
            retryErrorMessage.includes('markedUnread') || 
            retryErrorStack.includes('markedUnread');
          
          if (isStillMarkedUnreadError) {
            // В этом случае считаем, что сообщение могло быть отправлено, но sendSeen упал
            // Проверяем, можем ли мы получить информацию о чате (косвенный признак успешной отправки)
            try {
              const contact = await waClient.getContactById(chatId);
              if (contact) {
                console.warn('⚠️ Ошибка markedUnread, но контакт доступен. Предполагаем, что сообщение отправлено.');
                // Возвращаем успех, так как сообщение, вероятно, было отправлено
                return res.json({
                  success: true,
                  message: 'Код отправлен в WhatsApp',
                  contact: {
                    name: contactName,
                    picture: profilePicUrl
                  },
                  warning: 'Сообщение отправлено, но возникла техническая ошибка при отметке прочтения'
                });
              }
            } catch (contactError) {
              // Если не можем получить контакт, значит сообщение не было отправлено
            }
          }
          
          console.error('❌ Ошибка whatsapp-web.js (markedUnread) при отправке сообщения после повторной попытки.');
          throw retryError;
        }
      } else {
        // Если это другая ошибка - пробрасываем её дальше
        throw sendError;
      }
    }

    return res.json({
      success: true,
      message: 'Код отправлен в WhatsApp',
      contact: {
        name: contactName,
        picture: profilePicUrl
      }
    });
  } catch (error) {
    console.error('Ошибка отправки кода через WhatsApp:', error);
    return res.status(500).json({
      success: false,
      error: 'Не удалось отправить код через WhatsApp'
    });
  }
});

/**
 * POST /api/whatsapp/send-message - Отправка произвольного сообщения через WhatsApp
 */
app.post('/api/whatsapp/send-message', async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо указать номер телефона и сообщение'
      });
    }

    if (!message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Сообщение не может быть пустым'
      });
    }

    // Проверяем готовность клиента перед отправкой
    if (!waClientReady) {
      // Попытка проверить состояние клиента еще раз
      try {
        if (waClient && waClient.info && waClient.info.wid) {
          console.log('⚠️ waClientReady = false, но клиент авторизован. Устанавливаем готовность...');
          waClientReady = true;
        } else {
          console.warn('⚠️ Попытка отправить сообщение через WhatsApp, но клиент не готов. Статус waClientReady:', waClientReady);
          return res.status(503).json({
            success: false,
            error: 'WhatsApp сервис временно недоступен. Пожалуйста, подождите несколько секунд и попробуйте снова. Если проблема сохраняется, убедитесь, что WhatsApp Web авторизован на сервере.',
            code: 'WHATSAPP_NOT_READY'
          });
        }
      } catch (checkError) {
        console.warn('⚠️ Попытка отправить сообщение через WhatsApp, но клиент не готов. Статус waClientReady:', waClientReady);
        return res.status(503).json({
          success: false,
          error: 'WhatsApp сервис временно недоступен. Пожалуйста, подождите несколько секунд и попробуйте снова. Если проблема сохраняется, убедитесь, что WhatsApp Web авторизован на сервере.',
          code: 'WHATSAPP_NOT_READY'
        });
      }
    }

    const digits = String(phone).replace(/\D/g, '');
    if (!digits) {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат номера телефона'
      });
    }

    const chatId = `${digits}@c.us`;
    const messageText = message.trim();

    let contactName = null;
    let profilePicUrl = null;

    try {
      const contact = await waClient.getContactById(chatId);
      if (contact) {
        contactName = contact.pushname || contact.name || contact.number || null;
        try {
          profilePicUrl = await contact.getProfilePicUrl();
        } catch {
          profilePicUrl = null;
        }
      }
    } catch {
      // Если контакт не найден, просто продолжаем отправку сообщения
    }

    // Применяем патч sendSeen перед отправкой (на случай, если он не был применен ранее)
    await applySendSeenPatch();
    
    // Отправляем сообщение с дополнительной диагностикой
    try {
      await waClient.sendMessage(chatId, messageText);
    } catch (sendError) {
      const errorMessage = sendError.message || '';
      const errorStack = sendError.stack || '';
      const isMarkedUnreadError = 
        errorMessage.includes('markedUnread') || 
        errorStack.includes('markedUnread') ||
        errorMessage.includes('Cannot read properties of undefined');
      
      if (isMarkedUnreadError) {
        // Это известная ошибка библиотеки. Пытаемся применить патч еще раз и повторить отправку
        console.warn('⚠️ Обнаружена ошибка markedUnread, применяем патч и повторяем отправку...');
        await applySendSeenPatch();
        
        try {
          // Повторная попытка отправки после применения патча
          await waClient.sendMessage(chatId, messageText);
          console.log('✅ Сообщение отправлено после применения патча');
        } catch (retryError) {
          // Если повторная попытка тоже не удалась, проверяем, было ли сообщение отправлено
          // Иногда сообщение отправляется, но ошибка возникает в sendSeen
          const retryErrorMessage = retryError.message || '';
          const retryErrorStack = retryError.stack || '';
          const isStillMarkedUnreadError = 
            retryErrorMessage.includes('markedUnread') || 
            retryErrorStack.includes('markedUnread');
          
          if (isStillMarkedUnreadError) {
            // В этом случае считаем, что сообщение могло быть отправлено, но sendSeen упал
            // Проверяем, можем ли мы получить информацию о чате (косвенный признак успешной отправки)
            try {
              const contact = await waClient.getContactById(chatId);
              if (contact) {
                console.warn('⚠️ Ошибка markedUnread, но контакт доступен. Предполагаем, что сообщение отправлено.');
                // Возвращаем успех, так как сообщение, вероятно, было отправлено
                return res.json({
                  success: true,
                  message: 'Сообщение отправлено в WhatsApp',
                  contact: {
                    name: contactName,
                    picture: profilePicUrl
                  },
                  warning: 'Сообщение отправлено, но возникла техническая ошибка при отметке прочтения'
                });
              }
            } catch (contactError) {
              // Если не можем получить контакт, значит сообщение не было отправлено
            }
          }
          
          console.error('❌ Ошибка whatsapp-web.js (markedUnread) при отправке сообщения после повторной попытки.');
          throw retryError;
        }
      } else {
        // Если это другая ошибка - пробрасываем её дальше
        throw sendError;
      }
    }

    // Обновляем статистику в базе данных для WhatsApp пользователей
    try {
      const existingUser = whatsappUserQueries.getByPhone(chatId);
      whatsappUserQueries.createOrUpdate({
        phone_number: chatId,
        phone_number_clean: digits,
        country: existingUser?.country || null,
        language: existingUser?.language || 'ru'
      });
    } catch (dbError) {
      console.warn('⚠️ Ошибка обновления статистики в БД:', dbError.message);
    }

    return res.json({
      success: true,
      message: 'Сообщение отправлено в WhatsApp',
      contact: {
        name: contactName,
        picture: profilePicUrl
      }
    });
  } catch (error) {
    console.error('Ошибка отправки сообщения через WhatsApp:', error);
    return res.status(500).json({
      success: false,
      error: 'Не удалось отправить сообщение через WhatsApp'
    });
  }
});

/**
 * POST /api/auth/email/register - Регистрация через Email
 */
app.post('/api/auth/email/register', async (req, res) => {
  try {
    const { email, password, name, code } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Необходимо указать email, пароль и имя' 
      });
    }
    
    // Валидация пароля
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.message,
        passwordValidation: {
          missing: passwordValidation.missing,
          present: passwordValidation.present
        }
      });
    }
    
    const emailLower = email.toLowerCase();
    
    // Проверяем, существует ли пользователь с таким email
    const existingUser = userQueries.getByEmail(emailLower);
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        error: 'Пользователь с таким email уже существует' 
      });
    }
    
    // Разбиваем имя на имя и фамилию
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Хешируем пароль (используем SHA-256 для безопасности)
    // В production рекомендуется использовать bcrypt, но для простоты используем crypto
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');
    
    const newUser = {
      first_name: firstName,
      last_name: lastName,
      email: emailLower,
      password: hashedPassword, // Сохраняем хешированный пароль
      phone_number: null, // Телефон не требуется для email регистрации
      role: req.body.role || 'buyer', // Используем переданную роль или 'buyer' по умолчанию
      // ВАЖНО: is_verified отвечает за верификацию документов администратором,
      // а не за подтверждение email. Новый пользователь всегда стартует как не верифицированный.
      is_verified: 0,
      is_online: 1
    };
    
    const result = userQueries.create(newUser);
    const createdUser = userQueries.getById(result.lastInsertRowid);
    
    // Не возвращаем пароль в ответе (даже захешированный)
    const { password: userPassword, ...userWithoutPassword } = createdUser;
    
    res.status(201).json({ 
      success: true, 
      user: {
        id: createdUser.id,
        name: `${createdUser.first_name} ${createdUser.last_name}`.trim(),
        email: createdUser.email,
        role: createdUser.role,
        phone: createdUser.phone_number
      }
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ 
        success: false, 
        error: 'Пользователь с таким email уже существует' 
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/email/login - Вход через Email или Username
 */
app.post('/api/auth/email/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Необходимо указать email/username и пароль' 
      });
    }
    
    const identifier = email.toLowerCase().trim();
    
    console.log('🔐 Попытка входа:', { identifier });
    
    // Сначала пробуем найти пользователя по email
    let user = userQueries.getByEmail(identifier);
    
    // Если не нашли по email, можно добавить поиск по username в будущем
    // Пока ищем только по email
    
    if (!user) {
      console.log('❌ Пользователь не найден:', identifier);
      return res.status(401).json({ 
        success: false, 
        error: 'Неверный email или пароль' 
      });
    }
    
    console.log('✅ Пользователь найден:', { id: user.id, email: user.email, hasPassword: !!user.password });
    
    // Проверяем пароль
    // Если у пользователя нет пароля (WhatsApp регистрация или старые записи)
    if (!user.password) {
      console.log('⚠️ У пользователя нет пароля');
      // Для пользователей без пароля - требуем установить пароль в настройках
      return res.status(401).json({ 
        success: false, 
        error: 'Пароль не установлен. Установите пароль в настройках профиля (вкладка "Данные").' 
      });
    }
    
    // Хешируем введенный пароль тем же способом для сравнения
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');
    
    console.log('🔑 Проверка пароля:', { 
      storedHash: user.password.substring(0, 20) + '...', 
      inputHash: hashedPassword.substring(0, 20) + '...',
      match: user.password === hashedPassword
    });
    
    // Сравниваем хеши паролей
    if (user.password !== hashedPassword) {
      console.log('❌ Неверный пароль');
      return res.status(401).json({ 
        success: false, 
        error: 'Неверный email или пароль' 
      });
    }
    
    // Проверяем, заблокирован ли пользователь
    if (user.is_blocked === 1) {
      console.log('🚫 Пользователь заблокирован:', { id: user.id, email: user.email });
      return res.status(403).json({ 
        success: false, 
        error: 'Пользователь заблокирован',
        is_blocked: true
      });
    }
    
    // Пароль верный, обновляем статус онлайн
    userQueries.update(user.id, { is_online: 1 });
    
    console.log('✅ Вход успешен:', { id: user.id, email: user.email, role: user.role });
    
    // Не возвращаем пароль в ответе (для безопасности)
    const { password: userPassword, ...userWithoutPassword } = user;
    
    res.json({ 
      success: true, 
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`.trim() || user.email || 'Пользователь',
        email: user.email,
        role: user.role,
        phone: user.phone_number,
        is_verified: user.is_verified,
        is_blocked: user.is_blocked === 1
      }
    });
  } catch (error) {
    console.error('❌ Ошибка при входе:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/email/send-code - Отправка кода верификации на email
 */
app.post('/api/auth/email/send-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Необходимо указать email' 
      });
    }
    
    // В реальном приложении здесь должна быть отправка email
    // Код уже отправлен через EmailJS на фронтенде
    // Здесь можно сохранить код в БД для проверки
    
    res.json({ 
      success: true, 
      message: 'Код отправлен на email' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/users/:id/verify-email - Проверка кода подтверждения email при обновлении профиля
 */
app.post('/api/users/:id/verify-email', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Необходимо указать email и код подтверждения' 
      });
    }
    
    // Получаем пользователя
    const user = userQueries.getById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Пользователь не найден' 
      });
    }
    
    // Проверяем, что код верный (в реальном приложении здесь должна быть проверка через БД)
    // Пока используем простую проверку через фронтенд
    
    // Проверяем, не занят ли email другим пользователем
    const existingUser = userQueries.getByEmail(email.toLowerCase());
    if (existingUser && existingUser.id !== parseInt(id)) {
      return res.status(409).json({ 
        success: false, 
        error: 'Пользователь с таким email уже существует' 
      });
    }
    
    // Обновляем email. Статус is_verified (верификация документов) не трогаем.
    const result = userQueries.update(id, { 
      email: email.toLowerCase()
    });
    
    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Пользователь не найден' 
      });
    }
    
    const updatedUser = userQueries.getById(id);
    const userWithoutPassword = removePasswordFromUser(updatedUser);
    
    res.json({ 
      success: true, 
      message: 'Email успешно подтвержден',
      data: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/google - Авторизация через Google
 */
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential, access_token, userInfo } = req.body;
    
    let googleEmail = '';
    let googleName = '';
    let googlePicture = '';
    
    // Если передан credential (JWT токен), декодируем его
    if (credential) {
      try {
        const base64Payload = credential.split('.')[1];
        const payload = JSON.parse(atob(base64Payload));
        googleEmail = payload.email || '';
        googleName = payload.name || '';
        googlePicture = payload.picture || '';
      } catch (e) {
        console.error('Ошибка декодирования JWT:', e);
      }
    }
    
    // Если передан access_token и userInfo
    if (access_token && userInfo) {
      googleEmail = userInfo.email || '';
      googleName = userInfo.name || '';
      googlePicture = userInfo.picture || '';
    }
    
    if (!googleEmail) {
      return res.status(400).json({ 
        success: false, 
        error: 'Не удалось получить данные от Google' 
      });
    }
    
    const emailLower = googleEmail.toLowerCase();
    
    // Проверяем, существует ли пользователь
    let user = userQueries.getByEmail(emailLower);
    
    if (user) {
      // Проверяем, заблокирован ли пользователь
      if (user.is_blocked === 1) {
        return res.status(403).json({ 
          success: false, 
          error: 'Пользователь заблокирован',
          is_blocked: true
        });
      }
      
      // Пользователь существует - обновляем и авторизуем
      userQueries.update(user.id, { 
        is_online: 1,
        user_photo: googlePicture || user.user_photo
      });
      const updatedUser = userQueries.getById(user.id);
      
      res.json({ 
        success: true, 
        user: {
          id: updatedUser.id,
          name: `${updatedUser.first_name} ${updatedUser.last_name}`.trim() || googleName,
          email: updatedUser.email,
          picture: googlePicture,
          role: updatedUser.role,
          is_blocked: updatedUser.is_blocked === 1
        }
      });
    } else {
      // Пользователь не существует - создаем нового
      const nameParts = googleName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const newUser = {
        first_name: firstName,
        last_name: lastName,
        email: emailLower,
        phone_number: null,
        user_photo: googlePicture,
        role: 'buyer',
        // Статус верификации документов всегда начинается с 0.
        // Одобрение документов админом устанавливает is_verified = 1.
        is_verified: 0,
        is_online: 1
      };
      
      const result = userQueries.create(newUser);
      const createdUser = userQueries.getById(result.lastInsertRowid);
      
      res.status(201).json({ 
        success: true, 
        user: {
          id: createdUser.id,
          name: googleName,
          email: createdUser.email,
          picture: googlePicture,
          role: createdUser.role
        }
      });
    }
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ 
        success: false, 
        error: 'Пользователь с таким email уже существует' 
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/auth/whatsapp/user-info - Получение информации о пользователе WhatsApp по номеру
 */
app.get('/api/auth/whatsapp/user-info', async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо указать номер телефона'
      });
    }

    if (!waClientReady) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp клиент еще не готов'
      });
    }

    const digits = String(phone).replace(/\D/g, '');
    if (!digits) {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат номера телефона'
      });
    }

    const chatId = `${digits}@c.us`;

    const contact = await waClient.getContactById(chatId);

    let profilePicUrl = null;
    try {
      profilePicUrl = await contact.getProfilePicUrl();
    } catch {
      profilePicUrl = null;
    }

    const name = contact.pushname ||
      contact.name ||
      contact.shortName ||
      contact.number ||
      null;

    return res.json({
      success: true,
      data: {
        name,
        picture: profilePicUrl
      }
    });
  } catch (error) {
    console.error('Ошибка получения информации о пользователе WhatsApp:', error);
    return res.status(500).json({
      success: false,
      error: 'Не удалось получить информацию о пользователе WhatsApp'
    });
  }
});

// ========== РОУТЫ ДЛЯ WHATSAPP ПОЛЬЗОВАТЕЛЕЙ ==========

/**
 * POST /api/whatsapp/users - Создать или обновить WhatsApp пользователя
 */
app.post('/api/whatsapp/users', (req, res) => {
  try {
    const { phone_number, phone_number_clean, first_name, last_name, country, language } = req.body;

    if (!phone_number) {
      return res.status(400).json({
        success: false,
        error: 'Номер телефона обязателен'
      });
    }

    // Логируем сохранение языка для отладки
    console.log(`💾 Сохранение WhatsApp пользователя: ${phone_number} | Язык: ${language || 'ru'}`);

    const result = whatsappUserQueries.createOrUpdate({
      phone_number,
      phone_number_clean,
      first_name,
      last_name,
      country,
      language: language || 'ru'
    });
    
    console.log(`✅ WhatsApp пользователь сохранен в БД: ${phone_number} | Язык: ${language || 'ru'}`);

    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid || null,
        message: 'Пользователь сохранен'
      }
    });
  } catch (error) {
    console.error('Ошибка сохранения WhatsApp пользователя:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// URL бота для рассылки
const BOT_URL = process.env.BOT_URL || 'http://localhost:3001';

/**
 * GET /api/whatsapp/status - Проверка статуса WhatsApp клиента
 */
app.get('/api/whatsapp/status', async (req, res) => {
  try {
    // Сначала проверяем локальное состояние клиента
    let localReady = waClientReady;
    let clientInfo = null;
    
    try {
      if (waClient && waClient.info) {
        clientInfo = {
          wid: waClient.info.wid ? waClient.info.wid.user : null,
          platform: waClient.info.platform || null,
          pushname: waClient.info.pushname || null
        };
        
        // Если клиент имеет информацию, но waClientReady = false, обновляем статус
        if (clientInfo.wid && !localReady) {
          console.log('⚠️ Обнаружено несоответствие: клиент авторизован, но waClientReady = false. Исправляем...');
          waClientReady = true;
          localReady = true;
        }
      }
    } catch (infoError) {
      console.warn('⚠️ Ошибка при получении информации о клиенте:', infoError.message);
    }
    
    // Если локальный клиент готов, возвращаем его статус
    if (localReady) {
      return res.json({
        success: true,
        ready: true,
        state: 'READY',
        message: 'WhatsApp клиент готов к работе',
        info: clientInfo
      });
    }
    
    // Если локальный клиент не готов, проверяем через бот (если доступен)
    try {
      const botResponse = await axios.get(`${BOT_URL}/api/status`, {
        timeout: 5000
      }).catch(() => null);

      if (botResponse && botResponse.data) {
        const botData = botResponse.data;
        return res.json({
          success: true,
          ready: botData.ready,
          state: botData.ready ? 'READY' : 'NOT_READY',
          message: botData.message || (botData.ready ? 'WhatsApp клиент готов к работе' : 'WhatsApp клиент не готов'),
          source: 'bot'
        });
      }
    } catch (botError) {
      // Игнорируем ошибки бота
    }
    
    // Если ни локальный клиент, ни бот не готовы
    return res.json({
      success: false,
      ready: false,
      state: 'NOT_READY',
      message: 'WhatsApp клиент не готов. Убедитесь, что WhatsApp Web авторизован на сервере.',
      info: clientInfo
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      ready: false,
      state: 'ERROR',
      error: error.message
    });
  }
});

/**
 * GET /api/whatsapp/qr - Получить QR-код WhatsApp для отображения в футере
 */
app.get('/api/whatsapp/qr', async (req, res) => {
  try {
    if (!currentQRCode) {
      return res.status(404).json({
        success: false,
        error: 'QR-код недоступен. WhatsApp клиент уже авторизован или QR-код еще не сгенерирован.'
      });
    }

    // Пытаемся использовать библиотеку qrcode для генерации изображения
    try {
      const QRCode = await import('qrcode');
      const qrImageBuffer = await QRCode.toBuffer(currentQRCode, {
        type: 'png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.send(qrImageBuffer);
    } catch (importError) {
      // Если библиотека qrcode не установлена, возвращаем SVG
      // Генерируем простой SVG QR-код
      const qrDataUrl = `data:image/svg+xml;base64,${Buffer.from(`
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
          <rect width="300" height="300" fill="white"/>
          <text x="150" y="150" text-anchor="middle" font-size="14" fill="black">
            QR-код WhatsApp
          </text>
          <text x="150" y="170" text-anchor="middle" font-size="12" fill="gray">
            Установите пакет qrcode
          </text>
        </svg>
      `).toString('base64')}`;
      
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(Buffer.from(`
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
          <rect width="300" height="300" fill="white"/>
          <text x="150" y="150" text-anchor="middle" font-size="14" fill="black">
            QR-код WhatsApp
          </text>
          <text x="150" y="170" text-anchor="middle" font-size="12" fill="gray">
            Установите пакет qrcode
          </text>
        </svg>
      `));
    }
  } catch (error) {
    console.error('Ошибка генерации QR-кода:', error);
    return res.status(500).json({
      success: false,
      error: 'Не удалось сгенерировать QR-код'
    });
  }
});

/**
 * POST /api/whatsapp/broadcast - Рассылка сообщений выбранным пользователям
 */
app.post('/api/whatsapp/broadcast', async (req, res) => {
  try {
    const { message, phoneNumbers } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Сообщение не может быть пустым'
      });
    }

    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Необходимо выбрать хотя бы одного получателя'
      });
    }

    // Перенаправляем запрос на бот
    try {
      const botResponse = await axios.post(`${BOT_URL}/api/broadcast`, {
        message: message.trim(),
        phoneNumbers: phoneNumbers
      }, {
        timeout: 300000, // 5 минут таймаут для больших рассылок
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const botData = botResponse.data;

      // Обновляем статистику отправки в базе данных (НЕ перезаписываем язык!)
      try {
        for (const phoneNumber of phoneNumbers) {
          let chatId = phoneNumber;
          if (!chatId.includes('@')) {
            const digits = String(phoneNumber).replace(/\D/g, '');
            if (digits) {
              chatId = `${digits}@c.us`;
              // Получаем существующего пользователя, чтобы сохранить его язык
              const existingUser = whatsappUserQueries.getByPhone(chatId);
              whatsappUserQueries.createOrUpdate({
                phone_number: chatId,
                phone_number_clean: digits,
                country: existingUser?.country || null,
                language: existingUser?.language || 'ru' // Используем существующий язык или 'ru' по умолчанию
              });
            }
          } else {
            // Если chatId уже в правильном формате, просто обновляем статистику без изменения языка
            const existingUser = whatsappUserQueries.getByPhone(chatId);
            if (existingUser) {
              // Обновляем только last_message_at и message_count, не трогая язык
              whatsappUserQueries.createOrUpdate({
                phone_number: chatId,
                phone_number_clean: existingUser.phone_number_clean || null,
                first_name: existingUser.first_name || null,
                last_name: existingUser.last_name || null,
                country: existingUser.country || null,
                language: existingUser.language || 'ru' // Сохраняем существующий язык
              });
            }
          }
        }
      } catch (dbError) {
        console.warn('⚠️ Ошибка обновления статистики в БД:', dbError.message);
      }

      return res.json(botData);
    } catch (fetchError) {
      console.error('Ошибка обращения к боту:', fetchError.message);
      const errorMessage = fetchError.response?.data?.error || fetchError.message || 'Бот недоступен';
      return res.status(fetchError.response?.status || 503).json({
        success: false,
        error: errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout')
          ? 'Бот недоступен. Убедитесь, что бот запущен на порту 3001.'
          : errorMessage
      });
    }
  } catch (error) {
    console.error('Ошибка рассылки сообщений:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Не удалось выполнить рассылку'
    });
  }
});

/**
 * GET /api/whatsapp/users - Получить всех WhatsApp пользователей
 */
app.get('/api/whatsapp/users', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || '';
    const roleFilter = req.query.role || 'all';
    const statusFilter = req.query.status || 'all';

    let users;
    
    // Если есть поисковый запрос
    if (search) {
      users = whatsappUserQueries.search(search, limit, offset);
    } else {
      users = whatsappUserQueries.getAll(limit, offset);
    }

    // Фильтрация по статусу (активные/неактивные)
    let filteredUsers = users;
    if (statusFilter === 'active') {
      filteredUsers = users.filter(u => u.is_active === 1);
    } else if (statusFilter === 'blocked') {
      filteredUsers = users.filter(u => u.is_active === 0);
    }

    // Форматируем данные для фронтенда
    const formattedUsers = filteredUsers.map(user => ({
      id: user.id,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      email: '', // WhatsApp пользователи не имеют email
      phone: user.phone_number_clean || user.phone_number || '',
      phoneFull: user.phone_number || '',
      role: 'buyer', // По умолчанию покупатель
      status: user.is_active === 1 ? 'active' : 'blocked',
      verified: false, // WhatsApp пользователи не верифицированы через документы
      country: user.country || '',
      language: user.language || 'ru',
      lastMessageAt: user.last_message_at || null,
      messageCount: user.message_count || 0,
      createdAt: user.created_at || null
    }));

    const totalCount = whatsappUserQueries.getCount();

    res.json({
      success: true,
      data: formattedUsers,
      total: totalCount,
      limit,
      offset
    });
  } catch (error) {
    console.error('Ошибка получения WhatsApp пользователей:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========== РОУТЫ ДЛЯ УВЕДОМЛЕНИЙ ==========

/**
 * GET /api/notifications/user/:userId - Получить все уведомления пользователя
 */
app.get('/api/notifications/user/:userId', (req, res) => {
  try {
    console.log('📥 Запрос уведомлений для пользователя:', req.params.userId);
    const notifications = notificationQueries.getByUserId(req.params.userId);
    console.log('📋 Найдено уведомлений:', notifications ? notifications.length : 0);
    
    if (!notifications || notifications.length === 0) {
      console.log('⚠️ Уведомления не найдены для пользователя:', req.params.userId);
      return res.json({ success: true, data: [] });
    }
    
    // Парсим JSON данные для каждого уведомления
    const formattedNotifications = notifications.map(notif => {
      try {
        return {
          ...notif,
          data: notif.data ? JSON.parse(notif.data) : null,
          is_read: notif.is_read === 1,
          view_count: notif.view_count || 0
        };
      } catch (parseError) {
        console.warn('⚠️ Ошибка парсинга данных уведомления:', parseError);
        return {
          ...notif,
          data: null,
          is_read: notif.is_read === 1,
          view_count: notif.view_count || 0
        };
      }
    });
    
    console.log('✅ Отправляем уведомления:', formattedNotifications.length);
    res.json({ success: true, data: formattedNotifications });
  } catch (error) {
    console.error('❌ Ошибка при получении уведомлений:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/notifications/user/:userId/unread - Получить непрочитанные уведомления
 */
app.get('/api/notifications/user/:userId/unread', (req, res) => {
  try {
    const notifications = notificationQueries.getUnreadByUserId(req.params.userId);
    const formattedNotifications = notifications.map(notif => ({
      ...notif,
      data: notif.data ? JSON.parse(notif.data) : null,
      is_read: false,
      view_count: notif.view_count || 0
    }));
    res.json({ success: true, data: formattedNotifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/notifications/:id/view - Отметить уведомление как просмотренное
 * Увеличивает счетчик просмотров. Если просмотрено 2 раза, удаляет уведомление
 */
app.put('/api/notifications/:id/view', (req, res) => {
  try {
    notificationQueries.markAsViewed(req.params.id);
    res.json({ success: true, message: 'Уведомление отмечено как просмотренное' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/notifications - Создать новое уведомление
 */
app.post('/api/notifications', (req, res) => {
  try {
    const { user_id, type, title, message, data } = req.body;
    
    if (!user_id || !type || !title) {
      return res.status(400).json({ 
        success: false, 
        error: 'Необходимо указать user_id, type и title' 
      });
    }
    
    const result = notificationQueries.create({
      user_id: user_id,
      type: type,
      title: title,
      message: message || null,
      data: data ? JSON.stringify(data) : null,
      is_read: 0,
      view_count: 0
    });
    
    res.json({ 
      success: true, 
      message: 'Уведомление создано',
      id: result.lastInsertRowid 
    });
  } catch (error) {
    console.error('Ошибка при создании уведомления:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/notifications/:id - Удалить уведомление
 */
app.delete('/api/notifications/:id', (req, res) => {
  try {
    notificationQueries.delete(req.params.id);
    res.json({ success: true, message: 'Уведомление удалено' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== РОУТЫ ДЛЯ АДМИН-ПАНЕЛИ ==========

/**
 * GET /api/admin/users/count - Получить количество зарегистрированных пользователей
 */
app.get('/api/admin/users/count', (req, res) => {
  try {
    const count = userQueries.getCount();
    res.json({ success: true, count });
  } catch (error) {
    console.error('Ошибка при получении количества пользователей:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/users/country-stats - Получить статистику по национальностям (странам)
 */
app.get('/api/admin/users/country-stats', (req, res) => {
  try {
    const stats = userQueries.getCountryStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Ошибка при получении статистики по странам:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/users/role-stats - Получить статистику по ролям (продавцы/покупатели)
 */
app.get('/api/admin/users/role-stats', (req, res) => {
  try {
    const stats = userQueries.getRoleStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Ошибка при получении статистики по ролям:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== РОУТЫ ДЛЯ УПРАВЛЕНИЯ АДМИНИСТРАТОРАМИ ==========

/**
 * POST /api/admin/auth/login - Вход администратора
 */
app.post('/api/admin/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Необходимо указать username/email и пароль' 
      });
    }

    const identifier = username.toLowerCase().trim();

    // Проверяем супер-админа (admin, admin)
    if (identifier === 'admin' && password === 'admin') {
      // Создаем или получаем супер-админа
      let superAdmin = administratorQueries.getByUsername('admin');
      if (!superAdmin) {
        const hashedPassword = crypto.createHash('sha256').update('admin').digest('hex');
        administratorQueries.create({
          username: 'admin',
          password: hashedPassword,
          is_super_admin: 1,
          can_access_statistics: 1,
          can_access_users: 1,
          can_access_moderation: 1,
          can_access_chat: 1,
          can_access_objects: 1,
          can_access_access_management: 1
        });
        superAdmin = administratorQueries.getByUsername('admin');
      }

      const { password: _, ...adminWithoutPassword } = superAdmin;
      return res.json({
        success: true,
        admin: adminWithoutPassword
      });
    }

    // Проверяем администратора сначала по username, затем по email
    let admin = administratorQueries.getByUsername(identifier);
    if (!admin) {
      // Если не найден по username, пробуем найти по email
      admin = administratorQueries.getByEmail(identifier);
    }
    
    if (!admin) {
      console.log('❌ Администратор не найден:', { identifier, searchedBy: 'username and email' });
      return res.status(401).json({ 
        success: false, 
        error: 'Неверный username/email или пароль' 
      });
    }
    
    console.log('✅ Администратор найден:', { id: admin.id, username: admin.username, email: admin.email });

    // Проверяем пароль
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    if (admin.password !== hashedPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Неверный username/email или пароль' 
      });
    }

    const { password: __, ...adminWithoutPassword } = admin;
    res.json({
      success: true,
      admin: adminWithoutPassword
    });
  } catch (error) {
    console.error('Ошибка при входе администратора:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/administrators - Получить всех администраторов
 */
app.get('/api/admin/administrators', (req, res) => {
  try {
    const admins = administratorQueries.getAll();
    // Убираем пароли из ответа
    const adminsWithoutPasswords = admins.map(admin => {
      const { password, ...adminWithoutPassword } = admin;
      return adminWithoutPassword;
    });
    res.json({ success: true, data: adminsWithoutPasswords });
  } catch (error) {
    console.error('Ошибка при получении администраторов:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/administrators/:id - Получить администратора по ID
 */
app.get('/api/admin/administrators/:id', (req, res) => {
  try {
    const admin = administratorQueries.getById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, error: 'Администратор не найден' });
    }
    const { password, ...adminWithoutPassword } = admin;
    res.json({ success: true, data: adminWithoutPassword });
  } catch (error) {
    console.error('Ошибка при получении администратора:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/administrators - Создать нового администратора
 */
app.post('/api/admin/administrators', (req, res) => {
  try {
    const { username, password, email, full_name, ...permissions } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Необходимо указать username и пароль' 
      });
    }

    // Проверяем, не существует ли уже администратор с таким username
    const existingAdmin = administratorQueries.getByUsername(username);
    if (existingAdmin) {
      return res.status(400).json({ 
        success: false, 
        error: 'Администратор с таким username уже существует' 
      });
    }

    // Валидация пароля
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.message,
        passwordValidation: {
          missing: passwordValidation.missing,
          present: passwordValidation.present
        }
      });
    }

    // Хешируем пароль
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    // Нормализуем email (lowercase и trim) если он указан
    const normalizedEmail = email ? email.toLowerCase().trim() : null;

    const result = administratorQueries.create({
      username,
      password: hashedPassword,
      email: normalizedEmail,
      full_name: full_name || null,
      is_super_admin: 0,
      can_access_statistics: permissions.can_access_statistics ? 1 : 0,
      can_access_users: permissions.can_access_users ? 1 : 0,
      can_access_moderation: permissions.can_access_moderation ? 1 : 0,
      can_access_chat: permissions.can_access_chat ? 1 : 0,
      can_access_objects: permissions.can_access_objects ? 1 : 0,
      can_access_access_management: 0 // Только для супер-админа
    });

    const newAdmin = administratorQueries.getById(result.lastInsertRowid);
    const { password: _, ...adminWithoutPassword } = newAdmin;
    
    res.json({ 
      success: true, 
      data: adminWithoutPassword,
      message: 'Администратор успешно создан' 
    });
  } catch (error) {
    console.error('Ошибка при создании администратора:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/admin/administrators/:id - Обновить администратора
 */
app.put('/api/admin/administrators/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { email, full_name, ...permissions } = req.body;

    const admin = administratorQueries.getById(id);
    if (!admin) {
      return res.status(404).json({ success: false, error: 'Администратор не найден' });
    }

    // Не позволяем изменять права супер-админа
    if (admin.is_super_admin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Нельзя изменять права супер-администратора' 
      });
    }

    // Нормализуем email (lowercase и trim) если он указан
    const normalizedEmail = email ? email.toLowerCase().trim() : null;

    administratorQueries.update(id, {
      email: normalizedEmail,
      full_name: full_name || null,
      can_access_statistics: permissions.can_access_statistics ? 1 : 0,
      can_access_users: permissions.can_access_users ? 1 : 0,
      can_access_moderation: permissions.can_access_moderation ? 1 : 0,
      can_access_chat: permissions.can_access_chat ? 1 : 0,
      can_access_objects: permissions.can_access_objects ? 1 : 0,
      can_access_access_management: 0 // Только для супер-админа
    });

    const updatedAdmin = administratorQueries.getById(id);
    const { password: _, ...adminWithoutPassword } = updatedAdmin;
    
    res.json({ 
      success: true, 
      data: adminWithoutPassword,
      message: 'Администратор успешно обновлен' 
    });
  } catch (error) {
    console.error('Ошибка при обновлении администратора:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/admin/administrators/:id - Удалить администратора
 */
app.delete('/api/admin/administrators/:id', (req, res) => {
  try {
    const { id } = req.params;

    const admin = administratorQueries.getById(id);
    if (!admin) {
      return res.status(404).json({ success: false, error: 'Администратор не найден' });
    }

    // Не позволяем удалять супер-админа
    if (admin.is_super_admin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Нельзя удалить супер-администратора' 
      });
    }

    administratorQueries.delete(id);
    res.json({ 
      success: true, 
      message: 'Администратор успешно удален' 
    });
  } catch (error) {
    console.error('Ошибка при удалении администратора:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ============================================
 * API ENDPOINTS ДЛЯ НЕДВИЖИМОСТИ
 * ============================================
 */

/**
 * POST /api/properties - Создать новое объявление о недвижимости
 */
app.post('/api/properties', upload.fields([
  { name: 'ownership_document', maxCount: 1 },
  { name: 'no_debts_document', maxCount: 1 }
]), (req, res) => {
  try {
    console.log('📥 Получен запрос на создание объявления');
    console.log('📋 Body:', req.body);
    console.log('📁 Files:', req.files);
    
    const db = getDatabase();
    
    // Проверяем существование таблицы properties
    try {
      db.prepare('SELECT 1 FROM properties LIMIT 1').get();
    } catch (tableError) {
      console.error('❌ Таблица properties не существует:', tableError);
      return res.status(500).json({ 
        success: false, 
        error: 'Таблица properties не существует. Необходимо выполнить миграцию БД.' 
      });
    }
    
    const {
      user_id,
      property_type,
      title,
      description,
      price,
      currency = 'USD',
      is_auction = 0,
      auction_start_date,
      auction_end_date,
      auction_starting_price
    } = req.body;
    
    // Нормализуем is_auction: может быть строкой '0'/'1', числом 0/1, или булевым значением
    let normalizedIsAuction = 0;
    if (typeof is_auction === 'string') {
      normalizedIsAuction = (is_auction === '1' || is_auction === 'true') ? 1 : 0;
    } else if (typeof is_auction === 'boolean') {
      normalizedIsAuction = is_auction ? 1 : 0;
    } else {
      normalizedIsAuction = is_auction ? 1 : 0;
    }
    
    console.log('📋 Получен is_auction:', is_auction, 'тип:', typeof is_auction, 'нормализован:', normalizedIsAuction);
    
    const {
      area,
      living_area,
      building_type,
      rooms,
      bedrooms,
      bathrooms,
      floor,
      total_floors,
      year_built,
      location,
      address,
      apartment,
      country,
      city,
      coordinates,
      balcony = 0,
      parking = 0,
      elevator = 0,
      land_area,
      garage = 0,
      pool = 0,
      garden = 0,
      commercial_type,
      business_hours,
      renovation,
      condition,
      heating,
      water_supply,
      sewerage,
      electricity = 0,
      internet = 0,
      security = 0,
      furniture = 0,
      photos,
      videos,
      additional_documents,
      additional_amenities,
      test_drive_data,
      test_drive = 0
    } = req.body;

    // Нормализуем test_drive: может быть строкой '0'/'1', числом 0/1, или булевым значением
    let normalizedTestDrive = 0;
    if (typeof test_drive === 'string') {
      normalizedTestDrive = (test_drive === '1' || test_drive === 'true') ? 1 : 0;
    } else if (typeof test_drive === 'boolean') {
      normalizedTestDrive = test_drive ? 1 : 0;
    } else {
      normalizedTestDrive = test_drive ? 1 : 0;
    }
    console.log('🔍 POST /api/properties - test_drive:', {
      raw: test_drive,
      type: typeof test_drive,
      normalized: normalizedTestDrive
    })

    // Парсим JSON-строки для медиа
    let parsedPhotos = [];
    let parsedVideos = [];
    let parsedAdditionalDocuments = [];
    
    try {
      if (photos && typeof photos === 'string') {
        parsedPhotos = JSON.parse(photos);
      } else if (Array.isArray(photos)) {
        parsedPhotos = photos;
      }
      
      if (videos && typeof videos === 'string') {
        parsedVideos = JSON.parse(videos);
      } else if (Array.isArray(videos)) {
        parsedVideos = videos;
      }
      
      if (additional_documents && typeof additional_documents === 'string') {
        parsedAdditionalDocuments = JSON.parse(additional_documents);
      } else if (Array.isArray(additional_documents)) {
        parsedAdditionalDocuments = additional_documents;
      }
    } catch (parseError) {
      console.warn('⚠️ Ошибка парсинга JSON для медиа:', parseError.message);
    }

    if (!user_id || !property_type || !title) {
      return res.status(400).json({ 
        success: false, 
        error: 'Необходимо указать user_id, property_type и title' 
      });
    }

    // Обновляем данные пользователя из профиля, если они переданы
    // Это нужно для синхронизации данных профиля с данными пользователя при отправке объекта
    try {
      const user = userQueries.getById(user_id);
      if (user) {
        // Обновляем данные пользователя, если они были переданы в запросе
        const updateData = {};
        if (req.body.first_name) updateData.first_name = req.body.first_name;
        if (req.body.last_name) updateData.last_name = req.body.last_name;
        if (req.body.email) updateData.email = req.body.email;
        if (req.body.phone_number) updateData.phone_number = req.body.phone_number;
        if (req.body.country) updateData.country = req.body.country;
        if (req.body.address) updateData.address = req.body.address;
        if (req.body.passport_series) updateData.passport_series = req.body.passport_series;
        if (req.body.passport_number) updateData.passport_number = req.body.passport_number;
        if (req.body.identification_number) updateData.identification_number = req.body.identification_number;
        
        if (Object.keys(updateData).length > 0) {
          userQueries.update(user_id, updateData);
          console.log('✅ Данные пользователя обновлены при отправке объекта');
        }
      }
    } catch (userUpdateError) {
      console.warn('⚠️ Не удалось обновить данные пользователя:', userUpdateError.message);
    }

    // Обработка загруженных документов
    let ownershipDocumentPath = null;
    let noDebtsDocumentPath = null;

    if (req.files) {
      if (req.files['ownership_document'] && req.files['ownership_document'][0]) {
        ownershipDocumentPath = `/uploads/${req.files['ownership_document'][0].filename}`;
      }
      if (req.files['no_debts_document'] && req.files['no_debts_document'][0]) {
        noDebtsDocumentPath = `/uploads/${req.files['no_debts_document'][0].filename}`;
      }
    }

    const stmt = db.prepare(`
      INSERT INTO properties (
        user_id, property_type, title, description, price, currency,
        is_auction, auction_start_date, auction_end_date, auction_starting_price,
        area, living_area, building_type, rooms, bedrooms, bathrooms, floor, total_floors, year_built, location,
        balcony, parking, elevator, land_area, garage, pool, garden,
        commercial_type, business_hours, renovation, condition, heating,
        water_supply, sewerage, electricity, internet, security, furniture,
        photos, videos, additional_documents, additional_amenities, ownership_document, no_debts_document,
        test_drive, test_drive_data, moderation_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Используем location, если он указан (он уже содержит полный адрес)
    // Если location не указан, формируем его из отдельных полей
    let finalLocation = location || '';
    if (!finalLocation && (address || apartment || city || country)) {
      const locationParts = [];
      if (address) locationParts.push(address);
      // Убираем автоматическое добавление квартиры, чтобы избежать дублирования
      // if (apartment) locationParts.push(`кв. ${apartment}`);
      if (city) locationParts.push(city);
      if (country) locationParts.push(country);
      if (locationParts.length > 0) {
        finalLocation = locationParts.join(', ');
      }
    }

    const result = stmt.run(
      user_id, property_type, title, description || null, price || null, currency,
      normalizedIsAuction, auction_start_date || null, auction_end_date || null, auction_starting_price || null,
      area || null, living_area || null, building_type || null, rooms || null, bedrooms || null, bathrooms || null, floor || null, total_floors || null, year_built || null, finalLocation || null,
      balcony ? 1 : 0, parking ? 1 : 0, elevator ? 1 : 0, land_area || null, garage ? 1 : 0, pool ? 1 : 0, garden ? 1 : 0,
      commercial_type || null, business_hours || null, renovation || null, condition || null, heating || null,
      water_supply || null, sewerage || null, electricity ? 1 : 0, internet ? 1 : 0, security ? 1 : 0, furniture ? 1 : 0,
      parsedPhotos.length > 0 ? JSON.stringify(parsedPhotos) : null,
      parsedVideos.length > 0 ? JSON.stringify(parsedVideos) : null,
      parsedAdditionalDocuments.length > 0 ? JSON.stringify(parsedAdditionalDocuments) : null,
      additional_amenities || null,
      ownershipDocumentPath, noDebtsDocumentPath,
      normalizedTestDrive,
      test_drive_data ? JSON.stringify(test_drive_data) : null,
      'pending'
    );
    
    console.log('🔍 POST /api/properties - Сохранено test_drive в БД:', normalizedTestDrive, 'тип:', typeof normalizedTestDrive)

    const propertyId = result.lastInsertRowid;
    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId);

    console.log('✅ Объявление успешно создано с ID:', propertyId);
    console.log('📋 Статус модерации из БД:', property.moderation_status);
    console.log('📋 Сохраненные данные в БД:', {
      rooms: property.rooms,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      living_area: property.living_area,
      floor: property.floor,
      total_floors: property.total_floors,
      year_built: property.year_built,
      building_type: property.building_type,
      balcony: property.balcony,
      parking: property.parking,
      elevator: property.elevator,
      price: property.price,
      auction_starting_price: property.auction_starting_price,
      test_drive: property.test_drive,
      test_drive_type: typeof property.test_drive,
    });
    
    // Проверяем, что объявление действительно создано с правильным статусом
    const checkProperty = db.prepare('SELECT id, moderation_status, title FROM properties WHERE id = ?').get(propertyId);
    console.log('🔍 Проверка объявления в БД:', checkProperty);
    
    // Проверяем количество объявлений на модерации
    const pendingCount = db.prepare('SELECT COUNT(*) as count FROM properties WHERE moderation_status = ?').get('pending');
    console.log('📊 Всего объявлений на модерации:', pendingCount.count);

    res.json({ 
      success: true, 
      data: property,
      message: 'Объявление успешно отправлено на модерацию' 
    });
  } catch (error) {
    console.error('❌ Ошибка при создании объявления:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Ошибка при создании объявления',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * PUT /api/properties/:id/delete-request - Отправить запрос на удаление объявления
 * ВАЖНО: Этот маршрут должен быть ПЕРЕД /api/properties/:id, иначе он будет перехвачен
 */
app.put('/api/properties/:id/delete-request', (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Необходимо указать причину удаления' 
      });
    }

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    if (!property) {
      return res.status(404).json({ 
        success: false, 
        error: 'Объявление не найдено' 
      });
    }

    // Проверяем, не отправлен ли уже запрос на удаление
    const existingDeleteRequest = db.prepare(`
      SELECT * FROM properties 
      WHERE rejection_reason LIKE ? AND moderation_status = 'pending'
    `).get(`DELETE:${id}:%`);

    if (existingDeleteRequest) {
      return res.status(400).json({ 
        success: false, 
        error: 'Запрос на удаление уже отправлен и ожидает модерации' 
      });
    }

    // Создаем новую запись с запросом на удаление
    // Используем rejection_reason для хранения ID оригинального объекта и причины: DELETE:propertyId:reason
    const stmt = db.prepare(`
      INSERT INTO properties (
        user_id, property_type, title, description, price, currency,
        is_auction, auction_start_date, auction_end_date, auction_starting_price,
        area, rooms, bedrooms, bathrooms, floor, total_floors, year_built, location,
        balcony, parking, elevator, land_area, garage, pool, garden,
        commercial_type, business_hours, renovation, condition, heating,
        water_supply, sewerage, electricity, internet, security, furniture,
        photos, videos, additional_documents, ownership_document, no_debts_document,
        test_drive, test_drive_data, moderation_status, rejection_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Подготавливаем все значения для вставки (44 значения для 44 колонок)
    const values = [
      property.user_id,
      property.property_type,
      property.title,
      property.description,
      property.price,
      property.currency,
      property.is_auction,
      property.auction_start_date,
      property.auction_end_date,
      property.auction_starting_price,
      property.area,
      property.rooms,
      property.bedrooms,
      property.bathrooms,
      property.floor,
      property.total_floors,
      property.year_built,
      property.location,
      property.balcony,
      property.parking,
      property.elevator,
      property.land_area,
      property.garage,
      property.pool,
      property.garden,
      property.commercial_type,
      property.business_hours,
      property.renovation,
      property.condition,
      property.heating,
      property.water_supply,
      property.sewerage,
      property.electricity,
      property.internet,
      property.security,
      property.furniture,
      property.photos,
      property.videos,
      property.additional_documents,
      property.ownership_document,
      property.no_debts_document,
      property.test_drive !== undefined && property.test_drive !== null ? property.test_drive : 0,
      property.test_drive_data,
      'pending', // Статус модерации для запроса на удаление
      `DELETE:${id}:${reason.trim()}` // Сохраняем ID оригинального объекта и причину
    ];
    
    console.log(`📊 Количество значений для вставки: ${values.length}`);
    console.log(`📊 Ожидается 44 значения`);

    const result = stmt.run(...values);
    const newRequestId = result.lastInsertRowid;

    console.log(`🗑️ Создан запрос на удаление. ID запроса: ${newRequestId}, ID оригинала: ${id}, Причина: ${reason.trim()}`);

    res.json({
      success: true,
      message: 'Запрос на удаление отправлен на модерацию',
      request_id: newRequestId
    });
  } catch (error) {
    console.error('❌ Ошибка при создании запроса на удаление:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Ошибка при создании запроса на удаление' 
    });
  }
});

/**
 * PUT /api/properties/:id - Обновить объявление (для редактирования)
 */
app.put('/api/properties/:id', upload.fields([
  { name: 'ownership_document', maxCount: 1 },
  { name: 'no_debts_document', maxCount: 1 }
]), (req, res) => {
  try {
    console.log('📥 Получен запрос на обновление объявления');
    console.log('📋 Body:', req.body);
    console.log('📁 Files:', req.files);
    
    const db = getDatabase();
    const { id } = req.params;
    const isEdit = req.body.is_edit === '1' || req.body.is_edit === 1;
    const originalPropertyId = req.body.original_property_id || id;
    
    // Проверяем существование оригинального объекта
    const originalProperty = db.prepare('SELECT * FROM properties WHERE id = ?').get(originalPropertyId);
    if (!originalProperty) {
      return res.status(404).json({ 
        success: false, 
        error: 'Оригинальное объявление не найдено' 
      });
    }
    
    const {
      user_id,
      property_type,
      title,
      description,
      price,
      currency = 'USD',
      is_auction = 0,
      auction_start_date,
      auction_end_date,
      auction_starting_price
    } = req.body;
    
    // Нормализуем is_auction
    let normalizedIsAuction = 0;
    if (typeof is_auction === 'string') {
      normalizedIsAuction = (is_auction === '1' || is_auction === 'true') ? 1 : 0;
    } else if (typeof is_auction === 'boolean') {
      normalizedIsAuction = is_auction ? 1 : 0;
    } else {
      normalizedIsAuction = is_auction ? 1 : 0;
    }
    
    const {
      area,
      living_area,
      building_type,
      rooms,
      bedrooms,
      bathrooms,
      floor,
      total_floors,
      year_built,
      location,
      address,
      apartment,
      country,
      city,
      coordinates,
      balcony = 0,
      parking = 0,
      elevator = 0,
      land_area,
      garage = 0,
      pool = 0,
      garden = 0,
      commercial_type,
      business_hours,
      renovation,
      condition,
      heating,
      water_supply,
      sewerage,
      electricity = 0,
      internet = 0,
      security = 0,
      furniture = 0,
      photos,
      videos,
      additional_documents,
      additional_amenities,
      test_drive_data,
      test_drive = 0
    } = req.body;
    
    // Нормализуем test_drive для редактирования
    // Если test_drive не передан в запросе, используем значение из оригинального объекта
    let normalizedTestDriveEdit = undefined;
    if (test_drive !== undefined && test_drive !== null) {
      if (typeof test_drive === 'string') {
        normalizedTestDriveEdit = (test_drive === '1' || test_drive === 'true') ? 1 : 0;
      } else if (typeof test_drive === 'boolean') {
        normalizedTestDriveEdit = test_drive ? 1 : 0;
      } else {
        normalizedTestDriveEdit = test_drive ? 1 : 0;
      }
    }
    
    // Парсим JSON поля
    let parsedPhotos = [];
    let parsedVideos = [];
    let parsedAdditionalDocuments = [];
    
    try {
      if (photos && typeof photos === 'string') {
        parsedPhotos = JSON.parse(photos);
      } else if (Array.isArray(photos)) {
        parsedPhotos = photos;
      }
      
      if (videos && typeof videos === 'string') {
        parsedVideos = JSON.parse(videos);
      } else if (Array.isArray(videos)) {
        parsedVideos = videos;
      }
      
      if (additional_documents && typeof additional_documents === 'string') {
        parsedAdditionalDocuments = JSON.parse(additional_documents);
      } else if (Array.isArray(additional_documents)) {
        parsedAdditionalDocuments = additional_documents;
      }
    } catch (parseError) {
      console.warn('⚠️ Ошибка парсинга JSON для медиа:', parseError.message);
    }
    
    // Обрабатываем координаты
    let coordinatesStr = null;
    if (coordinates) {
      try {
        coordinatesStr = typeof coordinates === 'string' ? coordinates : JSON.stringify(coordinates);
      } catch (e) {
        console.warn('⚠️ Ошибка обработки координат:', e);
      }
    }
    
    // Обрабатываем test_drive_data
    let testDriveDataStr = null;
    if (test_drive_data) {
      try {
        testDriveDataStr = typeof test_drive_data === 'string' 
          ? test_drive_data 
          : JSON.stringify(test_drive_data);
      } catch (e) {
        console.warn('⚠️ Ошибка обработки test_drive_data:', e);
      }
    }
    
    // Обрабатываем документы
    let ownershipDocumentPath = originalProperty.ownership_document;
    let noDebtsDocumentPath = originalProperty.no_debts_document;
    
    if (req.files) {
      if (req.files['ownership_document'] && req.files['ownership_document'][0]) {
        ownershipDocumentPath = `/uploads/${req.files['ownership_document'][0].filename}`;
      }
      if (req.files['no_debts_document'] && req.files['no_debts_document'][0]) {
        noDebtsDocumentPath = `/uploads/${req.files['no_debts_document'][0].filename}`;
      }
    }
    
    // Формируем location
    let finalLocation = location || '';
    if (!finalLocation && (address || apartment || city || country)) {
      const locationParts = [];
      if (address) locationParts.push(address);
      if (city) locationParts.push(city);
      if (country) locationParts.push(country);
      if (locationParts.length > 0) {
        finalLocation = locationParts.join(', ');
      }
    }
    
    // Если это редактирование, создаем новую запись с пометкой
    if (isEdit) {
      // Создаем новую запись с данными изменений
      // Используем rejection_reason для хранения original_property_id
      const stmt = db.prepare(`
        INSERT INTO properties (
          user_id, property_type, title, description, price, currency,
          is_auction, auction_start_date, auction_end_date, auction_starting_price,
          area, living_area, building_type, rooms, bedrooms, bathrooms, floor, total_floors, year_built, location,
          balcony, parking, elevator, land_area, garage, pool, garden,
          commercial_type, business_hours, renovation, condition, heating,
          water_supply, sewerage, electricity, internet, security, furniture,
          photos, videos, additional_documents, additional_amenities, ownership_document, no_debts_document,
          test_drive, test_drive_data, moderation_status, rejection_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      // Подготавливаем все значения для вставки
      const values = [
        user_id || originalProperty.user_id,
        property_type || originalProperty.property_type,
        title || originalProperty.title,
        description !== undefined ? description : originalProperty.description,
        price ? parseFloat(price) : originalProperty.price,
        currency || originalProperty.currency,
        normalizedIsAuction,
        auction_start_date || originalProperty.auction_start_date,
        auction_end_date || originalProperty.auction_end_date,
        auction_starting_price ? parseFloat(auction_starting_price) : originalProperty.auction_starting_price,
        area ? parseFloat(area) : originalProperty.area,
        living_area ? parseFloat(living_area) : originalProperty.living_area,
        building_type || originalProperty.building_type,
        rooms ? parseInt(rooms) : originalProperty.rooms,
        bedrooms ? parseInt(bedrooms) : originalProperty.bedrooms,
        bathrooms ? parseInt(bathrooms) : originalProperty.bathrooms,
        floor ? parseInt(floor) : originalProperty.floor,
        total_floors ? parseInt(total_floors) : originalProperty.total_floors,
        year_built ? parseInt(year_built) : originalProperty.year_built,
        finalLocation || originalProperty.location,
        balcony === '1' || balcony === 1 || (typeof balcony === 'boolean' && balcony) ? 1 : 0,
        parking === '1' || parking === 1 || (typeof parking === 'boolean' && parking) ? 1 : 0,
        elevator === '1' || elevator === 1 || (typeof elevator === 'boolean' && elevator) ? 1 : 0,
        land_area ? parseFloat(land_area) : originalProperty.land_area,
        garage === '1' || garage === 1 || (typeof garage === 'boolean' && garage) ? 1 : 0,
        pool === '1' || pool === 1 || (typeof pool === 'boolean' && pool) ? 1 : 0,
        garden === '1' || garden === 1 || (typeof garden === 'boolean' && garden) ? 1 : 0,
        commercial_type || originalProperty.commercial_type,
        business_hours || originalProperty.business_hours,
        renovation || originalProperty.renovation,
        condition || originalProperty.condition,
        heating || originalProperty.heating,
        water_supply || originalProperty.water_supply,
        sewerage || originalProperty.sewerage,
        electricity === '1' || electricity === 1 || (typeof electricity === 'boolean' && electricity) ? 1 : 0,
        internet === '1' || internet === 1 || (typeof internet === 'boolean' && internet) ? 1 : 0,
        security === '1' || security === 1 || (typeof security === 'boolean' && security) ? 1 : 0,
        furniture === '1' || furniture === 1 || (typeof furniture === 'boolean' && furniture) ? 1 : 0,
        JSON.stringify(parsedPhotos.length > 0 ? parsedPhotos : (originalProperty.photos ? JSON.parse(originalProperty.photos) : [])),
        JSON.stringify(parsedVideos.length > 0 ? parsedVideos : (originalProperty.videos ? JSON.parse(originalProperty.videos) : [])),
        JSON.stringify(parsedAdditionalDocuments.length > 0 ? parsedAdditionalDocuments : (originalProperty.additional_documents ? JSON.parse(originalProperty.additional_documents) : [])),
        additional_amenities || originalProperty.additional_amenities,
        ownershipDocumentPath,
        noDebtsDocumentPath,
        normalizedTestDriveEdit !== undefined ? normalizedTestDriveEdit : (originalProperty.test_drive !== undefined && originalProperty.test_drive !== null ? originalProperty.test_drive : 0),
        testDriveDataStr || originalProperty.test_drive_data,
        'pending', // Статус модерации для изменений
        `EDIT:${originalPropertyId}` // Сохраняем ID оригинального объекта в rejection_reason
      ];
      
      console.log(`📊 Количество значений для вставки: ${values.length}`);
      console.log(`📊 Ожидается 44 значения`);
      
      const result = stmt.run(...values);
      
      const newPropertyId = result.lastInsertRowid;
      
      console.log(`✅ Создана новая запись для редактирования. ID новой записи: ${newPropertyId}, ID оригинала: ${originalPropertyId}`);
      
      // Получаем созданную запись
      const newProperty = db.prepare('SELECT * FROM properties WHERE id = ?').get(newPropertyId);
      
      res.json({
        success: true,
        data: newProperty,
        message: 'Изменения отправлены на модерацию',
        is_edit: true,
        original_property_id: originalPropertyId
      });
    } else {
      // Обычное обновление (если не режим редактирования)
      return res.status(400).json({
        success: false,
        error: 'Используйте POST для создания нового объявления'
      });
    }
  } catch (error) {
    console.error('❌ Ошибка при обновлении объявления:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка при обновлении объявления'
    });
  }
});

/**
 * GET /api/properties/pending - Получить все объявления на модерации
 * ВАЖНО: Этот маршрут должен быть ПЕРЕД /api/properties/:id, иначе "pending" будет интерпретироваться как ID
 */
app.get('/api/properties/pending', (req, res) => {
  try {
    const db = getDatabase();
    console.log('📥 Запрос объявлений на модерации');
    
    const properties = db.prepare(`
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
    `).all();

    console.log(`✅ Найдено объявлений на модерации: ${properties.length}`);
    if (properties.length > 0) {
      console.log('📋 ID объявлений:', properties.map(p => p.id).join(', '));
      console.log('📋 Статусы:', properties.map(p => p.moderation_status).join(', '));
    }

    // Парсим JSON поля
    const formattedProperties = properties.map(prop => {
      const formatted = { ...prop };
      if (formatted.photos) {
        try {
          formatted.photos = JSON.parse(formatted.photos);
        } catch (e) {
          formatted.photos = [];
        }
      }
      if (formatted.videos) {
        try {
          formatted.videos = JSON.parse(formatted.videos);
        } catch (e) {
          formatted.videos = [];
        }
      }
      if (formatted.additional_documents) {
        try {
          formatted.additional_documents = JSON.parse(formatted.additional_documents);
        } catch (e) {
          formatted.additional_documents = [];
        }
      }
      if (formatted.test_drive_data) {
        try {
          formatted.test_drive_data = JSON.parse(formatted.test_drive_data);
        } catch (e) {
          formatted.test_drive_data = null;
        }
      }
      return formatted;
    });

    res.json({ success: true, data: formattedProperties });
  } catch (error) {
    console.error('Ошибка при получении объявлений на модерации:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/properties/pending - Получить все объявления на модерации
 * ВАЖНО: Этот маршрут должен быть ПЕРЕД /api/properties/:id, иначе "pending" будет интерпретироваться как ID
 */
app.get('/api/properties/pending', (req, res) => {
  try {
    const db = getDatabase();
    console.log('📥 Запрос объявлений на модерации');
    
    const properties = db.prepare(`
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
    `).all();

    console.log(`✅ Найдено объявлений на модерации: ${properties.length}`);
    if (properties.length > 0) {
      console.log('📋 ID объявлений:', properties.map(p => p.id).join(', '));
      console.log('📋 Статусы:', properties.map(p => p.moderation_status).join(', '));
    }

    // Парсим JSON поля
    const formattedProperties = properties.map(prop => {
      const formatted = { ...prop };
      if (formatted.photos) {
        try {
          formatted.photos = JSON.parse(formatted.photos);
        } catch (e) {
          formatted.photos = [];
        }
      }
      if (formatted.videos) {
        try {
          formatted.videos = JSON.parse(formatted.videos);
        } catch (e) {
          formatted.videos = [];
        }
      }
      if (formatted.additional_documents) {
        try {
          formatted.additional_documents = JSON.parse(formatted.additional_documents);
        } catch (e) {
          formatted.additional_documents = [];
        }
      }
      if (formatted.test_drive_data) {
        try {
          formatted.test_drive_data = JSON.parse(formatted.test_drive_data);
        } catch (e) {
          formatted.test_drive_data = null;
        }
      }
      return formatted;
    });

    res.json({ success: true, data: formattedProperties });
  } catch (error) {
    console.error('Ошибка при получении объявлений на модерации:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/properties/approved - Получить одобренные объявления без аукциона
 * ВАЖНО: Этот маршрут должен быть ПЕРЕД /api/properties/:id, иначе он будет перехвачен
 */
app.get('/api/properties/approved', (req, res) => {
  try {
    const db = getDatabase();
    const { type } = req.query; // Опциональный фильтр по типу
    
    // Теперь делаем основной запрос
    let query = `
      SELECT p.*, 
             u.first_name, u.last_name, u.email, u.phone_number
      FROM properties p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.moderation_status = 'approved' 
        AND (p.is_auction = 0 OR p.is_auction IS NULL)
    `;
    
    const params = [];
    if (type) {
      query += ' AND p.property_type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY p.reviewed_at DESC, p.created_at DESC';
    
    const properties = db.prepare(query).all(...params);
    
    // Преобразуем данные в формат для фронтенда
    const formattedProperties = properties.map(prop => {
      // Парсим JSON поля
      let photos = [];
      let videos = [];
      
      if (prop.photos) {
        try {
          photos = typeof prop.photos === 'string' ? JSON.parse(prop.photos) : prop.photos;
        } catch (e) {
          photos = [];
        }
      }
      
      if (prop.videos) {
        try {
          videos = typeof prop.videos === 'string' ? JSON.parse(prop.videos) : prop.videos;
        } catch (e) {
          videos = [];
        }
      }
      
      return {
        id: prop.id,
        name: prop.title,
        title: prop.title,
        location: prop.location || '',
        price: prop.price || 0,
        coordinates: prop.coordinates ? (
          typeof prop.coordinates === 'string' 
            ? (prop.coordinates.startsWith('[') || prop.coordinates.startsWith('{') 
                ? JSON.parse(prop.coordinates) 
                : prop.coordinates.split(',').map(Number))
            : prop.coordinates
        ) : null,
        owner: {
          firstName: prop.first_name || '',
          lastName: prop.last_name || '',
          email: prop.email || ''
        },
        image: photos && photos.length > 0 ? photos[0] : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
        images: photos || [],
        videos: videos || [],
        hasSamolyot: false,
        isAuction: false,
        currentBid: null,
        endTime: null,
        beds: prop.bedrooms || prop.rooms || 0,
        baths: prop.bathrooms || 0,
        sqft: prop.area || 0,
        description: prop.description || '',
        property_type: prop.property_type,
        currency: prop.currency || 'USD'
      };
    });
    
    res.json({
      success: true,
      data: formattedProperties
    });
  } catch (error) {
    console.error('Ошибка при получении одобренных объявлений:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/properties/auctions - Получить одобренные объявления с аукционом
 * ВАЖНО: Этот маршрут должен быть ПЕРЕД /api/properties/:id, иначе он будет перехвачен
 */
app.get('/api/properties/auctions', (req, res) => {
  try {
    const db = getDatabase();
    const { type } = req.query; // Опциональный фильтр по типу
    
    // Запрос для получения объявлений с аукционом
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
    if (type) {
      query += ' AND p.property_type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY p.auction_end_date ASC, p.reviewed_at DESC, p.created_at DESC';
    
    const properties = db.prepare(query).all(...params);
    
    // Преобразуем данные в формат для фронтенда
    const formattedProperties = properties.map(prop => {
      // Парсим JSON поля
      let photos = [];
      let videos = [];
      
      if (prop.photos) {
        try {
          photos = typeof prop.photos === 'string' ? JSON.parse(prop.photos) : prop.photos;
        } catch (e) {
          photos = [];
        }
      }
      
      if (prop.videos) {
        try {
          videos = typeof prop.videos === 'string' ? JSON.parse(prop.videos) : prop.videos;
        } catch (e) {
          videos = [];
        }
      }
      
      return {
        id: prop.id,
        name: prop.title,
        title: prop.title,
        location: prop.location || '',
        // price по-прежнему используем как стартовую ставку, чтобы не ломать фронт
        price: prop.auction_starting_price || prop.price || 0,
        coordinates: prop.coordinates ? (
          typeof prop.coordinates === 'string' 
            ? (prop.coordinates.startsWith('[') || prop.coordinates.startsWith('{') 
                ? JSON.parse(prop.coordinates) 
                : prop.coordinates.split(',').map(Number))
            : prop.coordinates
        ) : null,
        owner: {
          firstName: prop.first_name || '',
          lastName: prop.last_name || '',
          email: prop.email || ''
        },
        image: photos && photos.length > 0 ? photos[0] : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
        images: photos || [],
        videos: videos || [],
        hasSamolyot: false,
        isAuction: true,
        currentBid: prop.auction_starting_price || prop.price || 0,
        endTime: prop.auction_end_date || null,
        beds: prop.bedrooms || prop.rooms || 0,
        baths: prop.bathrooms || 0,
        sqft: prop.area || 0,
        area: prop.area || 0,
        rooms: prop.bedrooms || prop.rooms || 0,
        description: prop.description || '',
        property_type: prop.property_type,
        currency: prop.currency || 'USD',
        // Доп. поля для админки
        // originalPrice - минимальная цена продажи (из поля price в БД)
        originalPrice: prop.price || null,
        // auctionStartingPrice - стартовая ставка (из поля auction_starting_price в БД)
        // НЕ используем fallback на price, чтобы не смешивать с минимальной ценой
        auctionStartingPrice: prop.auction_starting_price || null,
        tag: prop.property_type === 'apartment' ? 'apartment' : 
             prop.property_type === 'villa' ? 'villa' : 
             prop.property_type === 'house' ? 'house' : 
             prop.property_type === 'commercial' ? 'apartment' : 'apartment'
      };
    });
    
    res.json({
      success: true,
      data: formattedProperties
    });
  } catch (error) {
    console.error('Ошибка при получении аукционных объявлений:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/properties/:id - Получить объявление по ID
 */
app.get('/api/properties/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    
    const property = db.prepare(`
      SELECT 
        p.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        u.role
      FROM properties p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(id);

    if (!property) {
      return res.status(404).json({ success: false, error: 'Объявление не найдено' });
    }

    // Логируем данные из базы для отладки
    console.log('📥 GET /api/properties/:id - Данные из БД:', {
      id: property.id,
      rooms: property.rooms,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      living_area: property.living_area,
      floor: property.floor,
      total_floors: property.total_floors,
      year_built: property.year_built,
      building_type: property.building_type,
      balcony: property.balcony,
      parking: property.parking,
      elevator: property.elevator,
      price: property.price,
      auction_starting_price: property.auction_starting_price,
      test_drive: property.test_drive,
    });
    
    console.log('🔍 GET /api/properties/:id - test_drive из БД:', {
      test_drive: property.test_drive,
      test_drive_type: typeof property.test_drive,
      test_drive_raw: property.test_drive
    });

    // Парсим JSON поля
    const formatted = { ...property };
    if (formatted.photos) {
      try {
        formatted.photos = JSON.parse(formatted.photos);
      } catch (e) {
        formatted.photos = [];
      }
    } else {
      formatted.photos = [];
    }
    if (formatted.videos) {
      try {
        formatted.videos = JSON.parse(formatted.videos);
      } catch (e) {
        formatted.videos = [];
      }
    } else {
      formatted.videos = [];
    }
    if (formatted.additional_documents) {
      try {
        formatted.additional_documents = JSON.parse(formatted.additional_documents);
      } catch (e) {
        formatted.additional_documents = [];
      }
    } else {
      formatted.additional_documents = [];
    }
    if (formatted.test_drive_data) {
      try {
        formatted.test_drive_data = JSON.parse(formatted.test_drive_data);
      } catch (e) {
        formatted.test_drive_data = null;
      }
    }
    
    // Обрабатываем координаты
    if (formatted.coordinates) {
      try {
        if (typeof formatted.coordinates === 'string') {
          // Проверяем, это JSON строка или строка с запятой
          if (formatted.coordinates.startsWith('[') || formatted.coordinates.startsWith('{')) {
            const parsed = JSON.parse(formatted.coordinates);
            if (Array.isArray(parsed) && parsed.length >= 2) {
              formatted.coordinates = [parseFloat(parsed[0]), parseFloat(parsed[1])];
            } else {
              formatted.coordinates = null;
            }
          } else {
            // Строка вида "lat,lng"
            const parts = formatted.coordinates.split(',');
            if (parts.length >= 2) {
              formatted.coordinates = [parseFloat(parts[0]), parseFloat(parts[1])];
            } else {
              formatted.coordinates = null;
            }
          }
        } else if (Array.isArray(formatted.coordinates) && formatted.coordinates.length >= 2) {
          // Уже массив, просто убеждаемся что это числа
          formatted.coordinates = [parseFloat(formatted.coordinates[0]), parseFloat(formatted.coordinates[1])];
        }
      } catch (e) {
        console.warn('Ошибка парсинга coordinates:', e);
        formatted.coordinates = null;
      }
    }

    console.log('🔍 GET /api/properties/:id - Отправляем formatted с test_drive:', {
      test_drive: formatted.test_drive,
      test_drive_type: typeof formatted.test_drive
    });
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Ошибка при получении объявления:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/properties/user/:userId - Получить все объявления пользователя
 */
app.get('/api/properties/user/:userId', (req, res) => {
  try {
    const db = getDatabase();
    const { userId } = req.params;
    
    const properties = db.prepare(`
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
    `).all(userId);

    // Парсим JSON поля
    const formattedProperties = properties.map(prop => {
      const formatted = { ...prop };
      if (formatted.photos) {
        try {
          formatted.photos = JSON.parse(formatted.photos);
        } catch (e) {
          formatted.photos = [];
        }
      } else {
        formatted.photos = [];
      }
      if (formatted.videos) {
        try {
          formatted.videos = JSON.parse(formatted.videos);
        } catch (e) {
          formatted.videos = [];
        }
      } else {
        formatted.videos = [];
      }
      if (formatted.additional_documents) {
        try {
          formatted.additional_documents = JSON.parse(formatted.additional_documents);
        } catch (e) {
          formatted.additional_documents = [];
        }
      } else {
        formatted.additional_documents = [];
      }
      if (formatted.test_drive_data) {
        try {
          formatted.test_drive_data = JSON.parse(formatted.test_drive_data);
        } catch (e) {
          formatted.test_drive_data = null;
        }
      }
      return formatted;
    });

    res.json({ success: true, data: formattedProperties });
  } catch (error) {
    console.error('Ошибка при получении объявлений пользователя:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/properties/:id/approve - Одобрить объявление
 */
app.put('/api/properties/:id/approve', (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { reviewed_by } = req.body;

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Объявление не найдено' });
    }

    console.log(`✅ Одобрение объявления ID: ${id}, Тип: ${property.property_type}, Аукцион: ${property.is_auction}`);

    // Проверяем тип запроса (редактирование или удаление)
    const isEdit = property.rejection_reason && property.rejection_reason.startsWith('EDIT:');
    const isDelete = property.rejection_reason && property.rejection_reason.startsWith('DELETE:');
    let originalPropertyId = null;
    let deleteReason = null;
    
    if (isDelete) {
      // Извлекаем ID оригинального объекта и причину удаления
      // Формат: DELETE:propertyId:reason
      const deleteMatch = property.rejection_reason.match(/^DELETE:(\d+):(.+)$/);
      if (deleteMatch) {
        originalPropertyId = deleteMatch[1];
        deleteReason = deleteMatch[2];
        console.log(`🗑️ Это запрос на удаление. ID оригинала: ${originalPropertyId}, Причина: ${deleteReason}`);
      } else {
        // Старый формат без причины (для обратной совместимости)
        originalPropertyId = property.rejection_reason.replace('DELETE:', '');
        console.log(`🗑️ Это запрос на удаление (старый формат). ID оригинала: ${originalPropertyId}`);
      }
      
      // Проверяем существование оригинального объекта
      const originalProperty = db.prepare('SELECT * FROM properties WHERE id = ?').get(originalPropertyId);
      if (!originalProperty) {
        return res.status(404).json({ 
          success: false, 
          error: 'Оригинальное объявление не найдено' 
        });
      }
      
      // Удаляем оригинальное объявление
      db.prepare('DELETE FROM properties WHERE id = ?').run(originalPropertyId);
      console.log(`✅ Оригинальное объявление ID ${originalPropertyId} удалено`);
      
      // Удаляем запись с запросом на удаление
      db.prepare('DELETE FROM properties WHERE id = ?').run(id);
      console.log(`🗑️ Запись с запросом на удаление ID ${id} удалена`);
      
      // Создаем уведомление для пользователя
      try {
        notificationQueries.create({
          user_id: property.user_id,
          type: 'property_deleted',
          title: 'Объявление удалено',
          message: `Ваш запрос на удаление объявления "${property.title}" одобрен. Объявление удалено с площадки.`,
          data: JSON.stringify({ property_id: originalPropertyId })
        });
      } catch (notifError) {
        console.warn('Не удалось создать уведомление:', notifError);
      }
      
      res.json({ 
        success: true, 
        message: 'Объявление удалено',
        deleted_property_id: originalPropertyId
      });
      return;
    } else if (isEdit) {
      // Извлекаем ID оригинального объекта
      originalPropertyId = property.rejection_reason.replace('EDIT:', '');
      console.log(`📝 Это редактирование. ID оригинала: ${originalPropertyId}`);
      
      // Проверяем существование оригинального объекта
      const originalProperty = db.prepare('SELECT * FROM properties WHERE id = ?').get(originalPropertyId);
      if (!originalProperty) {
        return res.status(404).json({ 
          success: false, 
          error: 'Оригинальное объявление не найдено' 
        });
      }
      
      // Определяем, изменились ли даты аукциона
      // Если даты не изменились (равны оригинальным или пустые), сохраняем оригинальные даты
      let finalAuctionStartDate = property.auction_start_date;
      let finalAuctionEndDate = property.auction_end_date;
      
      // Проверяем, является ли это аукционом
      const isAuction = property.is_auction === 1 || property.is_auction === '1' || property.is_auction === true;
      
      if (isAuction) {
        // Нормализуем даты для сравнения (убираем лишние пробелы, приводим к единому формату)
        const normalizeDate = (date) => {
          if (!date) return null;
          return String(date).trim() || null;
        };
        
        const newStartDate = normalizeDate(property.auction_start_date);
        const newEndDate = normalizeDate(property.auction_end_date);
        const oldStartDate = normalizeDate(originalProperty.auction_start_date);
        const oldEndDate = normalizeDate(originalProperty.auction_end_date);
        
        // Проверяем, изменились ли даты аукциона
        // Если новые даты пустые или равны оригинальным, значит пользователь не менял их
        const startDateChanged = newStartDate && newStartDate !== oldStartDate;
        const endDateChanged = newEndDate && newEndDate !== oldEndDate;
        const datesChanged = startDateChanged || endDateChanged;
        
        // Если даты не изменились или пустые, используем оригинальные даты (чтобы таймер продолжал работать)
        if (!datesChanged || !newStartDate || !newEndDate) {
          finalAuctionStartDate = originalProperty.auction_start_date;
          finalAuctionEndDate = originalProperty.auction_end_date;
          console.log(`⏰ Даты аукциона не изменились, сохраняем оригинальные даты для продолжения таймера`);
          console.log(`   Оригинальные: ${oldStartDate} - ${oldEndDate}`);
        } else {
          console.log(`⏰ Даты аукциона изменены, используем новые даты`);
          console.log(`   Было: ${oldStartDate} - ${oldEndDate}`);
          console.log(`   Стало: ${newStartDate} - ${newEndDate}`);
        }
      } else {
        // Если это не аукцион, даты не важны
        finalAuctionStartDate = null;
        finalAuctionEndDate = null;
      }
      
      // Обновляем оригинальный объект данными из изменений
      // Важно: обновляем существующий объект, а не создаем новый, чтобы избежать дубликатов
      db.prepare(`
        UPDATE properties 
        SET 
          property_type = ?,
          title = ?,
          description = ?,
          price = ?,
          currency = ?,
          is_auction = ?,
          auction_start_date = ?,
          auction_end_date = ?,
          auction_starting_price = ?,
          area = ?,
          living_area = ?,
          building_type = ?,
          rooms = ?,
          bedrooms = ?,
          bathrooms = ?,
          floor = ?,
          total_floors = ?,
          year_built = ?,
          location = ?,
          balcony = ?,
          parking = ?,
          elevator = ?,
          land_area = ?,
          garage = ?,
          pool = ?,
          garden = ?,
          commercial_type = ?,
          business_hours = ?,
          renovation = ?,
          condition = ?,
          heating = ?,
          water_supply = ?,
          sewerage = ?,
          electricity = ?,
          internet = ?,
          security = ?,
          furniture = ?,
          photos = ?,
          videos = ?,
          additional_documents = ?,
          additional_amenities = ?,
          ownership_document = ?,
          no_debts_document = ?,
          test_drive = ?,
          test_drive_data = ?,
          moderation_status = 'approved',
          rejection_reason = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        property.property_type,
        property.title,
        property.description,
        property.price,
        property.currency,
        property.is_auction,
        finalAuctionStartDate,
        finalAuctionEndDate,
        property.auction_starting_price,
        property.area,
        property.living_area || null,
        property.building_type || null,
        property.rooms,
        property.bedrooms,
        property.bathrooms,
        property.floor,
        property.total_floors,
        property.year_built,
        property.location,
        property.balcony,
        property.parking,
        property.elevator,
        property.land_area,
        property.garage,
        property.pool,
        property.garden,
        property.commercial_type,
        property.business_hours,
        property.renovation,
        property.condition,
        property.heating,
        property.water_supply,
        property.sewerage,
        property.electricity,
        property.internet,
        property.security,
        property.furniture,
        property.photos,
        property.videos,
        property.additional_documents,
        property.additional_amenities || null,
        property.ownership_document,
        property.no_debts_document,
        property.test_drive !== undefined && property.test_drive !== null ? property.test_drive : 0,
        property.test_drive_data,
        originalPropertyId
      );
      
      console.log(`✅ Оригинальный объект ID ${originalPropertyId} обновлен данными из изменений`);
      console.log(`   Статус модерации: approved, rejection_reason: очищен`);
      
      // Удаляем запись с изменениями после применения (чтобы избежать дубликатов)
      db.prepare('DELETE FROM properties WHERE id = ?').run(id);
      console.log(`🗑️ Запись с изменениями ID ${id} удалена (дубликат предотвращен)`);
      
      // Проверяем, что оригинальный объект обновлен корректно
      const updatedOriginal = db.prepare('SELECT id, title, moderation_status, is_auction, auction_start_date, auction_end_date FROM properties WHERE id = ?').get(originalPropertyId);
      console.log(`✅ Проверка обновленного объекта:`, {
        id: updatedOriginal.id,
        title: updatedOriginal.title,
        moderation_status: updatedOriginal.moderation_status,
        is_auction: updatedOriginal.is_auction,
        auction_dates: updatedOriginal.is_auction ? `${updatedOriginal.auction_start_date} - ${updatedOriginal.auction_end_date}` : 'N/A'
      });
      
      // Создаем уведомление для пользователя
      try {
        notificationQueries.create({
          user_id: property.user_id,
          type: 'property_approved',
          title: 'Изменения в объекте одобрены',
          message: `Изменения в объекте "${property.title}" одобрены и применены к опубликованному объявлению`,
          data: JSON.stringify({ property_id: originalPropertyId })
        });
      } catch (notifError) {
        console.warn('Не удалось создать уведомление:', notifError);
      }
      
      res.json({ 
        success: true, 
        message: 'Изменения одобрены и применены к оригинальному объекту',
        original_property_id: originalPropertyId
      });
    } else {
      // Обычное одобрение нового объявления
      console.log('🔍 Одобрение нового объявления - test_drive перед одобрением:', {
        test_drive: property.test_drive,
        test_drive_type: typeof property.test_drive
      });
      
      db.prepare(`
        UPDATE properties 
        SET moderation_status = 'approved',
            reviewed_by = ?,
            reviewed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(reviewed_by || 'admin', id);
      
      // Проверяем, что объявление действительно одобрено и сохраняет is_auction
      const updatedProperty = db.prepare('SELECT id, title, property_type, moderation_status, is_auction, test_drive FROM properties WHERE id = ?').get(id);
      console.log(`✅ Объявление обновлено:`, updatedProperty);
      console.log('🔍 Одобрение нового объявления - test_drive после одобрения:', {
        test_drive: updatedProperty.test_drive,
        test_drive_type: typeof updatedProperty.test_drive
      });

      // Создаем уведомление для пользователя
      try {
        notificationQueries.create({
          user_id: property.user_id,
          type: 'property_approved',
          title: 'Ваш объект прошел верификацию',
          message: `Ваш объект "${property.title}" прошел верификацию, в скором времени он будет опубликован на платформе`,
          data: JSON.stringify({ property_id: id })
        });
      } catch (notifError) {
        console.warn('Не удалось создать уведомление:', notifError);
      }

      res.json({ 
        success: true, 
        message: 'Объявление одобрено' 
      });
    }
  } catch (error) {
    console.error('Ошибка при одобрении объявления:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/properties/:id/toggle-auction - Переключить статус аукциона (для тестирования)
 */
app.put('/api/properties/:id/toggle-auction', (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Объявление не найдено' });
    }

    // Переключаем статус аукциона
    const newAuctionStatus = property.is_auction === 1 ? 0 : 1;
    db.prepare(`
      UPDATE properties 
      SET is_auction = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newAuctionStatus, id);

    console.log(`✅ Статус аукциона изменен для объявления ID ${id}: ${property.is_auction} -> ${newAuctionStatus}`);

    res.json({ 
      success: true, 
      message: `Статус аукциона изменен на ${newAuctionStatus === 1 ? 'с аукционом' : 'без аукциона'}`,
      data: { is_auction: newAuctionStatus }
    });
  } catch (error) {
    console.error('Ошибка при изменении статуса аукциона:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/properties/:id/reject - Отклонить объявление
 */
app.put('/api/properties/:id/reject', (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { reviewed_by, rejection_reason } = req.body;

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Объявление не найдено' });
    }

    db.prepare(`
      UPDATE properties 
      SET moderation_status = 'rejected',
          reviewed_by = ?,
          reviewed_at = CURRENT_TIMESTAMP,
          rejection_reason = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reviewed_by || 'admin', rejection_reason || null, id);

    // Создаем уведомление для пользователя
    try {
      notificationQueries.create({
        user_id: property.user_id,
        type: 'property_rejected',
        title: 'Объявление отклонено',
        message: `Ваше объявление "${property.title}" было отклонено.${rejection_reason ? ' Причина: ' + rejection_reason : ''}`,
        data: JSON.stringify({ property_id: id, rejection_reason })
      });
    } catch (notifError) {
      console.warn('Не удалось создать уведомление:', notifError);
    }

    res.json({ 
      success: true, 
      message: 'Объявление отклонено' 
    });
  } catch (error) {
    console.error('Ошибка при отклонении объявления:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/properties/:id - Удалить объявление (только для админа)
 */
app.delete('/api/properties/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Объявление не найдено' });
    }

    // Удаляем объявление
    db.prepare('DELETE FROM properties WHERE id = ?').run(id);

    res.json({ 
      success: true, 
      message: 'Объявление успешно удалено' 
    });
  } catch (error) {
    console.error('Ошибка при удалении объявления:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Обработка ошибок БД
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err);
  
  // Специальная обработка ошибок базы данных
  if (err.message?.includes('locked') || 
      err.message?.includes('SQLITE_BUSY') || 
      err.message?.includes('SQLITE_LOCKED') ||
      err.code?.includes('SQLITE_BUSY') ||
      err.code?.includes('SQLITE_LOCKED')) {
    console.error('⚠️ Ошибка блокировки БД:', err.message);
    return res.status(503).json({ 
      success: false, 
      error: 'База данных временно недоступна. Попробуйте позже.',
      retryable: true
    });
  }
  
  // Ошибки целостности данных
  if (err.message?.includes('UNIQUE constraint') || 
      err.message?.includes('FOREIGN KEY constraint')) {
    return res.status(409).json({ 
      success: false, 
      error: err.message || 'Нарушение целостности данных'
    });
  }
  
  // Общие ошибки
  res.status(500).json({ 
    success: false, 
    error: 'Внутренняя ошибка сервера',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📡 API доступен по адресу: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Остановка сервера...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Остановка сервера...');
  closeDatabase();
  process.exit(0);
});

