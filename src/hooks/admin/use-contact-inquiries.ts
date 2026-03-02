import { fetchAPI } from "@/lib/api-client"
import { EContactStatus } from "@/types/contact-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const INQUIRY_API_URL = "/admin/inquiries"

// Query keys
const INQUIRY_KEYS = {
	all: ["inquiries"] as const,
	lists: () => [...INQUIRY_KEYS.all, "list"] as const,
	list: (params: { search?: string }) => [...INQUIRY_KEYS.lists(), params] as const,
}

// API functions
const inquiryAPI = {
	getAll: (params: { search?: string }) => {
		const query = new URLSearchParams()
		if (params.search) query.set("search", params.search)
		return fetchAPI(`${INQUIRY_API_URL}?${query.toString()}`)
	},

	updateStatus: (id: string, status: EContactStatus) => {
		return fetchAPI(`${INQUIRY_API_URL}/${id}`, {
			method: "PATCH",
			body: JSON.stringify({ status }),
		})
	},
}

// Hook
export function useContactInquiries(params: { search?: string } = {}) {
	const queryClient = useQueryClient()

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: INQUIRY_KEYS.list(params),
		queryFn: () => inquiryAPI.getAll(params),
	})

	// UPDATE status
	const updateStatusMutation = useMutation({
		mutationFn: ({ id, status }: { id: string; status: EContactStatus }) =>
			inquiryAPI.updateStatus(id, status),
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

		// Update status
		updateStatus: updateStatusMutation.mutate,
		updateStatusAsync: updateStatusMutation.mutateAsync,
		isUpdating: updateStatusMutation.isPending,
	}
}
