import { fetchAPI } from "@/lib/api-client"
import { IProduct } from "@/types/product"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const PRODUCT_API_URL = "/booth/products"
const CATEGORY_API_URL = "/booth/categories"

const PRODUCT_KEYS = {
    all: ["booth-products"] as const,
    lists: () => [...PRODUCT_KEYS.all, "list"] as const,
    list: (filters?: Record<string, any>) =>
        [...PRODUCT_KEYS.lists(), filters] as const,
    details: () => [...PRODUCT_KEYS.all, "detail"] as const,
    detail: (id: string) => [...PRODUCT_KEYS.details(), id] as const,
    categories: ["booth-categories-select"] as const,
}

const productAPI = {
    getAll: (params?: Record<string, any>) => {
        const queryString = params
            ? `?${new URLSearchParams(
                  Object.entries(params).reduce(
                      (acc, [key, value]) => {
                          if (
                              value !== undefined &&
                              value !== null &&
                              value !== ""
                          ) {
                              acc[key] = Array.isArray(value)
                                  ? value.join(",")
                                  : String(value)
                          }
                          return acc
                      },
                      {} as Record<string, string>,
                  ),
              ).toString()}`
            : ""
        return fetchAPI(`${PRODUCT_API_URL}${queryString}`)
    },

    getById: (id: string) => fetchAPI(`${PRODUCT_API_URL}/${id}`),

    create: (data: Partial<IProduct>) =>
        fetchAPI(`${PRODUCT_API_URL}`, {
            method: "POST",
            body: JSON.stringify(data),
        }),

    update: (id: string, data: Partial<IProduct>) =>
        fetchAPI(`${PRODUCT_API_URL}/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        fetchAPI(`${PRODUCT_API_URL}/${id}`, {
            method: "DELETE",
        }),

    bulkDelete: (ids: string[]) =>
        fetchAPI(`${PRODUCT_API_URL}/bulk-delete`, {
            method: "POST",
            body: JSON.stringify({ ids }),
        }),

    bulkUpdateStatus: (ids: string[], status: string) =>
        fetchAPI(`${PRODUCT_API_URL}/bulk-update-status`, {
            method: "PUT",
            body: JSON.stringify({ ids, status }),
        }),

    getCategories: () => fetchAPI(`${CATEGORY_API_URL}?view=tree`),
}

export function useBoothProducts(params?: Record<string, any>) {
    const queryClient = useQueryClient()

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
    })

    const getProductById = (id: string) =>
        useQuery({
            queryKey: PRODUCT_KEYS.detail(id),
            queryFn: () => productAPI.getById(id),
            enabled: !!id,
        })

    const getCategoriesSelect = () => {
        const { data: categoriesData, isLoading: isLoadingCategories } =
            useQuery({
                queryKey: PRODUCT_KEYS.categories,
                queryFn: async () => {
                    const result = await productAPI.getCategories()

                    const flattenCategories = (cats: any[]): any[] =>
                        cats.flatMap((cat) => [
                            { value: cat._id, label: cat.name },
                            ...(cat.children
                                ? flattenCategories(cat.children)
                                : []),
                        ])

                    return {
                        ...result,
                        data: flattenCategories(result.data || []),
                    }
                },
                staleTime: 1000 * 60 * 10,
            })

        return { data: categoriesData, isLoading: isLoadingCategories }
    }

    const createMutation = useMutation({
        mutationFn: productAPI.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<IProduct> }) =>
            productAPI.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() })
            queryClient.invalidateQueries({
                queryKey: PRODUCT_KEYS.detail(variables.id),
            })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: productAPI.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() })
        },
    })

    const bulkDeleteMutation = useMutation({
        mutationFn: productAPI.bulkDelete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() })
        },
    })

    const bulkUpdateStatusMutation = useMutation({
        mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
            productAPI.bulkUpdateStatus(ids, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() })
        },
    })

    return {
        products,
        isLoading,
        error,
        refetch,
        getProductById,
        getCategoriesSelect,
        createProduct: createMutation.mutate,
        createProductAsync: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
        createError: createMutation.error,
        updateProduct: updateMutation.mutate,
        updateProductAsync: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        updateError: updateMutation.error,
        deleteProduct: deleteMutation.mutate,
        deleteProductAsync: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
        deleteError: deleteMutation.error,
        bulkDeleteProducts: bulkDeleteMutation.mutate,
        bulkDeleteProductsAsync: bulkDeleteMutation.mutateAsync,
        isBulkDeleting: bulkDeleteMutation.isPending,
        bulkDeleteError: bulkDeleteMutation.error,
        bulkUpdateStatus: bulkUpdateStatusMutation.mutate,
        bulkUpdateStatusAsync: bulkUpdateStatusMutation.mutateAsync,
        isBulkUpdatingStatus: bulkUpdateStatusMutation.isPending,
        bulkUpdateStatusError: bulkUpdateStatusMutation.error,
    }
}
