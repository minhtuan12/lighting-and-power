'use client'

import { useEffect, useState } from "react"
import { Table, Button, Tag, Space, message, Popconfirm, Tabs, Card } from "antd"
import Link from "next/link"
import { useTranslations } from "next-intl"

export default function QuanLyPage() {
    const t = useTranslations('c2c')
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchMyProducts = () => {
        setLoading(true)
        fetch("/api/c2c/products/me")
            .then(res => res.json())
            .then(data => {
                if (data.success) setProducts(data.data.products)
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchMyProducts()
    }, [])

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

    const orderColumns = [
        {
            title: t('orderId'),
            dataIndex: 'orderId',
            key: 'orderId',
        },
        {
            title: t('product'),
            dataIndex: 'productName',
            key: 'productName',
        },
        {
            title: t('purchaseDate'),
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: t('totalAmount'),
            dataIndex: 'total',
            key: 'total',
        },
        {
            title: t('status'),
            dataIndex: 'status',
            key: 'status',
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
                                columns={orderColumns}
                                dataSource={[]}
                                locale={{ emptyText: t('noOrders') }}
                                pagination={{ hideOnSinglePage: true }}
                            />
                        )
                    }
                ]}
            />
        </Card>
    )
}
