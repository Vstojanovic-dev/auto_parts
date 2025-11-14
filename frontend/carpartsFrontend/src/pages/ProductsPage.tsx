import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './ProductsPage.css'


export type ProductCategory =
    | 'Exhaust'
    | 'Brakes'
    | 'Suspension'
    | 'Fluids'
    | 'Electrical'
    | 'Accessories'

export interface Product {
    id: number
    name: string
    brand: string
    category: ProductCategory
    price: number
    badge?: 'new' | 'bestseller' | 'limited'
}

const MOCK_PRODUCTS: Product[] = [
    {
        id: 1,
        name: 'Performance Exhaust System',
        brand: 'AkraTune',
        category: 'Exhaust',
        price: 1250,
        badge: 'bestseller',
    },
    {
        id: 2,
        name: 'Ceramic Front Brake Kit',
        brand: 'TrackLine',
        category: 'Brakes',
        price: 590,
        badge: 'new',
    },
    {
        id: 3,
        name: 'Street Coilover Kit',
        brand: 'StancePro',
        category: 'Suspension',
        price: 980,
    },
    {
        id: 4,
        name: 'Engine Oil 5W-30 (5L)',
        brand: 'PureOil',
        category: 'Fluids',
        price: 49,
    },
    {
        id: 5,
        name: '70Ah AGM Battery',
        brand: 'VoltEdge',
        category: 'Electrical',
        price: 189,
    },
    {
        id: 6,
        name: 'All-weather Wiper Set',
        brand: 'ClearView',
        category: 'Accessories',
        price: 29,
    },
    {
        id: 7,
        name: 'Rear Brake Pads',
        brand: 'TrackLine',
        category: 'Brakes',
        price: 130,
    },
    {
        id: 8,
        name: 'Lowering Spring Kit',
        brand: 'StancePro',
        category: 'Suspension',
        price: 340,
        badge: 'limited',
    },
]

const ALL_CATEGORIES: ProductCategory[] = [
    'Exhaust',
    'Brakes',
    'Suspension',
    'Fluids',
    'Electrical',
    'Accessories',
]

type SortOption = 'recommended' | 'price_low' | 'price_high'

function ProductsPage() {
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all')
    const [sort, setSort] = useState<SortOption>('recommended')

    const filteredProducts = useMemo(() => {
        let items = [...MOCK_PRODUCTS]

        if (activeCategory !== 'all') {
            items = items.filter((p) => p.category === activeCategory)
        }

        if (search.trim() !== '') {
            const term = search.toLowerCase()
            items = items.filter(
                (p) =>
                    p.name.toLowerCase().includes(term) ||
                    p.brand.toLowerCase().includes(term),
            )
        }

        if (sort === 'price_low') {
            items.sort((a, b) => a.price - b.price)
        } else if (sort === 'price_high') {
            items.sort((a, b) => b.price - a.price)
        } else {
            // "recommended" – simple sort by badge presence then price
            items.sort((a, b) => {
                const badgeScore = (x?: string) =>
                    x === 'bestseller' ? 2 : x === 'new' ? 1 : 0
                return badgeScore(b.badge) - badgeScore(a.badge) || a.price - b.price
            })
        }

        return items
    }, [activeCategory, search, sort])

    return (
        <div className="products-page">
            {/* Top band / title */}
            <section className="products-hero">
                <div className="container">
                    <p className="products-hero__eyebrow">Catalogue</p>
                    <div className="products-hero__header">
                        <h1>Performance car parts</h1>
                        <p>
                            Browse exhaust systems, brakes, suspension and more. Inspired by clean,
                            minimal product catalogues from premium brands.
                        </p>
                    </div>
                </div>
            </section>

            {/* Filters & controls */}
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
                                className={
                                    activeCategory === 'all'
                                        ? 'chip chip--active'
                                        : 'chip'
                                }
                                onClick={() => setActiveCategory('all')}
                            >
                                All
                            </button>
                            {ALL_CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    className={
                                        activeCategory === cat
                                            ? 'chip chip--active'
                                            : 'chip'
                                    }
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat}
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
                    {filteredProducts.length === 0 ? (
                        <p className="products-empty">No products match your filters.</p>
                    ) : (
                        <div className="products-grid">
                            {filteredProducts.map((p) => (
                                <article key={p.id} className="product-card">
                                    {p.badge && (
                                        <div className={`product-card__badge product-card__badge--${p.badge}`}>
                                            {p.badge === 'bestseller' && 'Bestseller'}
                                            {p.badge === 'new' && 'New'}
                                            {p.badge === 'limited' && 'Limited'}
                                        </div>
                                    )}
                                    <div className="product-card__image-placeholder" />
                                    <div className="product-card__body">
                                        <p className="product-card__brand">{p.brand}</p>
                                        <h3 className="product-card__name">{p.name}</h3>
                                        <p className="product-card__category">{p.category}</p>
                                        <div className="product-card__footer">
                      <span className="product-card__price">
                        {p.price.toFixed(0)} €
                      </span>
                                            <Link
                                                to={`/products/${p.id}`}
                                                className="product-card__cta-link"
                                            >
                                                <button className="product-card__cta" type="button">
                                                    View details
                                                </button>
                                            </Link>

                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}

export default ProductsPage
