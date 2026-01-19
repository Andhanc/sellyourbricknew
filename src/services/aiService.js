const AI_API_URL = "https://api.intelligence.io.solutions/api/v1/chat/completions";
const AI_MODEL = "deepseek-ai/DeepSeek-V3.2";
const AI_API_KEY = "io-v2-eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJvd25lciI6ImE5YzAwNjc4LTFjNzEtNDY5Ny1hY2NiLTliYTU0NTdhMWU4NSIsImV4cCI6NDkyMTI0NDg2NX0.E92VNc-ri_VH1bRLZfJ4seHnvr_hdL0vzgBbRC97WYDaENrvqU-jV1gYxqG128Tvyf8yfEczZ9hfpdKeZ2E0UA";

/**
 * Отправляет запрос к AI для подбора недвижимости
 * @param {Array} conversationHistory - История сообщений чата
 * @param {Object} userPreferences - Предпочтения пользователя (цель, бюджет, локация и т.д.)
 * @param {Array} availableProperties - Доступные объявления недвижимости
 * @returns {Promise<Object>} Ответ от AI с текстом и возможными кнопками
 */
export async function askPropertyAssistant(conversationHistory, userPreferences, availableProperties) {
  // Подсчитываем количество собранной информации
  const collectedInfoCount = Object.values(userPreferences).filter(v => v !== null && v !== '').length
  
  const systemPrompt = `Ты — профессиональный консультант по недвижимости, специализирующийся на подборе недвижимости в Испании и Дубае. Твоя задача — помочь клиенту найти идеальный вариант недвижимости.

**ТВОЯ РОЛЬ:**
- Задавай уточняющие вопросы, чтобы понять потребности клиента
- Минимум 3-4 уточнения перед рекомендацией (сейчас собрано: ${collectedInfoCount})
- Будь дружелюбным и профессиональным
- Рекомендуй только недвижимость из доступных объявлений

**ДОСТУПНАЯ НЕДВИЖИМОСТЬ:**
${JSON.stringify(availableProperties.map(p => ({
  id: p.id,
  name: p.name || p.title || `Объявление ${p.id}`,
  title: p.title || p.name || `Объявление ${p.id}`,
  location: p.location || 'Локация не указана',
  price: p.price || 0,
  area: p.area || p.sqft || null,
  rooms: p.rooms || p.beds || null,
  description: (p.description || '').substring(0, 200)
})), null, 2)}

**ПРЕДПОЧТЕНИЯ КЛИЕНТА:**
${JSON.stringify(userPreferences, null, 2)}

**ПРАВИЛА:**
1. Если не хватает информации (цель, бюджет, локация, тип недвижимости), задавай вопросы
2. Используй кнопки для быстрого выбора (цель: для себя/под сдачу/инвестиции)
3. После сбора информации (минимум 3-4 уточнения) рекомендую конкретные объявления
4. В рекомендациях указывай ID объявлений в массиве recommendations
5. Работай только с недвижимостью в Испании и Дубае
6. Отвечай на русском языке
7. Будь кратким и по делу
8. При рекомендации учитывай все предпочтения клиента
9. ВСЕГДА уточняй бюджет в ЕВРО (€), не в рублях. Все цены на недвижимость указаны в евро.

**ФОРМАТ ОТВЕТА:**
Отвечай ТОЛЬКО в формате JSON (без дополнительного текста):
{
  "text": "Текст ответа",
  "buttons": ["Вариант 1", "Вариант 2"] или null,
  "needsMoreInfo": true/false,
  "recommendations": [1, 2, 3] или null
}

Если нужны уточнения, установи "needsMoreInfo": true и предложи кнопки для выбора.
Если готов дать рекомендации (после 3-4 уточнений), установи "recommendations" с массивом ID объявлений (максимум 5 рекомендаций).`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }))
  ];

  try {
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${AI_API_KEY}`
    };

    const payload = {
      "model": AI_MODEL,
      "messages": messages,
      "temperature": 0.7
    };

    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error ${response.status}: ${errorText}`);
      
      if (response.status === 401) {
        return {
          text: "Ошибка: неверный API ключ. Проверьте настройки AI сервиса.",
          buttons: null,
          needsMoreInfo: false,
          recommendations: null
        };
      }
      
      return {
        text: "Ошибка подключения к AI-сервису. Попробуйте позже.",
        buttons: null,
        needsMoreInfo: false,
        recommendations: null
      };
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      let messageContent = data.choices[0].message?.content || "";

      // Удаляем возможные служебные метки
      while (messageContent.includes("</think>")) {
        messageContent = messageContent.split("</think>").pop().trim();
      }
      messageContent = messageContent.replace(/<\/?redacted_reasoning>/g, "").trim();
      messageContent = messageContent.replace(/<\/?think>/g, "").trim();

      // Пытаемся распарсить JSON из ответа
      try {
        // Ищем JSON в ответе (может быть обернут в markdown код блоки)
        let jsonText = messageContent;
        
        // Удаляем markdown код блоки если есть
        jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        // Ищем JSON объект
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Валидируем recommendations - должны быть массивом чисел
          let recommendations = parsed.recommendations;
          if (recommendations && Array.isArray(recommendations)) {
            recommendations = recommendations
              .map(id => {
                const numId = typeof id === 'string' ? parseInt(id, 10) : id;
                return isNaN(numId) ? null : numId;
              })
              .filter(id => id !== null);
          } else {
            recommendations = null;
          }
          
          return {
            text: parsed.text || messageContent,
            buttons: Array.isArray(parsed.buttons) ? parsed.buttons : null,
            needsMoreInfo: parsed.needsMoreInfo !== false,
            recommendations: recommendations
          };
        }
      } catch (parseError) {
        console.log("Не удалось распарсить JSON, используем текст как есть:", parseError);
      }

      // Если не удалось распарсить, возвращаем текст
      if (!messageContent || !messageContent.trim()) {
        messageContent = "К сожалению, не удалось получить ответ от AI-сервиса. Попробуйте переформулировать вопрос.";
      }

      return {
        text: messageContent,
        buttons: null,
        needsMoreInfo: true,
        recommendations: null
      };
    } else {
      console.error("Unexpected API response format:", data);
      return {
        text: "Не удалось получить ответ от сервиса. Попробуйте позже.",
        buttons: null,
        needsMoreInfo: false,
        recommendations: null
      };
    }
  } catch (error) {
    console.error("AI Service Error:", error);
    
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      return {
        text: "Запрос занимает слишком много времени. Попробуйте упростить вопрос.",
        buttons: null,
        needsMoreInfo: false,
        recommendations: null
      };
    }
    
    if (error.message?.includes('Network') || error.message?.includes('fetch')) {
      return {
        text: "Ошибка сети. Проверьте подключение к интернету.",
        buttons: null,
        needsMoreInfo: false,
        recommendations: null
      };
    }

    return {
      text: `Произошла ошибка при обработке запроса: ${error.message || 'Неизвестная ошибка'}. Попробуйте позже.`,
      buttons: null,
      needsMoreInfo: false,
      recommendations: null
    };
  }
}

