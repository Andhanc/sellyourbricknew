# Инструкция по загрузке проекта на GitHub

## Быстрый способ (запустите setup-git.bat)

Просто дважды кликните на файл `setup-git.bat` в проводнике Windows, и все команды выполнятся автоматически.

---

## Ручной способ (если bat файл не работает)

Откройте **Git Bash** или **Command Prompt (cmd)** в папке проекта и выполните команды по порядку:

### 1. Инициализация Git
```bash
git init
```

### 2. Добавление всех файлов
```bash
git add .
```

### 3. Создание первого коммита
```bash
git commit -m "Initial commit: новая версия проекта"
```

### 4. Подключение вашего репозитория
```bash
git remote add origin https://github.com/Andhanc/sellyourbricknew.git
```

### 5. Переименование ветки в main (если нужно)
```bash
git branch -M main
```

### 6. Загрузка на GitHub
```bash
git push -u origin main --force
```

⚠️ **Внимание:** Флаг `--force` перезапишет старую версию в репозитории, если она там есть.

---

## Если возникли проблемы

### Проблема: "remote origin already exists"
Решение: Удалите старый remote и добавьте заново
```bash
git remote remove origin
git remote add origin https://github.com/Andhanc/sellyourbricknew.git
```

### Проблема: "Authentication failed"
Решение: Вам нужно будет авторизоваться. GitHub может запросить:
- Personal Access Token (рекомендуется)
- Или использовать GitHub Desktop
- Или настроить SSH ключи

### Проблема: "Permission denied"
Решение: Убедитесь, что у вас есть права на запись в репозиторий `Andhanc/sellyourbricknew`

---

## Альтернативный способ через GitHub Desktop

1. Откройте GitHub Desktop
2. File → Add Local Repository
3. Выберите папку проекта
4. Publish repository
5. Выберите репозиторий `sellyourbricknew`

---

После успешной загрузки ваш проект будет доступен по адресу:
**https://github.com/Andhanc/sellyourbricknew**

