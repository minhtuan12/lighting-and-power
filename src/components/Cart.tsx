'use client'

import { routes } from "@/constants/routes"
import { cartCountAtom } from "@/stores"
import { Badge } from "antd"
import { useAtomValue } from "jotai"
import { ShoppingCart } from "lucide-react"
import { useTranslations } from "next-intl"

export default function Cart() {
    const t = useTranslations('common');
    const cartCount = useAtomValue(cartCountAtom);

    return <>
        <Badge count={cartCount} showZero size='small'>
            <ShoppingCart className='text-white' />
        </Badge>
        {t(routes.gioHang.key)}
    </>
}
