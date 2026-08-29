import GoToTopButton from "@/components/GoToTopButton"
import Loading from "@/components/Loading"
import MessengerBubble from "@/components/chat/MessengerBubble"
import Footer from "@/components/layout/Footer"
import { getCategories } from "@/fetch-data/categories"
import { getConfig } from "@/fetch-data/config"
import "@/styles/theme-c2c.css"
import { Flex } from "antd"
import dynamic from "next/dynamic"
import React, { Suspense } from "react"

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
                <main className="flex-1 w-full max-w-[1140px] mx-auto pt-5 pb-30 lg:px-0 lg:mt-[149px] mt-[60px] max-md:px-3">
                    {children}
                </main>
                <Footer config={config.data} categories={categories.data} />
                <GoToTopButton />
                <MessengerBubble />
            </div>
        </Suspense>
    )
}
