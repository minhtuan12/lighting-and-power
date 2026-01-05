const API_BASE_URL = '/api';

export async function fetchAPI(endpoint: string, options?: RequestInit) {
    const headers: HeadersInit = {}

    if (!(options?.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (options?.headers) {
        Object.assign(headers, options.headers);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }

    return data;
}
