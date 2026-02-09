"use client"

import Loading from "@/components/Loading"
import { useCart } from "@/hooks/user/use-cart"
import { Flex, Input, Space } from "antd"
import { useTranslations } from "next-intl"
import { Suspense } from "react"

export default function GioHang() {
    const { cart } = useCart()
    const t = useTranslations();

    return <Suspense fallback={<Loading />}>
        <Space className="mt-5">
            <Flex vertical gap={40}>
                <Input placeholder={t('common.shipAddress')} />
                
            </Flex>
        </Space>
    </Suspense>
}
