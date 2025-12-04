// src/api/catalog.ts

const API_BASE = 'http://localhost:8080/api/public';

export interface CategoryDto {
    category: string;
    product_count: number;
}

interface CategoriesResponseOk {
    status: 'ok';
    data: CategoryDto[];
}

interface CategoriesResponseError {
    status: 'error';
    message?: string;
}

export async function getCategories(): Promise<CategoryDto[]> {
    const res = await fetch(`${API_BASE}/categories.php`, {
        method: 'GET',
        credentials: 'include',
    });

    const data = (await res.json()) as CategoriesResponseOk | CategoriesResponseError;

    if (!res.ok || data.status !== 'ok') {
        const msg = (data as CategoriesResponseError).message || 'Failed to load categories';
        throw new Error(msg);
    }

    return (data as CategoriesResponseOk).data;
}


export interface ProductDto {
    id: number;
    name: string;
    brand: string;
    category: string;
    description: string | null;
    price: string | number;
    stock: number;
    image_url: string | null;
    created_at: string;
}

interface ProductsResponseOk {
    status: 'ok';
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    data: ProductDto[];
}

interface ProductsResponseError {
    status: 'error';
    message?: string;
}

export type ProductsSortBackend =
    | 'price_asc'
    | 'price_desc'
    | 'name_asc'
    | 'name_desc'
    | 'newest';

export interface ProductsQuery {
    page?: number;
    limit?: number;
    q?: string;
    category?: string;
    sort?: ProductsSortBackend;
}

export async function getProducts(params: ProductsQuery): Promise<ProductsResponseOk> {
    const search = new URLSearchParams();

    if (params.page != null) search.set('page', String(params.page));
    if (params.limit != null) search.set('limit', String(params.limit));
    if (params.q && params.q.trim() !== '') search.set('q', params.q.trim());
    if (params.category && params.category !== 'all') {
        search.set('category', params.category);
    }
    if (params.sort) search.set('sort', params.sort);

    const res = await fetch(`${API_BASE}/products.php?${search.toString()}`, {
        method: 'GET',
        credentials: 'include',
    });

    const data = (await res.json()) as ProductsResponseOk | ProductsResponseError;

    if (!res.ok || (data as ProductsResponseOk).status !== 'ok') {
        const msg = (data as ProductsResponseError).message || 'Failed to load products';
        throw new Error(msg);
    }

    return data as ProductsResponseOk;
}

