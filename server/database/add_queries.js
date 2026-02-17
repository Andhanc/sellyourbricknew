import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Читаем queries из второй папки
const sourceFile = 'C:\\Проекты\\sell15.02\\sellyourbricknew\\server\\database\\database.js';
const targetFile = join(__dirname, 'database.js');

try {
  const sourceContent = fs.readFileSync(sourceFile, 'utf8');
  const targetContent = fs.readFileSync(targetFile, 'utf8');

  // Извлекаем queries из исходного файла
  const apartmentQueriesStart = sourceContent.indexOf('export const apartmentQueries = {');
  
  if (apartmentQueriesStart === -1) {
    console.error('❌ Не найдено apartmentQueries в исходном файле');
    process.exit(1);
  }

  // Находим конец propertySharesQueries
  const propertySharesStart = sourceContent.indexOf('export const propertySharesQueries = {');
  let queriesEnd = sourceContent.length;
  
  if (propertySharesStart !== -1) {
    // Ищем закрывающую скобку для propertySharesQueries
    let braceCount = 0;
    let foundStart = false;
    for (let i = propertySharesStart; i < sourceContent.length; i++) {
      if (sourceContent[i] === '{') {
        braceCount++;
        foundStart = true;
      } else if (sourceContent[i] === '}') {
        braceCount--;
        if (foundStart && braceCount === 0) {
          queriesEnd = i + 1;
          break;
        }
      }
    }
  }

  // Извлекаем все queries (от apartmentQueries до конца propertySharesQueries)
  const queriesToAdd = sourceContent.substring(apartmentQueriesStart, queriesEnd);

  // Проверяем, не добавлены ли уже queries
  if (targetContent.includes('export const apartmentQueries')) {
    console.log('⚠️ Queries уже добавлены в файл');
    process.exit(0);
  }

  // Добавляем queries в конец файла
  const newContent = targetContent.trimEnd() + '\n\n' + queriesToAdd;

  fs.writeFileSync(targetFile, newContent, 'utf8');
  console.log('✅ Queries успешно добавлены в database.js');
} catch (error) {
  console.error('❌ Ошибка:', error.message);
  process.exit(1);
}
