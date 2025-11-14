import './HomePage.css'

function HomePage() {
    return (
        <div className="home">
            {/* HERO */}
            <section className="hero">
                <div className="hero__overlay" />
                <div className="hero__content container">
                    <p className="hero__eyebrow">Premium performance parts</p>
                    <h1 className="hero__title">
                        Upgrade your <span>drive</span>.
                    </h1>
                    <p className="hero__subtitle">
                        Exhausts, brakes, suspension and more — curated for car enthusiasts who care
                        about performance and design.
                    </p>
                    <div className="hero__actions">
                        <button className="btn btn--primary">Browse car parts</button>
                        <button className="btn btn--ghost">Vehicle finder</button>
                    </div>
                </div>
            </section>

            {/* HIGHLIGHTS */}
            <section className="highlights container">
                <div className="highlights__card">
                    <h3>Performance focused</h3>
                    <p>Carefully selected parts that deliver real gains on the road and track.</p>
                </div>
                <div className="highlights__card">
                    <h3>Trusted brands</h3>
                    <p>Only components from proven manufacturers and OEM suppliers.</p>
                </div>
                <div className="highlights__card">
                    <h3>Fast delivery</h3>
                    <p>Parts shipped quickly so your build spends less time in the garage.</p>
                </div>
            </section>

            {/* FEATURED CATEGORIES */}
            <section className="section section--light">
                <div className="container">
                    <div className="section__header">
                        <h2>Featured categories</h2>
                        <p>Start with the essentials for your next upgrade.</p>
                    </div>
                    <div className="categories">
                        <article className="category-card">
                            <div className="category-card__tag">New</div>
                            <h3>Exhaust systems</h3>
                            <p>Deep, refined sound and reduced backpressure for your engine.</p>
                        </article>
                        <article className="category-card">
                            <h3>Brakes</h3>
                            <p>High-performance pads, discs and kits for confident stopping power.</p>
                        </article>
                        <article className="category-card">
                            <h3>Suspension</h3>
                            <p>Coilovers and lowering springs for sharper handling and stance.</p>
                        </article>
                        <article className="category-card">
                            <h3>Wheels & accessories</h3>
                            <p>Lightweight alloys and hardware to finish your build.</p>
                        </article>
                    </div>
                </div>
            </section>

            {/* BRAND STORY / STRIP */}
            <section className="section section--dark">
                <div className="container brand-strip">
                    <div className="brand-strip__text">
                        <p className="brand-strip__eyebrow">Built for enthusiasts</p>
                        <h2>From track passion to road perfection.</h2>
                        <p>
                            Inspired by the aesthetics and engineering of high-end exhaust brands,
                            our store focuses on premium parts with clean design and serious
                            performance.
                        </p>
                    </div>
                    <div className="brand-strip__stats">
                        <div className="stat">
                            <span className="stat__number">150+</span>
                            <span className="stat__label">Products</span>
                        </div>
                        <div className="stat">
                            <span className="stat__number">25</span>
                            <span className="stat__label">Brands</span>
                        </div>
                        <div className="stat">
                            <span className="stat__number">4.9</span>
                            <span className="stat__label">Average rating</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default HomePage
