'use client';

import JotaiProvider from "@/app/[locale]/(providers)/jotai-provider";
import QueryProvider from "@/app/[locale]/(providers)/query-provider";

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
