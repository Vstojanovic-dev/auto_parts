// import { useParams } from 'react-router-dom'
import './ProductDetailPage.css'

interface ProductDetail {
    id: number
    name: string
    brand: string
    category: string
    price: number
    badge?: 'new' | 'bestseller' | 'limited'
    shortDescription: string
    longDescription: string
    specs: { label: string; value: string }[]
    compatibility: string
}

const MOCK_PRODUCT_DETAIL: ProductDetail = {
    id: 1,
    name: 'Performance Exhaust System',
    brand: 'AkraTune',
    category: 'Exhaust',
    price: 1250,
    badge: 'bestseller',
    shortDescription: 'Lightweight stainless performance exhaust with a deep, refined tone.',
    longDescription:
        'This performance exhaust system is engineered to improve exhaust flow, reduce weight, and deliver a deep, refined sound without excessive drone. Ideal for spirited street driving and occasional track days, it balances everyday usability with motorsport-inspired character.',
    specs: [
        { label: 'Material', value: 'Stainless steel' },
        { label: 'Configuration', value: 'Cat-back system' },
        { label: 'Weight reduction', value: 'Up to 7 kg vs OEM' },
        { label: 'Warranty', value: '2 years' },
    ],
    compatibility:
        'Compatible with selected performance models from 2018–2024. For exact fitment, please check your vehicle model, engine code, and body style.',
}

function ProductDetailPage() {
    //const { id } = useParams()
    // For now we ignore the id and use mock data – later you’ll fetch by id.
    const product = MOCK_PRODUCT_DETAIL

    return (
        <div className="product-page">
            {/* Top banner / breadcrumb */}
            <section className="product-banner">
                <div className="container">
                    <nav className="product-breadcrumb">
                        <span>Home</span>
                        <span>›</span>
                        <span>Products</span>
                        <span>›</span>
                        <span className="product-breadcrumb__current">{product.category}</span>
                    </nav>

                    <div className="product-banner__content">
                        <div>
                            <p className="product-banner__brand">{product.brand}</p>
                            <h1 className="product-banner__title">{product.name}</h1>
                        </div>
                        <div className="product-banner__meta">
                            {product.badge && (
                                <span className={`product-badge product-badge--${product.badge}`}>
                  {product.badge === 'bestseller' && 'Bestseller'}
                                    {product.badge === 'new' && 'New'}
                                    {product.badge === 'limited' && 'Limited'}
                </span>
                            )}
                            <span className="product-banner__category">{product.category}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main layout */}
            <section className="product-main">
                <div className="container product-main__grid">
                    {/* Image / gallery placeholder */}
                    <div className="product-gallery">
                        <div className="product-gallery__main">
                            <div className="product-gallery__image-placeholder" />
                        </div>
                        <div className="product-gallery__thumbs">
                            <div className="thumb thumb--active" />
                            <div className="thumb" />
                            <div className="thumb" />
                        </div>
                    </div>

                    {/* Info panel */}
                    <aside className="product-info">
                        <p className="product-info__short">{product.shortDescription}</p>
                        <div className="product-info__price-row">
                            <div>
                <span className="product-info__price">
                  {product.price.toFixed(0)} €
                </span>
                                <span className="product-info__price-note">incl. VAT</span>
                            </div>
                        </div>

                        <div className="product-info__actions">
                            <button type="button" className="btn btn--primary">
                                Add to cart
                            </button>
                            <button type="button" className="btn btn--ghost">
                                Vehicle compatibility
                            </button>
                        </div>

                        <div className="product-info__meta">
                            <span>Estimated delivery: 3–5 business days</span>
                            <span>Free returns within 30 days</span>
                        </div>

                        <div className="product-specs">
                            <h3>Key specifications</h3>
                            <dl>
                                {product.specs.map((spec) => (
                                    <div key={spec.label} className="product-specs__row">
                                        <dt>{spec.label}</dt>
                                        <dd>{spec.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </aside>
                </div>
            </section>

            {/* Description & compatibility */}
            <section className="product-details">
                <div className="container product-details__grid">
                    <div className="product-details__block">
                        <h2>Product description</h2>
                        <p>{product.longDescription}</p>
                    </div>
                    <div className="product-details__block">
                        <h2>Compatibility</h2>
                        <p>{product.compatibility}</p>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default ProductDetailPage
