import { fetchAPI } from '@/lib/api-client';
import { ICategory } from '@/types/category';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const CATEGORY_API_URL = '/admin/categories';

// Query keys
const CATEGORY_KEYS = {
    all: ['categories'] as const,
    lists: () => [...CATEGORY_KEYS.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...CATEGORY_KEYS.lists(), filters] as const,
    details: () => [...CATEGORY_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...CATEGORY_KEYS.details(), id] as const,
};

// API functions
const categoryAPI = {
    getAll: (params?: Record<string, any>) => {
        const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
        return fetchAPI(`${CATEGORY_API_URL}${queryString}`);
    },

    getById: (id: string) => {
        return fetchAPI(`${CATEGORY_API_URL}/${id}`);
    },

    create: (data: Partial<ICategory>) => {
        return fetchAPI(`${CATEGORY_API_URL}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: (id: string, data: Partial<ICategory>) => {
        return fetchAPI(`${CATEGORY_API_URL}/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    delete: (id: string) => {
        return fetchAPI(`${CATEGORY_API_URL}/${id}`, {
            method: 'DELETE',
        });
    },
};

// Custom hook
export function useCategories(params?: Record<string, any>) {
    const queryClient = useQueryClient();

    // GET all categories
    const {
        data: categories,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: CATEGORY_KEYS.list(params),
        queryFn: () => categoryAPI.getAll(params),
    });

    // GET category by ID
    const getCategoryById = (id: string) => {
        return useQuery({
            queryKey: CATEGORY_KEYS.detail(id),
            queryFn: () => categoryAPI.getById(id),
            enabled: !!id,
        });
    };

    // CREATE category
    const createMutation = useMutation({
        mutationFn: categoryAPI.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.lists() });
        },
    });

    // UPDATE category
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ICategory> }) =>
            categoryAPI.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.detail(variables.id) });
        },
    });

    // DELETE category
    const deleteMutation = useMutation({
        mutationFn: categoryAPI.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.lists() });
        },
    });

    return {
        // Data
        categories,
        isLoading,
        error,

        // Methods
        refetch,
        getCategoryById,

        // Mutations
        createCategory: createMutation.mutate,
        createCategoryAsync: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
        createError: createMutation.error,

        updateCategory: updateMutation.mutate,
        updateCategoryAsync: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        updateError: updateMutation.error,

        deleteCategory: deleteMutation.mutate,
        deleteCategoryAsync: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
        deleteError: deleteMutation.error,
    };
}
