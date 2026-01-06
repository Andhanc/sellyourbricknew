# ✅ Проверка файла .env для EmailJS

## Правильная структура файла .env:

```env
# EmailJS настройки
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_yzcrytx
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

## Что проверить:

### ✅ 1. Все три переменные должны начинаться с `VITE_`
- `VITE_EMAILJS_SERVICE_ID` ✅
- `VITE_EMAILJS_TEMPLATE_ID` ✅
- `VITE_EMAILJS_PUBLIC_KEY` ✅

### ✅ 2. Формат значений:

**Service ID:**
- Должен начинаться с `service_`
- Пример: `service_abc123` или `service_gmail123`

**Template ID:**
- Должен начинаться с `template_`
- У вас должен быть: `template_yzcrytx`

**Public Key:**
- Длинная строка из букв и цифр
- Пример: `abc123def456ghi789` или `user_xxxxxxxxxxxxx`
- Обычно 20-30 символов

### ✅ 3. Синтаксис:

- **НЕ должно быть пробелов** вокруг знака `=`
- **НЕ должно быть кавычек** вокруг значений
- Каждая переменная на отдельной строке

### ❌ Неправильно:
```env
VITE_EMAILJS_SERVICE_ID = "service_abc123"  # ❌ Пробелы и кавычки
VITE_EMAILJS_SERVICE_ID="service_abc123"    # ❌ Кавычки
VITE_EMAILJS_SERVICE_ID = service_abc123    # ❌ Пробелы
```

### ✅ Правильно:
```env
VITE_EMAILJS_SERVICE_ID=service_abc123       # ✅
VITE_EMAILJS_TEMPLATE_ID=template_yzcrytx   # ✅
VITE_EMAILJS_PUBLIC_KEY=abc123def456ghi789  # ✅
```

## Пример полного файла .env:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Google OAuth (если используется)
VITE_GOOGLE_CLIENT_ID=...

# WhatsApp (если используется)
VITE_GREEN_API_URL=https://api.green-api.com
VITE_GREEN_API_ID=...
VITE_GREEN_API_TOKEN=...

# EmailJS для отправки кодов подтверждения
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_yzcrytx
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

## ⚠️ Важные замечания:

1. **Файл должен называться `.env.local`** (или `.env` для разработки)
2. **НЕ коммитьте** файл в Git (он уже в .gitignore)
3. **Перезапустите сервер** после изменения .env:
   ```bash
   # Остановите сервер (Ctrl+C)
   npm run dev
   ```

## 🔍 Как проверить, что переменные загружены:

Откройте консоль браузера (F12) и выполните:
```javascript
console.log(import.meta.env.VITE_EMAILJS_SERVICE_ID)
console.log(import.meta.env.VITE_EMAILJS_TEMPLATE_ID)
console.log(import.meta.env.VITE_EMAILJS_PUBLIC_KEY)
```

Если все три значения не `undefined`, значит переменные загружены правильно!

