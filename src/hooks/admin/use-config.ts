import { fetchAPI } from '@/lib/api-client';
import { IConfig } from '@/types/config';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const SETTING_API_URL = '/admin/config';

// Query keys
const SETTING_KEYS = {
    all: ['settings'] as const,
    lists: () => [...SETTING_KEYS.all, 'list'] as const,
    list: () => [...SETTING_KEYS.lists()] as const,
};

// API functions
const settingAPI = {
    get: () => {
        return fetchAPI(SETTING_API_URL);
    },

    update: (data: Partial<IConfig>) => {
        return fetchAPI(`${SETTING_API_URL}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
};

// Hook
export function useConfig() {
    const queryClient = useQueryClient();

    const {
        data,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: SETTING_KEYS.list(),
        queryFn: () => settingAPI.get(),
    });

    // UPDATE setting
    const updateMutation = useMutation({
        mutationFn: ({ data }: { data: Partial<IConfig> }) =>
            settingAPI.update(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: SETTING_KEYS.lists() });
        },
    });

    return {
        // Data
        config: data?.data,
        isLoading,
        error,
        refetch,

        // Update
        updateConfig: updateMutation.mutate,
        updateConfigAsync: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
    };
}
