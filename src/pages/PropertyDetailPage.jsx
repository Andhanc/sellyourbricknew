import { useParams, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { properties } from '../data/properties'
import PropertyDetail from './PropertyDetail'
import PropertyDetailClassic from './PropertyDetailClassic'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// Обёртка над страницей объекта:
// - аукционные объекты (isAuction === true и есть endTime) рендерятся через PropertyDetail (с таймером)
// - неаукционные (isAuction === false или нет endTime) — через PropertyDetailClassic (без таймера)
const PropertyDetailPage = () => {
  const { id } = useParams()
  const location = useLocation()
  const [property, setProperty] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Получаем объект из state (если передан из MainPage)
  const propertyFromState = location.state?.property

  useEffect(() => {
    const loadProperty = async () => {
      // Если объект передан из state, используем его
      if (propertyFromState) {
        setProperty(propertyFromState)
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
            if (result.success && result.data) {
              const prop = result.data
              
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
              let coordinates = [28.1000, -16.7200] // Дефолтные координаты
              if (prop.coordinates) {
                try {
                  if (typeof prop.coordinates === 'string') {
                    const parsed = JSON.parse(prop.coordinates)
                    if (Array.isArray(parsed) && parsed.length >= 2) {
                      coordinates = [parseFloat(parsed[0]), parseFloat(parsed[1])]
                    }
                  } else if (Array.isArray(prop.coordinates) && prop.coordinates.length >= 2) {
                    coordinates = [parseFloat(prop.coordinates[0]), parseFloat(prop.coordinates[1])]
                  }
                } catch (e) {
                  console.warn('Ошибка парсинга coordinates:', e)
                }
              }
              
              // Преобразуем данные из базы в формат для компонентов
              const formattedProperty = {
                id: prop.id,
                title: prop.title,
                name: prop.title,
                description: prop.description || '',
                location: prop.location || '',
                price: prop.price || 0,
                currentBid: prop.price || 0, // Для аукционов
                area: prop.area || 0,
                sqft: prop.area || 0,
                rooms: prop.rooms || 0,
                beds: prop.bedrooms || prop.rooms || 0,
                bathrooms: prop.bathrooms || 0,
                floor: prop.floor || null,
                total_floors: prop.total_floors || null,
                year_built: prop.year_built || null,
                property_type: prop.property_type || 'apartment',
                coordinates: coordinates,
                images: processedImages,
                videos: processedVideos,
                // Дополнительные характеристики
                balcony: prop.balcony === 1,
                parking: prop.parking === 1,
                elevator: prop.elevator === 1,
                land_area: prop.land_area || null,
                garage: prop.garage === 1,
                pool: prop.pool === 1,
                garden: prop.garden === 1,
                renovation: prop.renovation || null,
                condition: prop.condition || null,
                heating: prop.heating || null,
                water_supply: prop.water_supply || null,
                sewerage: prop.sewerage || null,
                electricity: prop.electricity === 1,
                internet: prop.internet === 1,
                security: prop.security === 1,
                furniture: prop.furniture === 1,
                commercial_type: prop.commercial_type || null,
                business_hours: prop.business_hours || null,
                currency: prop.currency || 'USD',
                is_auction: prop.is_auction === 1 || prop.is_auction === true,
                auction_start_date: prop.auction_start_date || null,
                auction_end_date: prop.auction_end_date || null,
                auction_starting_price: prop.auction_starting_price || null,
                endTime: prop.auction_end_date || null, // Для компонента PropertyDetail
                // Информация о продавце
                seller: prop.first_name && prop.last_name 
                  ? `${prop.first_name} ${prop.last_name}` 
                  : 'Продавец',
                sellerEmail: prop.email || null,
                sellerPhone: prop.phone_number || null,
                // НЕ включаем документы (ownership_document, no_debts_document, additional_documents)
              }
              
              console.log('✅ Загружено объявление:', {
                id: formattedProperty.id,
                title: formattedProperty.title,
                price: formattedProperty.price,
                currency: formattedProperty.currency,
                is_auction: formattedProperty.is_auction,
                auction_end_date: formattedProperty.auction_end_date,
                images_count: formattedProperty.images.length,
                coordinates: formattedProperty.coordinates
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
  }, [id, propertyFromState])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <p>Загрузка...</p>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <p>{error || 'Объявление не найдено'}</p>
      </div>
    )
  }
  
  const searchParams = new URLSearchParams(location.search)
  const isClassicFromQuery = searchParams.get('classic') === '1'

  // Определяем, является ли объект аукционным
  const isAuction = property.is_auction === true && property.auction_end_date != null && property.auction_end_date !== ''

  // Если объект неаукционный
  if (!isAuction || isClassicFromQuery) {
    return <PropertyDetailClassic property={property} />
  }

  // Для аукционных объектов используем PropertyDetail (с таймером)
  // Передаем property через location.state, чтобы компонент мог его использовать
  return <PropertyDetail />
}

export default PropertyDetailPage


