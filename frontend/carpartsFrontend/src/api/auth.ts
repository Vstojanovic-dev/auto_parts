// src/api/auth.ts

const API_BASE = 'http://localhost:8080/api/public';

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: 'user' | 'admin';
}

interface LoginResponseOk {
    status: 'ok';
    user: AuthUser;
}

interface LoginResponseError {
    status: 'error';
    message?: string;
}

export type RegisterPayload = {
    name: string;
    email: string;
    password: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not';
    date_of_birth?: string;
    vehicle?: { year?: number; make?: string; model?: string; engine?: string };
    address?: {
        address_line1?: string;
        apartment?: string;
        city?: string;
        postal_code?: string;
        country?: string;
    };
};

export async function registerUser(payload: RegisterPayload): Promise<{
    status: 'ok' | 'error';
    user_id?: number;
    verify_url?: string;
    message?: string;
    errors?: string[];
}> {
    const res = await fetch('/api/public/auth/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
    });

    const text = await res.text();
    let json: any;
    try {
        json = JSON.parse(text);
    } catch {
        throw new Error(text.slice(0, 160));
    }

    if (!res.ok || json.status !== 'ok') {
        const msg =
            (Array.isArray(json.errors) && json.errors.join(', ')) ||
            json.message ||
            `Registration failed (${res.status})`;
        throw new Error(msg);
    }

    return json;
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
    const res = await fetch(`${API_BASE}/auth/login.php`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    const data = (await res.json()) as LoginResponseOk | LoginResponseError;

    if (!res.ok || data.status !== 'ok') {
        const msg = (data as LoginResponseError).message || 'Login failed';
        throw new Error(msg);
    }

    return (data as LoginResponseOk).user;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
    const res = await fetch(`${API_BASE}/auth/me.php`, {
        method: 'GET',
        credentials: 'include',
    });

    if (res.status === 401) {
        // Not logged in
        return null;
    }

    const data = await res.json() as
        | { status: 'ok'; user: AuthUser }
        | { status: 'error'; message?: string };

    if (!res.ok || data.status !== 'ok') {
        return null;
    }

    return data.user;
}
