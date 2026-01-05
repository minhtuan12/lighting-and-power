import { fetchAPI } from '@/lib/api-client';
import { IProduct } from '@/types/product';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const PRODUCT_API_URL = '/admin/products';
const CATEGORY_API_URL = '/admin/categories';

// Query keys
const PRODUCT_KEYS = {
    all: ['products'] as const,
    lists: () => [...PRODUCT_KEYS.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...PRODUCT_KEYS.lists(), filters] as const,
    details: () => [...PRODUCT_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...PRODUCT_KEYS.details(), id] as const,
    categories: ['categories-select'] as const,
    stats: ['product-stats'] as const,
};

// API functions
const productAPI = {
    getAll: (params?: Record<string, any>) => {
        const queryString = params ? `?${new URLSearchParams(
            Object.entries(params).reduce((acc, [key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    acc[key] = Array.isArray(value) ? value.join(',') : String(value);
                }
                return acc;
            }, {} as Record<string, string>)
        ).toString()}` : '';
        return fetchAPI(`${PRODUCT_API_URL}${queryString}`);
    },

    getById: (id: string) => {
        return fetchAPI(`${PRODUCT_API_URL}/${id}`);
    },

    create: (data: Partial<IProduct>) => {
        return fetchAPI(`${PRODUCT_API_URL}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: (id: string, data: Partial<IProduct>) => {
        return fetchAPI(`${PRODUCT_API_URL}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: (id: string) => {
        return fetchAPI(`${PRODUCT_API_URL}/${id}`, {
            method: 'DELETE',
        });
    },

    bulkDelete: (ids: string[]) => {
        return fetchAPI(`${PRODUCT_API_URL}/bulk-delete`, {
            method: 'POST',
            body: JSON.stringify({ ids }),
        });
    },

    bulkUpdateStatus: (ids: string[], status: string) => {
        return fetchAPI(`${PRODUCT_API_URL}/bulk/status`, {
            method: 'PUT',
            body: JSON.stringify({ ids, status }),
        });
    },

    bulkUpdateFeatured: (ids: string[], isFeatured: boolean) => {
        return fetchAPI(`${PRODUCT_API_URL}/bulk/featured`, {
            method: 'PUT',
            body: JSON.stringify({ ids, isFeatured }),
        });
    },

    bulkAddTags: (ids: string[], tags: string[]) => {
        return fetchAPI(`${PRODUCT_API_URL}/bulk/tags`, {
            method: 'PUT',
            body: JSON.stringify({ ids, tags }),
        });
    },

    getStats: () => {
        return fetchAPI(`${PRODUCT_API_URL}/stats`);
    },

    getCategories: () => {
        return fetchAPI(`${CATEGORY_API_URL}?view=tree`);
    },
};

// Custom hook
export function useProducts(params?: Record<string, any>) {
    const queryClient = useQueryClient();

    // GET all products
    const {
        data: products,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: PRODUCT_KEYS.list(params),
        queryFn: () => productAPI.getAll(params),
        enabled: !params?.skip,
        staleTime: 1000 * 60 * 5,
    });

    // GET product by ID
    const getProductById = (id: string) => {
        return useQuery({
            queryKey: PRODUCT_KEYS.detail(id),
            queryFn: () => productAPI.getById(id),
            enabled: !!id,
        });
    };

    // GET categories for select
    const getCategoriesSelect = () => {
        const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
            queryKey: PRODUCT_KEYS.categories,
            queryFn: async () => {
                const result = await productAPI.getCategories();

                // Transform tree to flat options
                const flattenCategories = (cats: any[]): any[] => {
                    return cats.flatMap(cat => [
                        { value: cat._id, label: cat.name },
                        ...(cat.children ? flattenCategories(cat.children) : [])
                    ]);
                };

                return {
                    ...result,
                    data: flattenCategories(result.data || [])
                };
            },
            staleTime: 1000 * 60 * 10,
        });

        return { data: categoriesData, isLoading: isLoadingCategories };
    };

    // GET stats
    const getStats = () => {
        const { data: statsData, isLoading: isLoadingStats } = useQuery({
            queryKey: PRODUCT_KEYS.stats,
            queryFn: () => productAPI.getStats(),
            staleTime: 1000 * 60 * 10,
        });

        return { data: statsData?.data, isLoading: isLoadingStats };
    };

    // CREATE product
    const createMutation = useMutation({
        mutationFn: productAPI.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
        },
    });

    // UPDATE product
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<IProduct> }) =>
            productAPI.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(variables.id) });
        },
    });

    // DELETE product
    const deleteMutation = useMutation({
        mutationFn: productAPI.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
        },
    });

    // BULK DELETE products
    const bulkDeleteMutation = useMutation({
        mutationFn: productAPI.bulkDelete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
        },
    });

    // BULK UPDATE STATUS
    const bulkUpdateStatusMutation = useMutation({
        mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
            productAPI.bulkUpdateStatus(ids, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
        },
    });

    // BULK UPDATE FEATURED
    const bulkUpdateFeaturedMutation = useMutation({
        mutationFn: ({ ids, isFeatured }: { ids: string[]; isFeatured: boolean }) =>
            productAPI.bulkUpdateFeatured(ids, isFeatured),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
        },
    });

    // BULK ADD TAGS
    const bulkAddTagsMutation = useMutation({
        mutationFn: ({ ids, tags }: { ids: string[]; tags: string[] }) =>
            productAPI.bulkAddTags(ids, tags),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
        },
    });

    return {
        // Data
        products,
        isLoading,
        error,

        // Methods
        refetch,
        getProductById,
        getCategoriesSelect,
        getStats,

        // CREATE mutations
        createProduct: createMutation.mutate,
        createProductAsync: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
        createError: createMutation.error,

        // UPDATE mutations
        updateProduct: updateMutation.mutate,
        updateProductAsync: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        updateError: updateMutation.error,

        // DELETE mutations
        deleteProduct: deleteMutation.mutate,
        deleteProductAsync: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
        deleteError: deleteMutation.error,

        // BULK DELETE mutations
        bulkDeleteProducts: bulkDeleteMutation.mutate,
        bulkDeleteProductsAsync: bulkDeleteMutation.mutateAsync,
        isBulkDeleting: bulkDeleteMutation.isPending,
        bulkDeleteError: bulkDeleteMutation.error,

        // BULK UPDATE STATUS mutations
        bulkUpdateStatus: bulkUpdateStatusMutation.mutate,
        bulkUpdateStatusAsync: bulkUpdateStatusMutation.mutateAsync,
        isBulkUpdatingStatus: bulkUpdateStatusMutation.isPending,
        bulkUpdateStatusError: bulkUpdateStatusMutation.error,

        // BULK UPDATE FEATURED mutations
        bulkUpdateFeatured: bulkUpdateFeaturedMutation.mutate,
        bulkUpdateFeaturedAsync: bulkUpdateFeaturedMutation.mutateAsync,
        isBulkUpdatingFeatured: bulkUpdateFeaturedMutation.isPending,
        bulkUpdateFeaturedError: bulkUpdateFeaturedMutation.error,

        // BULK ADD TAGS mutations
        bulkAddTags: bulkAddTagsMutation.mutate,
        bulkAddTagsAsync: bulkAddTagsMutation.mutateAsync,
        isBulkAddingTags: bulkAddTagsMutation.isPending,
        bulkAddTagsError: bulkAddTagsMutation.error,
    };
}
