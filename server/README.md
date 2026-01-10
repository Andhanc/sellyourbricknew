# Backend Server с SQLite

Backend сервер для работы с базой данных SQLite.

## Установка зависимостей

```bash
npm install
```

## Запуск сервера

```bash
# Обычный режим
npm run server

# Режим разработки с автоматической перезагрузкой
npm run server:dev
```

Сервер запустится на порту 3000 (или PORT из переменных окружения).

## Структура базы данных

### Таблица `users` (Пользователи)

- `id` - уникальный идентификатор (автоинкремент)
- `first_name` - имя
- `last_name` - фамилия
- `email` - почта (уникальное)
- `phone_number` - номер телефона (уникальное)
- `passport_series` - серия паспорта
- `passport_number` - номер паспорта
- `identification_number` - идентификационный номер (уникальное)
- `address` - адрес проживания
- `country` - страна
- `passport_photo` - путь к фото паспорта
- `user_photo` - путь к фото пользователя
- `is_verified` - статус верификации (0/1)
- `role` - роль (buyer, seller, admin, manager)
- `is_online` - статус онлайн (0/1)
- `created_at` - дата создания
- `updated_at` - дата обновления

### Таблица `documents` (Документы)

- `id` - уникальный идентификатор (автоинкремент)
- `user_id` - ID пользователя (внешний ключ)
- `document_type` - тип документа
- `document_photo` - путь к фото документа
- `is_reviewed` - статус просмотра (0/1)
- `reviewed_by` - ID админа/менеджера, который просмотрел
- `reviewed_at` - дата просмотра
- `created_at` - дата создания

## API Endpoints

### Пользователи

- `GET /api/users` - получить всех пользователей (query: limit, offset)
- `GET /api/users/:id` - получить пользователя по ID
- `GET /api/users/email/:email` - получить пользователя по email
- `GET /api/users/role/:role` - получить пользователей по роли
- `POST /api/users` - создать нового пользователя
- `PUT /api/users/:id` - обновить данные пользователя
- `DELETE /api/users/:id` - удалить пользователя
- `POST /api/users/:id/upload-photo` - загрузить фото пользователя (multipart/form-data, поле: user_photo)
- `POST /api/users/:id/upload-passport` - загрузить фото паспорта (multipart/form-data, поле: passport_photo)

### Документы

- `GET /api/documents` - получить все документы (query: limit, offset)
- `GET /api/documents/unreviewed` - получить непросмотренные документы
- `GET /api/documents/user/:userId` - получить документы пользователя
- `GET /api/documents/:id` - получить документ по ID
- `POST /api/documents` - создать новый документ (multipart/form-data, поля: user_id, document_type, document_photo)
- `PUT /api/documents/:id/review` - отметить документ как просмотренный (body: { reviewed_by: userId })
- `DELETE /api/documents/:id` - удалить документ

## Примеры использования

### Создание пользователя

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Иван",
    "last_name": "Иванов",
    "email": "ivan@example.com",
    "phone_number": "+79991234567",
    "role": "buyer"
  }'
```

### Загрузка фото пользователя

```bash
curl -X POST http://localhost:3000/api/users/1/upload-photo \
  -F "user_photo=@/path/to/photo.jpg"
```

### Создание документа

```bash
curl -X POST http://localhost:3000/api/documents \
  -F "user_id=1" \
  -F "document_type=паспорт" \
  -F "document_photo=@/path/to/document.jpg"
```

### Отметить документ как просмотренный

```bash
curl -X PUT http://localhost:3000/api/documents/1/review \
  -H "Content-Type: application/json" \
  -d '{
    "reviewed_by": 2
  }'
```

## Файлы базы данных

База данных SQLite создается автоматически при первом запуске сервера в файле `database.sqlite` в корне проекта.

Загруженные файлы сохраняются в папке `server/uploads/`.

## Примечания

- Максимальный размер загружаемого файла: 10MB
- Все файлы загружаются в папку `server/uploads/`
- База данных автоматически создается при первом запуске
- Внешние ключи включены для обеспечения целостности данных

