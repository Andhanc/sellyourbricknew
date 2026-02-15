import { useState, useEffect, useMemo } from 'react'
import Header from '../components/Header'
import Hero from '../components/Hero'
import PropertyList from '../components/PropertyList'
import FAQ from '../components/FAQ'
import DepositButton from '../components/DepositButton'
import './Home.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

function Home() {
  const [auctionProperties, setAuctionProperties] = useState([])
  const [loading, setLoading] = useState(true)

  // Загрузка аукционных и не аукционных объявлений из API
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true)
        // Загружаем объявления по типам
        const types = [
          { apiType: 'commercial', stateKey: 'apartments' },
          { apiType: 'villa', stateKey: 'villas' },
          { apiType: 'apartment', stateKey: 'flats' },
          { apiType: 'house', stateKey: 'houses' }
        ]

        const allAuctionProperties = []
        const allNonAuctionProperties = []

        for (const { apiType } of types) {
          try {
            // Загружаем аукционные объявления
            const auctionUrl = `${API_BASE_URL}/properties/auctions?type=${apiType}`
            const auctionResponse = await fetch(auctionUrl)
            if (auctionResponse.ok) {
              const data = await auctionResponse.json()
              if (data.success && data.data) {
                allAuctionProperties.push(...data.data)
              }
            }

            // Загружаем не аукционные объявления (одобренные)
            const approvedUrl = `${API_BASE_URL}/properties/approved?type=${apiType}`
            const approvedResponse = await fetch(approvedUrl)
            if (approvedResponse.ok) {
              const data = await approvedResponse.json()
              if (data.success && data.data) {
                // Фильтруем только не аукционные объекты
                const nonAuction = data.data.filter(prop => 
                  !prop.is_auction || prop.is_auction === 0 || prop.is_auction === false
                )
                allNonAuctionProperties.push(...nonAuction)
              }
            }
          } catch (error) {
            console.error(`Ошибка загрузки объявлений типа ${apiType}:`, error)
          }
        }

        // Форматируем данные для PropertyList
        const formatProperty = (prop, isAuction) => ({
          ...prop,
          // Убеждаемся, что все необходимые поля присутствуют
          title: prop.title || prop.name || '',
          name: prop.title || prop.name || '',
          location: prop.location || '',
          description: prop.description || '',
          price: prop.price !== undefined && prop.price !== null && prop.price !== '' ? Number(prop.price) : null,
          currentBid: isAuction ? (prop.currentBid || prop.auction_starting_price || prop.price || 0) : null,
          endTime: isAuction ? (prop.endTime || prop.auction_end_date || null) : null,
          isAuction: isAuction,
          is_auction: isAuction,
          images: prop.images || (prop.image ? [prop.image] : []),
          image: prop.image || (prop.images && prop.images[0] ? prop.images[0] : null),
          // Основные характеристики
          rooms: prop.rooms || prop.beds || 0,
          beds: prop.bedrooms || prop.rooms || prop.beds || 0,
          bedrooms: prop.bedrooms || prop.rooms || 0,
          bathrooms: prop.bathrooms || 0,
          area: prop.area || prop.sqft || 0,
          sqft: prop.area || prop.sqft || 0,
          floor: prop.floor !== undefined && prop.floor !== null && prop.floor !== '' ? prop.floor : null,
          total_floors: prop.total_floors !== undefined && prop.total_floors !== null && prop.total_floors !== '' ? prop.total_floors : (prop.totalFloors || null),
          year_built: prop.year_built !== undefined && prop.year_built !== null && prop.year_built !== '' ? prop.year_built : null,
          building_type: prop.building_type !== undefined && prop.building_type !== null && prop.building_type !== '' ? prop.building_type : (prop.buildingType || null),
          buildingType: prop.building_type !== undefined && prop.building_type !== null && prop.building_type !== '' ? prop.building_type : (prop.buildingType || null),
          living_area: prop.living_area !== undefined && prop.living_area !== null && prop.living_area !== '' ? prop.living_area : (prop.livingArea || null),
          livingArea: prop.living_area !== undefined && prop.living_area !== null && prop.living_area !== '' ? prop.living_area : (prop.livingArea || null),
          land_area: prop.land_area || null,
          property_type: prop.property_type || prop.propertyType || 'apartment',
          // Координаты
          coordinates: prop.coordinates || null,
          // Удобства (булевы значения)
          balcony: prop.balcony === 1 || prop.balcony === true || prop.balcony === '1' || prop.balcony === 'true',
          parking: prop.parking === 1 || prop.parking === true || prop.parking === '1' || prop.parking === 'true',
          elevator: prop.elevator === 1 || prop.elevator === true || prop.elevator === '1' || prop.elevator === 'true',
          garage: prop.garage === 1 || prop.garage === true || prop.garage === '1' || prop.garage === 'true',
          pool: prop.pool === 1 || prop.pool === true || prop.pool === '1' || prop.pool === 'true',
          garden: prop.garden === 1 || prop.garden === true || prop.garden === '1' || prop.garden === 'true',
          electricity: prop.electricity === 1 || prop.electricity === true || prop.electricity === '1' || prop.electricity === 'true',
          internet: prop.internet === 1 || prop.internet === true || prop.internet === '1' || prop.internet === 'true',
          security: prop.security === 1 || prop.security === true || prop.security === '1' || prop.security === 'true',
          furniture: prop.furniture === 1 || prop.furniture === true || prop.furniture === '1' || prop.furniture === 'true',
          // Дополнительная информация
          renovation: prop.renovation || null,
          condition: prop.condition || null,
          heating: prop.heating || null,
          water_supply: prop.water_supply || null,
          sewerage: prop.sewerage || null,
          commercial_type: prop.commercial_type || null,
          business_hours: prop.business_hours || null,
          additional_amenities: prop.additional_amenities !== undefined && prop.additional_amenities !== null && prop.additional_amenities !== '' ? prop.additional_amenities : (prop.additionalAmenities || null),
          additionalAmenities: prop.additional_amenities !== undefined && prop.additional_amenities !== null && prop.additional_amenities !== '' ? prop.additional_amenities : (prop.additionalAmenities || null),
          // Тест-драйв
          test_drive: prop.test_drive !== undefined ? (prop.test_drive === 1 || prop.test_drive === true || prop.test_drive === '1' || prop.test_drive === 'true') : false,
          testDrive: prop.testDrive !== undefined ? prop.testDrive : (prop.test_drive !== undefined ? (prop.test_drive === 1 || prop.test_drive === true || prop.test_drive === '1' || prop.test_drive === 'true') : false),
          // Аукционные поля
          auction_start_date: prop.auction_start_date || null,
          auction_end_date: prop.auction_end_date || null,
          auction_starting_price: prop.auction_starting_price || null,
          auctionStartingPrice: prop.auction_starting_price || null,
          // Валюта
          currency: prop.currency || 'USD',
          // Документы
          ownership_document: prop.ownership_document || prop.ownershipDocument || null,
          ownershipDocument: prop.ownership_document || prop.ownershipDocument || null,
          no_debts_document: prop.no_debts_document || prop.noDebtsDocument || null,
          noDebtsDocument: prop.no_debts_document || prop.noDebtsDocument || null,
          additional_documents: prop.additional_documents || prop.additionalDocuments || null,
          additionalDocuments: prop.additional_documents || prop.additionalDocuments || null,
          // Видео
          videos: prop.videos || null,
        })

        const formattedAuction = allAuctionProperties.map(prop => formatProperty(prop, true))
        const formattedNonAuction = allNonAuctionProperties.map(prop => formatProperty(prop, false))
        
        // Объединяем аукционные и не аукционные объекты
        const allProperties = [...formattedAuction, ...formattedNonAuction]

        setAuctionProperties(allProperties)
        console.log('✅ Загружено аукционных объявлений:', formattedAuction.length)
        console.log('✅ Загружено не аукционных объявлений:', formattedNonAuction.length)
      } catch (error) {
        console.error('❌ Ошибка загрузки объявлений:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProperties()
    
    // Обновляем каждые 5 минут для получения новых объявлений
    const interval = setInterval(loadProperties, 300000)
    return () => clearInterval(interval)
  }, [])

  // Получаем депозит пользователя (пока используем моковые данные)
  const userDeposit = 786898.67

  return (
    <div className="home-page">
      <DepositButton amount={userDeposit} />
      <Header />
      <Hero />
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <p>Загрузка аукционных объявлений...</p>
        </div>
      ) : (
        <PropertyList auctionProperties={auctionProperties} />
      )}
      <FAQ />
    </div>
  )
}

export default Home
