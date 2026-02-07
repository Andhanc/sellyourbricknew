import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
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
import Wallet from './pages/Wallet'
import AdminPanelPage from './admin/AdminPanelPage'
import Footer from './components/Footer'
import ClerkAuthSync from './components/ClerkAuthSync'
import ClerkAuthHandler from './components/ClerkAuthHandler'
import BlockedUserModal from './components/BlockedUserModal'
import ToastContainer from './components/ToastContainer'
import { validateSession, getUserData } from './services/authService'
import './App.css'

// Компонент для валидации сессии при запуске приложения
function SessionValidator({ onBlockedChange }) {
  useEffect(() => {
    // Валидируем сессию при монтировании приложения
    const checkSession = async () => {
      // Сначала проверяем флаг блокировки в localStorage
      const isBlockedFlag = localStorage.getItem('isBlocked') === 'true';
      if (isBlockedFlag) {
        // Если пользователь заблокирован, не проверяем сессию дальше
        // Состояние блокировки уже установлено в основном useEffect
        console.warn('🚫 Пользователь заблокирован (найден флаг в localStorage)');
        return;
      }
      
      try {
        const result = await validateSession()
        if (!result.valid && result.cleared) {
          console.log('✅ Устаревшая сессия автоматически очищена при запуске приложения')
          // Перезагружаем страницу для полного сброса состояния
          window.location.reload()
        } else if (result.valid) {
          console.log('✅ Сессия валидна, пользователь авторизован')
          // Проверяем блокировку
          if (result.is_blocked) {
            console.warn('🚫 Пользователь заблокирован')
            // Сохраняем флаг блокировки
            if (result.user && result.user.id) {
              localStorage.setItem('isBlocked', 'true');
              localStorage.setItem('blockedUserId', result.user.id.toString());
            }
            onBlockedChange(true)
          } else {
            onBlockedChange(false)
          }
        } else {
          onBlockedChange(false)
        }
      } catch (error) {
        console.error('❌ Ошибка при валидации сессии:', error)
        // Не сбрасываем состояние блокировки при ошибке, если флаг уже установлен
        if (!isBlockedFlag) {
          onBlockedChange(false)
        }
      }
    }
    
    // Небольшая задержка, чтобы дать время другим компонентам инициализироваться
    const timeoutId = setTimeout(checkSession, 500)
    
    return () => clearTimeout(timeoutId)
  }, [onBlockedChange])

  return null
}

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
  // Инициализируем состояние блокировки из localStorage сразу
  const [isBlocked, setIsBlocked] = useState(() => {
    const isBlockedFlag = localStorage.getItem('isBlocked') === 'true';
    console.log('🔍 Начальное состояние блокировки из localStorage:', isBlockedFlag);
    return isBlockedFlag;
  });

  // Проверяем блокировку при загрузке пользователя из localStorage
  useEffect(() => {
    console.log('🔍 Начинаем проверку блокировки пользователя...');
    
    const checkBlockedStatus = async () => {
      // Сначала проверяем флаг блокировки в localStorage
      const isBlockedFlag = localStorage.getItem('isBlocked') === 'true';
      const blockedUserId = localStorage.getItem('blockedUserId');
      
      console.log('🔍 Флаг блокировки в localStorage:', { isBlockedFlag, blockedUserId });
      
      if (isBlockedFlag && blockedUserId) {
        // Если есть флаг блокировки, сразу показываем модальное окно
        console.log('🚫 Пользователь заблокирован (найден флаг в localStorage), показываем модальное окно');
        setIsBlocked(true);
        
        // Дополнительно проверяем статус в БД
        try {
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
          const response = await fetch(`${API_BASE_URL}/users/${blockedUserId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data && result.data.is_blocked === 1) {
              console.log('✅ Подтверждено: пользователь заблокирован в БД');
              setIsBlocked(true);
            } else {
              // Если пользователь разблокирован, очищаем флаги
              console.log('✅ Пользователь разблокирован в БД, очищаем флаги');
              localStorage.removeItem('isBlocked');
              localStorage.removeItem('blockedUserId');
              setIsBlocked(false);
            }
          }
        } catch (error) {
          console.warn('⚠️ Не удалось проверить статус блокировки:', error);
          // Оставляем модальное окно видимым при ошибке проверки
          setIsBlocked(true);
        }
        return;
      }
      
      // Если нет флага блокировки, проверяем пользователя по его данным
      const userData = getUserData();
      console.log('🔍 Данные пользователя:', { isLoggedIn: userData.isLoggedIn, id: userData.id });
      
      if (userData.isLoggedIn && userData.id) {
        try {
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
          const response = await fetch(`${API_BASE_URL}/users/${userData.id}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data && result.data.is_blocked === 1) {
              console.log('🚫 Пользователь заблокирован (найдено в БД), сохраняем флаг');
              // Сохраняем флаг блокировки
              localStorage.setItem('isBlocked', 'true');
              localStorage.setItem('blockedUserId', userData.id.toString());
              setIsBlocked(true);
            } else {
              // Очищаем флаги блокировки, если пользователь не заблокирован
              localStorage.removeItem('isBlocked');
              localStorage.removeItem('blockedUserId');
              setIsBlocked(false);
            }
          }
        } catch (error) {
          console.warn('⚠️ Не удалось проверить статус блокировки:', error);
        }
      } else {
        // Очищаем флаги блокировки, если пользователь не авторизован
        localStorage.removeItem('isBlocked');
        localStorage.removeItem('blockedUserId');
        setIsBlocked(false);
      }
    };
    
    // Запускаем проверку сразу и с небольшой задержкой для надежности
    checkBlockedStatus();
    const timeoutId = setTimeout(checkBlockedStatus, 300);
    
    return () => clearTimeout(timeoutId);
  }, [])

  console.log('🔍 App render, isBlocked:', isBlocked);

  return (
    <Router>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <SessionValidator onBlockedChange={setIsBlocked} />
      <AdminSessionCleaner />
      <ClerkAuthSync />
      <ClerkAuthHandler />
      <div className={`app-layout ${isBlocked ? 'app-layout--blocked' : ''}`}>
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
          <Route path="/wallet" element={<Wallet />} />
          
          {/* Страницы для владельцев */}
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/owner/property/new" element={<AddProperty />} />
          <Route path="/property/:id/edit" element={<AddProperty />} />
          
          {/* Админ-панель */}
          <Route path="/admin" element={<AdminPanelPage />} />
          
            {/* Редирект для несуществующих маршрутов на главную страницу */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Footer />
      </div>
      {isBlocked && <BlockedUserModal isOpen={true} />}
      <ToastContainer />
    </Router>
  )
}

export default App

