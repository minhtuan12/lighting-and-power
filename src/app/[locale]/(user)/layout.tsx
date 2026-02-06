import GoToTopButton from "@/components/GoToTopButton"
import Loading from "@/components/Loading"
import { getCategories } from "@/fetch-data/categories"
import { getConfig } from "@/fetch-data/config"
import { Flex } from "antd"
import type { Metadata } from "next"
import dynamic from "next/dynamic"
import React, { Suspense } from "react"

const Header = dynamic(() => import("@/components/layout/Header"))
const Footer = dynamic(() => import("@/components/layout/Footer"))

export const metadata: Metadata = {
    title: "Lighting and Power",
    description: "Lighting and Power",
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const [config, categories] = await Promise.all([
        getConfig(),
        getCategories(),
    ])

    return (
        <Suspense
            fallback={
                <Flex
                    className="w-screen h-screen"
                    align="center"
                    justify="center"
                >
                    <Loading size="large" />
                </Flex>
            }
        >
            <main className="min-h-screen w-full">
                <Header config={config.data} categories={categories.data} />
                <div className="min-h-[calc(100vh-403px)] max-w-[1140px] mt-[174px] mx-auto py-5">
                    {children}
                </div>
                <Footer config={config.data} categories={categories.data} />
                <GoToTopButton />
            </main>
        </Suspense>
    )
}
