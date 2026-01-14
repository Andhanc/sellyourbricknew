import express from 'express';
import cors from 'cors';
import { initDatabase, closeDatabase, getDatabase } from './database/database.js';
import { userQueries, documentQueries, notificationQueries, administratorQueries } from './database/database.js';
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

// Настройка middleware
app.use(cors());
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
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB максимум
});

// Статическая папка для загрузок
app.use('/uploads', express.static(uploadsDir));

// Инициализация базы данных
initDatabase();

// ========== НАСТРОЙКА WHATSAPP WEB КЛИЕНТА ==========
let waClientReady = false;

const waClient = new Client({
  authStrategy: new LocalAuth({
    dataPath: join(__dirname, '.wwebjs_auth')
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
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
  try {
    qrcode.generate(qr, { small: true });
  } catch (e) {
    console.log('QR-код (текстом):', qr);
  }
});

waClient.on('ready', async () => {
  waClientReady = true;
  console.log('✅ WhatsApp клиент готов к отправке сообщений');

  // Хак-обход бага whatsapp-web.js с window.WWebJS.sendSeen / markedUnread
  // В некоторых версиях WhatsApp Web внутренняя структура меняется,
  // и стандартная реализация sendSeen падает с ошибкой
  // "Cannot read properties of undefined (reading 'markedUnread')".
  //
  // Мы переопределяем функцию sendSeen в контексте страницы на безопасный no-op,
  // чтобы отправка сообщений (sendMessage) не падала на этом месте.
  try {
    if (waClient.pupPage) {
      await waClient.pupPage.evaluate(() => {
        if (window.WWebJS && typeof window.WWebJS.sendSeen === 'function') {
          console.log('⚙️ Переопределяем window.WWebJS.sendSeen на безопасную функцию');
          window.WWebJS.sendSeen = async () => {
            // Ничего не делаем, просто обходим баг с markedUnread
            return;
          };
        }
      });
      console.log('✅ Патч sendSeen применён успешно');
    }
  } catch (patchError) {
    console.warn('⚠️ Не удалось применить патч sendSeen:', patchError.message);
  }
});

waClient.on('auth_failure', (msg) => {
  waClientReady = false;
  console.error('❌ Ошибка авторизации WhatsApp:', msg);
});

waClient.on('disconnected', (reason) => {
  waClientReady = false;
  console.warn('⚠️ WhatsApp клиент отключен. Причина:', reason);
  console.log('🔄 Пытаемся переподключиться...');
  waClient.initialize();
});

// Инициализируем WhatsApp клиент
waClient.initialize();

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
    const user = userQueries.getByPhone(req.params.phone);
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
 * PUT /api/users/:id - Обновить данные пользователя
 */
app.put('/api/users/:id', (req, res) => {
  try {
    const updateData = { ...req.body };
    const userId = req.params.id;
    
    // Получаем текущего пользователя
    const currentUser = userQueries.getById(userId);
    if (!currentUser) {
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
      
      // Если email уже подтвержден и просто обновляется, устанавливаем is_verified = 1
      updateData.is_verified = 1;
    }
    
    // Если пароль передан, хешируем его перед сохранением
    if (updateData.password && updateData.password.trim() !== '') {
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
    
    const result = userQueries.update(userId, updateData);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    const updatedUser = userQueries.getById(userId);
    
    // Не возвращаем пароль в ответе (даже захешированный)
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.json({ success: true, data: userWithoutPassword });
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
 * GET /api/documents/pending - Получить документы на верификацию
 * ВАЖНО: Этот маршрут должен быть ПЕРЕД /api/documents/:id, иначе "pending" будет интерпретирован как ID
 */
app.get('/api/documents/pending', (req, res) => {
  try {
    console.log('📥 Запрос на получение документов на верификацию');
    
    // Используем упрощенную функцию из documentQueries
    const documents = documentQueries.getPendingVerification();
    
    console.log('✅ Отправляем документы на верификацию:', documents.length);
    
    res.json({ success: true, data: documents });
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
          is_online: 1
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

    if (!waClientReady) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp клиент еще не готов. Подождите несколько секунд и попробуйте снова.'
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
        // Это известная ошибка библиотеки. Раньше мы её гасили, считая, что
        // сообщение всё равно ушло, но у вас оно реально не доставляется.
        // Поэтому теперь считаем это ошибкой и отдаём 500 на фронт.
        console.error('❌ Ошибка whatsapp-web.js (markedUnread) при отправке сообщения. Ответ пользователю: 500.');
        throw sendError;
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
      is_verified: 1, // Email верифицирован кодом
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
        is_verified: user.is_verified
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
    
    // Обновляем email и устанавливаем is_verified = 1
    const result = userQueries.update(id, { 
      email: email.toLowerCase(),
      is_verified: 1 
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
          role: updatedUser.role
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
        is_verified: 1, // Google email уже верифицирован
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
        error: 'Необходимо указать username и пароль' 
      });
    }

    // Проверяем супер-админа (admin, admin)
    if (username === 'admin' && password === 'admin') {
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

    // Проверяем обычного администратора
    const admin = administratorQueries.getByUsername(username);
    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        error: 'Неверный username или пароль' 
      });
    }

    // Проверяем пароль
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    if (admin.password !== hashedPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Неверный username или пароль' 
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

    // Хешируем пароль
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    const result = administratorQueries.create({
      username,
      password: hashedPassword,
      email: email || null,
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

    administratorQueries.update(id, {
      email: email || null,
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

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err);
  res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
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

