import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-links">
          <div className="footer-column">
            <Link to="/map">Карта</Link>
            <a href="#">Тарифы и цены</a>
            <Link to="/">Аукцион</Link>
          </div>
          <div className="footer-column">
            <a href="#">Юридические документы</a>
            <a href="#">Реклама на сайте</a>
            <a href="#">Карьера в Циане</a>
          </div>
          <div className="footer-column">
            <a href="#">Поиск на карте</a>
            <a href="#">Продвижение</a>
            <a href="#">Сайт для инвесторов</a>
          </div>
          <div className="footer-column">
            <a href="#">Аукцион</a>
            <a href="#">Вакансии агентств</a>
          </div>
          <div className="footer-column">
            <a href="#">Реклама Циана на ТВ</a>
            <a href="#">Помощь</a>
          </div>
          <div className="footer-column">
            <a href="#">Программа «Суперагенты»</a>
            <a href="#">Ипотечный калькулятор</a>
          </div>
        </div>

        <div className="footer-info">
          <p className="footer-text">
            Циан – база проверенных объявлений о продаже и аренде жилой, загородной и коммерческой недвижимости. 
            Онлайн-сервис №1 в России в категории «Недвижимость», по данным Similarweb на сентябрь 2023 г. 
            Используя сервис, вы соглашаетесь с <a href="#">Пользовательским соглашением</a> и <a href="#">Политикой конфиденциальности</a> Циан. 
            Оплачивая услуги, вы принимаете <a href="#">Лицензионное соглашение</a>. 
            ООО «Айриэлтор», email: <a href="mailto:support@cian.ru">support@cian.ru</a>. 
            На информационном ресурсе применяются <a href="#">Рекомендательные технологии</a>.
          </p>
        </div>

        <div className="footer-bottom">
          <div className="footer-logo">
            <div className="logo-icon">🏠</div>
            <span className="logo-text">циан</span>
          </div>
          
          <div className="footer-mobile-links">
            <a href="#">Мобильная версия сайта</a>
            <a href="#">О приложении</a>
          </div>

          <div className="footer-apps">
            <a href="#" className="app-button google-play">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2L2 7v6l8 5 8-5V7l-8-5z"/>
              </svg>
              <div>
                <div className="app-button-text-small">СКАЧАТЬ ИЗ</div>
                <div className="app-button-text-large">Google Play</div>
              </div>
            </a>
            
            <a href="#" className="app-button app-store">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2L2 7v6l8 5 8-5V7l-8-5z"/>
              </svg>
              <div>
                <div className="app-button-text-small">Загрузите в</div>
                <div className="app-button-text-large">App Store</div>
              </div>
            </a>
            
            <a href="#" className="app-button rustore">
              <div className="app-button-text-large">RuStore</div>
            </a>
            
            <a href="#" className="app-button appgallery">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2L2 7v6l8 5 8-5V7l-8-5z"/>
              </svg>
              <div>
                <div className="app-button-text-small">Загрузите в</div>
                <div className="app-button-text-large">AppGallery</div>
              </div>
            </a>
          </div>

          <div className="footer-age-rating">
            <div className="age-badge">0+</div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

