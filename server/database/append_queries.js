const fs = require('fs');
const path = require('path');

const databasePath = path.join(__dirname, 'database.js');
const queriesPath = path.join(__dirname, 'all_property_queries.js');

// Читаем содержимое обоих файлов
const databaseContent = fs.readFileSync(databasePath, 'utf8');
const queriesContent = fs.readFileSync(queriesPath, 'utf8');

// Проверяем, не добавлены ли уже queries
if (databaseContent.includes('export const apartmentQueries')) {
  console.log('⚠️ Queries уже добавлены в database.js');
  process.exit(0);
}

// Убираем export из queries, так как они будут добавлены в тот же файл
// Но на самом деле export нужен, так как они экспортируются из database.js
// Просто добавляем queries в конец файла
const newContent = databaseContent.trim() + '\n\n' + queriesContent;

// Записываем обратно
fs.writeFileSync(databasePath, newContent, 'utf8');
console.log('✅ Queries успешно добавлены в database.js');
