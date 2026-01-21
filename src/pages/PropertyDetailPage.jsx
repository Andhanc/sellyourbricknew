import { useParams, useLocation } from 'react-router-dom'
import { properties } from '../data/properties'
import PropertyDetail from './PropertyDetail'
import PropertyDetailClassic from './PropertyDetailClassic'

// Обёртка над страницей объекта:
// - аукционные объекты (isAuction === true и есть endTime) рендерятся через PropertyDetail (с таймером)
// - неаукционные (isAuction === false или нет endTime) — через PropertyDetailClassic (без таймера)
const PropertyDetailPage = () => {
  const { id } = useParams()
  const location = useLocation()
  const numericId = parseInt(id, 10)

  // Получаем объект из state (если передан из MainPage) или ищем в properties
  const propertyFromState = location.state?.property
  const propertyFromData = properties.find((p) => p.id === numericId)
  const property = propertyFromState || propertyFromData
  
  const searchParams = new URLSearchParams(location.search)
  const isClassicFromQuery = searchParams.get('classic') === '1'

  // Определяем, является ли объект аукционным
  const isAuction = property && property.isAuction === true && property.endTime != null && property.endTime !== ''

  // Если объект передан из state или найден в properties и он неаукционный
  if (property && (!isAuction || isClassicFromQuery)) {
    return <PropertyDetailClassic property={property} />
  }

  // Для аукционных объектов используем PropertyDetail (с таймером)
  // Если объект не найден, PropertyDetail покажет сообщение об ошибке
  return <PropertyDetail />
}

export default PropertyDetailPage


