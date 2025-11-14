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
