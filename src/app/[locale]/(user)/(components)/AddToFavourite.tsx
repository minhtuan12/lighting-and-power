'use client'
import { useAuth } from '@/hooks/use-me'
import { useFavourites } from '@/hooks/user/use-favourites'
import { IProduct } from '@/types/product'
import { Tooltip } from 'antd'
import { Heart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import JotaiProvider from '../../(providers)/jotai-provider'
import QueryProvider from '../../(providers)/query-provider'
import LoginModal from './LoginModal'

function AddToFavouriteContent({
    product,
    size = 'small',
}: {
    product: IProduct
    size?: 'small' | 'large'
}) {
    const t = useTranslations('product')
    const { isAuthenticated } = useAuth()
    const { favouriteIds, toggleFavourite, isToggling } = useFavourites()
    const [loginOpen, setLoginOpen] = useState(false)
    const active = favouriteIds.includes(product._id)

    async function click() {
        if (!isAuthenticated) return setLoginOpen(true)
        await toggleFavourite({ productId: product._id, favourite: !active })
    }

    return (
        <>
            <Tooltip title={active ? t('removeFromFavourite') : t('addToFavourite')}>
                <Heart
                    onClick={click}
                    size={16}
                    className={`${active ? 'fill-[#ef5a22] !text-[#ef5a22]' : 'fill-white'} cursor-pointer text-white`}
                />
            </Tooltip>
            <LoginModal
                open={loginOpen}
                onClose={() => setLoginOpen(false)}
            />
        </>
    )
}

export default function AddToFavourite({
    product,
    size = 'small',
}: {
    product: IProduct
    size?: 'small' | 'large'
}) {
    return <JotaiProvider>
        <QueryProvider>
            <AddToFavouriteContent product={product} size={size} />
        </QueryProvider>
    </JotaiProvider>
}
