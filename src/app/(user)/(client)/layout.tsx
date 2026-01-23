'use client';

import JotaiProvider from "@/app/(providers)/jotai-provider";
import QueryProvider from "@/app/(providers)/query-provider";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <JotaiProvider>
            <QueryProvider>
                {children}
            </QueryProvider>
        </JotaiProvider>
    );
}
