# Информация о раздельном хранении недвижимости

## Описание

В проекте используется две отдельные таблицы для хранения разных типов недвижимости:

### 1. `properties_apartments` - Квартиры и Апартаменты
- **Типы**: `apartment`, `commercial`
- **Основное поле**: `rooms` (количество комнат)
- **Удобства** (хранятся в JSON массиве `amenities`):
  - `balcony` - балкон
  - `parking` - парковка
  - `elevator` - лифт
  - `electricity` - электричество
  - `internet` - интернет
  - `security` - охрана
  - `furniture` - мебель
  - `feature1` - `feature26` - дополнительные удобства

- **Уникальные поля**:
  - `apartment` - номер квартиры
  - `floor` - этаж
  - `total_floors` - всего этажей в здании
  - `commercial_type` - тип коммерческой недвижимости
  - `business_hours` - часы работы (для коммерческой)

### 2. `properties_houses` - Дома и Виллы
- **Типы**: `house`, `villa`
- **Основное поле**: `bedrooms` (количество спален)
- **Удобства** (хранятся в JSON массиве `amenities`):
  - `pool` - бассейн
  - `garden` - сад
  - `garage` - гараж
  - `parking` - парковка
  - `electricity` - электричество
  - `internet` - интернет
  - `security` - охрана
  - `furniture` - мебель
  - `feature1` - `feature26` - дополнительные удобства

- **Уникальные поля**:
  - `land_area` - площадь участка
  - `floors` - количество этажей дома

## Общие поля для обеих таблиц

- `user_id` - ID пользователя
- `property_type` - тип недвижимости
- `title` - заголовок
- `description` - описание
- `price` - цена
- `currency` - валюта
- `is_auction` - аукцион (да/нет)
- `area` - общая площадь
- `living_area` - жилая площадь
- `building_type` - тип здания
- `bathrooms` - количество санузлов
- `year_built` - год постройки
- `location` - полный адрес
- `address` - краткий адрес
- `country` - страна
- `city` - город
- `coordinates` - координаты (JSON)
- `renovation` - ремонт
- `condition` - состояние
- `heating` - отопление
- `water_supply` - водоснабжение
- `sewerage` - канализация
- `additional_amenities` - дополнительные удобства (текст)
- `photos` - фотографии (JSON)
- `videos` - видео (JSON)
- `additional_documents` - дополнительные документы (JSON)
- `ownership_document` - документ о собственности
- `no_debts_document` - справка об отсутствии долгов
- `test_drive` - тест-драйв (да/нет)
- `test_drive_data` - данные тест-драйва (JSON)
- `moderation_status` - статус модерации
- `reviewed_by` - кто проверил
- `reviewed_at` - когда проверено
- `rejection_reason` - причина отклонения
- `created_at` - дата создания
- `updated_at` - дата обновления

## API Endpoints

### Создание недвижимости
- `POST /api/properties` - автоматически определяет таблицу по `property_type`

### Получение недвижимости
- `GET /api/properties/:id?type=apartment` - получить квартиру/апартамент
- `GET /api/properties/:id?type=house` - получить дом/виллу

### Обновление недвижимости
- `PUT /api/properties/:id?type=apartment` - обновить квартиру/апартамент
- `PUT /api/properties/:id?type=house` - обновить дом/виллу

### Удаление недвижимости
- `DELETE /api/properties/:id?type=apartment` - удалить квартиру/апартамент
- `DELETE /api/properties/:id?type=house` - удалить дом/виллу

## Преимущества раздельного хранения

1. **Четкое разделение данных** - каждый тип недвижимости имеет свои специфичные поля
2. **Оптимизация запросов** - меньше NULL значений в базе данных
3. **Упрощение валидации** - разные правила для разных типов
4. **Масштабируемость** - легче добавлять новые типы недвижимости
5. **Удобства в виде массива** - проще работать с фильтрацией и поиском по удобствам
