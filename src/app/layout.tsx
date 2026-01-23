import { AntdRegistry } from '@ant-design/nextjs-registry';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "Lighting & Power",
    description: "Lighting & Power",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://cdn.jsdelivr.net" />
                <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
                <link
                    rel="preload"
                    href="https://cdn.jsdelivr.net/npm/antd@5/dist/reset.css"
                    as="style"
                />
            </head>
            <body
                suppressHydrationWarning
                className={`${inter.className} ${inter.variable} antialiased`}
            >
                <AntdRegistry>{children}</AntdRegistry>
            </body>
        </html>
    );
}
