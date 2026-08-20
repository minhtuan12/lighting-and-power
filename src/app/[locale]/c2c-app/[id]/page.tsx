'use client'

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Spin, Button, Tag, Divider, Avatar } from "antd"
import { Phone, User } from "lucide-react"
import { useTranslations } from "next-intl"
import RichTextContent from "@/components/RichTextContent"

export default function ProductDetailPage() {
    const t = useTranslations('c2c')
    const params = useParams()
    const id = params?.id
    const [product, setProduct] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showContact, setShowContact] = useState(false)

    useEffect(() => {
        if (!id) return
        fetch(`/api/c2c/products/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setProduct(data.data)
            })
            .finally(() => setLoading(false))
    }, [id])

    if (loading) return <div className="text-center py-20"><Spin size="large" /></div>
    if (!product) return <div className="text-center py-20 text-red-500">{t('productNotFound')}</div>

    return (
        <div className="bg-white rounded-lg p-6 shadow-sm max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <div className="bg-gray-100 aspect-square flex items-center justify-center rounded-lg overflow-hidden mb-4">
                        {product.images && product.images[0] ? (
                            <img src={product.images[0]} alt={product.title} className="object-cover w-full h-full" />
                        ) : (
                            <span className="text-gray-400">{t('noImage')}</span>
                        )}
                    </div>
                    {product.images && product.images.length > 1 && (
                        <div className="flex gap-2">
                            {product.images.map((img: string, i: number) => (
                                <div key={i} className="w-20 h-20 bg-gray-100 border rounded cursor-pointer">
                                    <img src={img} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h1 className="text-2xl font-bold mb-4">{product.title}</h1>
                    <div className="text-3xl font-bold text-red-600 mb-4">
                        {product.price.toLocaleString('vi-VN')} đ
                    </div>

                    <div className="mb-6 flex gap-4">
                        <Tag color={product.condition === 'new' ? 'green' : product.condition === 'like_new' ? 'blue' : 'orange'} className="text-sm px-3 py-1">
                            {product.condition === 'new' ? t('conditionNew') : product.condition === 'like_new' ? t('conditionLikeNew') : t('conditionUsed')}
                        </Tag>
                        <span className="text-gray-500 text-sm flex items-center">
                            {t('postDate', { date: new Date(product.createdAt).toLocaleDateString('vi-VN') })}
                        </span>
                    </div>

                    <Divider />

                    <div className="flex items-center gap-4 mb-6">
                        <Avatar size="large" src={product.seller?.avatar} icon={<User />} />
                        <div>
                            <div className="font-bold text-lg">{product.seller?.fullName}</div>
                            <div className="text-gray-500 text-sm">{t('c2cMember')}</div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                        <Button
                            type="primary"
                            className="w-full flex items-center justify-center gap-2 font-bold text-lg h-12 transition-colors"
                            onClick={() => setShowContact(true)}
                        >
                            <Phone />
                            {showContact ? product.contactInfo : t('clickToShowPhone')}
                        </Button>
                        <div className="text-center text-xs text-gray-500 mt-2">
                            {t('contactSellerDirectly')}
                        </div>
                    </div>

                    <Divider />

                    <div>
                        <h3 className="font-bold text-lg mb-2">{t('descriptionDetail')}</h3>
                        <div className="whitespace-pre-wrap text-gray-700">
                            {product.description ? <RichTextContent html={product.description} /> : t('noDescription')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
