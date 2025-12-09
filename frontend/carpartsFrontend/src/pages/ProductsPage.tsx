import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    getProducts,
    getCategories,
    type ProductDto,
    type CategoryDto,
    type ProductsSortBackend,
} from '../api/catalog';
import { useCart } from '../context/CartContext.tsx';


type SortOption = 'recommended' | 'price_low' | 'price_high';

function mapSortToBackend(sort: SortOption): ProductsSortBackend {
    switch (sort) {
        case 'price_low':
            return 'price_asc';
        case 'price_high':
            return 'price_desc';
        case 'recommended':
        default:
            return 'newest';
    }
}

function ProductsPage() {
    const { addItem } = useCart();

    const [searchParams] = useSearchParams();
    const initialCategoryFromUrl = searchParams.get('category') ?? 'all';

    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>(initialCategoryFromUrl);
    const [sort, setSort] = useState<SortOption>('recommended');

    const [products, setProducts] = useState<ProductDto[]>([]);
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [total, setTotal] = useState(0);

    // Load categories once (for chips)
    useEffect(() => {
        (async () => {
            try {
                const data = await getCategories();
                setCategories(data);
            } catch {
                // Silent fail: chips will just show "All"
            }
        })();
    }, []);

    // Load products whenever filters change
    useEffect(() => {
        async function loadProducts() {
            try {
                setLoading(true);
                setError(null);

                const response = await getProducts({
                    page: 1,
                    limit: 12,
                    q: search,
                    category: activeCategory === 'all' ? undefined : activeCategory,
                    sort: mapSortToBackend(sort),
                });

                setProducts(response.data);
                setTotal(response.total);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Unknown error');
                }
                setProducts([]);
            } finally {
                setLoading(false);
            }
        }

        loadProducts();
    }, [search, activeCategory, sort]);

    return (
        <div className="products-page">
            {/* Top band / title */}
            <section className="products-hero">
                <div className="container">
                    <p className="products-hero__eyebrow">Catalogue</p>
                    <div className="products-hero__header">
                        <h1>Performance car parts</h1>
                        <p>
                            Browse exhaust systems, brakes, suspension and more. Data is now coming
                            directly from your PHP backend.
                        </p>
                    </div>
                </div>
            </section>

            {}
            <section className="products-controls">
                <div className="container products-controls__inner">
                    <div className="products-search">
                        <input
                            type="text"
                            placeholder="Search by part or brand…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="products-filters">
                        <div className="products-categories">
                            <button
                                type="button"
                                className={activeCategory === 'all' ? 'chip chip--active' : 'chip'}
                                onClick={() => setActiveCategory('all')}
                            >
                                All
                            </button>

                            {categories.map((cat) => (
                                <button
                                    key={cat.category}
                                    type="button"
                                    className={
                                        activeCategory === cat.category ? 'chip chip--active' : 'chip'
                                    }
                                    onClick={() => setActiveCategory(cat.category)}
                                >
                                    {cat.category}
                                </button>
                            ))}
                        </div>

                        <div className="products-sort">
                            <label htmlFor="sort">Sort by</label>
                            <select
                                id="sort"
                                value={sort}
                                onChange={(e) => setSort(e.target.value as SortOption)}
                            >
                                <option value="recommended">Recommended</option>
                                <option value="price_low">Price: low to high</option>
                                <option value="price_high">Price: high to low</option>
                            </select>
                        </div>
                    </div>
                </div>
            </section>

            {/* Product grid */}
            <section className="products-grid-section">
                <div className="container">
                    {loading && <p>Loading products…</p>}
                    {error && !loading && (
                        <p style={{ color: 'red', fontSize: '0.9rem' }}>Error: {error}</p>
                    )}

                    {!loading && !error && total > 0 && (
                        <p className="products-count">
                            Showing {products.length} of {total} products
                        </p>
                    )}

                    {!loading && !error && products.length === 0 && (
                        <p className="products-empty">No products match your filters.</p>
                    )}

                    {!loading && !error && products.length > 0 && (
                        <div className="products-grid">
                            {products.map((p) => (
                                <article key={p.id} className="product-card">
                                    <div className="product-card__image-placeholder" />
                                    <div className="product-card__body">
                                        <p className="product-card__brand">{p.brand}</p>
                                        <h3 className="product-card__name">{p.name}</h3>
                                        <p className="product-card__category">{p.category}</p>
                                        <div className="product-card__footer">
  <span className="product-card__price">
    {Number(p.price).toFixed(2)} €
  </span>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button
                                                    className="product-card__cta"
                                                    type="button"
                                                    onClick={() =>
                                                        addItem(
                                                            {
                                                                id: p.id,
                                                                name: p.name,
                                                                price: Number(p.price),
                                                                brand: p.brand,
                                                                category: p.category,
                                                            },
                                                            1,
                                                        )
                                                    }
                                                >
                                                    Add to cart
                                                </button>
                                                <Link to={`/products/${p.id}`} className="product-card__cta-link">
                                                    <button className="product-card__cta" type="button">
                                                        View
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>

                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

export default ProductsPage;
