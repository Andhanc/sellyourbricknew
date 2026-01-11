import { createWorker } from 'tesseract.js'

/**
 * Распознает текст с изображения используя Tesseract.js
 * @param {File|string} image - Файл изображения или URL изображения
 * @param {string} lang - Язык для распознавания (по умолчанию 'rus+eng' - русский + английский)
 * @returns {Promise<string>} Распознанный текст
 */
export async function recognizeTextFromImage(image, lang = 'rus+eng') {
  const worker = await createWorker(lang)
  
  try {
    console.log('Начало распознавания текста с изображения...')
    
    const { data: { text } } = await worker.recognize(image)
    
    console.log('Распознавание текста завершено')
    
    // Очищаем текст от лишних пробелов и переносов строк
    const cleanedText = text.trim()
    
    return cleanedText
  } catch (error) {
    console.error('Ошибка при распознавании текста:', error)
    throw error
  } finally {
    await worker.terminate()
  }
}

/**
 * Распознает текст с изображения и выводит в консоль
 * @param {File|string} image - Файл изображения или URL изображения
 * @param {string} lang - Язык для распознавания (по умолчанию 'rus+eng')
 * @returns {Promise<string>} Распознанный текст
 */
export async function recognizeTextAndLog(image, lang = 'rus+eng') {
  try {
    const text = await recognizeTextFromImage(image, lang)
    
    console.log('========================================')
    console.log('РАСПОЗНАННЫЙ ТЕКСТ С ИЗОБРАЖЕНИЯ:')
    console.log('========================================')
    console.log(text)
    console.log('========================================')
    console.log(`Всего символов: ${text.length}`)
    console.log(`Всего строк: ${text.split('\n').filter(line => line.trim()).length}`)
    console.log('========================================')
    
    return text
  } catch (error) {
    console.error('Ошибка при распознавании и выводе текста:', error)
    throw error
  }
}

