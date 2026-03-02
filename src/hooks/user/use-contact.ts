import { fetchAPI } from "@/lib/api-client"
import { useMutation } from "@tanstack/react-query"

interface ContactData {
	fullName: string
	emailOrPhone: string
	subject: string
	content: string
}

interface ContactResponse {
	success: boolean
	message: string
	data?: {
		fullName: string
		subject: string
		status: string
		createdAt: string
	}
}

const CONTACT_API_URL = "/contact-us"

// API function
const contactAPI = {
	send: (data: ContactData): Promise<ContactResponse> => {
		return fetchAPI(CONTACT_API_URL, {
			method: "POST",
			body: JSON.stringify(data),
		})
	},
}

// Hook
export function useContact() {
	const contactMutation = useMutation({
		mutationFn: contactAPI.send,
	})

	return {
		// Actions
		sendContact: contactMutation.mutate,
		sendContactAsync: contactMutation.mutateAsync,

		// States
		isSending: contactMutation.isPending,
		isSuccess: contactMutation.isSuccess,
		isError: contactMutation.isError,
		error: contactMutation.error,
		data: contactMutation.data,

		// Reset
		reset: contactMutation.reset,
	}
}
