# Используем официальный образ Node.js
FROM node:20-slim

# Устанавливаем системные зависимости для better-sqlite3 и Puppeteer
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libglib2.0-0 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    libatspi2.0-0 \
    libxshmfence1 \
    libx11-6 \
    libxss1 \
    libxcb1 \
    libxau6 \
    libxdmcp6 \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --legacy-peer-deps

# Копируем остальные файлы
COPY . .

# Открываем порт для Vite (Railway установит PORT автоматически)
# EXPOSE - это только метаданные, реальный порт определяется переменной PORT от Railway
# Vite будет слушать на PORT (Railway установит, например 8080)
# Сервер будет слушать на SERVER_PORT (3000, нужно установить в Railway Variables)
EXPOSE 8080

# Запускаем приложение
CMD ["npm", "start"]
