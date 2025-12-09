import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import './admin.css';

interface AdminCoupon {
    id: number;
    code: string;
    discount_type: 'percent' | 'fixed' | string;
    discount_value: number | string;
    valid_from: string | null;
    valid_to: string | null;
    is_active: number | boolean;
    usage_limit: number | null;
    used_count: number;
    created_at: string;
}

interface AdminCouponsResponse {
    status?: string;
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
    data?: AdminCoupon[];
    message?: string;
}

interface AdminCouponCreateResponse {
    status?: string;
    data?: AdminCoupon;
    message?: string;
}

interface AdminCouponDeleteResponse {
    status?: string;
    data?: {
        id: number;
        deleted?: boolean;
    };
    message?: string;
}

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newCode, setNewCode] = useState('');
    const [newType, setNewType] = useState<'percent' | 'fixed'>('percent');
    const [newValue, setNewValue] = useState('');
    const [newValidFrom, setNewValidFrom] = useState('');
    const [newValidTo, setNewValidTo] = useState('');
    const [newUsageLimit, setNewUsageLimit] = useState('');
    const [newIsActive, setNewIsActive] = useState(true);
    const [createError, setCreateError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    const [deactivatingId, setDeactivatingId] = useState<number | null>(null);

    useEffect(() => {
        async function loadCoupons() {
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams();
                params.set('page', String(page));
                params.set('limit', '20');

                if (search.trim() !== '') {
                    params.set('q', search.trim());
                }
                if (typeFilter.trim() !== '') {
                    params.set('discount_type', typeFilter.trim());
                }
                if (activeFilter.trim() !== '') {
                    params.set('is_active', activeFilter.trim());
                }

                const res = await fetch(`/api/admin/coupons.php?${params.toString()}`, {
                    credentials: 'include',
                });

                if (res.status === 404) {
                    const text = await res.text();
                    throw new Error(
                        'Admin coupons API (/api/admin/coupons.php) not found (404). Response: ' +
                        text.slice(0, 120)
                    );
                }

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(
                        `Request failed (${res.status} ${res.statusText}): ${text.slice(0, 120)}`
                    );
                }

                const json = (await res.json()) as AdminCouponsResponse;

                if (json.status && json.status !== 'ok') {
                    throw new Error(json.message ?? 'Backend returned error status for coupons');
                }

                const data = Array.isArray(json.data) ? json.data : [];
                setCoupons(data);

                const tp =
                    typeof json.total_pages === 'number' && json.total_pages >= 1
                        ? json.total_pages
                        : 1;
                setTotalPages(tp);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Unknown error while loading coupons');
                }
            } finally {
                setLoading(false);
            }
        }

        void loadCoupons();
    }, [page, search, typeFilter, activeFilter]);

    function handleFiltersSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setPage(1);
    }

    const canGoPrev = page > 1;
    const canGoNext = page < totalPages;

    function formatDiscountValue(c: AdminCoupon): string {
        const v = typeof c.discount_value === 'string'
            ? parseFloat(c.discount_value)
            : c.discount_value;

        if (c.discount_type === 'percent') {
            return `${v}%`;
        }
        return `${v.toFixed(2)} €`;
    }

    function typeBadgeClass(c: AdminCoupon) {
        return c.discount_type === 'percent'
            ? 'admin-coupon-type-badge admin-coupon-type-percent'
            : 'admin-coupon-type-badge admin-coupon-type-fixed';
    }

    function activeBadgeClass(c: AdminCoupon) {
        const active = (typeof c.is_active === 'boolean'
            ? c.is_active
            : c.is_active === 1) as boolean;
        return 'admin-coupon-active-badge ' + (active ? 'admin-coupon-active-yes' : 'admin-coupon-active-no');
    }

    function activeText(c: AdminCoupon) {
        const active = (typeof c.is_active === 'boolean'
            ? c.is_active
            : c.is_active === 1) as boolean;
        return active ? 'Active' : 'Inactive';
    }

    async function handleCreateSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setCreateError(null);

        if (!newCode.trim()) {
            setCreateError('Code is required.');
            return;
        }

        const valueNum = Number(newValue.replace(',', '.'));
        if (!Number.isFinite(valueNum) || valueNum <= 0) {
            setCreateError('Discount value must be a positive number.');
            return;
        }

        setCreating(true);

        try {
            const usageLimitNum =
                newUsageLimit.trim() === '' ? null : Number(newUsageLimit);

            const res = await fetch('/api/admin/coupons_create.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    code: newCode.trim(),
                    discount_type: newType,
                    discount_value: valueNum,
                    valid_from: newValidFrom || null,
                    valid_to: newValidTo || null,
                    usage_limit: usageLimitNum,
                    is_active: newIsActive,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(
                    `Create coupon failed (${res.status} ${res.statusText}): ${text.slice(0, 120)}`
                );
            }

            const json = (await res.json()) as AdminCouponCreateResponse;

            if (json.status && json.status !== 'ok') {
                throw new Error(json.message ?? 'Backend returned error when creating coupon');
            }

            if (!json.data) {
                throw new Error('Coupon created but backend did not return data.');
            }

            // Add new coupon to the top
            setCoupons((prev) => [json.data as AdminCoupon, ...prev]);

            // Reset form
            setNewCode('');
            setNewType('percent');
            setNewValue('');
            setNewValidFrom('');
            setNewValidTo('');
            setNewUsageLimit('');
            setNewIsActive(true);
            setShowCreateForm(false);
        } catch (err) {
            if (err instanceof Error) {
                setCreateError(err.message);
            } else {
                setCreateError('Unknown error when creating coupon.');
            }
        } finally {
            setCreating(false);
        }
    }

    async function handleDeactivate(coupon: AdminCoupon) {
        const confirmed = window.confirm(
            `Deactivate coupon "${coupon.code}" (ID ${coupon.id})? It will no longer be usable.`
        );

        if (!confirmed) return;

        setDeactivatingId(coupon.id);

        try {
            const res = await fetch('/api/admin/coupons_delete.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ id: coupon.id }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(
                    `Deactivate failed (${res.status} ${res.statusText}): ${text.slice(0, 120)}`
                );
            }

            const json = (await res.json()) as AdminCouponDeleteResponse;

            if (json.status && json.status !== 'ok') {
                throw new Error(json.message ?? 'Backend error while deactivating coupon');
            }

            // Update is_active in local state
            setCoupons((prev) =>
                prev.map((c) =>
                    c.id === coupon.id
                        ? { ...c, is_active: 0 }
                        : c
                )
            );
        } catch (err) {
            if (err instanceof Error) {
                alert(`Error deactivating coupon: ${err.message}`);
            } else {
                alert('Unknown error deactivating coupon');
            }
        } finally {
            setDeactivatingId(null);
        }
    }

    return (
        <section className="admin-section">
            <div className="admin-section-header">
                <div className="admin-section-header-text">
                    <h2 className="admin-section-title">Coupons</h2>
                    <p className="admin-section-subtitle">
                        Create and manage discount codes used at checkout.
                    </p>
                </div>
                <button
                    className="admin-button-primary"
                    type="button"
                    onClick={() => setShowCreateForm((prev) => !prev)}
                >
                    {showCreateForm ? 'Close form' : '+ Add coupon'}
                </button>
            </div>

            <div className="admin-card">
                {showCreateForm && (
                    <form className="admin-create-form" onSubmit={handleCreateSubmit}>
                        <div className="admin-create-form-row">
                            <label className="admin-create-label" htmlFor="coupon-code">
                                Code
                            </label>
                            <input
                                id="coupon-code"
                                className="admin-create-input"
                                type="text"
                                value={newCode}
                                onChange={(e) => setNewCode(e.target.value)}
                                placeholder="WELCOME10"
                            />
                        </div>

                        <div className="admin-create-form-row">
                            <label className="admin-create-label" htmlFor="coupon-type">
                                Type
                            </label>
                            <select
                                id="coupon-type"
                                className="admin-create-input"
                                value={newType}
                                onChange={(e) =>
                                    setNewType(e.target.value as 'percent' | 'fixed')
                                }
                            >
                                <option value="percent">Percent</option>
                                <option value="fixed">Fixed amount (€)</option>
                            </select>
                        </div>

                        <div className="admin-create-form-row">
                            <label className="admin-create-label" htmlFor="coupon-value">
                                Value
                            </label>
                            <input
                                id="coupon-value"
                                className="admin-create-input"
                                type="text"
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                placeholder="10 (for 10% or 10€)"
                            />
                        </div>

                        <div className="admin-create-form-row">
                            <label className="admin-create-label" htmlFor="coupon-valid-from">
                                Valid from
                            </label>
                            <input
                                id="coupon-valid-from"
                                className="admin-create-input"
                                type="date"
                                value={newValidFrom}
                                onChange={(e) => setNewValidFrom(e.target.value)}
                            />
                        </div>

                        <div className="admin-create-form-row">
                            <label className="admin-create-label" htmlFor="coupon-valid-to">
                                Valid to
                            </label>
                            <input
                                id="coupon-valid-to"
                                className="admin-create-input"
                                type="date"
                                value={newValidTo}
                                onChange={(e) => setNewValidTo(e.target.value)}
                            />
                        </div>

                        <div className="admin-create-form-row">
                            <label className="admin-create-label" htmlFor="coupon-usage-limit">
                                Usage limit (optional)
                            </label>
                            <input
                                id="coupon-usage-limit"
                                className="admin-create-input"
                                type="number"
                                min={0}
                                value={newUsageLimit}
                                onChange={(e) => setNewUsageLimit(e.target.value)}
                                placeholder="100"
                            />
                        </div>

                        <div className="admin-create-form-row">
                            <label className="admin-create-label" htmlFor="coupon-active">
                                Active
                            </label>
                            <select
                                id="coupon-active"
                                className="admin-create-input"
                                value={newIsActive ? '1' : '0'}
                                onChange={(e) => setNewIsActive(e.target.value === '1')}
                            >
                                <option value="1">Yes</option>
                                <option value="0">No</option>
                            </select>
                        </div>

                        {createError && (
                            <div className="admin-create-error">{createError}</div>
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
                                {creating ? 'Creating…' : 'Create coupon'}
                            </button>
                        </div>
                    </form>
                )}

                <form className="admin-filters-row" onSubmit={handleFiltersSubmit}>
                    <input
                        type="text"
                        className="admin-input"
                        placeholder="Search by code…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <select
                        className="admin-select"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="">All types</option>
                        <option value="percent">Percent</option>
                        <option value="fixed">Fixed amount</option>
                    </select>

                    <select
                        className="admin-select"
                        value={activeFilter}
                        onChange={(e) => setActiveFilter(e.target.value)}
                    >
                        <option value="">Active + inactive</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </form>

                {loading && (
                    <p className="admin-card-placeholder">Loading coupons…</p>
                )}

                {error && !loading && (
                    <p className="admin-card-placeholder">
                        Error loading coupons: {error}
                    </p>
                )}

                {!loading && !error && coupons.length === 0 && (
                    <p className="admin-users-empty">
                        No coupons found. Try different filters or create one above.
                    </p>
                )}

                {!loading && !error && coupons.length > 0 && (
                    <>
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Code</th>
                                    <th>Type</th>
                                    <th>Value</th>
                                    <th>Valid from</th>
                                    <th>Valid to</th>
                                    <th>Active</th>
                                    <th>Usage</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {coupons.map((c) => (
                                    <tr key={c.id}>
                                        <td className="admin-table-muted">#{c.id}</td>
                                        <td className="admin-table-name">{c.code}</td>
                                        <td>
                        <span className={typeBadgeClass(c)}>
                          {c.discount_type}
                        </span>
                                        </td>
                                        <td className="admin-table-muted">
                                            {formatDiscountValue(c)}
                                        </td>
                                        <td className="admin-table-muted">
                                            {c.valid_from ?? ''}
                                        </td>
                                        <td className="admin-table-muted">
                                            {c.valid_to ?? ''}
                                        </td>
                                        <td>
                        <span className={activeBadgeClass(c)}>
                          {activeText(c)}
                        </span>
                                        </td>
                                        <td className="admin-table-muted">
                                            {c.used_count}
                                            {c.usage_limit != null ? ` / ${c.usage_limit}` : ' / ∞'}
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="admin-small-button admin-small-button-danger"
                                                disabled={deactivatingId === c.id || !((typeof c.is_active === 'boolean'
                                                    ? c.is_active
                                                    : c.is_active === 1))}
                                                onClick={() => void handleDeactivate(c)}
                                            >
                                                {deactivatingId === c.id ? 'Deactivating…' : 'Deactivate'}
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
