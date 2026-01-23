'use client'

import { routes } from "@/constants/routes"
import { cartCountAtom } from "@/stores"
import { Badge } from "antd"
import { useAtomValue } from "jotai"
import { ShoppingCart } from "lucide-react"

export function Cart() {
    const cartCount = useAtomValue(cartCountAtom);

    return <>
        <Badge count={cartCount} showZero size='small'>
            <ShoppingCart className='text-white' />
        </Badge>
        {routes.gioHang.title}
    </>
}
