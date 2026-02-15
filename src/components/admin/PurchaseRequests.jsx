import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiCheck, FiX, FiClock, FiFileText, FiExternalLink } from 'react-icons/fi';
import './PurchaseRequests.css';

const PurchaseRequests = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [loadingPropertyDetails, setLoadingPropertyDetails] = useState(false);

  // Загружаем запросы на покупку из БД
  useEffect(() => {
    fetchRequests();
  }, []);

  // Отладка состояния модального окна
  useEffect(() => {
    if (isDetailModalOpen) {
      console.log('✅ Модальное окно открыто, selectedRequest:', selectedRequest?.id);
      // Проверяем, что модальное окно действительно в DOM
      setTimeout(() => {
        const modal = document.querySelector('.purchase-request-modal-overlay');
        if (modal) {
          console.log('✅ Модальное окно найдено в DOM:', modal);
          const styles = window.getComputedStyle(modal);
          console.log('✅ Стили модального окна:', {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            zIndex: styles.zIndex
          });
        } else {
          console.error('❌ Модальное окно НЕ найдено в DOM!');
        }
      }, 100);
    }
  }, [isDetailModalOpen, selectedRequest]);

  // Удаляем все атрибуты title и скрываем любые overlay'и
  useEffect(() => {
    const removeTooltips = () => {
      // Удаляем title из всех статус-бейджей
      const statusBadges = document.querySelectorAll('.status-badge');
      statusBadges.forEach(badge => {
        badge.removeAttribute('title');
        // Удаляем title из всех дочерних элементов (иконок)
        const children = badge.querySelectorAll('*');
        children.forEach(child => {
          child.removeAttribute('title');
        });
      });
    };

    // Функция для скрытия любых overlay'ев и tooltip'ов
    const hideOverlays = () => {
      // НЕ скрываем overlay'и, если модальное окно открыто
      if (isDetailModalOpen) {
        return;
      }
      
      // Ищем и скрываем любые элементы, которые могут быть overlay'ями
      const allElements = document.querySelectorAll('body > *:not(script):not(style)');
      allElements.forEach(el => {
        // Пропускаем наш контейнер и его дочерние элементы
        if (el.closest('.purchase-requests-container') || 
            el.closest('.admin-panel') ||
            el.closest('.purchase-request-modal-overlay') ||
            el.closest('.purchase-request-modal')) {
          return;
        }
        
        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex) || 0;
        const position = style.position;
        const bgColor = style.backgroundColor || '';
        const display = style.display;
        
        // Если это абсолютно/фиксированно позиционированный элемент с высоким z-index
        // и белым/светлым фоном - скрываем его
        if ((position === 'absolute' || position === 'fixed') && 
            zIndex > 100 && 
            display !== 'none' &&
            (bgColor.includes('255') || bgColor.includes('white') || bgColor.includes('rgb(255') || bgColor.includes('rgba(255'))) {
          const rect = el.getBoundingClientRect();
          // Проверяем, находится ли элемент рядом со статус-бейджем
          const statusBadges = document.querySelectorAll('.status-badge');
          let shouldHide = false;
          
          statusBadges.forEach(badge => {
            const badgeRect = badge.getBoundingClientRect();
            const distance = Math.sqrt(
              Math.pow(rect.left - badgeRect.left, 2) + 
              Math.pow(rect.top - badgeRect.top, 2)
            );
            // Если overlay находится близко к статус-бейджу - скрываем его
            if (distance < 300) {
              shouldHide = true;
            }
          });
          
          if (shouldHide) {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
          }
        }
      });
    };

    // Глобальный обработчик для предотвращения показа tooltip'ов и overlay'ев
    // Ограничиваем только статус-бейджами, не блокируем клики на карточки
    const preventTooltip = (e) => {
      // Получаем target, проверяя что это DOM элемент
      let target = e.target;
      
      // Если target не является элементом (например, текстовый узел), получаем родительский элемент
      if (!target || typeof target.closest !== 'function') {
        if (target && target.parentElement) {
          target = target.parentElement;
        } else {
          return;
        }
      }
      
      // Проверяем, что target является элементом
      if (!target || typeof target.closest !== 'function') {
        return;
      }
      
      // Обрабатываем только статус-бейджи, не блокируем клики на карточки
      const statusBadge = target.closest('.status-badge');
      if (statusBadge && e.type !== 'click') {
        // Удаляем title при событиях мыши (но не при клике)
        try {
          if (target.removeAttribute) {
            target.removeAttribute('title');
          }
          if (statusBadge.removeAttribute) {
            statusBadge.removeAttribute('title');
          }
        } catch (err) {
          // Игнорируем ошибки при удалении атрибутов
        }
        // Скрываем любые overlay'и
        setTimeout(hideOverlays, 10);
      }
    };

    // Выполняем сразу
    removeTooltips();
    
    // Получаем контейнер один раз
    const container = document.querySelector('.purchase-requests-container');
    
    if (container) {
      // Добавляем обработчики событий только для мыши (не для кликов)
      // Ограничиваем область действия только контейнером запросов
      container.addEventListener('mouseenter', preventTooltip, true);
      container.addEventListener('mouseover', preventTooltip, true);
      container.addEventListener('mousemove', preventTooltip, true);
      
      // Используем MutationObserver для отслеживания изменений DOM
      const observer = new MutationObserver(() => {
        removeTooltips();
        hideOverlays();
      });
      
      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['title', 'style', 'class']
      });
      
      // Периодически скрываем overlay'и (только если модальное окно закрыто)
      const hideInterval = setInterval(() => {
        if (!isDetailModalOpen) {
          hideOverlays();
        }
      }, 100);
      
      return () => {
        observer.disconnect();
        clearInterval(hideInterval);
        container.removeEventListener('mouseenter', preventTooltip, true);
        container.removeEventListener('mouseover', preventTooltip, true);
        container.removeEventListener('mousemove', preventTooltip, true);
      };
    }
    
    return () => {
      // Cleanup если контейнер не найден
    };
    
    return () => {
      observer.disconnect();
      clearInterval(hideInterval);
      const container = document.querySelector('.purchase-requests-container');
      if (container) {
        container.removeEventListener('mouseenter', preventTooltip, true);
        container.removeEventListener('mouseover', preventTooltip, true);
        container.removeEventListener('mousemove', preventTooltip, true);
      }
    };
  }, [requests, isDetailModalOpen]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/purchase-requests?limit=1000`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setRequests(result.data);
        } else {
          setError('Не удалось загрузить запросы');
        }
      } else {
        setError('Ошибка при загрузке запросов');
      }
    } catch (err) {
      console.error('❌ Ошибка при загрузке запросов на покупку:', err);
      setError('Произошла ошибка при загрузке запросов');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    if (!searchQuery && statusFilter === 'all') {
      return requests;
    }
    
    return requests.filter(request => {
      // Поиск по имени покупателя, email, телефону или названию объекта
      const matchesSearch = !searchQuery || (() => {
        const searchLower = searchQuery.toLowerCase();
        const buyerName = (request.buyer_name || '').toLowerCase();
        const buyerEmail = (request.buyer_email || '').toLowerCase();
        const buyerPhone = (request.buyer_phone || '').toLowerCase();
        const propertyTitle = (request.property_title || '').toLowerCase();
        return buyerName.includes(searchLower) || 
               buyerEmail.includes(searchLower) || 
               buyerPhone.includes(searchLower) ||
               propertyTitle.includes(searchLower);
      })();
      
      // Фильтр по статусу
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter, requests]);

  const handleStatusUpdate = async (requestId, newStatus) => {
    if (updatingStatus) return;
    
    setUpdatingStatus(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/purchase-requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: adminNotes || null
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Обновляем локальное состояние
          setRequests(requests.map(req => 
            req.id === requestId ? { ...req, status: newStatus, admin_notes: adminNotes || req.admin_notes } : req
          ));
          setAdminNotes('');
          setIsDetailModalOpen(false);
          setSelectedRequest(null);
          setPropertyDetails(null);
        } else {
          alert(`Ошибка: ${result.error || 'Не удалось обновить статус'}`);
        }
      } else {
        const errorData = await response.json();
        alert(`Ошибка: ${errorData.error || 'Не удалось обновить статус'}`);
      }
    } catch (error) {
      console.error('Ошибка при обновлении статуса:', error);
      alert('Произошла ошибка при обновлении статуса');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот запрос?')) {
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/purchase-requests/${requestId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRequests(requests.filter(req => req.id !== requestId));
          alert('Запрос успешно удален');
        } else {
          alert(`Ошибка: ${result.error || 'Не удалось удалить запрос'}`);
        }
      } else {
        const errorData = await response.json();
        alert(`Ошибка: ${errorData.error || 'Не удалось удалить запрос'}`);
      }
    } catch (error) {
      console.error('Ошибка при удалении запроса:', error);
      alert('Произошла ошибка при удалении запроса');
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: 'Ожидает',
      processing: 'В обработке',
      completed: 'Завершен',
      cancelled: 'Отменен'
    };  
    return statusMap[status] || status;
  };

  const getStatusBadgeClass = (status) => {
    const classMap = {
      pending: 'status-badge--pending',
      processing: 'status-badge--processing',
      completed: 'status-badge--completed',
      cancelled: 'status-badge--cancelled'
    };
    return classMap[status] || '';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock size={16} />;
      case 'processing':
        return <FiFileText size={16} />;
      case 'completed':
        return <FiCheck size={16} />;
      case 'cancelled':
        return <FiX size={16} />;
      default:
        return <FiClock size={16} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    try {
      return new Date(dateString).toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Не указано';
    }
  };

  const formatPrice = (price, currency) => {
    if (!price) return 'Не указано';
    const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency || '';
    return `${currencySymbol}${price.toLocaleString('ru-RU')}`;
  };

  return (
    <div className="purchase-requests-container">
      <div className="purchase-requests-filter">
        <div className="filter-search">
          <FiSearch className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Поиск по имени, email, телефону или объекту..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-input"
          />
          {searchQuery && (
            <button 
              className="clear-search"
              onClick={() => setSearchQuery('')}
              aria-label="Очистить поиск"
            >
              <FiX size={18} />
            </button>
          )}
        </div>
        
        <div className="filter-buttons">
          <div className="filter-group">
            <label className="filter-label">Статус:</label>
            <div className="filter-options">
              <button
                className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                Все
              </button>
              <button
                className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setStatusFilter('pending')}
              >
                Ожидает
              </button>
              <button
                className={`filter-btn ${statusFilter === 'processing' ? 'active' : ''}`}
                onClick={() => setStatusFilter('processing')}
              >
                В обработке
              </button>
              <button
                className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`}
                onClick={() => setStatusFilter('completed')}
              >
                Завершен
              </button>
              <button
                className={`filter-btn ${statusFilter === 'cancelled' ? 'active' : ''}`}
                onClick={() => setStatusFilter('cancelled')}
              >
                Отменен
              </button>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="purchase-requests-loading">
          <p>Загрузка запросов...</p>
        </div>
      ) : error ? (
        <div className="purchase-requests-error">
          <p>Ошибка: {error}</p>
          <button onClick={fetchRequests}>Попробовать снова</button>
        </div>
      ) : (
        <div className="purchase-requests-list">
          {filteredRequests.length === 0 ? (
            <div className="purchase-requests-empty">
              <FiShoppingCart size={48} />
              <p>Запросы на покупку не найдены</p>
            </div>
          ) : (
            filteredRequests.map(request => (
              <div 
                key={request.id} 
                className="purchase-request-card"
                onClick={async (e) => {
                  // Предотвращаем всплытие события, если клик был на статус-бейдже
                  if (e.target.closest('.status-badge')) {
                    return;
                  }
                  
                  e.stopPropagation();
                  
                  console.log('🖱️ Клик на карточке запроса:', request.id);
                  setSelectedRequest(request);
                  setAdminNotes(request.admin_notes || '');
                  setIsDetailModalOpen(true);
                  console.log('✅ Модальное окно должно открыться, isDetailModalOpen:', true);
                  
                  // Загружаем полную информацию об объекте
                  if (request.property_id) {
                    setLoadingPropertyDetails(true);
                    try {
                      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
                      const response = await fetch(`${API_BASE_URL}/properties/${request.property_id}`);
                      if (response.ok) {
                        const result = await response.json();
                        if (result.success && result.data) {
                          setPropertyDetails(result.data);
                          console.log('✅ Данные объекта загружены');
                        }
                      }
                    } catch (err) {
                      console.error('Ошибка при загрузке данных объекта:', err);
                    } finally {
                      setLoadingPropertyDetails(false);
                    }
                  } else {
                    setPropertyDetails(null);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="purchase-request-card__header">
                  <div className="purchase-request-card__title">
                    <FiShoppingCart size={20} />
                    <h3>{request.property_title || 'Объект не указан'}</h3>
                  </div>
                  <span 
                    className={`status-badge ${getStatusBadgeClass(request.status)}`}
                    onMouseEnter={(e) => {
                      e.currentTarget.removeAttribute('title');
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.removeAttribute('title');
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {getStatusIcon(request.status)}
                    {getStatusLabel(request.status)}
                  </span>
                </div>
                
                <div className="purchase-request-card__info">
                  <div className="purchase-request-info-item">
                    <span className="info-label">Покупатель:</span>
                    <span className="info-value">{request.buyer_name || 'Не указано'}</span>
                  </div>
                  
                  {request.buyer_email && (
                    <div className="purchase-request-info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{request.buyer_email}</span>
                    </div>
                  )}
                  
                  {request.buyer_phone && (
                    <div className="purchase-request-info-item">
                      <span className="info-label">Телефон:</span>
                      <span className="info-value">{request.buyer_phone}</span>
                    </div>
                  )}
                  
                  {request.property_price && (
                    <div className="purchase-request-info-item">
                      <span className="info-label">Цена:</span>
                      <span className="info-value info-value--price">
                        {formatPrice(request.property_price, request.property_currency)}
                      </span>
                    </div>
                  )}
                  
                  {request.property_location && (
                    <div className="purchase-request-info-item">
                      <span className="info-label">Местоположение:</span>
                      <span className="info-value">{request.property_location}</span>
                    </div>
                  )}
                  
                  <div className="purchase-request-info-item">
                    <span className="info-label">Дата запроса:</span>
                    <span className="info-value">{formatDate(request.request_date || request.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!isLoading && !error && (
        <div className="purchase-requests-stats">
          <div className="stat-item">
            <span className="stat-label">Всего запросов:</span>
            <span className="stat-value">{requests.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Найдено:</span>
            <span className="stat-value">{filteredRequests.length}</span>
          </div>
        </div>
      )}

      {/* Модальное окно с деталями запроса */}
      {isDetailModalOpen && selectedRequest && createPortal(
        <div className="purchase-request-modal-overlay" onClick={() => {
          setIsDetailModalOpen(false);
          setSelectedRequest(null);
          setAdminNotes('');
          setPropertyDetails(null);
        }}>
          <div className="purchase-request-modal" onClick={(e) => e.stopPropagation()}>
            <div className="purchase-request-modal__header">
              <h2>Детали запроса на покупку</h2>
              <button 
                className="modal-close-btn"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedRequest(null);
                  setAdminNotes('');
                  setPropertyDetails(null);
                }}
              >
                <FiX size={24} />
              </button>
            </div>
            
            <div className="purchase-request-modal__content">
              <div className="modal-section">
                <h3>Информация о покупателе</h3>
                <div className="modal-info-grid">
                  <div className="modal-info-item">
                    <span className="modal-info-label">Имя:</span>
                    <span className="modal-info-value">{selectedRequest.buyer_name || 'Не указано'}</span>
                  </div>
                  <div className="modal-info-item">
                    <span className="modal-info-label">Телефон:</span>
                    <span className="modal-info-value">{selectedRequest.buyer_phone || 'Не указано'}</span>
                  </div>
                  <div className="modal-info-item">
                    <span className="modal-info-label">Почта:</span>
                    <span className="modal-info-value">{selectedRequest.buyer_email || 'Не указано'}</span>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h3>Информация о владельце объекта</h3>
                <div className="modal-info-grid">
                  <div className="modal-info-item">
                    <span className="modal-info-label">Имя:</span>
                    <span className="modal-info-value">
                      {propertyDetails?.first_name && propertyDetails?.last_name
                        ? `${propertyDetails.first_name} ${propertyDetails.last_name}`
                        : selectedRequest.seller_name || 'Владелец не указан'}
                    </span>
                  </div>
                  {(propertyDetails?.email || selectedRequest.seller_email) && (
                    <div className="modal-info-item">
                      <span className="modal-info-label">Email:</span>
                      <span className="modal-info-value">
                        {propertyDetails?.email || selectedRequest.seller_email}
                      </span>
                    </div>
                  )}
                  <div className="modal-info-item">
                    <span className="modal-info-label">Телефон:</span>
                    <span className="modal-info-value">
                      {propertyDetails?.phone_number || selectedRequest.seller_phone || 'Не указано'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h3>Информация об объекте</h3>
                {loadingPropertyDetails ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                    Загрузка данных объекта...
                  </div>
                ) : (
                  <div className="modal-info-grid">
                    {/* Основная информация - Название, Цена, Тест-драйв в одном ряду */}
                    <div className="modal-info-item">
                      <span className="modal-info-label">Название:</span>
                      <span className="modal-info-value">
                        {propertyDetails?.title || selectedRequest.property_title || 'Не указано'}
                      </span>
                    </div>
                    
                    {(propertyDetails?.price || selectedRequest.property_price) && (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Цена:</span>
                        <span className="modal-info-value">
                          {formatPrice(
                            propertyDetails?.price || selectedRequest.property_price,
                            propertyDetails?.currency || selectedRequest.property_currency
                          )}
                        </span>
                      </div>
                    )}
                    
                    {propertyDetails?.test_drive !== undefined && propertyDetails?.test_drive !== null && (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Тест-драйв:</span>
                        <span className="modal-info-value">
                          {propertyDetails.test_drive === 1 || propertyDetails.test_drive === true || propertyDetails.test_drive === '1' || propertyDetails.test_drive === 'true'
                            ? 'Доступен'
                            : 'Не доступен'}
                        </span>
                      </div>
                    )}
                    
                    {(propertyDetails?.location || selectedRequest.property_location) && (
                      <div className="modal-info-item modal-info-item--full">
                        <span className="modal-info-label">Местоположение:</span>
                        <span className="modal-info-value">
                          {propertyDetails?.location || selectedRequest.property_location}
                        </span>
                      </div>
                    )}
                    
                    {(propertyDetails?.property_type || selectedRequest.property_type) && (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Тип:</span>
                        <span className="modal-info-value">
                          {propertyDetails?.property_type || selectedRequest.property_type}
                        </span>
                      </div>
                    )}
                    
                    {/* Параметры объекта */}
                    {(propertyDetails?.area || selectedRequest.property_area) && (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Площадь:</span>
                        <span className="modal-info-value">
                          {propertyDetails?.area || selectedRequest.property_area} м²
                        </span>
                      </div>
                    )}
                    
                    {(propertyDetails?.living_area || selectedRequest.property_living_area) && (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Жилая площадь:</span>
                        <span className="modal-info-value">
                          {propertyDetails?.living_area || selectedRequest.property_living_area} м²
                        </span>
                      </div>
                    )}
                    
                    {(propertyDetails?.land_area || selectedRequest.property_land_area) && (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Площадь участка:</span>
                        <span className="modal-info-value">
                          {propertyDetails?.land_area || selectedRequest.property_land_area} м²
                        </span>
                      </div>
                    )}
                    
                    {(propertyDetails?.rooms || selectedRequest.property_rooms) && (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Комнат:</span>
                        <span className="modal-info-value">
                          {propertyDetails?.rooms || selectedRequest.property_rooms}
                        </span>
                      </div>
                    )}
                    
                    {(propertyDetails?.bedrooms || selectedRequest.property_bedrooms) && (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Спален:</span>
                        <span className="modal-info-value">
                          {propertyDetails?.bedrooms || selectedRequest.property_bedrooms}
                        </span>
                      </div>
                    )}
                    
                    {(propertyDetails?.bathrooms || selectedRequest.property_bathrooms) && (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Ванных:</span>
                        <span className="modal-info-value">
                          {propertyDetails?.bathrooms || selectedRequest.property_bathrooms}
                        </span>
                      </div>
                    )}
                    
                    {(propertyDetails?.floor !== null && propertyDetails?.floor !== undefined) || 
                     (selectedRequest.property_floor !== null && selectedRequest.property_floor !== undefined) ? (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Этаж:</span>
                        <span className="modal-info-value">
                          {propertyDetails?.floor ?? selectedRequest.property_floor}
                        </span>
                      </div>
                    ) : null}
                    
                    {(propertyDetails?.total_floors !== null && propertyDetails?.total_floors !== undefined) || 
                     (selectedRequest.property_total_floors !== null && selectedRequest.property_total_floors !== undefined) ? (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Этажей в доме:</span>
                        <span className="modal-info-value">
                          {propertyDetails?.total_floors ?? selectedRequest.property_total_floors}
                        </span>
                      </div>
                    ) : null}
                    
                    {(propertyDetails?.year_built !== null && propertyDetails?.year_built !== undefined) || 
                     (selectedRequest.property_year_built !== null && selectedRequest.property_year_built !== undefined) ? (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Год постройки:</span>
                        <span className="modal-info-value">
                          {propertyDetails?.year_built ?? selectedRequest.property_year_built}
                        </span>
                      </div>
                    ) : null}
                    
                    {(propertyDetails?.building_type || selectedRequest.property_building_type) && (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Тип здания:</span>
                        <span className="modal-info-value">
                          {propertyDetails?.building_type || selectedRequest.property_building_type}
                        </span>
                      </div>
                    )}
                    
                    {(propertyDetails?.renovation || selectedRequest.property_renovation) && (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Ремонт:</span>
                        <span className="modal-info-value">
                          {propertyDetails?.renovation || selectedRequest.property_renovation}
                        </span>
                      </div>
                    )}
                    
                    {(propertyDetails?.condition || selectedRequest.property_condition) && (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Состояние:</span>
                        <span className="modal-info-value">
                          {propertyDetails?.condition || selectedRequest.property_condition}
                        </span>
                      </div>
                    )}
                    
                    {(propertyDetails?.heating || selectedRequest.property_heating) && (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Отопление:</span>
                        <span className="modal-info-value">
                          {propertyDetails?.heating || selectedRequest.property_heating}
                        </span>
                      </div>
                    )}
                    
                    {(propertyDetails?.water_supply || selectedRequest.property_water_supply) && (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Водоснабжение:</span>
                        <span className="modal-info-value">
                          {propertyDetails?.water_supply || selectedRequest.property_water_supply}
                        </span>
                      </div>
                    )}
                    
                    {(propertyDetails?.sewerage || selectedRequest.property_sewerage) && (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Канализация:</span>
                        <span className="modal-info-value">
                          {propertyDetails?.sewerage || selectedRequest.property_sewerage}
                        </span>
                      </div>
                    )}
                    
                    {(propertyDetails?.commercial_type || selectedRequest.property_commercial_type) && (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Тип коммерческой недвижимости:</span>
                        <span className="modal-info-value">
                          {propertyDetails?.commercial_type || selectedRequest.property_commercial_type}
                        </span>
                      </div>
                    )}
                    
                    {(propertyDetails?.business_hours || selectedRequest.property_business_hours) && (
                      <div className="modal-info-item">
                        <span className="modal-info-label">Часы работы:</span>
                        <span className="modal-info-value">
                          {propertyDetails?.business_hours || selectedRequest.property_business_hours}
                        </span>
                      </div>
                    )}
                    
                    {/* Аукционная информация */}
                    {propertyDetails?.is_auction && (
                      <>
                        {propertyDetails?.auction_start_date && (
                          <div className="modal-info-item">
                            <span className="modal-info-label">Дата начала аукциона:</span>
                            <span className="modal-info-value">
                              {formatDate(propertyDetails.auction_start_date)}
                            </span>
                          </div>
                        )}
                        {propertyDetails?.auction_end_date && (
                          <div className="modal-info-item">
                            <span className="modal-info-label">Дата окончания аукциона:</span>
                            <span className="modal-info-value">
                              {formatDate(propertyDetails.auction_end_date)}
                            </span>
                          </div>
                        )}
                        <div className="modal-info-item">
                          <span className="modal-info-label">Текущая сумма аукциона:</span>
                          <span className="modal-info-value info-value--price">
                            {formatPrice(
                              propertyDetails.auction_starting_price || propertyDetails.price || 0,
                              propertyDetails.currency
                            )}
                          </span>
                        </div>
                      </>
                    )}
                    
                    {/* Удобства и Дополнительные удобства в одном ряду */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', gridColumn: '1 / -1' }}>
                      {(() => {
                        const balcony = propertyDetails?.balcony === 1 || selectedRequest.property_balcony === 1;
                        const parking = propertyDetails?.parking === 1 || selectedRequest.property_parking === 1;
                        const elevator = propertyDetails?.elevator === 1 || selectedRequest.property_elevator === 1;
                        const garage = propertyDetails?.garage === 1 || selectedRequest.property_garage === 1;
                        const pool = propertyDetails?.pool === 1 || selectedRequest.property_pool === 1;
                        const garden = propertyDetails?.garden === 1 || selectedRequest.property_garden === 1;
                        const electricity = propertyDetails?.electricity === 1 || selectedRequest.property_electricity === 1;
                        const internet = propertyDetails?.internet === 1 || selectedRequest.property_internet === 1;
                        const security = propertyDetails?.security === 1 || selectedRequest.property_security === 1;
                        const furniture = propertyDetails?.furniture === 1 || selectedRequest.property_furniture === 1;
                        
                        if (balcony || parking || elevator || garage || pool || garden || electricity || internet || security || furniture) {
                          return (
                            <div className="modal-info-item">
                              <span className="modal-info-label">Удобства:</span>
                              <div className="modal-amenities-list">
                                {balcony && <span className="amenity-badge">Балкон</span>}
                                {parking && <span className="amenity-badge">Парковка</span>}
                                {elevator && <span className="amenity-badge">Лифт</span>}
                                {garage && <span className="amenity-badge">Гараж</span>}
                                {pool && <span className="amenity-badge">Бассейн</span>}
                                {garden && <span className="amenity-badge">Сад</span>}
                                {electricity && <span className="amenity-badge">Электричество</span>}
                                {internet && <span className="amenity-badge">Интернет</span>}
                                {security && <span className="amenity-badge">Охрана</span>}
                                {furniture && <span className="amenity-badge">Мебель</span>}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      {/* Дополнительные удобства */}
                      {propertyDetails?.additional_amenities && (
                        <div className="modal-info-item">
                          <span className="modal-info-label">Дополнительные удобства:</span>
                          <span className="modal-info-value">
                            {typeof propertyDetails.additional_amenities === 'string' 
                              ? propertyDetails.additional_amenities 
                              : JSON.stringify(propertyDetails.additional_amenities)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-section">
                <h3>Статус и заметки</h3>
                <div className="modal-info-grid">
                  {(selectedRequest.property_id || propertyDetails?.id) && (
                    <div className="modal-info-item">
                      <span className="modal-info-label">Ссылка на объект:</span>
                      <span className="modal-info-value">
                        <a
                          href={`/property/${selectedRequest.property_id || propertyDetails?.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/property/${selectedRequest.property_id || propertyDetails?.id}`);
                            setIsDetailModalOpen(false);
                          }}
                          style={{
                            color: '#0ABAB5',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 500
                          }}
                        >
                          Перейти к объекту
                          <FiExternalLink size={16} />
                        </a>
                      </span>
                    </div>
                  )}
                  <div className="modal-info-item">
                    <span className="modal-info-label">Дата запроса:</span>
                    <span className="modal-info-value">
                      {formatDate(selectedRequest.request_date || selectedRequest.created_at)}
                    </span>
                  </div>
                </div>
                
                <div className="modal-notes">
                  <label className="modal-notes-label">Заметки администратора:</label>
                  <textarea
                    className="modal-notes-textarea"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Добавьте заметки о запросе..."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div className="purchase-request-modal__actions">
              <div className="modal-actions-group">
                <button
                  className="modal-action-btn modal-action-btn--processing"
                  onClick={() => handleStatusUpdate(selectedRequest.id, 'processing')}
                  disabled={updatingStatus || selectedRequest.status === 'processing'}
                >
                  <FiFileText />
                  В обработку
                </button>
                <button
                  className="modal-action-btn modal-action-btn--completed"
                  onClick={() => handleStatusUpdate(selectedRequest.id, 'completed')}
                  disabled={updatingStatus || selectedRequest.status === 'completed'}
                >
                  <FiCheck />
                  Завершить
                </button>
                <button
                  className="modal-action-btn modal-action-btn--cancelled"
                  onClick={() => handleStatusUpdate(selectedRequest.id, 'cancelled')}
                  disabled={updatingStatus || selectedRequest.status === 'cancelled'}
                >
                  <FiX />
                  Отменить
                </button>
              </div>
              <button
                className="modal-action-btn modal-action-btn--delete"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleDelete(selectedRequest.id);
                }}
                disabled={updatingStatus}
              >
                <FiX />
                Удалить запрос
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PurchaseRequests;
