import { getCategories } from "@/fetch-data/categories"
import { getConfig } from "@/fetch-data/config"
import dynamic from "next/dynamic"
import React, { Suspense } from "react"
import { Flex } from "antd"
import Loading from "@/components/Loading"
import MessengerBubble from "@/components/MessengerBubble"
import "@/styles/theme-c2c.css"

const Header = dynamic(() => import("@/components/layout/Header"))

export default async function C2CLayout({ children }: { children: React.ReactNode }) {
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
            <div className="min-h-screen bg-gray-50 flex flex-col theme-c2c">
                <Header config={config.data} categories={categories.data} />
                <main className="flex-1 w-full max-w-[1200px] mx-auto py-8 px-4 lg:px-0 lg:mt-[174px] mt-[60px]">
                    {children}
                </main>
                <MessengerBubble />
            </div>
        </Suspense>
    )
}
