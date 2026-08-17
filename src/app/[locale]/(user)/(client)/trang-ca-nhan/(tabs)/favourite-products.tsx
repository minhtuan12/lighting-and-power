'use client'

import ProductItem from '@/app/[locale]/(user)/(components)/ProductItem'
import Loading from '@/components/Loading'
import { useFavourites } from '@/hooks/user/use-favourites'
import { fetchAPI } from '@/lib/api-client'
import { IProduct } from '@/types/product'
import { useQuery } from '@tanstack/react-query'
import { Col, Empty, Row } from 'antd'
import { useTranslations } from 'next-intl'

export default function FavouriteProductsTab() {
    const t = useTranslations('profile')
    const { favouriteIds, isLoading: isFavouritesLoading } = useFavourites()
    const { data: products = [], isLoading: isProductsLoading } = useQuery({
        queryKey: ['favourite-products', favouriteIds],
        enabled: !isFavouritesLoading,
        queryFn: async () => {
            const results = await Promise.all(
                favouriteIds.map(async (id) => {
                    const response = await fetchAPI(`/products/${id}`)
                    return response.data.product as IProduct | null
                }),
            )
            return results.filter((product): product is IProduct => !!product)
        },
    })

    if (isFavouritesLoading || isProductsLoading) return <Loading />
    if (!products.length) return <Empty description={t('noFavourites')} />

    return (
        <Row
            gutter={16}
        >
            {products.map((product) => (
                <Col
                    key={product._id}
                    span={8}
                    xs={24}
                    sm={12}
                    md={8}
                    lg={6}
                >
                    <ProductItem item={product} enableAddToCart />
                </Col>
            ))}
        </Row>
    )
}
