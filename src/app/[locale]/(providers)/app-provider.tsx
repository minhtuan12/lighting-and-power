"use client"

import { ReactNode } from "react"
import JotaiProvider from "./jotai-provider"
import QueryProvider from "./query-provider"

export default function AppProvider({ children }: { children: ReactNode }) {
    return (
        <QueryProvider>
            <JotaiProvider>
                {children}
            </JotaiProvider>
        </QueryProvider>
    )
}
