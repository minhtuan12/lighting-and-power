import { fetchAPI } from "@/lib/api-client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const key = ["favourites"] as const
export function useFavourites() {
    const client = useQueryClient()
    const query = useQuery({ queryKey: key, queryFn: () => fetchAPI("/favourites"), retry: false })
    const mutation = useMutation({
        mutationFn: ({ productId, favourite }: { productId: string; favourite: boolean }) => fetchAPI(favourite ? "/favourites" : `/favourites?productId=${productId}`, { method: favourite ? "POST" : "DELETE", body: favourite ? JSON.stringify({ productId }) : undefined }),
        onSuccess: () => client.invalidateQueries({ queryKey: key }),
    })
    return { favouriteIds: (query.data?.data ?? []) as string[], isLoading: query.isLoading, toggleFavourite: mutation.mutateAsync, isToggling: mutation.isPending }
}
