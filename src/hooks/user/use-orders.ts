import { fetchAPI } from "@/lib/api-client"
import { EOrderStatus, IOrder } from "@/types/order"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

interface OrdersQueryParams {
    page?: number
    limit?: number
    status?: EOrderStatus
}

interface OrdersResponse {
    success: boolean
    data: {
        orders: IOrder[]
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

interface CancelOrderPayload {
    orderId: string
    reason: string
}

const ORDER_API_URL = "/orders"

// Query keys
const ORDER_KEYS = {
    all: ["orders"] as const,
    lists: () => [...ORDER_KEYS.all, "list"] as const,
    list: (params?: OrdersQueryParams) =>
        [...ORDER_KEYS.lists(), params] as const,
}

// API functions
const orderAPI = {
    getAll: (params?: OrdersQueryParams): Promise<OrdersResponse> => {
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

    cancel: ({ orderId, reason }: CancelOrderPayload) => {
        return fetchAPI(`${ORDER_API_URL}/${orderId}/cancel`, {
            method: "POST",
            body: JSON.stringify({ reason }),
        })
    },
}

export function useOrders(params?: OrdersQueryParams) {
    const { data, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ORDER_KEYS.list(params),
        queryFn: () => orderAPI.getAll(params),
    })

    return {
        orders: data?.data?.orders ?? [],
        meta: data?.data,
        isLoading,
        isFetching,
        error,
        refetch,
    }
}

export function useCancelOrder() {
    const queryClient = useQueryClient()

    const cancelMutation = useMutation({
        mutationFn: orderAPI.cancel,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ORDER_KEYS.lists() })
        },
    })

    return {
        cancelOrder: cancelMutation.mutate,
        cancelOrderAsync: cancelMutation.mutateAsync,
        isCancelling: cancelMutation.isPending,
    }
}
