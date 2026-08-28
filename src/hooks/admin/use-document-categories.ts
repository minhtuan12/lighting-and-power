import { fetchAPI } from '@/lib/api-client'
import { IDocumentCategory } from '@/types/document-category'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const CATEGORY_API_URL = '/admin/document-categories'

const CATEGORY_KEYS = {
    all: ['document-categories'] as const,
    lists: () => [...CATEGORY_KEYS.all, 'list'] as const,
    list: (params?: Record<string, any>) =>
        [...CATEGORY_KEYS.lists(), params] as const,
}

const categoryAPI = {
    getAll: (params?: Record<string, any>) => {
        const queryString = params
            ? `?${new URLSearchParams(
                Object.entries(params).reduce(
                    (acc, [key, value]) => {
                        if (
                            value !== undefined &&
                            value !== null &&
                            value !== ''
                        ) {
                            acc[key] = String(value)
                        }
                        return acc
                    },
                    {} as Record<string, string>,
                ),
            ).toString()}`
            : ''
        return fetchAPI(`${CATEGORY_API_URL}${queryString}`)
    },

    create: (data: Partial<IDocumentCategory>) => {
        return fetchAPI(CATEGORY_API_URL, {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },

    update: (id: string, data: Partial<IDocumentCategory>) => {
        return fetchAPI(`${CATEGORY_API_URL}/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        })
    },

    delete: (id: string) => {
        return fetchAPI(`${CATEGORY_API_URL}/${id}`, {
            method: 'DELETE',
        })
    },
    reorder: (orderedIds: string[]) =>
        fetchAPI(`${CATEGORY_API_URL}/reorder`, {
            method: 'PUT',
            body: JSON.stringify({ orderedIds }),
        }),
}

export function useDocumentCategories(params?: Record<string, any>) {
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

    const createMutation = useMutation({
        mutationFn: (data: Partial<IDocumentCategory>) =>
            categoryAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: CATEGORY_KEYS.lists(),
            })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string
            data: Partial<IDocumentCategory>
        }) => categoryAPI.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: CATEGORY_KEYS.lists(),
            })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => categoryAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: CATEGORY_KEYS.lists(),
            })
        },
    })
    const reorderMutation = useMutation({
        mutationFn: (ids: string[]) => categoryAPI.reorder(ids),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.lists() }),
    })

    return {
        categories: categories?.data ?? [],
        isLoading,
        error,
        refetch,

        createCategory: createMutation.mutate,
        createCategoryAsync: createMutation.mutateAsync,
        isCreating: createMutation.isPending,

        updateCategory: updateMutation.mutate,
        updateCategoryAsync: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,

        deleteCategory: deleteMutation.mutate,
        deleteCategoryAsync: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
        reorderCategoryAsync: reorderMutation.mutateAsync,
        isReorderingCategory: reorderMutation.isPending,
    }
}
