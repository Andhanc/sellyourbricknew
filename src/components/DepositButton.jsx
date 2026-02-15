import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FaWallet, FaArrowRight } from 'react-icons/fa'
import './DepositButton.css'

const DepositButton = ({ amount = 0 }) => {
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)
  const [isHidden, setIsHidden] = useState(false)

  const formatAmount = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(2)}K`
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Отслеживаем прокрутку страницы для скрытия/показа кнопки
  useEffect(() => {
    let lastScrollY = window.scrollY
    let ticking = false
    let hideTimeout = null

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // Вычисляем, насколько близко к концу страницы (в пределах 400px от низа)
      const distanceFromBottom = documentHeight - (currentScrollY + windowHeight)
      const scrollingDown = currentScrollY > lastScrollY
      
      // Очищаем предыдущий таймаут
      if (hideTimeout) {
        clearTimeout(hideTimeout)
        hideTimeout = null
      }

      // Скрываем кнопку при прокрутке вниз, когда близко к концу страницы
      if (distanceFromBottom < 400 && scrollingDown && currentScrollY > 300) {
        setIsHidden(true)
      } 
      // Показываем кнопку при прокрутке вверх или когда далеко от конца
      else if (distanceFromBottom >= 400 || !scrollingDown) {
        // Небольшая задержка для плавности
        hideTimeout = setTimeout(() => {
          setIsHidden(false)
        }, 100)
      }

      lastScrollY = currentScrollY
      ticking = false
    }

    const requestTick = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll)
        ticking = true
      }
    }

    const onScroll = () => {
      requestTick()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (hideTimeout) {
        clearTimeout(hideTimeout)
      }
    }
  }, [])

  return (
    <button 
      className={`deposit-button ${isHidden ? 'deposit-button--hidden' : ''}`}
      onClick={() => navigate('/wallet')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Открыть депозит"
    >
      <div className="deposit-button__glow"></div>
      <div className="deposit-button__content-wrapper">
        <div className="deposit-button__icon-wrapper">
          <div className="deposit-button__icon-bg"></div>
          <FaWallet className="deposit-button__icon" />
        </div>
        <div className="deposit-button__content">
          <div className="deposit-button__label">Депозит</div>
          <div className="deposit-button__amount">{formatAmount(amount)}</div>
        </div>
        <div className={`deposit-button__arrow ${isHovered ? 'hovered' : ''}`}>
          <FaArrowRight />
        </div>
      </div>
      <div className="deposit-button__particles">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </button>
  )
}

export default DepositButton

