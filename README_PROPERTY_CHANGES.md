# Изменения в хранении недвижимости

## Что изменилось?

Теперь недвижимость хранится в **двух отдельных таблицах** вместо одной:

### 1. Таблица `properties_apartments`
**Для квартир и коммерческой недвижимости**
- Типы: `apartment`, `commercial`
- Основное поле: `rooms` (количество комнат)
- **Удобства хранятся в JSON массиве** `amenities`:
  ```json
  ["balcony", "parking", "elevator", "electricity", "internet", "security", "furniture", "feature1", "feature2", ...]
  ```

### 2. Таблица `properties_houses`
**Для домов и вилл**
- Типы: `house`, `villa`
- Основное поле: `bedrooms` (количество спален)
- **Удобства хранятся в JSON массиве** `amenities`:
  ```json
  ["pool", "garden", "garage", "parking", "electricity", "internet", "security", "furniture", "feature1", "feature2", ...]
  ```

## Преимущества нового подхода

✅ **Четкое разделение данных** - каждый тип недвижимости имеет только свои специфичные поля  
✅ **Меньше NULL значений** - в базе данных хранятся только релевантные данные  
✅ **Удобства в виде массива** - проще фильтровать и искать по удобствам  
✅ **Упрощенная валидация** - разные правила для разных типов  
✅ **Лучшая производительность** - оптимизированные запросы  

## Как работает API?

### Создание недвижимости
```http
POST /api/properties
```

API **автоматически определяет**, в какую таблицу сохранить недвижимость, основываясь на `property_type`:
- `apartment` или `commercial` → `properties_apartments`
- `house` или `villa` → `properties_houses`

**Ответ включает информацию о таблице:**
```json
{
  "success": true,
  "data": { /* данные объекта */ },
  "message": "Объявление успешно отправлено на модерацию",
  "table": "apartments" // или "houses"
}
```

### Получение недвижимости
```http
GET /api/properties/:id?type=apartment  // для квартир
GET /api/properties/:id?type=house      // для домов
```

Параметр `type` определяет, из какой таблицы читать данные.

## Различия в полях

### Только для квартир/апартаментов:
- `rooms` - количество комнат
- `floor` - этаж
- `apartment` - номер квартиры
- `commercial_type` - тип коммерческой недвижимости
- `business_hours` - часы работы

### Только для домов/вилл:
- `bedrooms` - количество спален
- `land_area` - площадь участка
- `floors` - количество этажей дома (сохраняется в `total_floors`)

### Общие поля:
- `area` - общая площадь
- `living_area` - жилая площадь
- `building_type` - тип здания
- `bathrooms` - количество санузлов
- `year_built` - год постройки
- `location`, `address`, `city`, `country`, `coordinates` - местоположение
- `renovation`, `condition`, `heating`, `water_supply`, `sewerage` - характеристики
- `photos`, `videos`, `additional_documents` - медиафайлы
- `test_drive` - тест-драйв
- `moderation_status` - статус модерации

## Миграция данных

При первом запуске сервера после обновления автоматически создаются новые таблицы:
1. `properties_apartments`
2. `properties_houses`

Старая таблица `properties` **сохраняется** для обратной совместимости.

## Что нужно обновить?

### На фронтенде (AddProperty.jsx):
Ничего! Компонент уже работает корректно. API автоматически определяет нужную таблицу.

### На бэкенде:
✅ Создана миграция `create_separate_property_tables.sql`  
✅ Добавлены функции `apartmentQueries` и `houseQueries` в `database.js`  
✅ Обновлен POST endpoint `/api/properties` для работы с новыми таблицами  

## Примеры работы с удобствами

### Для квартир/апартаментов:
```javascript
// При сохранении
const amenities = [];
if (balcony) amenities.push('balcony');
if (parking) amenities.push('parking');
if (elevator) amenities.push('elevator');
// ... и так далее
// Сохраняется в БД как JSON

// При чтении
const property = apartmentQueries.getById(id);
const hasBalcony = property.amenities.includes('balcony');
```

### Для домов/вилл:
```javascript
// При сохранении
const amenities = [];
if (pool) amenities.push('pool');
if (garden) amenities.push('garden');
if (garage) amenities.push('garage');
// ... и так далее

// При чтении
const property = houseQueries.getById(id);
const hasPool = property.amenities.includes('pool');
```

## Поддержка

Если возникнут вопросы или проблемы:
1. Проверьте файл `PROPERTY_TABLES_INFO.md` для детальной информации
2. Логи сервера покажут, в какую таблицу сохраняется объект
3. В ответе API есть поле `table`, показывающее используемую таблицу
