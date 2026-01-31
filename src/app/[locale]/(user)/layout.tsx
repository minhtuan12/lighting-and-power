import GoToTopButton from "@/components/GoToTopButton";
import Loading from "@/components/Loading";
import { getCategories } from "@/fetch-data/categories";
import { getConfig } from "@/fetch-data/config";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import React, { Suspense } from "react";

const Header = dynamic(() => import("@/components/layout/Header"));
const Footer = dynamic(() => import("@/components/layout/Footer"));

export const metadata: Metadata = {
    title: "Lighting and Power",
    description: "Lighting and Power",
};

export default async function RootLayout(
    {
        children,
    }: Readonly<{
        children: React.ReactNode;
    }>
) {
    const [config, categories] = await Promise.all([getConfig(), getCategories()]);

    return (
        <main className="min-h-screen w-full">
            <Suspense fallback={<div className="w-full h-full"><Loading size="large" /></div>}>
                <Header config={config.data} categories={categories.data} />
                <div className="min-h-[calc(100vh-403px)] max-w-[1140px] mt-[174px] mx-auto mb-[100px]">
                    {children}
                </div>
                <Footer config={config.data} categories={categories.data} />
                <GoToTopButton />
            </Suspense>
        </main>
    );
}
