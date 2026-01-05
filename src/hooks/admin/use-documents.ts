import { fetchAPI } from '@/lib/api-client';
import { IDocument } from '@/types/document';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const DOCUMENT_API_URL = '/admin/documents';

// Query keys
const DOCUMENT_KEYS = {
    all: ['documents'] as const,
    lists: () => [...DOCUMENT_KEYS.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...DOCUMENT_KEYS.lists(), filters] as const,
    details: () => [...DOCUMENT_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...DOCUMENT_KEYS.details(), id] as const,
};

// API functions
const documentAPI = {
    getAll: (params?: Record<string, any>) => {
        const queryString = params ? `?${new URLSearchParams(
            Object.entries(params).reduce((acc, [key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    acc[key] = Array.isArray(value) ? value.join(',') : String(value);
                }
                return acc;
            }, {} as Record<string, string>)
        ).toString()}` : '';
        return fetchAPI(`${DOCUMENT_API_URL}${queryString}`);
    },

    getById: (id: string) => {
        return fetchAPI(`${DOCUMENT_API_URL}/${id}`);
    },

    create: (data: Omit<IDocument, '_id'>) => {
        return fetchAPI(DOCUMENT_API_URL, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: (id: string, data: Partial<IDocument>) => {
        return fetchAPI(`${DOCUMENT_API_URL}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: (id: string) => {
        return fetchAPI(`${DOCUMENT_API_URL}/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
    },

    uploadFile: (file: File, folder: string = 'lightingpower') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        return fetchAPI('/api/upload/document', {
            method: 'POST',
            body: formData,
        });
    },
};

// Hook
export function useDocuments(params?: Record<string, any>) {
    const queryClient = useQueryClient();

    const {
        data: documents,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: DOCUMENT_KEYS.list(params),
        queryFn: () => documentAPI.getAll(params),
    });

    // CREATE document
    const createMutation = useMutation({
        mutationFn: (data: Omit<IDocument, '_id'>) =>
            documentAPI.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.lists() });
        },
    });

    // UPDATE document
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<IDocument> }) =>
            documentAPI.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.detail(variables.id) });
        },
    });

    // DELETE document
    const deleteMutation = useMutation({
        mutationFn: (id: string) => documentAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DOCUMENT_KEYS.lists() });
        },
    });

    // UPLOAD file
    const uploadFileMutation = useMutation({
        mutationFn: ({ file, folder }: { file: File; folder?: string }) =>
            documentAPI.uploadFile(file, folder),
    });

    return {
        // Data
        documents: documents?.data,
        isLoading,
        error,
        refetch,

        // Create
        createDocument: createMutation.mutate,
        createDocumentAsync: createMutation.mutateAsync,
        isCreating: createMutation.isPending,

        // Update
        updateDocument: updateMutation.mutate,
        updateDocumentAsync: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,

        // Delete
        deleteDocument: deleteMutation.mutate,
        deleteDocumentAsync: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,

        // Upload
        uploadFile: uploadFileMutation.mutate,
        uploadFileAsync: uploadFileMutation.mutateAsync,
        isUploading: uploadFileMutation.isPending,
    };
}
