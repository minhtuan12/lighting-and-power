import { fetchAPI } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';

const ACCOUNT_API_URL = '/admin/accounts';

// Query keys
const USER_KEYS = {
    all: ['users'] as const,
    lists: () => [...USER_KEYS.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...USER_KEYS.lists(), filters] as const,
};

// API functions
const userAPI = {
    getAll: (params?: Record<string, any>) => {
        const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
        return fetchAPI(`${ACCOUNT_API_URL}${queryString}`);
    },
};

// Custom hook
export function useAccounts(params?: Record<string, any>) {
    const {
        data,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: USER_KEYS.list(params),
        queryFn: () => userAPI.getAll(params),
    });

    return {
        // Data
        data: data?.data,
        isLoading,
        error,

        // Methods
        refetch,
    };
}