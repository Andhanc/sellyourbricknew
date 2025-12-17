import Header from '../components/Header'
import Hero from '../components/Hero'
import PropertyList from '../components/PropertyList'
import FAQ from '../components/FAQ'
import './Home.css'

function Home() {
  return (
    <div className="home-page">
      <Header />
      <Hero />
      <PropertyList />
      <FAQ />
    </div>
  )
}

export default Home
