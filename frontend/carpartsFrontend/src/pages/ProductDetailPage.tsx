import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext.tsx';

interface BackendProduct {
    id: number;
    name: string;
    brand: string;
    category: string;
    description?: string;
    price: number | string;
    stock: number;
    image_url: string | null;
    created_at: string;
}

interface ProductApiResponse {
    status?: string;
    message?: string;
    product?: BackendProduct;
    data?: BackendProduct[] | BackendProduct;
}

interface ProductDetail {
    id: number;
    name: string;
    brand: string;
    category: string;
    price: number;
    badge?: 'new' | 'bestseller' | 'limited';
    shortDescription: string;
    longDescription: string;
    specs: { label: string; value: string }[];
    compatibility: string;
    imageUrl: string | null;
}

function buildImageUrl(raw: string | null): string | null {
    if (!raw) return null;

    // If backend already stored a full URL, just use it
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
        return raw;
    }

    // If it's a relative path like "/assets/...", point to backend host (8080)
    // Adjust this if you change your backend port/domain later.
    if (raw.startsWith('/')) {
        return `http://localhost:8080${raw}`;
    }

    // Fallback: treat as relative from backend root
    return `http://localhost:8080/${raw}`;
}

function mapBackendToDetail(p: BackendProduct): ProductDetail {
    const priceNumber =
        typeof p.price === 'string' ? Number(p.price) : p.price;

    const desc = p.description ?? '';

    return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        price: priceNumber,
        badge:
            ['Exhaust', 'Brakes'].includes(p.category) ? 'bestseller' : 'new',
        shortDescription:
            desc ||
            'High-quality car part designed for performance and reliability.',
        longDescription:
            desc ||
            'This product is engineered to meet or exceed OEM standards, providing a precise fit and long-term durability for your vehicle.',
        specs: [
            { label: 'Brand', value: p.brand },
            { label: 'Category', value: p.category },
            { label: 'Stock', value: `${p.stock} pcs` },
            { label: 'Added', value: p.created_at },
        ],
        compatibility:
            'For exact fitment, please check your vehicle model, engine code, and body style. If you are unsure, contact our support with your VIN number.',
        imageUrl: buildImageUrl(p.image_url),
    };
}

function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { addItem } = useCart();

    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (!id) {
            setError('No product ID provided.');
            return;
        }

        const safeId = id; // now definitely string for TS

        async function loadProduct() {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(
                    `/api/public/product.php?id=${encodeURIComponent(safeId)}`,
                    { credentials: 'include' }
                );

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(
                        `Failed to load product (${res.status} ${res.statusText}): ${text.slice(
                            0,
                            120
                        )}`
                    );
                }

                const json = (await res.json()) as ProductApiResponse;

                if (json.status && json.status !== 'ok') {
                    throw new Error(json.message ?? 'Backend returned an error status');
                }

                let backendProduct: BackendProduct | null = null;

                if (json.product) {
                    backendProduct = json.product;
                } else if (Array.isArray(json.data)) {
                    backendProduct = json.data.length > 0 ? json.data[0] : null;
                } else if (json.data) {
                    backendProduct = json.data;
                }

                if (!backendProduct) {
                    throw new Error('Product not found');
                }

                setProduct(mapBackendToDetail(backendProduct));
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Unknown error while loading product.');
                }
            } finally {
                setLoading(false);
            }
        }

        void loadProduct();
    }, [id]);

    function handleAddToCart() {
        if (!product) return;

        addItem(
            {
                id: product.id,
                name: product.name,
                price: product.price,
                brand: product.brand,
                category: product.category,
            },
            quantity,
        );
    }

    if (loading) {
        return (
            <div className="product-page">
                <section className="product-main">
                    <div className="container">
                        <p>Loading product…</p>
                    </div>
                </section>
            </div>
        );
    }

    if (error) {
        return (
            <div className="product-page">
                <section className="product-main">
                    <div className="container">
                        <p style={{ color: '#fca5a5' }}>Error: {error}</p>
                    </div>
                </section>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="product-page">
                <section className="product-main">
                    <div className="container">
                        <p>Product not found.</p>
                    </div>
                </section>
            </div>
        );
    }

    const mainImageSrc = product.imageUrl;

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
                        <span className="product-breadcrumb__current">
              {product.category}
            </span>
                    </nav>

                    <div className="product-banner__content">
                        <div>
                            <p className="product-banner__brand">{product.brand}</p>
                            <h1 className="product-banner__title">{product.name}</h1>
                        </div>
                        <div className="product-banner__meta">
                            {product.badge && (
                                <span
                                    className={`product-badge product-badge--${product.badge}`}
                                >
                  {product.badge === 'bestseller' && 'Bestseller'}
                                    {product.badge === 'new' && 'New'}
                                    {product.badge === 'limited' && 'Limited'}
                </span>
                            )}
                            <span className="product-banner__category">
                {product.category}
              </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main layout */}
            <section className="product-main">
                <div className="container product-main__grid">
                    {/* Image / gallery */}
                    <div className="product-gallery">
                        <div className="product-gallery__main">
                            {mainImageSrc ? (
                                <img
                                    src={mainImageSrc}
                                    alt={product.name}
                                    className="product-gallery__image"
                                />
                            ) : (
                                <div className="product-gallery__image-placeholder" />
                            )}
                        </div>
                        <div className="product-gallery__thumbs">
                            {/* For now we just show up to 3 identical thumbs if image exists */}
                            {mainImageSrc ? (
                                <>
                                    <div className="thumb thumb--active">
                                        <img src={mainImageSrc} alt={product.name} />
                                    </div>
                                    <div className="thumb">
                                        <img src={mainImageSrc} alt={product.name} />
                                    </div>
                                    <div className="thumb">
                                        <img src={mainImageSrc} alt={product.name} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="thumb thumb--active" />
                                    <div className="thumb" />
                                    <div className="thumb" />
                                </>
                            )}
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
                            <button
                                type="button"
                                className="btn btn--primary"
                                onClick={handleAddToCart}
                            >
                                Add to cart
                            </button>
                            <button type="button" className="btn btn--ghost">
                                Vehicle compatibility
                            </button>
                        </div>
                        <div className="product-info__qty">
                            <label htmlFor="product-qty">Quantity</label>
                            <input
                                id="product-qty"
                                type="number"
                                min={1}
                                value={quantity}
                                onChange={(e) =>
                                    setQuantity(Math.max(1, Number(e.target.value) || 1))
                                }
                            />
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
    );
}

export default ProductDetailPage;
