"use client"

import QueryProvider from "@/app/[locale]/(providers)/query-provider"
import { safeLocalStorage } from "@/lib/utils"
import { use, useEffect } from "react"

export default function ClientLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = use(params)

    useEffect(() => {
        safeLocalStorage.setItem("locale", locale)
        safeLocalStorage.setItem("currency", "VND")
    }, [])

    return (
        <QueryProvider>{children}</QueryProvider>
    )
}
