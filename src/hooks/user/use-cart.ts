import { fetchAPI } from "@/lib/api-client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

interface UpdateItem {
    quantity: number
}

const CART_API_URL = "/cart"
const CART_ITEMS_API_URL = "/cart/items"

// Query keys
const CART_KEYS = {
    all: ["cart"] as const,
    lists: () => [...CART_KEYS.all, "list"] as const,
    list: () => [...CART_KEYS.lists()] as const,
}

// API functions
const cartAPI = {
    get: () => {
        return fetchAPI(CART_API_URL)
    },

    addItem: (data: { productId: string; quantity: number }) => {
        return fetchAPI(CART_API_URL, {
            method: "POST",
            body: JSON.stringify(data),
        })
    },

    updateItem: (itemId: string, data: UpdateItem) => {
        return fetchAPI(`${CART_ITEMS_API_URL}/${itemId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        })
    },

    removeItem: (itemId: string) => {
        return fetchAPI(`${CART_ITEMS_API_URL}/${itemId}`, {
            method: "DELETE",
        })
    },
}

// Hook
export function useCart() {
    const queryClient = useQueryClient()

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: CART_KEYS.list(),
        queryFn: cartAPI.get,
    })

    // ➕ Add item
    const addItemMutation = useMutation({
        mutationFn: cartAPI.addItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CART_KEYS.lists() })
        },
    })

    // ✏️ Update item
    const updateItemMutation = useMutation({
        mutationFn: ({ itemId, data }: { itemId: string; data: UpdateItem }) =>
            cartAPI.updateItem(itemId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CART_KEYS.lists() })
        },
    })

    // ❌ Remove item
    const removeItemMutation = useMutation({
        mutationFn: cartAPI.removeItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CART_KEYS.lists() })
        },
    })

    return {
        // Data
        cart: data,
        isLoading,
        error,
        refetch,

        // Actions
        addToCart: addItemMutation.mutate,
        addToCartAsync: addItemMutation.mutateAsync,

        updateItem: updateItemMutation.mutate,
        updateItemAsync: updateItemMutation.mutateAsync,

        removeItem: removeItemMutation.mutate,
        removeItemAsync: removeItemMutation.mutateAsync,

        // States
        isAdding: addItemMutation.isPending,
        isUpdating: updateItemMutation.isPending,
        isRemoving: removeItemMutation.isPending,
    }
}
