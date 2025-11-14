import { Routes, Route, Link } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import './App.css'

function App() {
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
                    </nav>
                </div>
            </header>

            <main className="app-main">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/:id" element={<ProductDetailPage />} />
                </Routes>
            </main>
        </div>
    )
}

export default App
