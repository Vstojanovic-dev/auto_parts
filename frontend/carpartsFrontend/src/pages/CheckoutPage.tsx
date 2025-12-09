import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.tsx';

interface CheckoutFormState {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    country: string;
    coupon: string;
}

const STRIPE_TEST_URL = 'https://stripe.com/payments/checkout';

function CheckoutPage() {
    const { items, totalItems, totalPrice } = useCart();
    const [form, setForm] = useState<CheckoutFormState>({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        country: '',
        coupon: '',
    });

    function handleChange(field: keyof CheckoutFormState, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        // In a real app this would call backend to create a Stripe Checkout session.
        window.location.href = STRIPE_TEST_URL;
    }

    if (items.length === 0) {
        return (
            <div className="checkout-page">
                <div className="container checkout-empty">
                    <h1>Your cart is empty</h1>
                    <p>Add some products before checking out.</p>
                    <Link to="/products" className="btn btn--primary">
                        Browse products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <div className="container checkout-grid">
                <div className="checkout-form-card">
                    <div className="checkout-header">
                        <h1>Checkout</h1>
                        <p>Enter your details to complete the purchase.</p>
                    </div>

                    <form className="checkout-form" onSubmit={handleSubmit}>
                        <div className="checkout-row">
                            <label>
                                First name
                                <input
                                    required
                                    value={form.firstName}
                                    onChange={(e) => handleChange('firstName', e.target.value)}
                                />
                            </label>
                            <label>
                                Last name
                                <input
                                    required
                                    value={form.lastName}
                                    onChange={(e) => handleChange('lastName', e.target.value)}
                                />
                            </label>
                        </div>

                        <div className="checkout-row">
                            <label>
                                Phone
                                <input
                                    required
                                    value={form.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                />
                            </label>
                            <label>
                                Email
                                <input
                                    type="email"
                                    required
                                    value={form.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                />
                            </label>
                        </div>

                        <label>
                            Address
                            <input
                                required
                                value={form.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                            />
                        </label>

                        <div className="checkout-row">
                            <label>
                                City
                                <input
                                    required
                                    value={form.city}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                />
                            </label>
                            <label>
                                Country
                                <input
                                    required
                                    value={form.country}
                                    onChange={(e) => handleChange('country', e.target.value)}
                                />
                            </label>
                        </div>

                        <label>
                            Coupon
                            <input
                                placeholder="Optional"
                                value={form.coupon}
                                onChange={(e) => handleChange('coupon', e.target.value)}
                            />
                        </label>

                        <button type="submit" className="btn btn--primary checkout-submit">
                            Proceed to Stripe
                        </button>
                    </form>
                </div>

                <aside className="checkout-summary">
                    <div className="checkout-summary__card">
                        <h2>Order summary</h2>
                        <p className="checkout-summary__meta">
                            {totalItems} item{totalItems !== 1 ? 's' : ''} in cart
                        </p>
                        <div className="checkout-summary__items">
                            {items.map((item) => (
                                <div key={item.id} className="checkout-summary__row">
                                    <div>
                                        <p className="checkout-summary__name">{item.name}</p>
                                        <p className="checkout-summary__note">
                                            Qty {item.quantity} · {item.brand || 'Brand'}{' '}
                                            {item.category ? `· ${item.category}` : ''}
                                        </p>
                                    </div>
                                    <div className="checkout-summary__price">
                                        {(item.price * item.quantity).toFixed(2)} €
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="checkout-summary__total">
                            <span>Total</span>
                            <span>{totalPrice.toFixed(2)} €</span>
                        </div>
                        <Link to="/cart" className="checkout-summary__back">
                            ← Back to cart
                        </Link>
                    </div>
                </aside>
            </div>
        </div>
    );
}

export default CheckoutPage;

