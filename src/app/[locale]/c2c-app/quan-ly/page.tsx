'use client'

import { useEffect, useState } from "react"
import { Table, Button, Tag, Space, message, Popconfirm, Tabs, Card } from "antd"
import Link from "next/link"
import { useTranslations } from "next-intl"

export default function QuanLyPage() {
    const t = useTranslations('c2c')
    const [products, setProducts] = useState<any[]>([])
    const [purchases, setPurchases] = useState<any[]>([])
    const [sales, setSales] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchMyProducts = () => {
        setLoading(true)
        Promise.all([
            fetch("/api/c2c/products/me").then(res => res.json()),
            fetch("/api/c2c/orders/me").then(res => res.json())
        ])
        .then(([productsData, ordersData]) => {
            if (productsData.success) setProducts(productsData.data.products)
            if (ordersData.success) {
                setPurchases(ordersData.data.purchases)
                setSales(ordersData.data.sales)
            }
        })
        .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchMyProducts()
    }, [])

    const confirmDelivery = async (orderId: string) => {
        try {
            const res = await fetch(`/api/c2c/orders/${orderId}/confirm`, { method: "POST" })
            const data = await res.json()
            if (data.success) {
                message.success("Đã xác nhận nhận hàng, tiền sẽ được chuyển cho người bán.")
                fetchMyProducts()
            } else throw new Error(data.error)
        } catch (error: any) {
            message.error(error.message || "Lỗi xác nhận")
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/c2c/products/${id}`, { method: "DELETE" })
            const data = await res.json()
            if (data.success) {
                message.success(t('deletedSuccessfully'))
                fetchMyProducts()
            } else throw new Error(data.message)
        } catch (error: any) {
            message.error(error.message || t('deleteError'))
        }
    }

    const markAsSold = async (id: string) => {
        try {
            const res = await fetch(`/api/c2c/products/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "sold" })
            })
            const data = await res.json()
            if (data.success) {
                message.success(t('markedAsSold'))
                fetchMyProducts()
            } else throw new Error(data.message)
        } catch (error: any) {
            message.error(error.message || t('error'))
        }
    }

    const columns = [
        {
            title: t('product'),
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: any) => (
                <Link href={`/${record._id}`} className="font-medium !text-[var(--primary)] hover:opacity-80 transition-opacity">
                    {text || record.name || t('noTitle')}
                </Link>
            ),
        },
        {
            title: t('postDateColumn'),
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val: string) => <span className="text-gray-500">{new Date(val).toLocaleDateString('vi-VN')}</span>,
        },
        {
            title: t('price'),
            dataIndex: 'price',
            key: 'price',
            render: (val: number) => <span className="font-bold text-red-500">{val?.toLocaleString()} đ</span>,
        },
        {
            title: t('condition'),
            dataIndex: 'condition',
            key: 'condition',
            render: (val: string) => (
                <Tag color={val === 'new' ? 'green' : val === 'like_new' ? 'blue' : 'orange'}>
                    {val === 'new' ? t('conditionNew') : val === 'like_new' ? t('conditionLikeNew') : t('conditionUsed')}
                </Tag>
            )
        },
        {
            title: t('status'),
            dataIndex: 'status',
            key: 'status',
            render: (val: string) => (
                <Tag color={val === 'active' ? 'green' : val === 'sold' ? 'gray' : val === 'pending' ? 'gold' : val === 'rejected' ? 'red' : 'default'}>
                    {val === 'active' ? t('statusActive') : val === 'sold' ? t('statusSold') : val === 'pending' ? t('statusPending') : val === 'rejected' ? t('statusRejected') : t('statusHidden')}
                </Tag>
            ),
        },
        {
            title: t('action'),
            key: 'action',
            render: (_: any, record: any) => (
                <Space size="middle">
                    {record.status === 'active' && (
                        <>
                            <Link href={`/sua-tin/${record._id}`}>
                                <Button size="small">{t('edit')}</Button>
                            </Link>
                            <Button size="small" onClick={() => markAsSold(record._id)}>{t('markAsSold')}</Button>
                        </>
                    )}
                    <Popconfirm title={t('confirmDelete')} onConfirm={() => handleDelete(record._id)}>
                        <Button size="small" danger>{t('delete')}</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    const purchaseColumns = [
        {
            title: t('orderId'),
            dataIndex: 'payosOrderCode',
            key: 'payosOrderCode',
            render: (val: any) => <b>#{val}</b>
        },
        {
            title: t('product'),
            dataIndex: 'productId',
            key: 'productName',
            render: (val: any) => (
                <div className="flex items-center gap-2">
                    {val?.images?.[0] && <img src={val.images[0]} alt="" className="w-10 h-10 object-cover rounded" />}
                    <span>{val?.title || t('noTitle')}</span>
                </div>
            )
        },
        {
            title: t('purchaseDate'),
            dataIndex: 'createdAt',
            key: 'date',
            render: (val: string) => <span className="text-gray-500">{new Date(val).toLocaleDateString('vi-VN')}</span>,
        },
        {
            title: t('totalAmount'),
            dataIndex: 'amount',
            key: 'total',
            render: (val: number) => <span className="font-bold text-red-500">{val?.toLocaleString()} đ</span>,
        },
        {
            title: t('status'),
            dataIndex: 'status',
            key: 'status',
            render: (val: string) => (
                <Tag color={val === 'paid' ? 'blue' : val === 'completed' ? 'green' : val === 'cancelled' ? 'red' : 'default'}>
                    {val === 'paid' ? 'Đã thanh toán' : val === 'completed' ? 'Hoàn thành' : val === 'cancelled' ? 'Đã hủy' : val}
                </Tag>
            ),
        },
        {
            title: t('action'),
            key: 'action',
            render: (_: any, record: any) => (
                <Space size="middle">
                    {record.status === 'paid' && (
                        <Popconfirm title="Bạn xác nhận đã nhận hàng và đồng ý trả tiền cho người bán?" onConfirm={() => confirmDelivery(record._id)}>
                            <Button type="primary" size="small" className="bg-green-600">Đã nhận được hàng</Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ]

    const saleColumns = [
        {
            title: t('orderId'),
            dataIndex: 'payosOrderCode',
            key: 'payosOrderCode',
            render: (val: any) => <b>#{val}</b>
        },
        {
            title: t('product'),
            dataIndex: 'productId',
            key: 'productName',
            render: (val: any) => (
                <div className="flex items-center gap-2">
                    {val?.images?.[0] && <img src={val.images[0]} alt="" className="w-10 h-10 object-cover rounded" />}
                    <span>{val?.title || t('noTitle')}</span>
                </div>
            )
        },
        {
            title: "Người mua",
            dataIndex: 'buyerId',
            key: 'buyer',
            render: (val: any, record: any) => (
                <div>
                    <div>{val?.fullName}</div>
                    <div className="text-xs text-gray-500">{record.shippingPhone}</div>
                </div>
            )
        },
        {
            title: "Địa chỉ giao hàng",
            dataIndex: 'shippingAddress',
            key: 'address',
            render: (val: string, record: any) => (
                <div className="max-w-[200px] text-xs">
                    <div>{val}</div>
                    {record.shippingNote && <div className="text-orange-500 italic">Ghi chú: {record.shippingNote}</div>}
                </div>
            )
        },
        {
            title: t('status'),
            dataIndex: 'status',
            key: 'status',
            render: (val: string) => (
                <Tag color={val === 'paid' ? 'blue' : val === 'completed' ? 'green' : val === 'cancelled' ? 'red' : 'default'}>
                    {val === 'paid' ? 'Đã thanh toán (Chờ giao hàng)' : val === 'completed' ? 'Hoàn thành' : val === 'cancelled' ? 'Đã hủy' : val}
                </Tag>
            ),
        }
    ]

    return (
        <Card className="shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{t('manageFleaMarket')}</h2>
                <Link href="/dang-ban">
                    <Button type="primary" className="!bg-[var(--brand-btn-bg)] hover:!bg-[var(--brand-btn-hover)] !border-none !text-white transition-colors">
                        {t('postNewAd')}
                    </Button>
                </Link>
            </div>
            
            <Tabs 
                defaultActiveKey="1"
                items={[
                    {
                        key: '1',
                        label: t('postedAds'),
                        children: (
                            <Table
                                className="custom-table"
                                columns={columns}
                                dataSource={products}
                                rowKey="_id"
                                loading={loading}
                                pagination={{ pageSize: 10, hideOnSinglePage: true }}
                            />
                        )
                    },
                    {
                        key: '2',
                        label: t('purchasedOrders'),
                        children: (
                            <Table
                                className="custom-table"
                                columns={purchaseColumns}
                                dataSource={purchases}
                                rowKey="_id"
                                loading={loading}
                                locale={{ emptyText: t('noOrders') }}
                                pagination={{ pageSize: 10, hideOnSinglePage: true }}
                            />
                        )
                    },
                    {
                        key: '3',
                        label: "Đơn hàng đã bán",
                        children: (
                            <Table
                                className="custom-table"
                                columns={saleColumns}
                                dataSource={sales}
                                rowKey="_id"
                                loading={loading}
                                locale={{ emptyText: t('noOrders') }}
                                pagination={{ pageSize: 10, hideOnSinglePage: true }}
                            />
                        )
                    }
                ]}
            />
        </Card>
    )
}
