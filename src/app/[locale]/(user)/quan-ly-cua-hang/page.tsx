"use client"

import { routes } from "@/constants/routes"
import { Card, Flex, Typography } from "antd"
import Link from "next/link"

const { Title, Text } = Typography

export default function BoothHomePage() {
    return (
        <Card>
            <Flex vertical gap={12}>
                <Title level={4} style={{ marginBottom: 0 }}>
                    Quản lý cửa hàng
                </Title>
                <Text type="secondary">
                    Quản lý danh mục và sản phẩm của riêng cửa hàng của bạn.
                </Text>
                <Flex gap={16}>
                    <Link href={routes.boothCategory.url}>Danh mục</Link>
                    <Link href={routes.boothProduct.url}>Sản phẩm</Link>
                </Flex>
            </Flex>
        </Card>
    )
}
