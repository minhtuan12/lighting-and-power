"use client"

import { cartCountAtom } from "@/stores"
import { cartItemsAtom } from "@/stores"
import { useMe } from "@/hooks/use-me"
import { Badge } from "antd"
import { useAtomValue, useSetAtom } from "jotai"
import { ShoppingCart } from "lucide-react"
import { useEffect } from "react"

export default function Cart() {
    const cartCount = useAtomValue(cartCountAtom)
    const setCartItems = useSetAtom(cartItemsAtom)
    const { user } = useMe()

    useEffect(() => {
        if (!user?._id) return

        fetch('/api/cart')
            .then((response) => response.json())
            .then((data) => {
                if (data.success && data.data?.items) {
                    setCartItems(data.data.items)
                }
            })
            .catch(() => undefined)
    }, [user?._id, setCartItems])

    return (
        <>
            <Badge count={cartCount} showZero size="small">
                <ShoppingCart className="text-white" />
            </Badge>
        </>
    )
}
