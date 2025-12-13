import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import MainPage from './pages/MainPage'
import PropertyDetail from './pages/PropertyDetail'
import MapPage from './pages/MapPage'
import Profile from './pages/Profile'
import Data from './pages/Data'
import Subscriptions from './pages/Subscriptions'
import History from './pages/History'
import Chat from './pages/Chat'
import OwnerDashboard from './pages/OwnerDashboard'
import AddProperty from './pages/AddProperty'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/data" element={<Data />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/history" element={<History />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/owner" element={<OwnerDashboard />} />
        <Route path="/owner/property/new" element={<AddProperty />} />
      </Routes>
    </Router>
  )
}

export default App

