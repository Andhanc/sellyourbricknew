import Hero from '../components/Hero'
import PropertyList from '../components/PropertyList'
import FAQ from '../components/FAQ'
import Footer from '../components/Footer'
import './Home.css'

const Home = () => {
  return (
    <div className="home-page">
      <Hero />
      <PropertyList />
      <FAQ />
      <Footer />
    </div>
  )
}

export default Home

