import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { FiCalendar } from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './Statistics.css';
import StatCard from './StatCard';
import NearestAuctionCard from './NearestAuctionCard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Statistics = ({ businessInfo, onShowUsers }) => {
  const [timeFilter, setTimeFilter] = useState('all');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);
  const calendarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };

    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  const getTimeMultiplier = (period, customStartDate = null, customEndDate = null) => {
    if (customStartDate && customEndDate) {
      const daysDiff = Math.ceil((customEndDate - customStartDate) / (1000 * 60 * 60 * 24));
      const baseMultiplier = Math.min(1.0, daysDiff / 30);
      return Math.max(0.3, baseMultiplier);
    }

    const multipliers = {
      'month': 1.0,
      '3months': 0.85,
      '6months': 0.70,
      'year': 0.55,
      'all': 0.40
    };
    return multipliers[period] || 1.0;
  };

  const getChangePercent = (basePercent, period) => {
    const adjustments = {
      'month': 0,
      '3months': -5,
      '6months': -10,
      'year': -15,
      'all': -20
    };
    const base = parseFloat(basePercent);
    const adjustment = adjustments[period] || 0;
    const newValue = base + adjustment;
    return newValue >= 0 ? `+${newValue.toFixed(1)}%` : `${newValue.toFixed(1)}%`;
  };

  // Функция для определения типа изменения на основе процента
  const getChangeType = (changeString) => {
    // Извлекаем числовое значение из строки (например, "+12.5%" или "-2.5%")
    const match = changeString.match(/([+-]?\d+\.?\d*)/);
    if (match) {
      const value = parseFloat(match[1]);
      return value >= 0 ? 'positive' : 'negative';
    }
    return 'positive'; // По умолчанию положительное
  };

  const multiplier = useMemo(() => {
    if (startDate && endDate) {
      return getTimeMultiplier(null, startDate, endDate);
    }
    return getTimeMultiplier(timeFilter);
  }, [timeFilter, startDate, endDate]);

  const generateCalendar = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < offset; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const calendarDays = useMemo(() => generateCalendar(calendarYear, calendarMonth), [calendarYear, calendarMonth]);

  const handleDateClick = (date) => {
    if (!date) return;
    
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      setTempStartDate(date);
      setTempEndDate(null);
    } else if (date < tempStartDate) {
      setTempStartDate(date);
      setTempEndDate(null);
    } else {
      setTempEndDate(date);
    }
  };

  const applyDateRange = () => {
    if (tempStartDate && tempEndDate) {
      setStartDate(tempStartDate);
      setEndDate(tempEndDate);
      setTimeFilter('custom');
      setIsCalendarOpen(false);
    }
  };

  const clearDateRange = () => {
    setStartDate(null);
    setEndDate(null);
    setTempStartDate(null);
    setTempEndDate(null);
    setTimeFilter('all');
    setIsCalendarOpen(false);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const isDateInRange = (date) => {
    if (!date) return false;
    if (tempStartDate && tempEndDate) {
      return date >= tempStartDate && date <= tempEndDate;
    }
    if (tempStartDate) {
      return date.getTime() === tempStartDate.getTime();
    }
    return false;
  };

  const isDateSelected = (date) => {
    if (!date) return false;
    if (tempStartDate && date.getTime() === tempStartDate.getTime()) return true;
    if (tempEndDate && date.getTime() === tempEndDate.getTime()) return true;
    return false;
  };

  const weekdayData = useMemo(() => ({
    labels: businessInfo.registrations_by_weekday.map(item => item.day),
    datasets: [{
      label: 'Количество регистраций',
      data: businessInfo.registrations_by_weekday.map(item => Math.round(item.count * multiplier)),
      backgroundColor: [
        '#4361ee',
        '#4895ef',
        '#3f37c9',
        '#4cc9f0',
        '#f8961e',
        '#f72585',
        '#10b981'
      ],
      borderRadius: 6,
      borderWidth: 0
    }]
  }), [businessInfo.registrations_by_weekday, multiplier]);

  const propertyCategoriesData = useMemo(() => ({
    labels: ['Виллы', 'Дома', 'Квартиры', 'Апартаменты', 'Земля'],
    datasets: [{
      label: 'Процент',
      data: [15, 20, 35, 18, 12],
      backgroundColor: [
        '#4361ee',
        '#4895ef',
        '#3f37c9',
        '#4cc9f0',
        '#10b981'
      ],
      borderRadius: 6
    }]
  }), []);

  const userRoleData = useMemo(() => ({
    labels: ['Продавцы', 'Покупатели'],
    datasets: [{
      data: [
        Math.round((businessInfo.user_role_stats?.sellers || 45) * multiplier),
        Math.round((businessInfo.user_role_stats?.buyers || 55) * multiplier)
      ],
      backgroundColor: [
        '#4361ee',
        '#f72585'
      ],
      borderWidth: 0
    }]
  }), [businessInfo.user_role_stats, multiplier]);

  const weekdayChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            return `Регистраций: ${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 50
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const propertyCategoriesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            return `${value}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  const nearestAuction = useMemo(() => {
    if (!businessInfo.auctions || businessInfo.auctions.length === 0) return null;
    const now = new Date();
    const activeAuctions = businessInfo.auctions.filter(auction => new Date(auction.end_date) > now);
    if (activeAuctions.length === 0) return null;
    return activeAuctions.reduce((nearest, current) => {
      return new Date(current.end_date) < new Date(nearest.end_date) ? current : nearest;
    });
  }, [businessInfo.auctions]);

  const stats = useMemo(() => {
    const totalUsers = Math.round(businessInfo.stats.clients_count * multiplier);
    const buyersCount = Math.round((businessInfo.user_role_stats?.buyers || 55) / 100 * totalUsers);
    const sellersCount = Math.round((businessInfo.user_role_stats?.sellers || 45) / 100 * totalUsers);
    
    const statsData = [
      {
        title: 'Всего пользователей',
        value: totalUsers,
        changePercent: '12.5',
        icon: 'fas fa-users',
        iconClass: 'blue'
      },
      {
        title: 'Количество Покупателей',
        value: buyersCount,
        changePercent: '8.3',
        icon: 'fas fa-shopping-cart',
        iconClass: 'green'
      },
      {
        title: 'Количество Продавцов',
        value: sellersCount,
        changePercent: '10.2',
        icon: 'fas fa-store',
        iconClass: 'purple'
      },
      {
        title: 'Выставленные Объекты',
        value: Math.round((businessInfo.objects_count || 156) * multiplier),
        changePercent: '15.2',
        icon: 'fas fa-building',
        iconClass: 'orange'
      },
      {
        title: 'Количество Аукционов',
        value: Math.round((businessInfo.auctions_count || 23) * multiplier),
        changePercent: '18.4',
        icon: 'fas fa-gavel',
        iconClass: 'blue'
      },
      {
        title: 'Прибыль',
        value: `$${Math.round(businessInfo.stats.total_profit * multiplier).toLocaleString('ru-RU')}`,
        changePercent: '22.7',
        icon: 'fas fa-wallet',
        iconClass: 'green'
      }
    ];

    return statsData.map(stat => {
      // При фильтре "Все время" не показываем проценты, только абсолютные значения
      if (timeFilter === 'all') {
        return {
          ...stat,
          change: null, // Не показываем изменение
          changeType: null
        };
      }
      
      const changeString = getChangePercent(stat.changePercent, timeFilter);
      return {
        ...stat,
        change: changeString + ' за период',
        changeType: getChangeType(changeString)
      };
    });
  }, [businessInfo, multiplier, timeFilter]);

  const timeFilterOptions = [
    { value: 'all', label: 'Все время' },
    { value: 'month', label: 'Месяц' },
    { value: '3months', label: '3 месяца' },
    { value: '6months', label: 'Полгода' },
    { value: 'year', label: 'Год' }
  ];

  return (
    <div className="content-section" id="statistics-section">
      <div className="statistics-header">
        <h2 className="statistics-title">Статистика</h2>
        <div className="time-filter-container">
          <div className="time-filter">
            {timeFilterOptions.map(option => (
              <button
                key={option.value}
                className={`time-filter-btn ${timeFilter === option.value && !startDate && !endDate ? 'active' : ''}`}
                onClick={() => {
                  setTimeFilter(option.value);
                  setStartDate(null);
                  setEndDate(null);
                  setTempStartDate(null);
                  setTempEndDate(null);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="calendar-wrapper" ref={calendarRef}>
            <button
              className={`calendar-icon-btn ${startDate && endDate ? 'active' : ''}`}
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              title="Выбрать диапазон дат"
            >
              <FiCalendar size={20} />
              {startDate && endDate && (
                <span className="calendar-date-range">
                  {formatDate(startDate)} - {formatDate(endDate)}
                </span>
              )}
            </button>
            {isCalendarOpen && (
              <div className="calendar-popup">
                <div className="calendar-header">
                  <button
                    className="calendar-nav-btn"
                    onClick={() => {
                      if (calendarMonth === 0) {
                        setCalendarMonth(11);
                        setCalendarYear(calendarYear - 1);
                      } else {
                        setCalendarMonth(calendarMonth - 1);
                      }
                    }}
                  >
                    ‹
                  </button>
                  <div className="calendar-month-year">
                    {new Date(calendarYear, calendarMonth).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                  </div>
                  <button
                    className="calendar-nav-btn"
                    onClick={() => {
                      if (calendarMonth === 11) {
                        setCalendarMonth(0);
                        setCalendarYear(calendarYear + 1);
                      } else {
                        setCalendarMonth(calendarMonth + 1);
                      }
                    }}
                  >
                    ›
                  </button>
                </div>
                <div className="calendar-grid">
                  <div className="calendar-weekdays">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                      <div key={day} className="calendar-weekday">{day}</div>
                    ))}
                  </div>
                  <div className="calendar-days">
                    {calendarDays.map((date, index) => (
                      <button
                        key={index}
                        className={`calendar-day ${!date ? 'empty' : ''} ${isDateInRange(date) ? 'in-range' : ''} ${isDateSelected(date) ? 'selected' : ''}`}
                        onClick={() => handleDateClick(date)}
                        disabled={!date}
                      >
                        {date ? date.getDate() : ''}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="calendar-footer">
                  {tempStartDate && tempEndDate && (
                    <div className="calendar-selected-range">
                      Выбрано: {formatDate(tempStartDate)} - {formatDate(tempEndDate)}
                    </div>
                  )}
                  <div className="calendar-actions">
                    <button className="calendar-action-btn" onClick={clearDateRange}>
                      Очистить
                    </button>
                    <button
                      className="calendar-action-btn calendar-action-btn-primary"
                      onClick={applyDateRange}
                      disabled={!tempStartDate || !tempEndDate}
                    >
                      Применить
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
        {nearestAuction && (
          <NearestAuctionCard auction={nearestAuction} />
        )}
      </div>

      <div className="charts-row">
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Регистрации по дням недели</h3>
            <div className="chart-actions">
              <button className="chart-btn active">Все дни</button>
            </div>
          </div>
          <div className="chart-wrapper">
            <Bar data={weekdayData} options={weekdayChartOptions} />
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Пользователи по дням недели</h3>
            <div className="chart-actions" id="weekdayButtons">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, idx) => (
                <button key={idx} className="chart-btn">
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div id="weekdayUsersList" style={{ padding: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
            <p style={{ color: 'var(--gray-dark)', textAlign: 'center' }}>
              Выберите день недели для просмотра пользователей
            </p>
          </div>
        </div>
      </div>

      <div className="demographics-grid">
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Категории недвижимости</h3>
          </div>
          <div className="chart-wrapper">
            <Bar data={propertyCategoriesData} options={propertyCategoriesOptions} />
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Соотношение продавцов и покупателей</h3>
          </div>
          <div className="chart-wrapper">
            <Pie data={userRoleData} options={pieOptions} />
          </div>
        </div>
      </div>

      <div className="users-section">
        <div className="users-header">
          <h3 className="users-title">Информация о пользователях</h3>
          <button className="users-toggle" onClick={onShowUsers}>
            <i className="fas fa-users"></i> Показать всех пользователей
          </button>
        </div>
        <p>Нажмите кнопку, чтобы просмотреть подробную информацию о клиентах, включая их покупки, бонусные баллы и другую статистику.</p>
      </div>
    </div>
  );
};

export default Statistics;

