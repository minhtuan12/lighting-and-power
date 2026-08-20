'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Spin, Button, Form, Input, Divider, message, Result } from "antd"
import { ShoppingCart, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"

export default function CheckoutPage() {
    const t = useTranslations('c2c')
    const params = useParams()
    const router = useRouter()
    const id = params?.id
    const [product, setProduct] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [form] = Form.useForm()

    useEffect(() => {
        if (!id) return
        fetch(`/api/c2c/products/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setProduct(data.data)
            })
            .finally(() => setLoading(false))
    }, [id])

    const onFinish = async (values: any) => {
        if (!product || product.status !== 'active') {
            message.error(t('productNotFound'))
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch('/api/c2c/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product._id,
                    ...values
                })
            })
            
            const data = await res.json()
            if (!res.ok) {
                message.error(data.error || t('errorOccurred'))
                setSubmitting(false)
                return
            }

            message.loading(t('payosProcessing'), 2)
            // Redirect to PayOS checkout page
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl
            }
        } catch (error) {
            console.error("Checkout error:", error)
            message.error(t('errorOccurred'))
            setSubmitting(false)
        }
    }

    if (loading) return <div className="text-center py-20"><Spin size="large" /></div>
    if (!product || product.status !== 'active') return (
        <Result 
            status="warning" 
            title={t('productNotFound')} 
            extra={<Button type="primary" onClick={() => router.push('/c2c-app')}>{t('backToShop')}</Button>}
        />
    )

    return (
        <div className="bg-white rounded-lg p-6 shadow-sm max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <ShoppingCart /> {t('checkout')}
            </h1>

            <div className="flex gap-4 mb-6 border p-4 rounded-lg bg-gray-50">
                <div className="w-24 h-24 bg-white rounded flex-shrink-0 border flex items-center justify-center overflow-hidden">
                    {product.images && product.images[0] ? (
                        <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-xs text-gray-400">{t('noImage')}</span>
                    )}
                </div>
                <div>
                    <h3 className="font-bold text-lg">{product.title}</h3>
                    <div className="text-xl font-bold text-red-600 mt-2">
                        {product.price.toLocaleString('vi-VN')} đ
                    </div>
                </div>
            </div>

            <Divider />

            <div className="mb-4">
                <h3 className="font-bold text-lg mb-2">{t('shippingAddress')}</h3>
                <p className="text-sm text-gray-500 mb-4">{t('contactSellerDirectly')}</p>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
            >
                <Form.Item
                    name="shippingPhone"
                    label={t('contactPhone')}
                    rules={[{ required: true, message: t('contactRequired') }]}
                >
                    <Input size="large" placeholder={t('contactPhone')} />
                </Form.Item>

                <Form.Item
                    name="shippingAddress"
                    label={t('shippingAddress')}
                    rules={[{ required: true, message: t('contactRequired') }]}
                >
                    <Input.TextArea size="large" rows={2} placeholder="Số nhà, Phường, Quận, Thành phố..." />
                </Form.Item>
                
                <Form.Item
                    name="shippingNote"
                    label={t('shippingNote')}
                >
                    <Input.TextArea size="large" rows={2} placeholder="Ghi chú thêm cho người bán (giờ nhận hàng, v.v.)" />
                </Form.Item>

                <Divider />

                <div className="flex justify-between items-center text-lg font-bold mb-6">
                    <span>{t('totalAmount')}:</span>
                    <span className="text-2xl text-red-600">{product.price.toLocaleString('vi-VN')} đ</span>
                </div>

                <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                    className="w-full h-12 text-lg font-bold flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                >
                    <ShieldCheck />
                    {t('paySecurely')}
                </Button>
            </Form>
        </div>
    )
}
