import { NavLink, Outlet } from 'react-router-dom';
import './admin.css';

export default function AdminLayout() {
    return (
        <div className="admin-root">
            <aside className="admin-sidebar">
                <div className="admin-logo">
                    <span className="admin-logo-badge">V</span>
                    <div className="admin-logo-text">
                        CARPARTS
                        <span>Admin panel</span>
                    </div>
                </div>

                <div>
                    <div className="admin-nav-section-label">Management</div>
                    <nav className="admin-nav">
                        <NavLink
                            to="/admin/products"
                            className={({ isActive }) =>
                                'admin-nav-link' + (isActive ? ' admin-nav-link-active' : '')
                            }
                        >
                            <span className="admin-nav-link-icon">🧰</span>
                            <span>Products</span>
                        </NavLink>

                        <NavLink
                            to="/admin/orders"
                            className={({ isActive }) =>
                                'admin-nav-link' + (isActive ? ' admin-nav-link-active' : '')
                            }
                        >
                            <span className="admin-nav-link-icon">📦</span>
                            <span>Orders</span>
                        </NavLink>

                        <NavLink
                            to="/admin/users"
                            className={({ isActive }) =>
                                'admin-nav-link' + (isActive ? ' admin-nav-link-active' : '')
                            }
                        >
                            <span className="admin-nav-link-icon">👤</span>
                            <span>Users</span>
                        </NavLink>

                        <NavLink
                            to="/admin/coupons"
                            className={({ isActive }) =>
                                'admin-nav-link' + (isActive ? ' admin-nav-link-active' : '')
                            }
                        >
                            <span className="admin-nav-link-icon">🎟️</span>
                            <span>Coupons</span>
                        </NavLink>
                    </nav>
                </div>

                <div className="admin-sidebar-footer">
                    <div>Admin tools for car parts store.</div>
                </div>
            </aside>

            <div className="admin-main">
                <header className="admin-topbar">
                    <div className="admin-topbar-breadcrumb">Admin</div>
                    <div className="admin-topbar-title">CarParts Control Center</div>
                </header>

                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
