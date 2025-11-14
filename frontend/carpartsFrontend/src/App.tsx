import { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import './App.css';

import type { AuthUser } from './api/auth';
import { getCurrentUser } from './api/auth';

function App() {
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

    // On first load, ask backend if we already have a session
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
        <div className="app">
            <header className="app-header">
                <div className="app-header__inner">
                    <div className="app-header__logo">
                        <span className="logo-mark">V</span>
                        <span className="logo-text">Car Parts</span>
                    </div>
                    <nav className="app-nav">
                        <Link to="/" className="app-nav__link">
                            Home
                        </Link>
                        <Link to="/products" className="app-nav__link">
                            Products
                        </Link>

                        {currentUser ? (
                            <span className="app-nav__welcome">
                Welcome {currentUser.name}
              </span>
                        ) : (
                            <Link to="/login" className="app-nav__link">
                                Login
                            </Link>
                        )}
                    </nav>
                </div>
            </header>

            <main className="app-main">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/:id" element={<ProductDetailPage />} />
                    <Route
                        path="/login"
                        element={<LoginPage onLogin={setCurrentUser} />}
                    />
                    <Route path="/register" element={<RegisterPage />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
