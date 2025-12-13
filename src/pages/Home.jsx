import Header from '../components/Header'
import Hero from '../components/Hero'
import PropertyList from '../components/PropertyList'
import ApartmentsSection from '../components/ApartmentsSection'
import FAQ from '../components/FAQ'
import Footer from '../components/Footer'
import './Home.css'

function Home() {
  return (
    <div className="home-page">
      <Header />
      <Hero />
      <PropertyList />
      <ApartmentsSection />
      <FAQ />
      <Footer />
    </div>
  )
}

export default Home
