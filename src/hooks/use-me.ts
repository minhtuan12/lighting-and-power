import { routes } from "@/constants/routes"
import { fetchAPI } from "@/lib/api-client"
import { EUserRole, IUser } from "@/types/user"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { showMessage } from "./use-message"

export interface LoginCredentials {
    emailOrPhone: string
    password: string
    role: EUserRole
}

export interface LoginResponse {
    data: IUser
}

export interface UpdateProfileData {
    username?: string
    avatar?: string
    email?: string
    phone?: string
    fullName?: string
    address?: {
        provinceCode?: number
        wardCode?: number
        detail?: string
        isDefault?: boolean
    }
}

export interface UpdateProfileResponse {
    success: boolean
    data?: IUser
    message?: string
}

// ============= QUERY KEYS =============
const AUTH_KEYS = {
    me: ["auth", "me"] as const,
    user: ["auth", "user"] as const,
}

// ============= API FUNCTIONS =============
const authAPI = {
    login: (credentials: LoginCredentials): Promise<LoginResponse> => {
        return fetchAPI("/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        })
    },

    logout: (): Promise<void> => {
        return fetchAPI("/auth/logout", {
            method: "POST",
        })
    },

    getMe: (): Promise<LoginResponse> => {
        return fetchAPI("/auth/me")
    },

    refreshToken: (refreshToken: string): Promise<LoginResponse> => {
        return fetchAPI("/auth/refresh", {
            method: "POST",
            body: JSON.stringify({ refreshToken }),
        })
    },
}

// ============= useLogin Hook =============
export function useLogin() {
    const queryClient = useQueryClient()

    const loginMutation = useMutation({
        mutationFn: authAPI.login,
        onSuccess: (data) => {
            // Cache user data
            queryClient.setQueryData(AUTH_KEYS.me, data)

            // Invalidate để refetch nếu cần
            queryClient.invalidateQueries({ queryKey: AUTH_KEYS.me })
            return data;
        },
        onError: (error: Error) => {
            console.error("Login failed:", error.message)

            // Clear user cache
            queryClient.setQueryData(AUTH_KEYS.me, null)
        },
    })

    return {
        login: loginMutation.mutate,
        loginAsync: loginMutation.mutateAsync,
        isLoading: loginMutation.isPending,
        isSuccess: loginMutation.isSuccess,
        isError: loginMutation.isError,
        error: loginMutation.error,
        data: loginMutation.data,
    }
}

// ============= useLogout Hook =============
export function useLogout() {
    const queryClient = useQueryClient()
    const router = useRouter()

    const logoutMutation = useMutation({
        mutationFn: authAPI.logout,
        onSuccess: () => {
            // Clear all cached data
            queryClient.clear()

            // Reset user data
            queryClient.setQueryData(AUTH_KEYS.me, null)

            // Redirect to login
            router.push(routes.trangChu.url)
            router.refresh() // Refresh để server components update
        },
        onError: (error: Error) => {
            console.error("Logout failed:", error.message)

            // Vẫn clear cache dù API fail
            queryClient.setQueryData(AUTH_KEYS.me, null)
            queryClient.clear()

            // Redirect anyway
            router.push(routes.trangChu.url)
            router.refresh()
        },
    })

    return {
        logout: logoutMutation.mutate,
        logoutAsync: logoutMutation.mutateAsync,
        isLoading: logoutMutation.isPending,
    }
}

// ============= useMe Hook =============
export function useMe() {
    const queryClient = useQueryClient()

    const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
        queryKey: AUTH_KEYS.me,
        queryFn: authAPI.getMe,
        retry: false, // Không retry nếu fail
        staleTime: 5 * 60 * 1000, // 5 phút
        gcTime: 10 * 60 * 1000, // 10 phút
    })

    // ✅ Check authentication dựa trên user data
    const isAuthenticated = !!data?.data

    // Manual logout function (không call API)
    const clearUser = () => {
        queryClient.setQueryData(AUTH_KEYS.me, null)
        queryClient.clear()
    }

    return {
        user: data?.data,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
        isAuthenticated,
        clearUser,
    }
}

