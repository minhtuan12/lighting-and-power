"use client"

import { ProtectedRoute } from "@/components/ProtectedRoute"
import { routes } from "@/constants/routes"
import { breadcrumbAtom } from "@/stores/ui"
import { Breadcrumb, Layout, Menu, theme } from "antd"
import { useAtomValue } from "jotai"
import { AlignStartVertical, Store } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React from "react"

const { Header, Sider, Content } = Layout

const menu = [
    {
        icon: <AlignStartVertical size={20} />,
        label: (
            <Link href={routes.boothCategory.url}>
                {routes.boothCategory.title}
            </Link>
        ),
        url: routes.boothCategory.url,
        key: routes.boothCategory.url,
    },
    {
        icon: <Store size={20} />,
        label: (
            <Link href={routes.boothProduct.url}>
                {routes.boothProduct.title}
            </Link>
        ),
        url: routes.boothProduct.url,
        key: routes.boothProduct.url,
    },
]

export default function BoothLayoutClient({
    children,
}: {
    children: React.ReactNode
}) {
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken()
    const breadcrumb = useAtomValue(breadcrumbAtom)
    const pathname = usePathname()

    const pathnameParts = pathname.split("/").filter(Boolean)
    const selectedKey = menu.find((item) => {
        const keyParts = item.key.split("/").filter(Boolean)
        return (
            pathnameParts.length >= keyParts.length &&
            keyParts.every((part, index) => part === pathnameParts[index])
        )
    })?.url

    return (
        <ProtectedRoute>
            <Layout className="h-screen w-screen">
                <Sider theme="dark" width={250}>
                    <div className="text-white font-semibold px-6 py-6 text-lg">
                        Quản lý cửa hàng
                    </div>
                    <Menu
                        theme="dark"
                        mode="inline"
                        items={menu as any}
                        selectedKeys={selectedKey ? [selectedKey] : []}
                    />
                </Sider>
                <Layout>
                    <Header
                        style={{ padding: 0, background: colorBgContainer }}
                        className="flex items-center !px-5"
                    >
                        <Breadcrumb
                            items={breadcrumb}
                            className="custom-breadcrumb"
                        />
                    </Header>
                    <Content
                        style={{
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                        }}
                        className="flex-1"
                    >
                        <div className="p-6 bg-gray-50 max-h-full overflow-auto !h-full">
                            {children}
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </ProtectedRoute>
    )
}
