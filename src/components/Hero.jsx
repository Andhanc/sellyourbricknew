import './Hero.css'

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-container">
        <div className="hero-features">
          <div className="hero-feature-card">
            <div className="hero-feature-image">
              <img src="https://static.cdn-cian.ru/frontend/valuation-my-home-page-frontend/icon_1.17dab2f77576179c.png" alt="Оценка недвижимости" />
            </div>
            <div className="hero-feature-content">
              <h3>Узнайте цену своего дома</h3>
              <p>
                Оцениваем квартиру и показываем, как её цена меняется – а ещё составляем подборки недвижимости с учётом ваших пожеланий и возможностей
              </p>
            </div>
          </div>

          <div className="hero-feature-card">
            <div className="hero-feature-image">
              <img src="https://static.cdn-cian.ru/frontend/valuation-my-home-page-frontend/icon_2.d6f1a6545650e2f8.svg" alt="Аренда недвижимости" />
            </div>
            <div className="hero-feature-content">
              <h3>Распоряжайтесь квартирой с умом</h3>
              <p>
                Показываем потенциальную стоимость аренды вашей квартиры и рассказываем, как и сколько можно на ней заработать
              </p>
            </div>
          </div>

          <div className="hero-feature-card">
            <div className="hero-feature-image">
              <img src="https://static.cdn-cian.ru/frontend/valuation-my-home-page-frontend/icon_3.be34334d56e4527b.svg" alt="Экспертиза недвижимости" />
            </div>
            <div className="hero-feature-content">
              <h3>Станьте экспертом в недвижимости</h3>
              <p>
                Помогаем разобраться в недвижимости с помощью гайдов и рассказываем полезное о жилье в журнале, пишем главное о доме и инфраструктуре.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero

