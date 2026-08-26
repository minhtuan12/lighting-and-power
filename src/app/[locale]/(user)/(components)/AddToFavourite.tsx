'use client'
import { useAuth } from '@/hooks/use-me'
import { useFavourites } from '@/hooks/user/use-favourites'
import { loginModalAtom } from '@/stores/ui'
import { IProduct } from '@/types/product'
import { Tooltip } from 'antd'
import { useSetAtom } from 'jotai'
import { Heart } from 'lucide-react'
import { useTranslations } from 'next-intl'

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
    const setLoginOpen = useSetAtom(loginModalAtom)
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
    return <AddToFavouriteContent product={product} size={size} />
}