// ============= useAuth Hook (Combined) =============
export function useAuth() {
    const {
        login,
        loginAsync,
        isLoading: isLoginLoading,
        error: loginError,
        data: loginData,
    } = useLogin()
    const { logout, logoutAsync, isLoading: isLogoutLoading } = useLogout()
    const {
        user,
        isLoading: isMeLoading,
        isAuthenticated,
        refetch: refetchMe,
        clearUser,
    } = useMe()

    return {
        // User data
        user,
        isAuthenticated,
        isAdmin: user?.role === EUserRole.admin,

        // Login
        login,
        loginAsync,
        isLoginLoading,
        loginError,
        loginData,

        // Logout
        logout,
        logoutAsync,
        isLogoutLoading,

        // Utils
        isLoading: isLoginLoading || isLogoutLoading || isMeLoading,
        refetchMe,
        clearUser,
    }
}


// ============= API FUNCTION =============
const profileAPI = {
    updateProfile: (data: UpdateProfileData): Promise<UpdateProfileResponse> => {
        return fetchAPI("/profile", {
            method: "PATCH",
            body: JSON.stringify(data),
        })
    },
    changePassword: async (data: {
        oldPassword: string
        newPassword: string
    }) => {
        return fetchAPI("/auth/change-password", {
            method: "POST",
            body: JSON.stringify(data),
        })
    },
}

// ============= useUpdateProfile Hook =============
export function useUpdateProfile() {
    const queryClient = useQueryClient()
    const t = useTranslations()
    const router = useRouter()

    const updateProfileMutation = useMutation({
        mutationFn: profileAPI.updateProfile,
        onSuccess: async (response) => {
            if (response.success) {
                queryClient.setQueryData(AUTH_KEYS.me, {
                    data: response.data,
                })

                queryClient.invalidateQueries({ queryKey: AUTH_KEYS.me })
                router.refresh()
                showMessage.success(t('form.updateSuccess') || 'Cập nhật thành công')
            } else {
                showMessage.error(response.message || t('form.updateFailed') || 'Cập nhật thất bại')
            }
        },
        onError: (error: any) => {
            console.error("Update profile failed:", error)
            const errorMessage = error?.message || t('form.updateFailed') || 'Cập nhật thất bại'
            showMessage.error(errorMessage)
        },
    })

    return {
        updateProfile: updateProfileMutation.mutate,
        updateProfileAsync: updateProfileMutation.mutateAsync,
        isLoading: updateProfileMutation.isPending,
        isSuccess: updateProfileMutation.isSuccess,
        isError: updateProfileMutation.isError,
        error: updateProfileMutation.error,
        data: updateProfileMutation.data,
    }
}

// ============= useChangePassword Hook =============
export function useChangePassword() {
    const queryClient = useQueryClient()
    const t = useTranslations()
    const router = useRouter()
    const { logoutAsync } = useLogout()

    const changePasswordMutation = useMutation({
        mutationFn: profileAPI.changePassword,
        onSuccess: async (response) => {
            if (response.success) {
                showMessage.success(t('form.changePasswordSuccess') || 'Đổi mật khẩu thành công')
                await logoutAsync();
                queryClient.clear()
                router.refresh()
                router.push(routes.dangNhap.url)
            } else {
                showMessage.error(response.message || t('form.changePasswordFailed') || 'Đổi mật khẩu thất bại')
            }
        },
        onError: (error: any) => {
            console.error("Change password failed:", error)
            const errorMessage = error?.message || t('form.changePasswordFailed') || 'Đổi mật khẩu thất bại'
            showMessage.error(errorMessage)
        },
    })

    return {
        changePassword: changePasswordMutation.mutate,
        changePasswordAsync: changePasswordMutation.mutateAsync,
        isLoading: changePasswordMutation.isPending,
        isSuccess: changePasswordMutation.isSuccess,
        isError: changePasswordMutation.isError,
        error: changePasswordMutation.error,
        data: changePasswordMutation.data,
    }
}
