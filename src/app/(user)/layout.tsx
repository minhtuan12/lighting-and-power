import GoToTopButton from "@/components/GoToTopButton";
import { ICategory } from "@/types/category";
import { IConfig } from "@/types/config";
import { Space } from "antd";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import React from "react";
import "../globals.css";

const Header = dynamic(() => import("@/components/layout/Header"));
const Footer = dynamic(() => import("@/components/layout/Footer"));

export const metadata: Metadata = {
    title: "Lighting and Power",
    description: "Lighting and Power",
};

interface IConfigResponse {
    success: boolean;
    data: IConfig;
}

interface ICategoryResponse {
    success: boolean;
    data: ICategory[];
}

async function getCategories(): Promise<ICategoryResponse> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
            next: {
                revalidate: 3600 * 3 // Cache for 3 hour
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch categories');
        }

        return res.json();
    } catch (error) {
        console.error('Error fetching categories:', error);

        // Fallback data
        return {
            success: false,
            data: [],
        };
    }
}

async function getConfig(): Promise<IConfigResponse> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/config`, {
            next: {
                revalidate: 3600 * 12 // Cache for 12 hour
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch footer data');
        }

        return res.json();
    } catch (error) {
        console.error('Error fetching footer data:', error);

        // Fallback data
        return {
            success: false,
            data: {
                companyName: 'TIỆM ĐIỆN TỬ L&P',
                address: '2/4A Tổ 10, KP.Bình Thuận, P.Lái Thiêu, TP.Thuận An, Bình Dương',
                email: 'thanhphuysvccd2@gmail.com',
                hotline: '0853 887 855',
                social: {}
            }
        };
    }
}

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
            <Header config={config.data} categories={categories.data} />
            <Space className="min-h-[calc(100vh-403px)] max-w-[1140px]">
                {children}
            </Space>
            <Footer config={config.data} categories={categories.data} />
            <GoToTopButton />
        </main>
    );
}
