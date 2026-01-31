'use client';

import AntdProvider from "../(providers)/antd-provider";
import JotaiProvider from "../(providers)/jotai-provider";
import QueryProvider from "../(providers)/query-provider";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <JotaiProvider>
            <QueryProvider>
                <AntdProvider>
                    {children}
                </AntdProvider>
            </QueryProvider>
        </JotaiProvider>
    );
}
