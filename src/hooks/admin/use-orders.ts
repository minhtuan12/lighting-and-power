import { fetchAPI } from "@/lib/api-client"
import { EOrderStatus, EPaymentStatus } from "@/types/order"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const ORDER_API_URL = "/admin/orders"

interface OrderQueryParams {
    page?: number
    limit?: number
    search?: string
    status?: EOrderStatus | "all"
    paymentStatus?: EPaymentStatus | "all"
}

// Query keys
const ORDER_KEYS = {
    all: ["admin-orders"] as const,
    lists: () => [...ORDER_KEYS.all, "list"] as const,
    list: (params: OrderQueryParams) =>
        [...ORDER_KEYS.lists(), params] as const,
}

// API functions
const orderAPI = {
    getAll: (params: OrderQueryParams) => {
        const queryString = params
            ? `?${new URLSearchParams(
                  Object.entries(params).reduce(
                      (acc, [key, value]) => {
                          if (
                              value !== undefined &&
                              value !== null &&
                              value !== ""
                          ) {
                              acc[key] = String(value)
                          }
                          return acc
                      },
                      {} as Record<string, string>,
                  ),
              ).toString()}`
            : ""
        return fetchAPI(`${ORDER_API_URL}${queryString}`)
    },

    updateStatus: (
        id: string,
        data: { status: EOrderStatus; cancelReason?: string },
    ) => {
        return fetchAPI(`${ORDER_API_URL}/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        })
    },
}

// Hook
export function useAdminOrders(params: OrderQueryParams = {}) {
    const queryClient = useQueryClient()

    const { data, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ORDER_KEYS.list(params),
        queryFn: () => orderAPI.getAll(params),
    })

    const updateStatusMutation = useMutation({
        mutationFn: ({
            id,
            status,
            cancelReason,
        }: {
            id: string
            status: EOrderStatus
            cancelReason?: string
        }) => orderAPI.updateStatus(id, { status, cancelReason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ORDER_KEYS.lists() })
        },
    })

    return {
        data: data?.data,
        isLoading,
        isFetching,
        error,
        refetch,

        updateStatus: updateStatusMutation.mutate,
        updateStatusAsync: updateStatusMutation.mutateAsync,
        isUpdating: updateStatusMutation.isPending,
    }
}
