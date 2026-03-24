import { fetchAPI } from '@/lib/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const INQUIRY_API_URL = '/comments'

// Query keys
const INQUIRY_KEYS = {
	all: ['comments'] as const,
	lists: () => [...INQUIRY_KEYS.all, 'list-comments'] as const,
	list: (params: { productId: string }) =>
		[...INQUIRY_KEYS.lists(), params] as const,
}

// API functions
const inquiryAPI = {
	getAll: (params: { productId: string }) => {
		const query = new URLSearchParams()
		query.set('productId', params.productId)
		return fetchAPI(`${INQUIRY_API_URL}?${query.toString()}`)
	},

	sendComment: (
		commentId: string | null,
		content: string,
		productId: string,
	) => {
		return fetchAPI(`${INQUIRY_API_URL}`, {
			method: 'POST',
			body: JSON.stringify({ replyTo: commentId, content, productId }),
		})
	},
}

// Hook
export function useComments(params: { productId: string }) {
	const queryClient = useQueryClient()

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: INQUIRY_KEYS.list(params),
		queryFn: () => inquiryAPI.getAll(params),
	})

	// REPLY comment
	const replyMutation = useMutation({
		mutationFn: ({
			content,
			commentId,
			productId,
		}: {
			commentId?: string
			content: string
			productId: string
		}) => inquiryAPI.sendComment(commentId || null, content, productId),
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
		sendComment: replyMutation.mutate,
		sendCommentAsync: replyMutation.mutateAsync,
		isSendingComment: replyMutation.isPending,
	}
}
