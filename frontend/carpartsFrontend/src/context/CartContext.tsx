import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '../api/auth.ts';

export interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    brand?: string;
    category?: string;
}

interface CartContextValue {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
    updateQuantity: (id: number, quantity: number) => void;
    removeItem: (id: number) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const GUEST_KEY = 'cart_guest';
const USER_KEY_PREFIX = 'cart_user_';

type StorageHandle = {
    store: Storage;
    key: string;
};

function getStorage(user: AuthUser | null): StorageHandle | null {
    if (typeof window === 'undefined') return null;
    if (user) {
        return { store: window.localStorage, key: `${USER_KEY_PREFIX}${user.id}` };
    }
    return { store: window.sessionStorage, key: GUEST_KEY };
}

function readStoredCart(user: AuthUser | null): CartItem[] {
    const storage = getStorage(user);
    if (!storage) return [];
    try {
        const raw = storage.store.getItem(storage.key);
        return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
        return [];
    }
}

export function CartProvider({ children, user }: { children: ReactNode; user: AuthUser | null }) {
    const [items, setItems] = useState<CartItem[]>(() => readStoredCart(user));

    // Hydrate when auth state changes
    useEffect(() => {
        const storage = getStorage(user);
        if (!storage) return;

        // Drop guest cart when user logs in
        if (user) {
            try {
                window.sessionStorage.removeItem(GUEST_KEY);
            } catch {
                // ignore
            }
        }

        try {
            const raw = storage.store.getItem(storage.key);
            if (raw) {
                setItems(JSON.parse(raw) as CartItem[]);
                return;
            }
        } catch {
            // ignore parse/storage errors
        }

        // Default: empty cart for this context (also clears guest cart on logout)
        setItems([]);
        try {
            storage.store.setItem(storage.key, JSON.stringify([]));
        } catch {
            // ignore
        }
    }, [user?.id]);

    // Persist whenever cart changes
    useEffect(() => {
        const storage = getStorage(user);
        if (!storage) return;
        try {
            storage.store.setItem(storage.key, JSON.stringify(items));
        } catch {
            // ignore storage errors
        }
    }, [items, user?.id]);

    const totalItems = useMemo(
        () => items.reduce((sum, item) => sum + item.quantity, 0),
        [items],
    );
    const totalPrice = useMemo(
        () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        [items],
    );

    function addItem(item: Omit<CartItem, 'quantity'>, quantity = 1) {
        setItems((prev) => {
            const existing = prev.find((i) => i.id === item.id);
            if (existing) {
                return prev.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i,
                );
            }
            return [...prev, { ...item, quantity }];
        });
    }

    function updateQuantity(id: number, quantity: number) {
        setItems((prev) => {
            if (quantity <= 0) {
                return prev.filter((i) => i.id !== id);
            }
            return prev.map((i) => (i.id === id ? { ...i, quantity } : i));
        });
    }

    function removeItem(id: number) {
        setItems((prev) => prev.filter((i) => i.id !== id));
    }

    function clearCart() {
        setItems([]);
    }

    const value: CartContextValue = {
        items,
        totalItems,
        totalPrice,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) {
        throw new Error('useCart must be used within CartProvider');
    }
    return ctx;
}
