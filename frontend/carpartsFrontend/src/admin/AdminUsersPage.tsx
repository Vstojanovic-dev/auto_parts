import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import './admin.css';

interface AdminUser {
    id: number;
    name?: string;
    email?: string;
    role?: string;
    created_at?: string;
}

interface AdminUsersResponse {
    status?: string;
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
    data?: AdminUser[];
    message?: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        async function loadUsers() {
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams();
                params.set('page', String(page));
                params.set('limit', '20');

                if (search.trim() !== '') {
                    params.set('q', search.trim());
                }
                if (roleFilter.trim() !== '') {
                    params.set('role', roleFilter.trim());
                }

                const res = await fetch(`/api/admin/users.php?${params.toString()}`, {
                    credentials: 'include',
                });

                if (res.status === 404) {
                    const text = await res.text();
                    throw new Error(
                        'Admin users API (/api/admin/users.php) not found on backend (404). ' +
                        'Response: ' +
                        text.slice(0, 120)
                    );
                }

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(
                        `Request failed (${res.status} ${res.statusText}): ${text.slice(0, 120)}`
                    );
                }

                const json = (await res.json()) as AdminUsersResponse;

                if (json.status && json.status !== 'ok') {
                    throw new Error(json.message ?? 'Backend returned error status for users');
                }

                const data = Array.isArray(json.data) ? json.data : [];
                setUsers(data);

                const tp =
                    typeof json.total_pages === 'number' && json.total_pages >= 1
                        ? json.total_pages
                        : 1;
                setTotalPages(tp);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Unknown error while loading users');
                }
            } finally {
                setLoading(false);
            }
        }

        void loadUsers();
    }, [page, search, roleFilter]);

    function handleFiltersSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setPage(1);
    }

    const canGoPrev = page > 1;
    const canGoNext = page < totalPages;

    function formatRole(role?: string) {
        if (!role) return 'user';
        return role;
    }

    function roleClass(role?: string) {
        const r = (role ?? '').toLowerCase();
        return r === 'admin' ? 'admin-badge-role admin-badge-role-admin' : 'admin-badge-role admin-badge-role-user';
    }

    return (
        <section className="admin-section">
            <div className="admin-section-header">
                <div className="admin-section-header-text">
                    <h2 className="admin-section-title">Users</h2>
                    <p className="admin-section-subtitle">
                        Search users, inspect their accounts and prepare for managing orders later.
                    </p>
                </div>
            </div>

            <div className="admin-card">
                <form className="admin-filters-row" onSubmit={handleFiltersSubmit}>
                    <input
                        type="text"
                        className="admin-input"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <select
                        className="admin-select"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="">All roles</option>
                        <option value="admin">Admins</option>
                        <option value="user">Users</option>
                    </select>
                </form>

                {loading && (
                    <p className="admin-card-placeholder">Loading users…</p>
                )}

                {error && !loading && (
                    <p className="admin-card-placeholder">
                        Error loading users: {error}
                    </p>
                )}

                {!loading && !error && users.length === 0 && (
                    <p className="admin-users-empty">
                        No users found. Try changing filters or create some user accounts on the public side.
                    </p>
                )}

                {!loading && !error && users.length > 0 && (
                    <>
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {users.map((u) => (
                                    <tr key={u.id}>
                                        <td className="admin-table-muted">#{u.id}</td>
                                        <td className="admin-table-name">
                                            {u.name ?? '(no name)'}
                                        </td>
                                        <td className="admin-table-muted">
                                            {u.email ?? '(no email)'}
                                        </td>
                                        <td>
                        <span className={roleClass(u.role)}>
                          {formatRole(u.role)}
                        </span>
                                        </td>
                                        <td className="admin-table-muted">
                                            {u.created_at ?? ''}
                                        </td>
                                        <td>
                        <span className="admin-status-text">
                          {/* placeholders for future: view orders / edit / delete */}
                            view / edit / delete
                        </span>
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
