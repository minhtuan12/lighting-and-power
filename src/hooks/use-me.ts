import { routes } from '@/constants/routes';
import { fetchAPI } from '@/lib/api-client';
import { EUserRole, IUser } from '@/types/user';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export interface LoginCredentials {
    emailOrPhone: string;
    password: string;
}

export interface LoginResponse {
    data: IUser;
}

// ============= QUERY KEYS =============
const AUTH_KEYS = {
    me: ['auth', 'me'] as const,
    user: ['auth', 'user'] as const,
};

// ============= API FUNCTIONS =============
const authAPI = {
    login: (credentials: LoginCredentials): Promise<LoginResponse> => {
        return fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    },

    logout: (): Promise<void> => {
        return fetchAPI('/auth/logout', {
            method: 'POST',
        });
    },

    getMe: (): Promise<LoginResponse> => {
        return fetchAPI('/auth/me');
    },

    refreshToken: (refreshToken: string): Promise<LoginResponse> => {
        return fetchAPI('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
        });
    },
};

// ============= useLogin Hook =============
export function useLogin() {
    const queryClient = useQueryClient();

    const loginMutation = useMutation({
        mutationFn: authAPI.login,
        onSuccess: (data) => {
            // Cache user data
            queryClient.setQueryData(AUTH_KEYS.me, data);

            // Invalidate để refetch nếu cần
            queryClient.invalidateQueries({ queryKey: AUTH_KEYS.me });
        },
        onError: (error: Error) => {
            console.error('Login failed:', error.message);

            // Clear user cache
            queryClient.setQueryData(AUTH_KEYS.me, null);
        },
    });

    return {
        login: loginMutation.mutate,
        loginAsync: loginMutation.mutateAsync,
        isLoading: loginMutation.isPending,
        isSuccess: loginMutation.isSuccess,
        isError: loginMutation.isError,
        error: loginMutation.error,
        data: loginMutation.data,
    };
}

// ============= useLogout Hook =============
export function useLogout() {
    const queryClient = useQueryClient();
    const router = useRouter();

    const logoutMutation = useMutation({
        mutationFn: authAPI.logout,
        onSuccess: () => {
            // Clear all cached data
            queryClient.clear();

            // Reset user data
            queryClient.setQueryData(AUTH_KEYS.me, null);

            // Redirect to login
            router.push(routes.dangNhap.url);
            router.refresh(); // Refresh để server components update
        },
        onError: (error: Error) => {
            console.error('Logout failed:', error.message);

            // Vẫn clear cache dù API fail
            queryClient.setQueryData(AUTH_KEYS.me, null);
            queryClient.clear();

            // Redirect anyway
            router.push(routes.dangNhap.url);
            router.refresh();
        },
    });

    return {
        logout: logoutMutation.mutate,
        logoutAsync: logoutMutation.mutateAsync,
        isLoading: logoutMutation.isPending,
    };
}

// ============= useMe Hook =============
export function useMe() {
    const queryClient = useQueryClient();

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
    } = useQuery({
        queryKey: AUTH_KEYS.me,
        queryFn: authAPI.getMe,
        retry: false, // Không retry nếu fail
        staleTime: 5 * 60 * 1000, // 5 phút
        gcTime: 10 * 60 * 1000, // 10 phút
    });

    // ✅ Check authentication dựa trên user data
    const isAuthenticated = !!data?.data;

    // Manual logout function (không call API)
    const clearUser = () => {
        queryClient.setQueryData(AUTH_KEYS.me, null);
        queryClient.clear();
    };

    return {
        user: data?.data,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
        isAuthenticated,
        clearUser,
    };
}

// ============= useAuth Hook (Combined) =============
export function useAuth() {
    const { login, loginAsync, isLoading: isLoginLoading, error: loginError, data: loginData } = useLogin();
    const { logout, logoutAsync, isLoading: isLogoutLoading } = useLogout();
    const {
        user,
        isLoading: isMeLoading,
        isAuthenticated,
        refetch: refetchMe,
        clearUser,
    } = useMe();

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
    };
}
