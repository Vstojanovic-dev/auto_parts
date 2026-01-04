import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth';

type Gender = 'male' | 'female' | 'other' | 'prefer_not';

export default function RegisterPage() {
    const navigate = useNavigate();

    // Account
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordRepeat, setPasswordRepeat] = useState('');

    // Profile
    const [gender, setGender] = useState<Gender>('prefer_not');
    const [dateOfBirth, setDateOfBirth] = useState('');

    // Vehicle
    const [carYear, setCarYear] = useState('');
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [engine, setEngine] = useState('');

    // Address
    const [addressLine1, setAddressLine1] = useState('');
    const [apartment, setApartment] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [country, setCountry] = useState('SI');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Email verification
    const [verifyUrl, setVerifyUrl] = useState<string | null>(null);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setVerifyUrl(null);

        if (password !== passwordRepeat) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await registerUser({
                name,
                email,
                password,
                gender,
                date_of_birth: dateOfBirth || undefined,
                vehicle: {
                    year: carYear ? Number(carYear) : undefined,
                    make: make || undefined,
                    model: model || undefined,
                    engine: engine || undefined,
                },
                address: {
                    address_line1: addressLine1 || undefined,
                    apartment: apartment || undefined,
                    city: city || undefined,
                    postal_code: postalCode || undefined,
                    country: country || undefined,
                },
            });

            if (res.verify_url) {
                setVerifyUrl(res.verify_url);
            } else {
                // fallback if backend ever changes response
                navigate('/login');
            }
        } catch (err) {
            if (err instanceof Error) setError(err.message);
            else setError('Unknown error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page auth-page--register">
            <div className="auth-card auth-card--wide">
                <h1 className="auth-title">Create an account</h1>
                <p className="auth-subtitle">
                    Create your account and verify your email to activate it.
                </p>

                {error && <div className="auth-error">{error}</div>}

                {verifyUrl && (
                    <div className="auth-success">
                        <strong>Almost done.</strong> Please verify your email.
                        <div className="auth-success__actions">
                            <a className="auth-link" href={verifyUrl} target="_blank" rel="noreferrer">
                                Open verification link
                            </a>
                            <button
                                type="button"
                                className="auth-link-button"
                                onClick={() => navigator.clipboard.writeText(verifyUrl)}
                            >
                                Copy link
                            </button>
                            <button
                                type="button"
                                className="auth-link-button"
                                onClick={() => navigate('/login')}
                            >
                                Go to login
                            </button>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form auth-form--grid">
                    {/* Account */}
                    <div className="auth-section">
                        <h2 className="auth-section__title">Account</h2>

                        <label className="auth-field">
                            <span>Name</span>
                            <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
                        </label>

                        <label className="auth-field">
                            <span>Email</span>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                        </label>

                        <label className="auth-field">
                            <span>Password</span>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
                        </label>

                        <label className="auth-field">
                            <span>Repeat password</span>
                            <input type="password" value={passwordRepeat} onChange={(e) => setPasswordRepeat(e.target.value)} required autoComplete="new-password" />
                        </label>
                    </div>

                    {/* Profile */}
                    <div className="auth-section">
                        <h2 className="auth-section__title">Profile</h2>

                        <label className="auth-field">
                            <span>Gender</span>
                            <select className="auth-select" value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                                <option value="prefer_not">Prefer not to say</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </label>

                        <label className="auth-field">
                            <span>Date of birth</span>
                            <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                        </label>
                    </div>

                    {/* Vehicle */}
                    <div className="auth-section">
                        <h2 className="auth-section__title">Vehicle</h2>

                        <label className="auth-field">
                            <span>Car year</span>
                            <input
                                type="number"
                                value={carYear}
                                onChange={(e) => setCarYear(e.target.value)}
                                placeholder="e.g. 2018"
                                min={1950}
                                max={2100}
                            />
                        </label>

                        <label className="auth-field">
                            <span>Make</span>
                            <input value={make} onChange={(e) => setMake(e.target.value)} placeholder="e.g. BMW" />
                        </label>

                        <label className="auth-field">
                            <span>Model</span>
                            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. M3" />
                        </label>

                        <label className="auth-field">
                            <span>Engine</span>
                            <input value={engine} onChange={(e) => setEngine(e.target.value)} placeholder="e.g. 3.0 I6" />
                        </label>
                    </div>

                    {/* Address */}
                    <div className="auth-section">
                        <h2 className="auth-section__title">Address</h2>

                        <label className="auth-field">
                            <span>Address</span>
                            <input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="Street + number" />
                        </label>

                        <label className="auth-field">
                            <span>Apartment</span>
                            <input value={apartment} onChange={(e) => setApartment(e.target.value)} placeholder="Optional" />
                        </label>

                        <label className="auth-field">
                            <span>City</span>
                            <input value={city} onChange={(e) => setCity(e.target.value)} />
                        </label>

                        <label className="auth-field">
                            <span>Postal code</span>
                            <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                        </label>

                        <label className="auth-field">
                            <span>Country</span>
                            <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="SI" />
                        </label>
                    </div>

                    <button className="auth-button auth-button--full" type="submit" disabled={loading}>
                        {loading ? 'Creating account…' : 'Create account'}
                    </button>
                </form>

                <p className="auth-footer-text">
                    Already have an account?{' '}
                    <Link to="/login" className="auth-link">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
