import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './CategoriesPage.css';
import { getCategories, type CategoryDto } from '../api/catalog';

function CategoriesPage() {
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadCategories() {
            try {
                setLoading(true);
                setError(null);
                const data = await getCategories();
                setCategories(data);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Unknown error');
                }
            } finally {
                setLoading(false);
            }
        }

        loadCategories();
    }, []);

    return (
        <div className="categories-page">
            <section className="categories-hero">
                <div className="container">
                    <p className="categories-hero__eyebrow">Catalogue</p>
                    <h1 className="categories-hero__title">Choose your category</h1>
                    <p className="categories-hero__subtitle">
                        Start with the type of upgrade you have in mind. You can refine by brand and price on the next step.
                    </p>
                </div>
            </section>

            <section className="categories-grid-section">
                <div className="container">
                    {loading && <p>Loading categories…</p>}
                    {error && !loading && (
                        <p style={{ color: 'red', fontSize: '0.9rem' }}>Error: {error}</p>
                    )}

                    {!loading && !error && categories.length === 0 && (
                        <p>No categories found.</p>
                    )}

                    {!loading && !error && categories.length > 0 && (
                        <div className="categories-grid">
                            {categories.map((cat) => (
                                <Link
                                    key={cat.category}
                                    to={`/products/list?category=${encodeURIComponent(cat.category)}`}
                                    className="category-tile-link"
                                >
                                    <article className="category-tile">
                                        <div className="category-tile__header">
                                            <h2>{cat.category}</h2>
                                            <span className="category-tile__pill">
                        {cat.product_count} items
                      </span>
                                        </div>
                                        <p>
                                            Explore {cat.category.toLowerCase()} parts tailored for performance
                                            and reliability.
                                        </p>
                                        <span className="category-tile__cta">
                      Browse {cat.category.toLowerCase()} →
                    </span>
                                    </article>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

export default CategoriesPage;
