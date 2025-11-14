// src/api/auth.ts

const API_BASE = 'http://localhost:8080/api/public';

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: 'user' | 'admin';
}

interface RegisterResponseOk {
    status: 'ok';
    user_id: number;
}

interface RegisterResponseError {
    status: 'error';
    errors?: string[];
    message?: string;
}

interface LoginResponseOk {
    status: 'ok';
    user: AuthUser;
}

interface LoginResponseError {
    status: 'error';
    message?: string;
}

export async function registerUser(name: string, email: string, password: string): Promise<number> {
    const res = await fetch(`${API_BASE}/auth/register.php`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
    });

    const data = (await res.json()) as RegisterResponseOk | RegisterResponseError;

    if (!res.ok || data.status !== 'ok') {
        const msg =
            (data as RegisterResponseError).errors?.join('\n') ||
            (data as RegisterResponseError).message ||
            'Registration failed';
        throw new Error(msg);
    }

    return (data as RegisterResponseOk).user_id;
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
