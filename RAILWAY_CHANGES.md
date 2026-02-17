# Изменения для Railway деплоя

## 📦 package.json - Обязательные изменения:

### 1. Добавить секцию `engines` (если её нет):
```json
"engines": {
  "node": ">=20.0.0"
}
```

### 2. Добавить скрипт `start`:
```json
"scripts": {
  "start": "concurrently -n \"SERVER,FRONTEND\" -c \"blue,green\" \"npm run server\" \"npm run dev\""
}
```

### 3. Переместить `concurrently` и `vite` в `dependencies` (НЕ в devDependencies):
```json
"dependencies": {
  "concurrently": "^8.2.2",
  "vite": "^5.0.8",
  // ... остальные зависимости
}
```

### 4. В `devDependencies` должны остаться только:
```json
"devDependencies": {
  "@types/react": "^19.2.2",
  "@types/react-dom": "^19.2.2",
  "@vitejs/plugin-react": "^5.1.0",
  "baseline-browser-mapping": "^2.9.19"
}
```

## 📄 package-lock.json

**ВАЖНО:** `package-lock.json` должен быть:
- ✅ Закоммичен в репозиторий
- ✅ Синхронизирован с `package.json`
- ✅ Содержать все зависимости `concurrently` (chalk, date-fns, lodash, rxjs и т.д.)

## 📝 Другие файлы для Railway:

### nixpacks.toml (создать в корне):
```toml
[phases.setup]
nixPkgs = ["nodejs-20_x", "python3"]

[phases.install]
cmds = ["npm install --legacy-peer-deps"]

[start]
cmd = "npm start"
```

### Procfile (создать в корне):
```
web: npm start
```

### .nvmrc (создать в корне):
```
20
```

## ✅ Проверка перед коммитом:

1. Убедитесь, что `concurrently` установлен локально:
   ```bash
   npm install concurrently
   ```

2. Проверьте, что `package-lock.json` обновлен:
   ```bash
   npm ci --dry-run
   ```

3. Проверьте статус git:
   ```bash
   git status
   git add package.json package-lock.json nixpacks.toml Procfile .nvmrc
   git commit -m "Configure Railway deployment"
   ```

## 🔍 Если git status показывает "nothing to commit":

Возможные причины:
1. Все файлы уже закоммичены - проверьте последний коммит
2. Файлы в .gitignore - проверьте `.gitignore`
3. Файлы не отслеживаются - добавьте их явно: `git add -f nixpacks.toml`

## 🔐 Переменные окружения для Railway:

**ОБЯЗАТЕЛЬНО** установите следующие переменные в Railway Dashboard → Variables:

### Обязательные переменные:
```
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_... (или VITE_CLERK_PUBLISHABLE_KEY)
SERVER_PORT=3000
```

### Рекомендуемые переменные:
```
NODE_ENV=production (опционально - режим определяется автоматически по наличию PORT)
```

### Опциональные переменные (если используются):
```
REACT_APP_GOOGLE_CLIENT_ID=... (или VITE_GOOGLE_CLIENT_ID)
REACT_APP_EMAILJS_SERVICE_ID=... (или VITE_EMAILJS_SERVICE_ID)
REACT_APP_EMAILJS_TEMPLATE_ID=... (или VITE_EMAILJS_TEMPLATE_ID)
REACT_APP_EMAILJS_PUBLIC_KEY=... (или VITE_EMAILJS_PUBLIC_KEY)
REACT_APP_API_BASE_URL=/api (или VITE_API_BASE_URL)
```

**Как установить:**
1. Откройте Railway Dashboard
2. Выберите ваш проект
3. Перейдите в раздел **Variables**
4. Добавьте каждую переменную с её значением
5. После добавления Railway автоматически перезапустит приложение

**Важно:** 
- Можно использовать префикс `REACT_APP_` или `VITE_` (оба поддерживаются)
- `PORT` устанавливается Railway автоматически - НЕ добавляйте его вручную
- `SERVER_PORT` должен быть `3000` (порт для бэкенд-сервера)