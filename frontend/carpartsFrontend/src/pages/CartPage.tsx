import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.tsx';

function CartPage() {
    const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } =
        useCart();

    if (items.length === 0) {
        return (
            <div className="cart-page">
                <div className="container cart-empty">
                    <h1>Your cart is empty</h1>
                    <p>Add some parts to see them here.</p>
                    <Link to="/products" className="btn btn--primary">
                        Browse products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="container cart-inner">
                <div className="cart-header">
                    <div>
                        <p className="cart-eyebrow">Cart</p>
                        <h1 className="cart-title">Your shopping bag</h1>
                        <p className="cart-subtitle">
                            {totalItems} item{totalItems !== 1 ? 's' : ''} ready to ship.
                        </p>
                    </div>
                    <div className="cart-actions-inline">
                        <Link to="/products" className="link-mute">
                            Continue shopping →
                        </Link>
                        <button type="button" className="link-danger" onClick={clearCart}>
                            Clear cart
                        </button>
                    </div>
                </div>

                <div className="cart-layout">
                    <div className="cart-items">
                        {items.map((item) => (
                            <div key={item.id} className="cart-item">
                                <div className="cart-item__info">
                                    <h2>{item.name}</h2>
                                    <p className="cart-item__meta">
                                        {item.brand && <span>{item.brand}</span>}
                                        {item.category && <span>• {item.category}</span>}
                                    </p>
                                </div>
                                <div className="cart-item__controls">
                                    <div className="cart-item__qty">
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            min={1}
                                            value={item.quantity}
                                            onChange={(e) =>
                                                updateQuantity(item.id, Math.max(1, Number(e.target.value) || 1))
                                            }
                                        />
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="cart-item__price">
                                        {(item.price * item.quantity).toFixed(2)} €
                                    </div>
                                    <button
                                        type="button"
                                        className="cart-item__remove"
                                        onClick={() => removeItem(item.id)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <aside className="cart-summary">
                        <h2>Order summary</h2>
                        <div className="cart-summary__row">
                            <span>Subtotal</span>
                            <span>{totalPrice.toFixed(2)} €</span>
                        </div>
                        <div className="cart-summary__row">
                            <span>Shipping</span>
                            <span>Calculated at checkout</span>
                        </div>
                        <div className="cart-summary__row cart-summary__row--total">
                            <span>Total</span>
                            <span>{totalPrice.toFixed(2)} €</span>
                        </div>

                        <Link to="/checkout" className="btn btn--primary cart-summary__checkout">
                            Continue to checkout
                        </Link>

                        <p className="cart-summary__note">
                            Secure checkout. Free returns within 30 days.
                        </p>
                    </aside>
                </div>
            </div>
        </div>
    );
}

export default CartPage;
