'use client'

import { Icon } from "@/components/Icon";
import { Flex } from "antd";
import { useTranslations } from "next-intl";

export default function RemainingStock({ stock }: { stock: number }) {
    const t = useTranslations();

    return <Flex align="center" gap={5} className="text-[12px]">
        {stock ? <Icon src="/images/green-tick.png" size={17} /> : '❌'}
        {
            stock ? <p>
                {t("product.remaining")}:{" "}
                {stock.toLocaleString("vi-VN")}
            </p> : <p>{t("product.outOfStock")}</p>
        }
    </Flex>
}
