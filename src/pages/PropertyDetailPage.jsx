import { useParams, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { properties } from '../data/properties'
import PropertyDetailClassic from './PropertyDetailClassic'
import { isAuthenticated } from '../services/authService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// Обёртка над страницей объекта:
// Теперь используем единый «классический» layout PropertyDetailClassic
// Для аукционных объектов внутри него отображаются:
// - таймер аукциона
// - блок с аукционной информацией и кнопкой «История ставок»
const PropertyDetailPage = () => {
  const { id } = useParams()
  const location = useLocation()
  const { user, isLoaded: userLoaded } = useUser()
  const [property, setProperty] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Получаем объект из state (если передан из MainPage)
  const propertyFromState = location.state?.property

  // Проверка авторизации - пользователь должен быть залогинен для просмотра объектов
  useEffect(() => {
    // Проверяем авторизацию через Clerk или старую систему
    const isClerkAuth = userLoaded && user
    const isOldAuth = isAuthenticated()

    // Если пользователь не авторизован - сразу показываем сообщение
    if (userLoaded && !isClerkAuth && !isOldAuth) {
      console.warn('⚠️ Доступ запрещен: пользователь не авторизован')
      setError('Требуется авторизация')
      setIsLoading(false)
    }
  }, [userLoaded, user])

  useEffect(() => {
    const loadProperty = async () => {
      // Проверяем авторизацию перед загрузкой
      const isClerkAuth = userLoaded && user
      const isOldAuth = isAuthenticated()

      if (!isClerkAuth && !isOldAuth) {
        // Не загружаем данные, если не авторизован
        return
      }

      // Если объект передан из state, нормализуем его так же, как данные из API
      if (propertyFromState) {
        console.log('🔄 PropertyDetailPage - Данные из state (propertyFromState):', propertyFromState)
        // Нормализуем данные из state, чтобы они были в том же формате, что и из API
        const normalizedStateProperty = {
          ...propertyFromState,
          // Убеждаемся, что все поля присутствуют
          title: propertyFromState.title || propertyFromState.name || '',
          name: propertyFromState.title || propertyFromState.name || '',
          description: propertyFromState.description || '',
          location: propertyFromState.location || '',
          price: (propertyFromState.price !== undefined && propertyFromState.price !== null && propertyFromState.price !== '') 
            ? Number(propertyFromState.price) 
            : null,
          area: propertyFromState.area !== undefined && propertyFromState.area !== null 
            ? propertyFromState.area 
            : (propertyFromState.sqft || 0),
          sqft: propertyFromState.sqft !== undefined && propertyFromState.sqft !== null 
            ? propertyFromState.sqft 
            : (propertyFromState.area || 0),
          living_area: propertyFromState.living_area !== undefined && propertyFromState.living_area !== null && propertyFromState.living_area !== '' 
            ? propertyFromState.living_area 
            : (propertyFromState.livingArea || null),
          livingArea: propertyFromState.living_area !== undefined && propertyFromState.living_area !== null && propertyFromState.living_area !== '' 
            ? propertyFromState.living_area 
            : (propertyFromState.livingArea || null),
          rooms: propertyFromState.rooms !== undefined && propertyFromState.rooms !== null 
            ? propertyFromState.rooms 
            : (propertyFromState.beds || propertyFromState.bedrooms || 0),
          beds: propertyFromState.beds !== undefined && propertyFromState.beds !== null 
            ? propertyFromState.beds 
            : (propertyFromState.rooms || propertyFromState.bedrooms || 0),
          bedrooms: propertyFromState.bedrooms !== undefined && propertyFromState.bedrooms !== null 
            ? propertyFromState.bedrooms 
            : (propertyFromState.rooms || propertyFromState.beds || 0),
          bathrooms: propertyFromState.bathrooms !== undefined && propertyFromState.bathrooms !== null 
            ? propertyFromState.bathrooms 
            : (propertyFromState.baths || 0),
          baths: propertyFromState.baths !== undefined && propertyFromState.baths !== null 
            ? propertyFromState.baths 
            : (propertyFromState.bathrooms || 0),
          floor: propertyFromState.floor !== undefined && propertyFromState.floor !== null && propertyFromState.floor !== '' 
            ? propertyFromState.floor 
            : null,
          total_floors: propertyFromState.total_floors !== undefined && propertyFromState.total_floors !== null && propertyFromState.total_floors !== '' 
            ? propertyFromState.total_floors 
            : (propertyFromState.totalFloors || null),
          year_built: propertyFromState.year_built !== undefined && propertyFromState.year_built !== null && propertyFromState.year_built !== '' 
            ? propertyFromState.year_built 
            : null,
          building_type: propertyFromState.building_type !== undefined && propertyFromState.building_type !== null && propertyFromState.building_type !== '' 
            ? propertyFromState.building_type 
            : (propertyFromState.buildingType || null),
          buildingType: propertyFromState.building_type !== undefined && propertyFromState.building_type !== null && propertyFromState.building_type !== '' 
            ? propertyFromState.building_type 
            : (propertyFromState.buildingType || null),
          property_type: propertyFromState.property_type || propertyFromState.propertyType || 'apartment',
          land_area: propertyFromState.land_area || null,
          // Координаты
          coordinates: propertyFromState.coordinates || null,
          // Убеждаемся, что is_auction правильно установлен
          is_auction: propertyFromState.is_auction === true || 
                     propertyFromState.is_auction === 1 || 
                     propertyFromState.isAuction === true,
          isAuction: propertyFromState.is_auction === true || 
                     propertyFromState.is_auction === 1 || 
                     propertyFromState.isAuction === true,
          // Убеждаемся, что все поля удобств правильно обработаны
          balcony: propertyFromState.balcony === true || propertyFromState.balcony === 1 || propertyFromState.balcony === '1' || propertyFromState.balcony === 'true',
          parking: propertyFromState.parking === true || propertyFromState.parking === 1 || propertyFromState.parking === '1' || propertyFromState.parking === 'true',
          elevator: propertyFromState.elevator === true || propertyFromState.elevator === 1 || propertyFromState.elevator === '1' || propertyFromState.elevator === 'true',
          garage: propertyFromState.garage === true || propertyFromState.garage === 1 || propertyFromState.garage === '1' || propertyFromState.garage === 'true',
          pool: propertyFromState.pool === true || propertyFromState.pool === 1 || propertyFromState.pool === '1' || propertyFromState.pool === 'true',
          garden: propertyFromState.garden === true || propertyFromState.garden === 1 || propertyFromState.garden === '1' || propertyFromState.garden === 'true',
          electricity: propertyFromState.electricity === true || propertyFromState.electricity === 1 || propertyFromState.electricity === '1' || propertyFromState.electricity === 'true',
          internet: propertyFromState.internet === true || propertyFromState.internet === 1 || propertyFromState.internet === '1' || propertyFromState.internet === 'true',
          security: propertyFromState.security === true || propertyFromState.security === 1 || propertyFromState.security === '1' || propertyFromState.security === 'true',
          furniture: propertyFromState.furniture === true || propertyFromState.furniture === 1 || propertyFromState.furniture === '1' || propertyFromState.furniture === 'true',
          // Дополнительная информация
          renovation: propertyFromState.renovation || null,
          condition: propertyFromState.condition || null,
          heating: propertyFromState.heating || null,
          water_supply: propertyFromState.water_supply || null,
          sewerage: propertyFromState.sewerage || null,
          commercial_type: propertyFromState.commercial_type || null,
          business_hours: propertyFromState.business_hours || null,
          additional_amenities: propertyFromState.additional_amenities !== undefined && propertyFromState.additional_amenities !== null && propertyFromState.additional_amenities !== '' 
            ? propertyFromState.additional_amenities 
            : (propertyFromState.additionalAmenities || null),
          additionalAmenities: propertyFromState.additional_amenities !== undefined && propertyFromState.additional_amenities !== null && propertyFromState.additional_amenities !== '' 
            ? propertyFromState.additional_amenities 
            : (propertyFromState.additionalAmenities || null),
          // Тест-драйв
          test_drive: propertyFromState.test_drive !== undefined 
            ? (propertyFromState.test_drive === 1 || propertyFromState.test_drive === true || propertyFromState.test_drive === '1' || propertyFromState.test_drive === 'true') 
            : false,
          testDrive: propertyFromState.testDrive !== undefined 
            ? propertyFromState.testDrive 
            : (propertyFromState.test_drive !== undefined 
                ? (propertyFromState.test_drive === 1 || propertyFromState.test_drive === true || propertyFromState.test_drive === '1' || propertyFromState.test_drive === 'true') 
                : false),
          // Аукционные поля
          auction_start_date: propertyFromState.auction_start_date || null,
          auction_end_date: propertyFromState.auction_end_date || propertyFromState.endTime || null,
          endTime: propertyFromState.endTime || propertyFromState.auction_end_date || null,
          auction_starting_price: propertyFromState.auction_starting_price || propertyFromState.auctionStartingPrice || null,
          auctionStartingPrice: propertyFromState.auction_starting_price || propertyFromState.auctionStartingPrice || null,
          currentBid: propertyFromState.currentBid || null,
          // Валюта
          currency: propertyFromState.currency || 'USD',
          // Документы
          ownership_document: propertyFromState.ownership_document || propertyFromState.ownershipDocument || null,
          ownershipDocument: propertyFromState.ownership_document || propertyFromState.ownershipDocument || null,
          no_debts_document: propertyFromState.no_debts_document || propertyFromState.noDebtsDocument || null,
          noDebtsDocument: propertyFromState.no_debts_document || propertyFromState.noDebtsDocument || null,
          additional_documents: propertyFromState.additional_documents || propertyFromState.additionalDocuments || null,
          additionalDocuments: propertyFromState.additional_documents || propertyFromState.additionalDocuments || null,
          // Медиа
          images: propertyFromState.images || [],
          videos: propertyFromState.videos || null,
        }
        console.log('✅ PropertyDetailPage - Нормализованные данные из state:', normalizedStateProperty)
        setProperty(normalizedStateProperty)
        setIsLoading(false)
        return
      }

      // Иначе загружаем из API
      if (id) {
        try {
          setIsLoading(true)
          const response = await fetch(`${API_BASE_URL}/properties/${id}`)
          if (response.ok) {
            const result = await response.json()
            console.log('📥 PropertyDetailPage - Ответ от API:', result)
            if (result.success && result.data) {
              const prop = result.data
              console.log('📥 PropertyDetailPage - Данные объекта (prop) - ВСЕ ПОЛЯ:', prop)
              console.log('📥 PropertyDetailPage - КРИТИЧЕСКИЕ ПОЛЯ из API (prop):', {
                id: prop.id,
                title: prop.title,
                price: prop.price,
                auction_starting_price: prop.auction_starting_price,
                area: prop.area,
                sqft: prop.sqft,
                rooms: prop.rooms,
                bedrooms: prop.bedrooms,
                bathrooms: prop.bathrooms,
                floor: prop.floor,
                total_floors: prop.total_floors,
                year_built: prop.year_built,
                building_type: prop.building_type,
                living_area: prop.living_area,
                balcony: prop.balcony,
                parking: prop.parking,
                elevator: prop.elevator,
                garage: prop.garage,
                pool: prop.pool,
                garden: prop.garden,
                electricity: prop.electricity,
                internet: prop.internet,
                security: prop.security,
                furniture: prop.furniture,
                is_auction: prop.is_auction,
                renovation: prop.renovation,
                condition: prop.condition,
                heating: prop.heating,
                water_supply: prop.water_supply,
                sewerage: prop.sewerage,
                additional_amenities: prop.additional_amenities,
                test_drive: prop.test_drive,
              })
              console.log('📥 PropertyDetailPage - ВСЕ ПОЛЯ из API (prop):', prop)
              console.log('📥 PropertyDetailPage - Ключевые поля из API:', {
                rooms: prop.rooms,
                bedrooms: prop.bedrooms,
                bathrooms: prop.bathrooms,
                area: prop.area,
                living_area: prop.living_area,
                floor: prop.floor,
                total_floors: prop.total_floors,
                year_built: prop.year_built,
                building_type: prop.building_type,
                balcony: prop.balcony,
                parking: prop.parking,
                elevator: prop.elevator,
                price: prop.price,
                auction_starting_price: prop.auction_starting_price,
                test_drive: prop.test_drive,
                test_drive_type: typeof prop.test_drive,
              })
              console.log('📥 PropertyDetailPage - Все поля из API:', {
                rooms: prop.rooms,
                bedrooms: prop.bedrooms,
                bathrooms: prop.bathrooms,
                area: prop.area,
                living_area: prop.living_area,
                floor: prop.floor,
                total_floors: prop.total_floors,
                year_built: prop.year_built,
                building_type: prop.building_type,
                balcony: prop.balcony,
                parking: prop.parking,
                elevator: prop.elevator,
                garage: prop.garage,
                pool: prop.pool,
                garden: prop.garden,
                electricity: prop.electricity,
                internet: prop.internet,
                security: prop.security,
                furniture: prop.furniture,
                price: prop.price,
                auction_starting_price: prop.auction_starting_price,
              })
              console.log('📥 PropertyDetailPage - Координаты (raw):', prop.coordinates, typeof prop.coordinates)
              
              // Получаем базовый URL без /api
              const baseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '')
              
              // Обрабатываем фотографии
              let processedImages = []
              if (prop.photos && Array.isArray(prop.photos) && prop.photos.length > 0) {
                processedImages = prop.photos.map(photo => {
                  if (typeof photo === 'string') {
                    const photoStr = photo.trim()
                    // Data URL (base64) - используем как есть
                    if (photoStr.startsWith('data:')) {
                      return photoStr
                    }
                    // Полный HTTP/HTTPS URL - используем как есть
                    else if (photoStr.startsWith('http://') || photoStr.startsWith('https://')) {
                      return photoStr
                    }
                    // Путь начинается с /uploads/ - добавляем базовый URL
                    else if (photoStr.startsWith('/uploads/')) {
                      return `${baseUrl}${photoStr}`
                    }
                    // Путь начинается с uploads/ без слеша - добавляем / и базовый URL
                    else if (photoStr.startsWith('uploads/')) {
                      return `${baseUrl}/${photoStr}`
                    }
                    // Относительный путь - добавляем /uploads/
                    else {
                      return `${baseUrl}/uploads/${photoStr}`
                    }
                  } else if (photo && typeof photo === 'object' && photo.url) {
                    const photoUrl = String(photo.url).trim()
                    if (photoUrl.startsWith('data:')) {
                      return photoUrl
                    } else if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
                      return photoUrl
                    } else if (photoUrl.startsWith('/uploads/')) {
                      return `${baseUrl}${photoUrl}`
                    } else if (photoUrl.startsWith('uploads/')) {
                      return `${baseUrl}/${photoUrl}`
                    } else {
                      return `${baseUrl}/uploads/${photoUrl}`
                    }
                  }
                  return photo
                })
              }
              
              // Если нет фотографий, используем дефолтное изображение
              if (processedImages.length === 0) {
                processedImages = ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80']
              }
              
              // Обрабатываем видео
              let processedVideos = []
              if (prop.videos && Array.isArray(prop.videos) && prop.videos.length > 0) {
                processedVideos = prop.videos.map(video => {
                  // Если видео - строка, пытаемся определить тип
                  if (typeof video === 'string') {
                    // Проверяем, является ли это YouTube URL
                    const youtubeMatch = video.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
                    if (youtubeMatch) {
                      return {
                        type: 'youtube',
                        videoId: youtubeMatch[1],
                        url: video
                      }
                    }
                    // Проверяем, является ли это Google Drive URL
                    const driveMatch = video.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
                    if (driveMatch) {
                      return {
                        type: 'googledrive',
                        videoId: driveMatch[1],
                        url: video
                      }
                    }
                    // Иначе считаем обычным URL
                    return {
                      type: 'file',
                      url: video
                    }
                  } else if (video && typeof video === 'object') {
                    // Если видео - объект, используем его как есть
                    return video
                  }
                  return video
                })
              }
              
              // Обрабатываем координаты
              let coordinates = [53.9045, 27.5615] // Дефолтные координаты (Минск)
              if (prop.coordinates) {
                try {
                  if (typeof prop.coordinates === 'string') {
                    const parsed = JSON.parse(prop.coordinates)
                    if (Array.isArray(parsed) && parsed.length >= 2) {
                      const lat = parseFloat(parsed[0])
                      const lng = parseFloat(parsed[1])
                      // Проверяем, что координаты валидны (широта: -90 до 90, долгота: -180 до 180)
                      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                        coordinates = [lat, lng]
                      } else {
                        console.warn('⚠️ Некорректные координаты:', { lat, lng })
                      }
                    }
                  } else if (Array.isArray(prop.coordinates) && prop.coordinates.length >= 2) {
                    const lat = parseFloat(prop.coordinates[0])
                    const lng = parseFloat(prop.coordinates[1])
                    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                      coordinates = [lat, lng]
                    } else {
                      console.warn('⚠️ Некорректные координаты:', { lat, lng })
                    }
                  }
                } catch (e) {
                  console.warn('Ошибка парсинга coordinates:', e)
                }
              }
              
              console.log('📍 Координаты объекта:', {
                raw: prop.coordinates,
                processed: coordinates,
                location: prop.location
              })
              
              // Преобразуем данные из базы в формат для компонентов
              // ВАЖНО: Используем все поля из prop, даже если они null или undefined
              const formattedProperty = {
                id: prop.id,
                title: prop.title || prop.name || '',
                name: prop.title || prop.name || '',
                description: prop.description || '',
                location: prop.location || '',
                // Минимальная цена продажи - для аукционов это отдельное поле price (НЕ смешивать с auction_starting_price!)
                price: (prop.price !== undefined && prop.price !== null && prop.price !== '') 
                  ? Number(prop.price) 
                  : null,
                currentBid: (prop.auction_starting_price !== undefined && prop.auction_starting_price !== null && prop.auction_starting_price !== '') 
                  ? Number(prop.auction_starting_price) 
                  : 0,
                // Площадь - обрабатываем все форматы (числа, строки, null)
                area: (prop.area !== undefined && prop.area !== null && prop.area !== '') 
                  ? (typeof prop.area === 'string' ? parseFloat(prop.area) || 0 : Number(prop.area) || 0) 
                  : 0,
                sqft: (prop.area !== undefined && prop.area !== null && prop.area !== '') 
                  ? (typeof prop.area === 'string' ? parseFloat(prop.area) || 0 : Number(prop.area) || 0)
                  : ((prop.sqft !== undefined && prop.sqft !== null && prop.sqft !== '') 
                      ? (typeof prop.sqft === 'string' ? parseFloat(prop.sqft) || 0 : Number(prop.sqft) || 0) 
                      : 0),
                living_area: (prop.living_area !== undefined && prop.living_area !== null && prop.living_area !== '') 
                  ? prop.living_area 
                  : null,
                livingArea: (prop.living_area !== undefined && prop.living_area !== null && prop.living_area !== '') 
                  ? prop.living_area 
                  : null,
                // Комнаты - обрабатываем все форматы
                rooms: (prop.rooms !== undefined && prop.rooms !== null && prop.rooms !== '') 
                  ? (typeof prop.rooms === 'string' ? parseInt(prop.rooms, 10) || 0 : Number(prop.rooms) || 0)
                  : ((prop.bedrooms !== undefined && prop.bedrooms !== null && prop.bedrooms !== '') 
                      ? (typeof prop.bedrooms === 'string' ? parseInt(prop.bedrooms, 10) || 0 : Number(prop.bedrooms) || 0)
                      : 0),
                beds: (prop.bedrooms !== undefined && prop.bedrooms !== null && prop.bedrooms !== '') 
                  ? (typeof prop.bedrooms === 'string' ? parseInt(prop.bedrooms, 10) || 0 : Number(prop.bedrooms) || 0)
                  : ((prop.rooms !== undefined && prop.rooms !== null && prop.rooms !== '') 
                      ? (typeof prop.rooms === 'string' ? parseInt(prop.rooms, 10) || 0 : Number(prop.rooms) || 0)
                      : ((prop.beds !== undefined && prop.beds !== null && prop.beds !== '') 
                          ? (typeof prop.beds === 'string' ? parseInt(prop.beds, 10) || 0 : Number(prop.beds) || 0) 
                          : 0)),
                bedrooms: (prop.bedrooms !== undefined && prop.bedrooms !== null && prop.bedrooms !== '') 
                  ? (typeof prop.bedrooms === 'string' ? parseInt(prop.bedrooms, 10) || 0 : Number(prop.bedrooms) || 0)
                  : ((prop.rooms !== undefined && prop.rooms !== null && prop.rooms !== '') 
                      ? (typeof prop.rooms === 'string' ? parseInt(prop.rooms, 10) || 0 : Number(prop.rooms) || 0) 
                      : 0),
                // Ванные - обрабатываем все форматы
                bathrooms: (prop.bathrooms !== undefined && prop.bathrooms !== null && prop.bathrooms !== '') 
                  ? (typeof prop.bathrooms === 'string' ? parseInt(prop.bathrooms, 10) || 0 : Number(prop.bathrooms) || 0)
                  : ((prop.baths !== undefined && prop.baths !== null && prop.baths !== '') 
                      ? (typeof prop.baths === 'string' ? parseInt(prop.baths, 10) || 0 : Number(prop.baths) || 0) 
                      : 0),
                baths: (prop.baths !== undefined && prop.baths !== null && prop.baths !== '') 
                  ? (typeof prop.baths === 'string' ? parseInt(prop.baths, 10) || 0 : Number(prop.baths) || 0)
                  : ((prop.bathrooms !== undefined && prop.bathrooms !== null && prop.bathrooms !== '') 
                      ? (typeof prop.bathrooms === 'string' ? parseInt(prop.bathrooms, 10) || 0 : Number(prop.bathrooms) || 0) 
                      : 0),
                // Этаж и этажность
                floor: (prop.floor !== undefined && prop.floor !== null && prop.floor !== '') 
                  ? (typeof prop.floor === 'string' ? (prop.floor.trim() === '' ? null : prop.floor) : prop.floor) 
                  : null,
                total_floors: (prop.total_floors !== undefined && prop.total_floors !== null && prop.total_floors !== '') 
                  ? (typeof prop.total_floors === 'string' ? (prop.total_floors.trim() === '' ? null : prop.total_floors) : prop.total_floors) 
                  : null,
                // Год постройки
                year_built: (prop.year_built !== undefined && prop.year_built !== null && prop.year_built !== '') 
                  ? (typeof prop.year_built === 'string' ? (prop.year_built.trim() === '' ? null : prop.year_built) : prop.year_built) 
                  : null,
                // Тип недвижимости
                property_type: prop.property_type || 'apartment',
                // Тип дома
                building_type: (prop.building_type !== undefined && prop.building_type !== null && prop.building_type !== '') 
                  ? prop.building_type 
                  : null,
                buildingType: (prop.building_type !== undefined && prop.building_type !== null && prop.building_type !== '') 
                  ? prop.building_type 
                  : null,
                coordinates: coordinates,
                images: processedImages,
                videos: processedVideos,
                // Дополнительные характеристики - проверяем разные форматы (сохраняем исходные значения из БД)
                balcony: prop.balcony === 1 || prop.balcony === true || prop.balcony === '1' || prop.balcony === 'true',
                parking: prop.parking === 1 || prop.parking === true || prop.parking === '1' || prop.parking === 'true',
                elevator: prop.elevator === 1 || prop.elevator === true || prop.elevator === '1' || prop.elevator === 'true',
                land_area: prop.land_area || null,
                garage: prop.garage === 1 || prop.garage === true || prop.garage === '1' || prop.garage === 'true',
                pool: prop.pool === 1 || prop.pool === true || prop.pool === '1' || prop.pool === 'true',
                garden: prop.garden === 1 || prop.garden === true || prop.garden === '1' || prop.garden === 'true',
                renovation: prop.renovation || null,
                condition: prop.condition || null,
                heating: prop.heating || null,
                water_supply: prop.water_supply || null,
                sewerage: prop.sewerage || null,
                electricity: prop.electricity === 1 || prop.electricity === true || prop.electricity === '1' || prop.electricity === 'true',
                internet: prop.internet === 1 || prop.internet === true || prop.internet === '1' || prop.internet === 'true',
                security: prop.security === 1 || prop.security === true || prop.security === '1' || prop.security === 'true',
                furniture: prop.furniture === 1 || prop.furniture === true || prop.furniture === '1' || prop.furniture === 'true',
                commercial_type: prop.commercial_type || null,
                business_hours: prop.business_hours || null,
                currency: prop.currency || 'USD',
                is_auction: prop.is_auction === 1 || prop.is_auction === true || prop.isAuction === true,
                isAuction: prop.is_auction === 1 || prop.is_auction === true || prop.isAuction === true,
                auction_start_date: (prop.auction_start_date !== undefined && prop.auction_start_date !== null && prop.auction_start_date !== '') ? prop.auction_start_date : null,
                auction_end_date: (prop.auction_end_date !== undefined && prop.auction_end_date !== null && prop.auction_end_date !== '') ? prop.auction_end_date : null,
                auction_starting_price: (prop.auction_starting_price !== undefined && prop.auction_starting_price !== null && prop.auction_starting_price !== '' && prop.auction_starting_price !== 0) 
                  ? Number(prop.auction_starting_price) 
                  : null,
                endTime: (prop.auction_end_date !== undefined && prop.auction_end_date !== null && prop.auction_end_date !== '') ? prop.auction_end_date : null, // Для компонента PropertyDetail
                additional_amenities: (prop.additional_amenities !== undefined && prop.additional_amenities !== null && prop.additional_amenities !== '') ? prop.additional_amenities : null,
                test_drive: prop.test_drive !== undefined ? (prop.test_drive === 1 || prop.test_drive === true || prop.test_drive === '1' || prop.test_drive === 'true') : false,
                testDrive: prop.testDrive !== undefined ? prop.testDrive : (prop.test_drive !== undefined ? (prop.test_drive === 1 || prop.test_drive === true || prop.test_drive === '1' || prop.test_drive === 'true') : false),
                // Информация о продавце
                seller: prop.first_name && prop.last_name 
                  ? `${prop.first_name} ${prop.last_name}` 
                  : 'Продавец',
                sellerEmail: prop.email || null,
                sellerPhone: prop.phone_number || null,
                // Документы
                ownership_document: prop.ownership_document || null,
                no_debts_document: prop.no_debts_document || null,
                additional_documents: prop.additional_documents || null,
              }
              
              console.log('✅ Загружено объявление (formattedProperty):', {
                id: formattedProperty.id,
                title: formattedProperty.title,
                price: formattedProperty.price,
                auction_starting_price: formattedProperty.auction_starting_price,
                currency: formattedProperty.currency,
                is_auction: formattedProperty.is_auction,
                auction_end_date: formattedProperty.auction_end_date,
                area: formattedProperty.area,
                sqft: formattedProperty.sqft,
                rooms: formattedProperty.rooms,
                bedrooms: formattedProperty.bedrooms,
                bathrooms: formattedProperty.bathrooms,
                floor: formattedProperty.floor,
                total_floors: formattedProperty.total_floors,
                year_built: formattedProperty.year_built,
                building_type: formattedProperty.building_type,
                living_area: formattedProperty.living_area,
                images_count: formattedProperty.images.length,
                coordinates: formattedProperty.coordinates,
                amenities: {
                  balcony: formattedProperty.balcony,
                  parking: formattedProperty.parking,
                  elevator: formattedProperty.elevator,
                  garage: formattedProperty.garage,
                  pool: formattedProperty.pool,
                  garden: formattedProperty.garden,
                  electricity: formattedProperty.electricity,
                  internet: formattedProperty.internet,
                  security: formattedProperty.security,
                  furniture: formattedProperty.furniture,
                }
              })
              console.log('💰 ЦЕНЫ - СЫРЫЕ ДАННЫЕ из API (prop):', {
                prop_price: prop.price,
                prop_auction_starting_price: prop.auction_starting_price,
                равны: prop.price === prop.auction_starting_price,
              })
              console.log('💰 ЦЕНЫ - ПОСЛЕ ФОРМАТИРОВАНИЯ (formattedProperty):', {
                formattedProperty_price: formattedProperty.price,
                formattedProperty_auction_starting_price: formattedProperty.auction_starting_price,
                равны: formattedProperty.price === formattedProperty.auction_starting_price,
              })
              setProperty(formattedProperty)
            } else {
              setError('Объявление не найдено')
            }
          } else {
            setError('Ошибка при загрузке объявления')
          }
        } catch (err) {
          console.error('Ошибка загрузки объявления:', err)
          setError('Ошибка при загрузке объявления')
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    loadProperty()
  }, [id, propertyFromState, userLoaded, user])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <p>Загрузка...</p>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        {error === 'Требуется авторизация' ? (
          <>
            <div style={{
              fontSize: '60px',
              marginBottom: '20px'
            }}>🔒</div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '12px',
              fontFamily: 'Montserrat, sans-serif'
            }}>
              Требуется авторизация
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              fontFamily: 'Montserrat, sans-serif'
            }}>
              Пожалуйста, войдите в систему для просмотра детальной информации об объектах
            </p>
          </>
        ) : (
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            fontFamily: 'Montserrat, sans-serif'
          }}>
            {error || 'Объявление не найдено'}
          </p>
        )}
      </div>
    )
  }
  
  const searchParams = new URLSearchParams(location.search)
  const isClassicFromQuery = searchParams.get('classic') === '1'

  // Определяем, является ли объект аукционным
  const hasAuctionFlag =
    property.is_auction === true ||
    property.is_auction === 1 ||
    property.isAuction === true

  const hasEndTime =
    (property.endTime != null && property.endTime !== '') ||
    (property.auction_end_date != null && property.auction_end_date !== '')

  const isAuction = hasAuctionFlag && hasEndTime

  // Если явно запрошен классический (неаукционный) вид через ?classic=1,
  // принудительно отключаем аукционный режим
  const finalIsAuction = isClassicFromQuery ? false : isAuction

  // Проверяем, находимся ли мы в кабинете продавца (по URL или другим признакам)
  // Если пользователь пришел из кабинета продавца, показываем документы
  const isOwnerDashboard = location.pathname.includes('/owner') || 
                           document.referrer.includes('/owner') ||
                           location.state?.fromOwnerDashboard

  // Всегда используем PropertyDetailClassic, передавая флаг аукциона
  return (
    <PropertyDetailClassic
      property={{ ...property, isAuction: finalIsAuction }}
      showDocuments={isOwnerDashboard}
    />
  )
}

export default PropertyDetailPage


