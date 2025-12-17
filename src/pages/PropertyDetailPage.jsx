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

  const property = properties.find((p) => p.id === numericId)
  const searchParams = new URLSearchParams(location.search)
  const isClassicFromQuery = searchParams.get('classic') === '1'

  if (property && (property.isAuction === false || isClassicFromQuery)) {
    return <PropertyDetailClassic property={property} />
  }

  // Для аукционных и случая, когда объект не найден, оставляем текущее поведение
  return <PropertyDetail />
}

export default PropertyDetailPage


