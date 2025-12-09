import { useEffect, useState } from 'react';
import './admin.css';

interface AdminProduct {
    id: number;
    name: string;
    brand: string;
    category: string;
    description: string;
    price: string;
    stock: number;
    image_url: string | null;
    created_at: string;
}

interface AdminProductsResponse {
    status: 'ok' | 'error';
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    data: AdminProduct[];
    message?: string;
}

interface AdminDeleteResponse {
    status: 'ok' | 'error';
    data?: {
        id: number;
        deleted?: boolean;
    };
    message?: string;
}

interface AdminCreateResponse {
    status: 'ok' | 'error';
    data?: AdminProduct;
    message?: string;
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [brandFilter, setBrandFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Create form state
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newBrand, setNewBrand] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newStock, setNewStock] = useState('');
    const [newImageFile, setNewImageFile] = useState<File | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        async function loadProducts() {
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams();
                params.set('page', String(page));
                params.set('limit', '20');

                if (search.trim() !== '') {
                    params.set('q', search.trim());
                }
                if (categoryFilter.trim() !== '') {
                    params.set('category', categoryFilter.trim());
                }
                if (brandFilter.trim() !== '') {
                    params.set('brand', brandFilter.trim());
                }

                const res = await fetch(`/api/admin/products.php?${params.toString()}`, {
                    credentials: 'include',
                });

                if (!res.ok) {
                    throw new Error(`Request failed with status ${res.status}`);
                }

                const json = (await res.json()) as AdminProductsResponse;

                if (json.status !== 'ok') {
                    throw new Error(json.message ?? 'Failed to load products');
                }

                setProducts(json.data);
                setTotalPages(json.total_pages);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Unknown error while loading products');
                }
            } finally {
                setLoading(false);
            }
        }

        void loadProducts();
    }, [page, search, categoryFilter, brandFilter]);

    function handleSearchSubmit(e: React.FormEvent) {
        e.preventDefault();
        setPage(1);
    }

    async function handleDelete(product: AdminProduct) {
        const confirmed = window.confirm(
            `Are you sure you want to delete product "${product.name}" (ID ${product.id})?`
        );

        if (!confirmed) return;

        setDeletingId(product.id);

        try {
            const res = await fetch('/api/admin/products_delete.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ id: product.id }),
            });

            if (!res.ok) {
                throw new Error(`Delete failed with status ${res.status}`);
            }

            const json = (await res.json()) as AdminDeleteResponse;

            if (json.status !== 'ok') {
                throw new Error(json.message ?? 'Failed to delete product');
            }

            setProducts((prev) => prev.filter((p) => p.id !== product.id));
        } catch (err) {
            if (err instanceof Error) {
                alert(`Error deleting product: ${err.message}`);
            } else {
                alert('Unknown error deleting product');
            }
        } finally {
            setDeletingId(null);
        }
    }

    async function handleCreateSubmit(e: React.FormEvent) {
        e.preventDefault();
        setCreateError(null);

        const priceNum = Number(newPrice.replace(',', '.'));
        const stockNum = Number(newStock);

        if (!newName.trim() || !newBrand.trim() || !newCategory.trim()) {
            setCreateError('Name, brand and category are required.');
            return;
        }
        if (!Number.isFinite(priceNum) || priceNum <= 0) {
            setCreateError('Price must be a positive number.');
            return;
        }
        if (!Number.isInteger(stockNum) || stockNum < 0) {
            setCreateError('Stock must be a non-negative integer.');
            return;
        }

        setCreating(true);

        try {
            let imageUrl: string | null = null;

            // 1) Optional image upload
            if (newImageFile) {
                const formData = new FormData();
                formData.append('image', newImageFile);

                const uploadRes = await fetch('/api/admin/product_upload_image.php', {
                    method: 'POST',
                    credentials: 'include',
                    body: formData,
                });

                if (!uploadRes.ok) {
                    const text = await uploadRes.text();
                    throw new Error(
                        `Image upload failed (${uploadRes.status}): ${text.slice(0, 120)}`
                    );
                }

                const uploadJson = (await uploadRes.json()) as {
                    status: 'ok' | 'error';
                    url?: string;
                    message?: string;
                };

                if (uploadJson.status !== 'ok' || !uploadJson.url) {
                    throw new Error(
                        uploadJson.message ?? 'Image upload did not return a URL.'
                    );
                }

                imageUrl = uploadJson.url;
            }

            // 2) Create product
            const createRes = await fetch('/api/admin/products_create.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: newName.trim(),
                    brand: newBrand.trim(),
                    category: newCategory.trim(),
                    description: newDescription.trim(),
                    price: priceNum,
                    stock: stockNum,
                    image_url: imageUrl,
                }),
            });

            if (!createRes.ok) {
                const text = await createRes.text();
                throw new Error(
                    `Create failed (${createRes.status}): ${text.slice(0, 120)}`
                );
            }

            const createJson = (await createRes.json()) as AdminCreateResponse;

            if (createJson.status !== 'ok' || !createJson.data) {
                throw new Error(createJson.message ?? 'Failed to create product');
            }

            // 3) Optimistically add new product to the top of current list
            setProducts((prev) => [createJson.data as AdminProduct, ...prev]);

            // Reset form
            setNewName('');
            setNewBrand('');
            setNewCategory('');
            setNewDescription('');
            setNewPrice('');
            setNewStock('');
            setNewImageFile(null);
            setShowCreateForm(false);
        } catch (err) {
            if (err instanceof Error) {
                setCreateError(err.message);
            } else {
                setCreateError('Unknown error while creating product.');
            }
        } finally {
            setCreating(false);
        }
    }

    const canGoPrev = page > 1;
    const canGoNext = page < totalPages;

    return (
        <section className="admin-section">
            <div className="admin-section-header">
                <div className="admin-section-header-text">
                    <h2 className="admin-section-title">Products</h2>
                    <p className="admin-section-subtitle">
                        Manage your catalog of car parts: search, filter, create and delete products.
                    </p>
                </div>
                <button
                    className="admin-button-primary"
                    type="button"
                    onClick={() => setShowCreateForm((prev) => !prev)}
                >
                    {showCreateForm ? 'Close form' : '+ Add product'}
                </button>
            </div>

            <div className="admin-card">
                {showCreateForm && (
                    <form className="admin-create-form" onSubmit={handleCreateSubmit}>
                        <div className="admin-create-form-row">
                            <label className="admin-create-label" htmlFor="new-name">
                                Name
                            </label>
                            <input
                                id="new-name"
                                className="admin-create-input"
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Front Brake Pads"
                            />
                        </div>

                        <div className="admin-create-form-row">
                            <label className="admin-create-label" htmlFor="new-brand">
                                Brand
                            </label>
                            <input
                                id="new-brand"
                                className="admin-create-input"
                                type="text"
                                value={newBrand}
                                onChange={(e) => setNewBrand(e.target.value)}
                                placeholder="Brembo"
                            />
                        </div>

                        <div className="admin-create-form-row">
                            <label className="admin-create-label" htmlFor="new-category">
                                Category
                            </label>
                            <input
                                id="new-category"
                                className="admin-create-input"
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="Brakes, Exhaust, Wheels..."
                            />
                        </div>

                        <div className="admin-create-form-row">
                            <label className="admin-create-label" htmlFor="new-price">
                                Price (€)
                            </label>
                            <input
                                id="new-price"
                                className="admin-create-input"
                                type="text"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                placeholder="49.99"
                            />
                        </div>

                        <div className="admin-create-form-row">
                            <label className="admin-create-label" htmlFor="new-stock">
                                Stock
                            </label>
                            <input
                                id="new-stock"
                                className="admin-create-input"
                                type="number"
                                min={0}
                                value={newStock}
                                onChange={(e) => setNewStock(e.target.value)}
                                placeholder="10"
                            />
                        </div>

                        <div className="admin-create-form-row">
                            <label className="admin-create-label" htmlFor="new-image">
                                Image
                            </label>
                            <input
                                id="new-image"
                                className="admin-create-input"
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    setNewImageFile(
                                        e.target.files && e.target.files[0] ? e.target.files[0] : null
                                    )
                                }
                            />
                        </div>

                        <div className="admin-create-form-row" style={{ gridColumn: '1 / -1' }}>
                            <label className="admin-create-label" htmlFor="new-description">
                                Description
                            </label>
                            <textarea
                                id="new-description"
                                className="admin-create-textarea"
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                placeholder="Short description of this product..."
                            />
                        </div>

                        {createError && (
                            <div className="admin-create-error">
                                {createError}
                            </div>
                        )}

                        <div className="admin-create-actions">
                            <button
                                type="button"
                                className="admin-button-secondary"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setCreateError(null);
                                }}
                                disabled={creating}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="admin-button-primary"
                                disabled={creating}
                            >
                                {creating ? 'Creating…' : 'Create product'}
                            </button>
                        </div>
                    </form>
                )}

                <form className="admin-filters-row" onSubmit={handleSearchSubmit}>
                    <input
                        type="text"
                        className="admin-input"
                        placeholder="Search by name, brand, category..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <input
                        type="text"
                        className="admin-input"
                        placeholder="Filter by category"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    />
                    <input
                        type="text"
                        className="admin-input"
                        placeholder="Filter by brand"
                        value={brandFilter}
                        onChange={(e) => setBrandFilter(e.target.value)}
                    />
                </form>

                {loading && (
                    <p className="admin-card-placeholder">Loading products…</p>
                )}

                {error && !loading && (
                    <p className="admin-card-placeholder">
                        Error loading products: {error}
                    </p>
                )}

                {!loading && !error && products.length === 0 && (
                    <p className="admin-card-placeholder">
                        No products found. Try adjusting your filters.
                    </p>
                )}

                {!loading && !error && products.length > 0 && (
                    <>
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Product</th>
                                    <th>Brand</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {products.map((p) => (
                                    <tr key={p.id}>
                                        <td className="admin-table-muted">#{p.id}</td>
                                        <td className="admin-table-name">{p.name}</td>
                                        <td className="admin-table-muted">{p.brand}</td>
                                        <td>
                        <span className="admin-badge-category">
                          {p.category}
                        </span>
                                        </td>
                                        <td className="admin-table-muted">
                                            {Number(p.price).toFixed(2)} €
                                        </td>
                                        <td className={p.stock <= 3 ? 'admin-badge-stock-low' : ''}>
                                            {p.stock}
                                        </td>
                                        <td className="admin-table-muted">
                                            {p.created_at}
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="admin-small-button admin-small-button-danger"
                                                disabled={deletingId === p.id}
                                                onClick={() => void handleDelete(p)}
                                            >
                                                {deletingId === p.id ? 'Deleting…' : 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="admin-pagination">
                            <button
                                type="button"
                                disabled={!canGoPrev}
                                onClick={() => canGoPrev && setPage((prev) => prev - 1)}
                            >
                                Prev
                            </button>
                            <span>
                Page {page} of {totalPages}
              </span>
                            <button
                                type="button"
                                disabled={!canGoNext}
                                onClick={() => canGoNext && setPage((prev) => prev + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
