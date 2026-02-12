import { useState, useEffect } from 'react';
import './CircularTimer.css';

const CircularTimer = ({ endTime, size = 120, strokeWidth = 6, originalDuration = null }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return { 
          days, 
          hours, 
          minutes, 
          seconds
        };
      }
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    const update = calculateTimeLeft();
    setTimeLeft(update);

    const timer = setInterval(() => {
      const update = calculateTimeLeft();
      setTimeLeft(update);
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);
  
  // Вычисляем прогресс для оранжевой обводки (основной прогресс)
  const calculateProgress = () => {
    // Для оранжевой обводки всегда показываем полный круг (100%)
    // Она служит фоном для красной обводки
    return 100;
  };
  
  // Вычисляем прогресс для красной обводки (показывает сколько времени прошло от начала)
  const calculateRedProgress = () => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const totalTime = end - now;
    
    if (totalTime <= 0) return 100; // Таймер истек - красная обводка полная
    
    // Если есть исходная длительность, используем её для расчета прогресса
    if (originalDuration && originalDuration > 0) {
      // Вычисляем сколько времени прошло от начала
      const elapsed = originalDuration - totalTime;
      const progress = Math.max(0, Math.min(100, (elapsed / originalDuration) * 100));
      return progress;
    }
    
    // Fallback: если исходная длительность неизвестна, используем приблизительную оценку
    // Предполагаем максимальное время тестового таймера - 2 часа
    const maxTime = 2 * 60 * 60 * 1000; // 2 часа в миллисекундах
    
    // Если текущее оставшееся время больше максимального, считаем что прошло 0%
    if (totalTime >= maxTime) return 0;
    
    // Прогресс = сколько времени прошло от максимального времени
    const elapsed = maxTime - totalTime;
    return Math.max(0, Math.min(100, (elapsed / maxTime) * 100));
  };
  
  const progressValue = calculateProgress();
  const redProgressValue = calculateRedProgress();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressValue / 100) * circumference;
  const redOffset = circumference - (redProgressValue / 100) * circumference;

  // Оранжевый цвет для основного прогресса
  const color = '#ff6b35';
  // Темно-красный цвет для обводки окончания (более контрастный)
  const redColor = '#dc2626';

  // Форматируем время для отображения в формате MM:SS или HH:MM:SS
  const formatTime = () => {
    const totalSeconds = timeLeft.days * 86400 + timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
  };

  return (
    <div className="circular-timer" style={{ width: size, height: size }}>
      <svg className="circular-timer-svg" width={size} height={size} style={{ overflow: 'visible' }}>
        <defs>
          {/* Красивый градиент для оранжевого прогресса */}
          <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff8c42" stopOpacity="1" />
            <stop offset="50%" stopColor="#ff6b35" stopOpacity="1" />
            <stop offset="100%" stopColor="#ff5722" stopOpacity="1" />
          </linearGradient>
          {/* Красивый градиент для красного прогресса */}
          <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4444" stopOpacity="1" />
            <stop offset="50%" stopColor="#dc2626" stopOpacity="1" />
            <stop offset="100%" stopColor="#b91c1c" stopOpacity="1" />
          </linearGradient>
          {/* Радиальный градиент для более объемного вида */}
          <radialGradient id="orangeRadial" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ffa366" stopOpacity="1" />
            <stop offset="100%" stopColor="#ff6b35" stopOpacity="1" />
          </radialGradient>
        </defs>
        {/* Фоновый круг */}
        <circle
          className="circular-timer-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Прогресс круг (оранжевый) с градиентом - под красной обводкой */}
        <circle
          className="circular-timer-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#orangeGradient)"
          strokeWidth={strokeWidth + 1}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
        {/* Красная обводка (показывает прогресс окончания таймера) - поверх оранжевой */}
        <circle
          className="circular-timer-red-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#redGradient)"
          strokeWidth={strokeWidth + 3}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={redOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: redProgressValue > 0 ? 1 : 0
          }}
        />
      </svg>
      <div className="circular-timer-content">
        <div className="circular-timer-time">{formatTime()}</div>
      </div>
    </div>
  );
};

export default CircularTimer;
