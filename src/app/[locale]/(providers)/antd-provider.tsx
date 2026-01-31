'use client';

import { themeComponents, themeToken } from '@/config/theme/color';
import { ConfigProvider, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { ReactNode, useEffect, useState } from 'react';

export default function AntdProvider({ children }: { children: ReactNode }) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        setIsDark(savedTheme === 'dark');
    }, []);

    return (
        <ConfigProvider
            locale={viVN}
            theme={{
                token: themeToken,
                components: themeComponents,
                algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
            }}
        >
            {children}
        </ConfigProvider>
    );
}
