import { useParams, useLocation } from 'react-router-dom'
import { properties } from '../data/properties'
import PropertyDetail from './PropertyDetail'
import PropertyDetailClassic from './PropertyDetailClassic'

// Обёртка над страницей объекта:
// - аукционные объекты (isAuction !== false) рендерятся через текущую страницу аукциона
// - неаукционные (isAuction === false) — через классическую страницу без таймера
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

  // Если объект передан из state или найден в properties и он неаукционный
  if (property && (property.isAuction === false || isClassicFromQuery || !property.endTime)) {
    return <PropertyDetailClassic property={property} />
  }

  // Для аукционных и случая, когда объект не найден, оставляем текущее поведение
  return <PropertyDetail />
}

export default PropertyDetailPage


