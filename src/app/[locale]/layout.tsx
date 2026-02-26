import { routing } from "@/i18n/routing"
import { AntdRegistry } from "@ant-design/nextjs-registry"
import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { Inter } from "next/font/google"
import { notFound } from "next/navigation"
import "../globals.css"

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    weight: ["400", "500", "600", "700"],
    display: "swap",
})

export const metadata: Metadata = {
    title: "Lighting & Power",
    description: "Lighting & Power",
}

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }))
}

export default async function RootLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode
    params: Promise<{ locale: string }>
}>) {
    const { locale } = await params

    if (!routing.locales.includes(locale as any)) {
        notFound()
    }

    const messages = await getMessages()
    return (
        <html lang={locale} suppressHydrationWarning className="page">
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
                <NextIntlClientProvider messages={messages}>
                    <AntdRegistry>{children}</AntdRegistry>
                </NextIntlClientProvider>
            </body>
        </html>
    )
}