/**
 * Извлекает данные из распознанного текста паспорта с помощью AI
 * @param {string} recognizedText - Текст, распознанный с фото паспорта (OCR)
 * @returns {Promise<Object>} Объект с извлеченными данными паспорта
 */
export async function extractPassportData(recognizedText) {
  const systemPrompt = `Ты специалист по извлечению данных из документов. Твоя задача - проанализировать распознанный текст с фото паспорта и извлечь структурированные данные.

**ТВОЯ РОЛЬ:**
- Анализируй предоставленный текст, распознанный с фото паспорта
- Извлекай максимально много информации для заполнения полей формы пользователя
- Будь точным и аккуратным при извлечении данных

**ПОЛЯ ДЛЯ ИЗВЛЕЧЕНИЯ:**
1. firstName (Имя) - имя владельца паспорта
2. lastName (Фамилия) - фамилия владельца паспорта
3. middleName (Отчество) - отчество, если есть
4. passportSeries (Серия паспорта) - первые 2 цифры серии паспорта
5. passportNumber (Номер паспорта) - номер паспорта (обычно 7 цифр)
6. identificationNumber (Идентификационный номер) - персональный идентификационный номер
7. address (Адрес) - адрес регистрации/проживания
8. email (Email) - если есть в документе

**ВАЖНО:**
- Извлекай только данные, которые точно присутствуют в тексте
- Если поле не найдено, оставляй его пустым (null)
- Для passportSeries извлекай только первые 2 цифры
- Для passportNumber извлекай только цифры (без серии)
- Нормализуй имена и фамилии (первая буква заглавная, остальные строчные)
- Если текст не содержит данных паспорта, верни объект с null значениями

**ФОРМАТ ОТВЕТА:**
Отвечай ТОЛЬКО в формате JSON (без дополнительного текста):
{
  "firstName": "Имя или null",
  "lastName": "Фамилия или null",
  "middleName": "Отчество или null",
  "passportSeries": "XX или null",
  "passportNumber": "XXXXXXX или null",
  "identificationNumber": "XXXXXXXXXXXXX или null",
  "address": "Адрес или null",
  "email": "email@example.com или null"
}`;

  const messages = [
    { role: "system", content: systemPrompt },
    { 
      role: "user", 
      content: `Распознанный текст с фото паспорта:\n\n${recognizedText}\n\nИзвлеки данные в формате JSON.`
    }
  ];

  try {
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${AI_API_KEY}`
    };

    const payload = {
      "model": AI_MODEL,
      "messages": messages,
      "temperature": 0.1 // Низкая температура для более точного извлечения
    };

    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error ${response.status}: ${errorText}`);
      throw new Error(`AI API Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      let messageContent = data.choices[0].message?.content || "";

      // Удаляем возможные служебные метки
      while (messageContent.includes("</think>")) {
        messageContent = messageContent.split("</think>").pop().trim();
      }
      messageContent = messageContent.replace(/<\/?redacted_reasoning>/g, "").trim();
      messageContent = messageContent.replace(/<\/?think>/g, "").trim();

      // Пытаемся распарсить JSON из ответа
      try {
        let jsonText = messageContent;
        jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Валидация и нормализация данных
          return {
            firstName: parsed.firstName && parsed.firstName !== 'null' ? parsed.firstName.trim() : null,
            lastName: parsed.lastName && parsed.lastName !== 'null' ? parsed.lastName.trim() : null,
            middleName: parsed.middleName && parsed.middleName !== 'null' ? parsed.middleName.trim() : null,
            passportSeries: parsed.passportSeries && parsed.passportSeries !== 'null' ? parsed.passportSeries.trim() : null,
            passportNumber: parsed.passportNumber && parsed.passportNumber !== 'null' ? parsed.passportNumber.trim() : null,
            identificationNumber: parsed.identificationNumber && parsed.identificationNumber !== 'null' ? parsed.identificationNumber.trim() : null,
            address: parsed.address && parsed.address !== 'null' ? parsed.address.trim() : null,
            email: parsed.email && parsed.email !== 'null' ? parsed.email.trim() : null
          };
        }
      } catch (parseError) {
        console.error("Ошибка парсинга JSON от AI:", parseError);
        throw new Error("Не удалось распарсить ответ от AI");
      }

      throw new Error("AI не вернул валидный JSON");
    } else {
      throw new Error("Неожиданный формат ответа от AI");
    }
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
}

/**
 * Фильтрует недвижимость по Испании и Дубаю
 * @param {Array} properties - Массив всех объявлений
 * @returns {Array} Отфильтрованные объявления
 */
export function filterPropertiesByLocation(properties) {
  return properties.filter(property => {
    const location = property.location?.toLowerCase() || '';
    // Проверяем на Испанию (Spain, España, Tenerife, Costa Adeje, Barcelona, Madrid и т.д.)
    const isSpain = location.includes('spain') || 
                    location.includes('españa') || 
                    location.includes('испания') ||
                    location.includes('tenerife') ||
                    location.includes('costa adeje') ||
                    location.includes('barcelona') ||
                    location.includes('madrid') ||
                    location.includes('valencia') ||
                    location.includes('malaga') ||
                    location.includes('sevilla');
    
    // Проверяем на Дубай (Dubai, Дубай, UAE, ОАЭ)
    const isDubai = location.includes('dubai') || 
                    location.includes('дубай') ||
                    location.includes('uae') ||
                    location.includes('оаэ') ||
                    location.includes('emirates');
    
    return isSpain || isDubai;
  });
}

