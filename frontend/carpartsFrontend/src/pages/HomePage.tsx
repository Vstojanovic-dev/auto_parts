import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, type CategoryDto } from '../api/catalog';

function HomePage() {
    const [categories, setCategories] = useState<CategoryDto[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const data = await getCategories();
                setCategories(data);
            } catch {
                // If it fails, we just keep the fallback static cards
                setCategories([]);
            }
        })();
    }, []);

    const topCategories = categories.slice(0, 4);

    // Fallback if DB has no categories (or request failed)
    const fallbackCategories = [
        { category: 'Exhaust systems', description: 'Deep, refined sound and reduced backpressure for your engine.' },
        { category: 'Brakes', description: 'High-performance pads, discs and kits for confident stopping power.' },
        { category: 'Suspension', description: 'Coilovers and lowering springs for sharper handling and stance.' },
        { category: 'Accessories', description: 'Wheels and accessories to finish your build.' },
    ];

    const showDynamic = topCategories.length > 0;

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
                        <Link to="/products" className="hero-link">
                            <button className="btn btn--primary">Browse car parts</button>
                        </Link>
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

            {/* FEATURED CATEGORIES (dynamic subset from DB) */}
            <section className="section section--light">
                <div className="container">
                    <div className="section__header">
                        <h2>Featured categories</h2>
                        <p>Jump directly into popular upgrade areas.</p>
                    </div>
                    <div className="categories">
                        {(showDynamic ? topCategories : []).map((cat) => (
                            <Link
                                key={cat.category}
                                to={`/products/list?category=${encodeURIComponent(cat.category)}`}
                                className="category-link"
                            >
                                <article className="category-card">
                                    <h3>{cat.category}</h3>
                                    <p>
                                        Explore {cat.category.toLowerCase()} parts tailored for performance
                                        and reliability.
                                    </p>
                                </article>
                            </Link>
                        ))}

                        {!showDynamic &&
                            fallbackCategories.map((fc) => (
                                <div key={fc.category} className="category-card">
                                    <h3>{fc.category}</h3>
                                    <p>{fc.description}</p>
                                </div>
                            ))}
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
    );
}

export default HomePage;
