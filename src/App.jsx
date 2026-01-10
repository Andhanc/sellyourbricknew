import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import MainPage from './pages/MainPage'
import PropertyDetailPage from './pages/PropertyDetailPage'
import MapPage from './pages/MapPage'
import Profile from './pages/Profile'
import Data from './pages/Data'
import Subscriptions from './pages/Subscriptions'
import History from './pages/History'
import Chat from './pages/Chat'
import Favorites from './pages/Favorites'
import OwnerDashboard from './pages/OwnerDashboard'
import AddProperty from './pages/AddProperty'
import AdminPanelPage from './admin/AdminPanelPage'
import Footer from './components/Footer'
import ClerkAuthSync from './components/ClerkAuthSync'
import ClerkAuthHandler from './components/ClerkAuthHandler'
import ClerkDebug from './components/ClerkDebug'
import './App.css'

// Компонент для очистки сессии администратора при переходе с админ-панели
function AdminSessionCleaner() {
  const location = useLocation()

  useEffect(() => {
    // Если мы не на странице админ-панели и есть активная сессия администратора, очищаем её
    if (location.pathname !== '/admin') {
      const userRole = localStorage.getItem('userRole')
      const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true'
      
      if (isAdminLoggedIn && userRole === 'admin') {
        console.log('🔄 Автоматическая очистка сессии администратора при переходе на:', location.pathname)
        localStorage.removeItem('userRole')
        localStorage.removeItem('isAdminLoggedIn')
        localStorage.removeItem('isLoggedIn')
      }
    }
  }, [location.pathname])

  return null
}

function App() {
  return (
    <Router>
      <AdminSessionCleaner />
      <ClerkDebug />
      <ClerkAuthSync />
      <ClerkAuthHandler />
      <div className="app-layout">
        <div className="app-layout__content">
          <Routes>
            {/* Главная страница - открывается по умолчанию */}
            <Route path="/" element={<MainPage />} />
            
            {/* Страница аукциона */}
            <Route path="/auction" element={<Home />} />
            <Route path="/main" element={<Home />} />
            <Route path="/property/:id" element={<PropertyDetailPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/data" element={<Data />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/history" element={<History />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/favorites" element={<Favorites />} />
            
            {/* Страницы для владельцев */}
            <Route path="/owner" element={<OwnerDashboard />} />
            <Route path="/owner/property/new" element={<AddProperty />} />
            
            {/* Админ-панель */}
            <Route path="/admin" element={<AdminPanelPage />} />
            
            {/* Редирект для несуществующих маршрутов на главную страницу */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  )
}

export default App

