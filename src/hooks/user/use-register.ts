import { fetchAPI } from "@/lib/api-client"
import { useMutation } from "@tanstack/react-query"

interface RegisterData {
    fullName: string
    email: string
    password: string
    phone?: string
}

interface RegisterResponse {
    success: boolean
    message: string
    data?: {
        user: {
            _id: string
            fullName: string
            email: string
            phone?: string
        }
        token: string
    }
}

const REGISTER_API_URL = "/auth/register"

// API function
const registerAPI = {
    register: (data: RegisterData): Promise<RegisterResponse> => {
        return fetchAPI(REGISTER_API_URL, {
            method: "POST",
            body: JSON.stringify(data),
        })
    },
}

// Hook
export function useRegister() {
    const registerMutation = useMutation({
        mutationFn: registerAPI.register,
    })

    return {
        // Actions
        register: registerMutation.mutate,
        registerAsync: registerMutation.mutateAsync,

        // States
        isRegistering: registerMutation.isPending,
        isSuccess: registerMutation.isSuccess,
        isError: registerMutation.isError,
        error: registerMutation.error,
        data: registerMutation.data,

        // Reset
        reset: registerMutation.reset,
    }
}
