import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import './admin.css';

interface AdminOrder {
    id: number;
    user_name?: string;
    user_email?: string;
    status?: string;
    total_amount?: number;
    created_at?: string;
}

interface AdminOrdersResponse {
    status?: string;
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
    data?: AdminOrder[];
    message?: string;
}

interface AdminOrderDetail {
    id: number;
    status?: string;
    total_amount?: number;
    created_at?: string;
    user_name?: string;
    user_email?: string;
    // anything else from backend we just treat as optional
}

interface AdminOrderItem {
    id?: number;
    product_name?: string;
    quantity?: number;
    unit_price?: number;
    total_price?: number;
}

interface OrderDetailResponse {
    status?: string;
    order?: AdminOrderDetail;
    items?: AdminOrderItem[];
    message?: string;
}

interface UpdateStatusResponse {
    status?: string;
    message?: string;
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [orderDetail, setOrderDetail] = useState<AdminOrderDetail | null>(null);
    const [orderItems, setOrderItems] = useState<AdminOrderItem[]>([]);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [statusDraft, setStatusDraft] = useState<string>('');

    useEffect(() => {
        async function loadOrders() {
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams();
                params.set('page', String(page));
                params.set('limit', '20');

                if (search.trim() !== '') {
                    params.set('q', search.trim());
                }

                if (statusFilter.trim() !== '') {
                    params.set('status', statusFilter.trim());
                }

                const res = await fetch(`/api/admin/orders.php?${params.toString()}`, {
                    credentials: 'include',
                });

                if (res.status === 404) {
                    const text = await res.text();
                    throw new Error(
                        'Admin orders API (/api/admin/orders.php) not found (404). Response: ' +
                        text.slice(0, 120)
                    );
                }

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(
                        `Request failed (${res.status} ${res.statusText}): ${text.slice(0, 120)}`
                    );
                }

                const json = (await res.json()) as AdminOrdersResponse;

                if (json.status && json.status !== 'ok') {
                    throw new Error(json.message ?? 'Backend returned error status for orders');
                }

                const data = Array.isArray(json.data) ? json.data : [];
                setOrders(data);

                const tp =
                    typeof json.total_pages === 'number' && json.total_pages >= 1
                        ? json.total_pages
                        : 1;
                setTotalPages(tp);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Unknown error while loading orders');
                }
            } finally {
                setLoading(false);
            }
        }

        void loadOrders();
    }, [page, search, statusFilter]);

    function handleFiltersSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setPage(1);
    }

    const canGoPrev = page > 1;
    const canGoNext = page < totalPages;

    function statusBadgeClass(status?: string) {
        const s = (status ?? '').toLowerCase();
        if (s === 'paid' || s === 'completed') {
            return 'admin-orders-status-badge admin-orders-status-paid';
        }
        if (s === 'cancelled' || s === 'canceled') {
            return 'admin-orders-status-badge admin-orders-status-cancelled';
        }
        return 'admin-orders-status-badge admin-orders-status-pending';
    }

    async function loadOrderDetail(orderId: number) {
        setSelectedOrderId(orderId);
        setDetailLoading(true);
        setDetailError(null);
        setOrderDetail(null);
        setOrderItems([]);
        setStatusDraft('');

        try {
            const res = await fetch(`/api/admin/order_detail.php?id=${orderId}`, {
                credentials: 'include',
            });

            if (res.status === 404) {
                const text = await res.text();
                throw new Error(
                    'Order detail API (/api/admin/order_detail.php) not found or order not found. Response: ' +
                    text.slice(0, 120)
                );
            }

            if (!res.ok) {
                const text = await res.text();
                throw new Error(
                    `Order detail failed (${res.status} ${res.statusText}): ${text.slice(0, 120)}`
                );
            }

            const json = (await res.json()) as OrderDetailResponse;

            if (json.status && json.status !== 'ok') {
                throw new Error(json.message ?? 'Backend returned error for order detail');
            }

            const od = json.order ?? null;
            const items = Array.isArray(json.items) ? json.items : [];

            setOrderDetail(od);
            setOrderItems(items);

            if (od?.status) {
                setStatusDraft(od.status);
            }
        } catch (err) {
            if (err instanceof Error) {
                setDetailError(err.message);
            } else {
                setDetailError('Unknown error while loading order detail');
            }
        } finally {
            setDetailLoading(false);
        }
    }

    async function handleStatusUpdate() {
        if (!orderDetail || !statusDraft || statusDraft === orderDetail.status) {
            return;
        }

        setUpdatingStatus(true);

        try {
            const res = await fetch('/api/admin/orders_update_status.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    id: orderDetail.id,
                    status: statusDraft,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(
                    `Update status failed (${res.status} ${res.statusText}): ${text.slice(0, 120)}`
                );
            }

            const json = (await res.json()) as UpdateStatusResponse;

            if (json.status && json.status !== 'ok') {
                throw new Error(json.message ?? 'Backend returned error on status update');
            }

            // update detail
            setOrderDetail((prev) =>
                prev ? { ...prev, status: statusDraft } : prev
            );

            // update list row
            setOrders((prev) =>
                prev.map((o) =>
                    o.id === orderDetail.id ? { ...o, status: statusDraft } : o
                )
            );
        } catch (err) {
            if (err instanceof Error) {
                alert(`Error updating status: ${err.message}`);
            } else {
                alert('Unknown error while updating status');
            }
        } finally {
            setUpdatingStatus(false);
        }
    }

    return (
        <section className="admin-section">
            <div className="admin-section-header">
                <div className="admin-section-header-text">
                    <h2 className="admin-section-title">Orders</h2>
                    <p className="admin-section-subtitle">
                        Review incoming orders, inspect details and adjust their status.
                    </p>
                </div>
            </div>

            <div className="admin-card">
                <div className="admin-orders-layout">
                    {/* Left: list */}
                    <div>
                        <form className="admin-filters-row" onSubmit={handleFiltersSubmit}>
                            <input
                                type="text"
                                className="admin-input"
                                placeholder="Search by user or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />

                            <select
                                className="admin-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All statuses</option>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="shipped">Shipped</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </form>

                        {loading && (
                            <p className="admin-card-placeholder">Loading orders…</p>
                        )}

                        {error && !loading && (
                            <p className="admin-card-placeholder">
                                Error loading orders: {error}
                            </p>
                        )}

                        {!loading && !error && orders.length === 0 && (
                            <p className="admin-users-empty">
                                No orders found. Try different filters or create an order on the public site.
                            </p>
                        )}

                        {!loading && !error && orders.length > 0 && (
                            <>
                                <div className="admin-table-wrapper">
                                    <table className="admin-table">
                                        <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>User</th>
                                            <th>Email</th>
                                            <th>Status</th>
                                            <th>Total</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {orders.map((o) => (
                                            <tr key={o.id}>
                                                <td className="admin-table-muted">#{o.id}</td>
                                                <td className="admin-table-name">
                                                    {o.user_name ?? '(no name)'}
                                                </td>
                                                <td className="admin-table-muted">
                                                    {o.user_email ?? ''}
                                                </td>
                                                <td>
                            <span className={statusBadgeClass(o.status)}>
                              {o.status ?? 'pending'}
                            </span>
                                                </td>
                                                <td className="admin-table-muted">
                                                    {typeof o.total_amount === 'number'
                                                        ? `${o.total_amount.toFixed(2)} €`
                                                        : ''}
                                                </td>
                                                <td className="admin-table-muted">
                                                    {o.created_at ?? ''}
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="admin-small-button"
                                                        onClick={() => void loadOrderDetail(o.id)}
                                                    >
                                                        View
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

                    {/* Right: detail panel */}
                    <div className="admin-orders-detail-card">
                        {!selectedOrderId && !detailLoading && !detailError && (
                            <p className="admin-orders-small">
                                Select an order from the table to see its details.
                            </p>
                        )}

                        {detailLoading && (
                            <p className="admin-card-placeholder">Loading order detail…</p>
                        )}

                        {detailError && !detailLoading && (
                            <p className="admin-card-placeholder">
                                Error loading order detail: {detailError}
                            </p>
                        )}

                        {orderDetail && !detailLoading && !detailError && (
                            <>
                                <div className="admin-orders-detail-header">
                                    <div>
                                        <div className="admin-orders-detail-title">
                                            Order #{orderDetail.id}
                                        </div>
                                        <div className="admin-orders-detail-sub">
                                            {orderDetail.user_name ?? '(no name)'} ·{' '}
                                            {orderDetail.user_email ?? ''}
                                        </div>
                                    </div>
                                    <span className={statusBadgeClass(orderDetail.status)}>
                    {orderDetail.status ?? 'pending'}
                  </span>
                                </div>

                                <div>
                                    <div className="admin-orders-detail-section-title">
                                        Summary
                                    </div>
                                    <ul className="admin-orders-detail-list">
                                        <li>
                                            <span>Created</span>
                                            <span>{orderDetail.created_at ?? ''}</span>
                                        </li>
                                        <li>
                                            <span>Total</span>
                                            <span>
                        {typeof orderDetail.total_amount === 'number'
                            ? `${orderDetail.total_amount.toFixed(2)} €`
                            : ''}
                      </span>
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <div className="admin-orders-detail-section-title">
                                        Items
                                    </div>
                                    {orderItems.length === 0 && (
                                        <p className="admin-orders-small">
                                            No items found for this order.
                                        </p>
                                    )}
                                    {orderItems.length > 0 && (
                                        <ul className="admin-orders-detail-list">
                                            {orderItems.map((item, idx) => (
                                                <li key={item.id ?? idx}>
                          <span>
                            {item.product_name ?? 'Item'}{' '}
                              {typeof item.quantity === 'number'
                                  ? `× ${item.quantity}`
                                  : ''}
                          </span>
                                                    <span>
                            {typeof item.total_price === 'number'
                                ? `${item.total_price.toFixed(2)} €`
                                : ''}
                          </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div style={{ marginTop: '0.5rem' }}>
                                    <div className="admin-orders-detail-section-title">
                                        Update status
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <select
                                            className="admin-orders-status-select"
                                            value={statusDraft}
                                            onChange={(e) => setStatusDraft(e.target.value)}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="paid">Paid</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                        <button
                                            type="button"
                                            className="admin-small-button"
                                            onClick={() => void handleStatusUpdate()}
                                            disabled={updatingStatus}
                                        >
                                            {updatingStatus ? 'Updating…' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
