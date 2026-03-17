import { fetchAPI } from "@/lib/api-client"
import { ICategory } from "@/types/category"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const CATEGORY_API_URL = "/booth/categories"

const CATEGORY_KEYS = {
    all: ["booth-categories"] as const,
    lists: () => [...CATEGORY_KEYS.all, "list"] as const,
    list: (filters?: Record<string, any>) =>
        [...CATEGORY_KEYS.lists(), filters] as const,
    details: () => [...CATEGORY_KEYS.all, "detail"] as const,
    detail: (id: string) => [...CATEGORY_KEYS.details(), id] as const,
}

const categoryAPI = {
    getAll: (params?: Record<string, any>) => {
        const queryString = params
            ? `?${new URLSearchParams(params).toString()}`
            : ""
        return fetchAPI(`${CATEGORY_API_URL}${queryString}`)
    },

    getById: (id: string) => fetchAPI(`${CATEGORY_API_URL}/${id}`),

    create: (data: Partial<ICategory>) =>
        fetchAPI(`${CATEGORY_API_URL}`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: string, data: Partial<ICategory>) =>
        fetchAPI(`${CATEGORY_API_URL}/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        fetchAPI(`${CATEGORY_API_URL}/${id}`, {
            method: "DELETE",
        }),
}

export function useBoothCategories(params?: Record<string, any>) {
    const queryClient = useQueryClient()

    const {
        data: categories,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: CATEGORY_KEYS.list(params),
        queryFn: () => categoryAPI.getAll(params),
    })

    const getCategoryById = (id: string) =>
        useQuery({
            queryKey: CATEGORY_KEYS.detail(id),
            queryFn: () => categoryAPI.getById(id),
            enabled: !!id,
        })

    const createMutation = useMutation({
        mutationFn: categoryAPI.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.lists() })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ICategory> }) =>
            categoryAPI.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.lists() })
            queryClient.invalidateQueries({
                queryKey: CATEGORY_KEYS.detail(variables.id),
            })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: categoryAPI.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.lists() })
        },
    })

    return {
        categories,
        isLoading,
        error,
        refetch,
        getCategoryById,
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
    }
}
