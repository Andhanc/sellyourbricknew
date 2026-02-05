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
          location: prop.location || '',
          price: prop.price || (isAuction ? prop.auction_starting_price : 0) || 0,
          currentBid: isAuction ? (prop.currentBid || prop.auction_starting_price || prop.price || 0) : null,
          endTime: isAuction ? (prop.endTime || prop.auction_end_date || null) : null,
          isAuction: isAuction,
          images: prop.images || (prop.image ? [prop.image] : []),
          image: prop.image || (prop.images && prop.images[0] ? prop.images[0] : null),
          // Основные характеристики
          rooms: prop.rooms || prop.beds || 0,
          beds: prop.bedrooms || prop.rooms || prop.beds || 0,
          bedrooms: prop.bedrooms || prop.rooms || 0,
          bathrooms: prop.bathrooms || 0,
          area: prop.area || prop.sqft || 0,
          sqft: prop.area || prop.sqft || 0,
          floor: prop.floor || null,
          total_floors: prop.total_floors || prop.totalFloors || null,
          year_built: prop.year_built || null,
          land_area: prop.land_area || null,
          // Дополнительная информация
          renovation: prop.renovation || null,
          condition: prop.condition || null,
          heating: prop.heating || null,
          water_supply: prop.water_supply || null,
          sewerage: prop.sewerage || null
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
