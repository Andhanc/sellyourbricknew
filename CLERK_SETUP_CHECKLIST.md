# Чеклист настройки Clerk для OAuth (Google и Facebook)

## ✅ Проверка настроек в Clerk Dashboard

### 1. Проверка API ключей
- [ ] Перейдите в [Clerk Dashboard](https://dashboard.clerk.com/)
- [ ] Выберите ваше приложение
- [ ] Перейдите в **API Keys** (https://dashboard.clerk.com/last-active?path=api-keys)
- [ ] Убедитесь, что используете **Publishable Key** (начинается с `pk_test_` или `pk_live_`)
- [ ] Проверьте, что ключ в `.env.local` совпадает с ключом в Dashboard

### 2. Настройка OAuth провайдеров

#### Google OAuth:
- [ ] Перейдите в **User & Authentication** → **Social Connections**
- [ ] Найдите **Google** в списке провайдеров
- [ ] Убедитесь, что Google **включен** (переключатель должен быть активен)
- [ ] Если Google не настроен:
  - Нажмите на Google
  - Нажмите **"Connect"** или **"Configure"**
  - Вам нужно будет:
    1. Создать проект в [Google Cloud Console](https://console.cloud.google.com/)
    2. Включить Google+ API
    3. Создать OAuth 2.0 Client ID
    4. Добавить Authorized redirect URIs:
       - `https://YOUR_CLERK_DOMAIN/v1/oauth_callback`
       - `http://localhost:5173` (для разработки)
    5. Скопировать Client ID и Client Secret в Clerk

#### Facebook OAuth:
- [ ] Перейдите в **User & Authentication** → **Social Connections**
- [ ] Найдите **Facebook** в списке провайдеров
- [ ] Убедитесь, что Facebook **включен** (переключатель должен быть активен)
- [ ] Если Facebook не настроен:
  - Нажмите на Facebook
  - Нажмите **"Connect"** или **"Configure"**
  - Вам нужно будет:
    1. Создать приложение в [Facebook Developers](https://developers.facebook.com/)
    2. Получить App ID и App Secret
    3. Добавить Valid OAuth Redirect URIs:
       - `https://YOUR_CLERK_DOMAIN/v1/oauth_callback`
       - `http://localhost:5173` (для разработки)
    4. Скопировать App ID и App Secret в Clerk

### 3. Проверка Redirect URLs
- [ ] В Clerk Dashboard перейдите в **Paths**
- [ ] Убедитесь, что настроены правильные пути:
  - **Sign-in URL**: `/sign-in` (или ваш путь)
  - **Sign-up URL**: `/sign-up` (или ваш путь)
  - **After sign-in URL**: `/profile`
  - **After sign-up URL**: `/profile`

### 4. Проверка домена
- [ ] В Clerk Dashboard перейдите в **Domains**
- [ ] Убедитесь, что ваш домен добавлен (для production)
- [ ] Для разработки должен быть доступен `localhost:5173`

## 🔍 Диагностика проблем

### Проверка в консоли браузера:
1. Откройте DevTools (F12)
2. Перейдите на вкладку Console
3. Войдите через Google/Facebook
4. Проверьте логи:
   - Должны быть логи `=== CLERK DEBUG INFO ===`
   - Проверьте значения `Is signed in`, `Has user object`, `Has session`

### Проверка в Network:
1. Откройте DevTools → Network
2. Войдите через Google/Facebook
3. Найдите запросы к `clerk.com` или `clerk.accounts.dev`
4. Проверьте, есть ли ошибки (красные запросы)

### Проверка localStorage:
1. Откройте DevTools → Application → Local Storage
2. После авторизации должны появиться:
   - `isLoggedIn: "true"`
   - `userName`
   - `userEmail`
   - `userPicture`

## ⚠️ Частые проблемы:

1. **OAuth провайдер не включен в Dashboard** - самая частая проблема ✅ (у вас подключено)
2. **Неправильные Redirect URIs в Google/Facebook** - **КРИТИЧНО!** Должны указывать на домен Clerk, НЕ на localhost
3. **Неправильный Publishable Key** - проверьте, что используете правильный ключ
4. **CORS ошибки** - проверьте настройки доменов в Clerk
5. **Проблема после OAuth редиректа** - Clerk может не сразу определить пользователя (если Redirect URIs неправильные)

## 🔴 КРИТИЧНО: Redirect URIs

**Самая частая проблема** - неправильные Redirect URIs в Google/Facebook.

### ❌ НЕПРАВИЛЬНО:
- `http://localhost:5173` 
- `http://localhost:5173/profile`
- `http://localhost:5173/callback`

### ✅ ПРАВИЛЬНО:
- `https://YOUR_CLERK_DOMAIN/v1/oauth_callback`
- Пример: `https://meet-hound-54.clerk.accounts.dev/v1/oauth_callback`

### Как найти ваш домен Clerk:
1. Откройте [Clerk Dashboard](https://dashboard.clerk.com/)
2. Выберите ваше приложение
3. Перейдите в **Domains**
4. Там будет указан ваш домен (например: `meet-hound-54.clerk.accounts.dev`)
5. Используйте этот домен в Redirect URIs

## 🔧 Важно проверить в Dashboard:

### Проверка Redirect URIs в Google/Facebook:
1. **Для Google:**
   - Откройте [Google Cloud Console](https://console.cloud.google.com/)
   - Перейдите в **APIs & Services** → **Credentials**
   - Найдите ваш OAuth 2.0 Client ID
   - В **Authorized redirect URIs** должны быть:
     - `https://YOUR_CLERK_DOMAIN/v1/oauth_callback` (замените YOUR_CLERK_DOMAIN на ваш домен Clerk)
     - Пример: `https://meet-hound-54.clerk.accounts.dev/v1/oauth_callback`

2. **Для Facebook:**
   - Откройте [Facebook Developers](https://developers.facebook.com/)
   - Перейдите в ваше приложение → **Settings** → **Basic**
   - В **Valid OAuth Redirect URIs** должны быть:
     - `https://YOUR_CLERK_DOMAIN/v1/oauth_callback`
     - Пример: `https://meet-hound-54.clerk.accounts.dev/v1/oauth_callback`

### Как узнать ваш домен Clerk:
- В Clerk Dashboard перейдите в **Domains**
- Там будет указан ваш домен (например: `meet-hound-54.clerk.accounts.dev`)

## 📝 Что проверить в коде:

1. `VITE_CLERK_PUBLISHABLE_KEY` в `.env.local` правильный
2. `ClerkProvider` обернут вокруг всего приложения
3. Используется правильный метод аутентификации (`authenticateWithRedirect`)
4. После редиректа проверьте консоль - должны быть логи `ClerkAuthHandler` и `ClerkDebug`

