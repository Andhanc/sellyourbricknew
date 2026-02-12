/**
 * Скрипт для проверки конфигурации Dev Tunnels
 * Запустите: node check-dev-tunnels.js
 */

import { readFileSync } from 'fs';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Проверка конфигурации Dev Tunnels...\n');

// Проверка .env.local
const envPath = join(__dirname, '.env.local');
let envContent = '';

if (existsSync(envPath)) {
  envContent = readFileSync(envPath, 'utf-8');
  console.log('✅ Файл .env.local найден');
} else {
  console.log('❌ Файл .env.local не найден');
  console.log('   Создайте файл .env.local и добавьте:');
  console.log('   VITE_API_BASE_URL=https://xxxxx-3000.euw.devtunnels.ms/api\n');
  process.exit(1);
}

// Проверка VITE_API_BASE_URL
const apiBaseUrlMatch = envContent.match(/VITE_API_BASE_URL=(.+)/);
const reactAppApiBaseUrlMatch = envContent.match(/REACT_APP_API_BASE_URL=(.+)/);

const apiBaseUrl = apiBaseUrlMatch?.[1]?.trim() || reactAppApiBaseUrlMatch?.[1]?.trim();

if (!apiBaseUrl) {
  console.log('❌ VITE_API_BASE_URL или REACT_APP_API_BASE_URL не найден в .env.local');
  console.log('   Добавьте в .env.local:');
  console.log('   VITE_API_BASE_URL=https://xxxxx-3000.euw.devtunnels.ms/api\n');
  process.exit(1);
}

console.log(`✅ API Base URL найден: ${apiBaseUrl}`);

// Проверка формата URL
if (!apiBaseUrl.startsWith('http')) {
  console.log('⚠️  ВНИМАНИЕ: API Base URL не начинается с http:// или https://');
  console.log('   Это может быть проблемой для dev tunnels');
  console.log('   Рекомендуется использовать полный URL: https://xxxxx-3000.euw.devtunnels.ms/api\n');
}

if (apiBaseUrl.includes('localhost') || apiBaseUrl.includes('127.0.0.1')) {
  console.log('⚠️  ВНИМАНИЕ: API Base URL указывает на localhost');
  console.log('   Это не будет работать для внешних тестировщиков через dev tunnels');
  console.log('   Используйте dev tunnel URL: https://xxxxx-3000.euw.devtunnels.ms/api\n');
}

if (apiBaseUrl.includes('devtunnels.ms')) {
  console.log('✅ API Base URL использует dev tunnels домен');
} else {
  console.log('⚠️  API Base URL не использует dev tunnels домен');
  console.log('   Убедитесь, что это правильный URL для тестирования\n');
}

// Проверка порта сервера
console.log('\n📋 Следующие шаги:');
console.log('1. Убедитесь, что бэкенд запущен: npm run server');
console.log('2. Создайте dev tunnel для порта 3000');
console.log('3. Обновите VITE_API_BASE_URL в .env.local с правильным URL');
console.log('4. Перезапустите фронтенд: npm run dev');
console.log('\n✅ Проверка завершена!\n');










