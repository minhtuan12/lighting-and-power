import { fetchAPI } from "@/lib/api-client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const INQUIRY_API_URL = "/admin/comments"

// Query keys
const INQUIRY_KEYS = {
	all: ["admin-comments"] as const,
	lists: () => [...INQUIRY_KEYS.all, "admin-list-comments"] as const,
	list: (params: { search?: string }) => [...INQUIRY_KEYS.lists(), params] as const,
}

// API functions
const inquiryAPI = {
	getAll: (params: { search?: string }) => {
		const query = new URLSearchParams()
		if (params.search) query.set("search", params.search)
		return fetchAPI(`${INQUIRY_API_URL}?${query.toString()}`)
	},

	reply: (commentId: string, content: string) => {
		return fetchAPI(`${INQUIRY_API_URL}`, {
			method: "POST",
			body: JSON.stringify({ replyTo: commentId, content }),
		})
	},
}

// Hook
export function useUserComments(params: { search?: string } = {}) {
	const queryClient = useQueryClient()

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: INQUIRY_KEYS.list(params),
		queryFn: () => inquiryAPI.getAll(params),
	})

	// REPLY comment
	const replyMutation = useMutation({
		mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
			inquiryAPI.reply(commentId, content),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: INQUIRY_KEYS.lists() })
		},
	})

	return {
		// Data
		data: data?.data,
		isLoading,
		error,
		refetch,

		// Reply comment
		reply: replyMutation.mutate,
		replyAsync: replyMutation.mutateAsync,
		isReplying: replyMutation.isPending,
	}
}
