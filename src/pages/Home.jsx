import { useState, useEffect, useMemo } from 'react'
import Header from '../components/Header'
import Hero from '../components/Hero'
import PropertyList from '../components/PropertyList'
import FAQ from '../components/FAQ'
import './Home.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

function Home() {
  const [auctionProperties, setAuctionProperties] = useState([])
  const [loading, setLoading] = useState(true)

  // Загрузка аукционных объявлений из API
  useEffect(() => {
    const loadAuctionProperties = async () => {
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

        for (const { apiType } of types) {
          try {
            const url = `${API_BASE_URL}/properties/auctions?type=${apiType}`
            const response = await fetch(url)
            if (response.ok) {
              const data = await response.json()
              if (data.success && data.data) {
                allAuctionProperties.push(...data.data)
              }
            }
          } catch (error) {
            console.error(`Ошибка загрузки аукционных объявлений типа ${apiType}:`, error)
          }
        }

        // Форматируем данные для PropertyList
        const formattedProperties = allAuctionProperties.map(prop => ({
          ...prop,
          // Убеждаемся, что все необходимые поля присутствуют
          title: prop.title || prop.name || '',
          location: prop.location || '',
          price: prop.price || prop.auction_starting_price || 0,
          currentBid: prop.currentBid || prop.auction_starting_price || prop.price || 0,
          endTime: prop.endTime || prop.auction_end_date || null,
          isAuction: true,
          images: prop.images || (prop.image ? [prop.image] : []),
          image: prop.image || (prop.images && prop.images[0] ? prop.images[0] : null),
          rooms: prop.rooms || prop.beds || 0,
          area: prop.area || prop.sqft || 0
        }))

        setAuctionProperties(formattedProperties)
        console.log('✅ Загружено аукционных объявлений:', formattedProperties.length)
      } catch (error) {
        console.error('❌ Ошибка загрузки аукционных объявлений:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAuctionProperties()
    
    // Обновляем каждые 5 минут для получения новых аукционных объявлений
    const interval = setInterval(loadAuctionProperties, 300000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="home-page">
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
