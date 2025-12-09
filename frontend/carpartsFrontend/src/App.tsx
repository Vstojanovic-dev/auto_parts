import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';

import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CategoriesPage from './pages/CategoriesPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';

import AdminLayout from './admin/AdminLayout';
import AdminProductsPage from './admin/AdminProductsPage';
import AdminOrdersPage from './admin/AdminOrdersPage';
import AdminUsersPage from './admin/AdminUsersPage';
import AdminCouponsPage from './admin/AdminCouponsPage';

import './App.css';

import type { AuthUser } from './api/auth';
import { getCurrentUser } from './api/auth';
import { CartProvider, useCart } from './context/CartContext.tsx';

interface RequireAdminProps {
    user: AuthUser | null;
    children: JSX.Element;
}

function RequireAdmin({ user, children }: RequireAdminProps) {
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
}



function AppShell({
    currentUser,
    onLogin,
    onLogout,
}: {
    currentUser: AuthUser | null;
    onLogin: (user: AuthUser | null) => void;
    onLogout: () => void;
}) {
    const { totalItems } = useCart();

    return (
        <div className="app">
            <header className="app-header">
                <div className="app-header__inner">
                    <div className="app-header__logo">
                        <span className="logo-mark">V</span>
                        <span className="logo-text">Car Parts</span>
                    </div>
                    <nav className="app-nav">
                        <Link to="/" className="app-nav__link">Home</Link>
                        <Link to="/products" className="app-nav__link">Products</Link>
                        <Link to="/cart" className="app-nav__link">
                            Cart{totalItems > 0 ? ` (${totalItems})` : ''}
                        </Link>

                        {currentUser && currentUser.role === 'admin' && (
                            <Link to="/admin" className="app-nav__link">Admin</Link>
                        )}

                        {currentUser ? (
                            <>
      <span className="app-nav__welcome">
        Welcome {currentUser.name}
      </span>
                                <button
                                    type="button"
                                    className="app-nav__link app-nav__logout"
                                    onClick={onLogout}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <Link to="/login" className="app-nav__link">Login</Link>
                        )}
                    </nav>

                </div>
            </header>

            <main className="app-main">
                <Routes>
                    <Route
                        path="/admin"
                        element={
                            <RequireAdmin user={currentUser}>
                                <AdminLayout />
                            </RequireAdmin>
                        }
                    >
                        <Route index element={<AdminProductsPage />} />
                        <Route path="products" element={<AdminProductsPage />} />
                        <Route path="orders" element={<AdminOrdersPage />} />
                        <Route path="users" element={<AdminUsersPage />} />
                        <Route path="coupons" element={<AdminCouponsPage />} />
                    </Route>

                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<CategoriesPage />} />
                    <Route path="/products/list" element={<ProductsPage />} />
                    <Route path="/products/:id" element={<ProductDetailPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/login" element={<LoginPage onLogin={onLogin} />} />
                    <Route path="/register" element={<RegisterPage />} />
                </Routes>
            </main>
        </div>
    );
}

function App() {
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

    async function handleLogout() {
        try {
            await fetch('/api/public/auth/logout.php', {
                method: 'POST',
                credentials: 'include',
            });
        } catch {
            // ignore
        } finally {
            setCurrentUser(null);
            try {
                localStorage.removeItem('authUser');
            } catch {
                // ignore
            }
        }
    }

    useEffect(() => {
        (async () => {
            try {
                const user = await getCurrentUser();
                setCurrentUser(user);
            } catch {
                setCurrentUser(null);
            }
        })();
    }, []);

    return (
        <CartProvider user={currentUser}>
            <AppShell
                currentUser={currentUser}
                onLogin={setCurrentUser}
                onLogout={handleLogout}
            />
        </CartProvider>
    );
}

export default App;
