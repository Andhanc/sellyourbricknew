# Проверка изменений для Git

## ✅ Что ДОЛЖНО быть в package.json:

```json
{
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "start": "concurrently -n \"SERVER,FRONTEND\" -c \"blue,green\" \"npm run server\" \"npm run dev\""
  },
  "dependencies": {
    "concurrently": "^8.2.2",
    "vite": "^5.0.8",
    // ... остальные
  }
}
```

## 🔍 Проверка изменений:

Выполните в терминале:

```bash
# 1. Проверить, что concurrently установлен
npm list concurrently

# 2. Проверить package-lock.json
npm ci --dry-run

# 3. Проверить статус всех файлов
git status --untracked-files=all

# 4. Проверить, отслеживаются ли новые файлы
git ls-files nixpacks.toml Procfile .nvmrc

# 5. Если файлы не отслеживаются, добавить их
git add nixpacks.toml Procfile .nvmrc .node-version

# 6. Принудительно обновить package-lock.json
git add -f package-lock.json

# 7. Проверить изменения
git status
```

## 📝 Если git status показывает "nothing to commit":

1. **Проверьте последний коммит:**
   ```bash
   git log --oneline -1
   git show HEAD:package.json | grep -A 2 "concurrently\|vite"
   ```

2. **Проверьте, что package-lock.json содержит concurrently:**
   ```bash
   grep -c "concurrently" package-lock.json
   ```

3. **Если нужно пересоздать package-lock.json:**
   ```bash
   rm package-lock.json
   npm install
   git add package-lock.json
   git status
   ```
