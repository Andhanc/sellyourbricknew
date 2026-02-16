# Настройка проекта для Railway

## Что было сделано:

1. ✅ Установлен `concurrently` для запуска двух процессов одновременно
2. ✅ Добавлен скрипт `start` в package.json
3. ✅ Настроены порты:
   - **Vite (фронтенд)**: использует `PORT` (Railway автоматически установит)
   - **Server (бэкенд)**: использует `SERVER_PORT` или 3000 по умолчанию

## Переменные окружения для Railway:

В настройках Railway добавьте:

- `SERVER_PORT=3000` - порт для бэкенд-сервера
- `API_URL=http://localhost:3000` - URL API для проксирования (или оставьте по умолчанию)

## Как это работает:

1. Railway запускает `npm start`
2. `concurrently` запускает оба процесса:
   - `npm run server` - бэкенд на порту SERVER_PORT (3000)
   - `npm run dev` - фронтенд на порту PORT (устанавливает Railway)
3. Vite проксирует запросы `/api/*` на бэкенд-сервер

## Важно:

- **Файл БД** (`server/database.sqlite`) должен быть в `.gitignore` (уже добавлен)
- Убедитесь, что БД не больше 80 МБ перед деплоем
- Если БД уже была закоммичена, удалите её из истории Git:
  ```bash
  git rm --cached server/database.sqlite
  git commit -m "Remove database.sqlite from git"
  git push origin --force --all
  ```

## Проверка:

После деплоя на Railway:
- Фронтенд будет доступен на основном URL Railway
- API будет доступно через `/api/*` (проксируется Vite на бэкенд)
