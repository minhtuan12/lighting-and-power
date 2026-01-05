import { message } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import { useEffect, useRef } from 'react';

let globalMessageApi: MessageInstance | null = null;

export const useMessage = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const isInitialized = useRef(false);

    useEffect(() => {
        if (!isInitialized.current) {
            globalMessageApi = messageApi;
            isInitialized.current = true;
        }
    }, [messageApi]);

    return {
        messageApi,
        contextHolder,
    };
};

// Standalone message functions that can be used without hooks
export const showMessage = {
    success: (content: string, duration?: number) => {
        if (globalMessageApi) {
            globalMessageApi.success(content, duration);
        } else {
            message.success(content, duration);
        }
    },
    error: (content: string, duration?: number) => {
        if (globalMessageApi) {
            globalMessageApi.error(content, duration);
        } else {
            message.error(content, duration);
        }
    },
    info: (content: string, duration?: number) => {
        if (globalMessageApi) {
            globalMessageApi.info(content, duration);
        } else {
            message.info(content, duration);
        }
    },
    warning: (content: string, duration?: number) => {
        if (globalMessageApi) {
            globalMessageApi.warning(content, duration);
        } else {
            message.warning(content, duration);
        }
    },
    loading: (content: string, duration?: number) => {
        if (globalMessageApi) {
            return globalMessageApi.loading(content, duration);
        } else {
            return message.loading(content, duration);
        }
    },
};
