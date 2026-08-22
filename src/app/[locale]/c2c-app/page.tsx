'use client'

import { useEffect, useState } from "react"
import { Card, Tag, Button, Spin, Row, Col } from "antd"
import Link from "next/link"
import { Phone, User } from "lucide-react"
import { useTranslations } from "next-intl"

export default function C2CFeedPage() {
    const t = useTranslations('c2c')
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/c2c/products")
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setProducts(data.data.products)
                }
            })
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="text-center py-20"><Spin size="large" /></div>

    return (
        <div className="px-10">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{t('latestAds')}</h2>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-white rounded-lg shadow-sm">
                    {t('noProductsForSale')}
                </div>
            ) : (
                <Row gutter={[20, 20]}>
                    {products.map(product => (
                        <Col xs={24} sm={12} md={8} lg={6} key={product._id}>
                            <Link href={`/san-pham/${product._id}`}>
                                <Card
                                    hoverable
                                    cover={
                                        <div className="h-48 overflow-hidden bg-gray-100 flex items-center justify-center">
                                            {product.images && product.images[0] ? (
                                                <img alt={product.title} src={product.images[0]} className="object-cover w-full h-full" />
                                            ) : (
                                                <span className="text-gray-400">{t('noImage')}</span>
                                            )}
                                        </div>
                                    }
                                    className="h-full overflow-hidden"
                                    styles={{ body: { padding: 16 } }}
                                >
                                    <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 min-h-[44px]">
                                        {product.title}
                                    </h3>
                                    <div className="text-red-600 font-bold text-lg mb-2">
                                        {product.price.toLocaleString('vi-VN')} đ
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                                        <Tag color={product.condition === 'new' ? 'green' : product.condition === 'like_new' ? 'blue' : 'orange'}>
                                            {product.condition === 'new' ? t('new') : product.condition === 'like_new' ? t('likeNew') : t('old')}
                                        </Tag>
                                        <span>{new Date(product.createdAt).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 border-t pt-3 mt-1">
                                        <User size={14} />
                                        <span className="truncate">{product.seller?.fullName}</span>
                                    </div>
                                </Card>
                            </Link>
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    )
}
