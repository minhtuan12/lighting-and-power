'use client'

import { showMessage } from '@/hooks/use-message'
import {
    CheckOutlined,
    DeleteOutlined,
    EditOutlined,
    PictureOutlined,
} from '@ant-design/icons'
import { Button, Card, Popconfirm, Table, Tabs, Tag, Tooltip } from 'antd'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import NguoiDangKyPage from '../(components)/NguoiDangKyPage'
import SanPhamXacNhanPage from '../(components)/SanPhamXacNhanPage'
import DangBanModal from '../DangBanModal'

export default function QuanLyPage() {
    const t = useTranslations('c2c')
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<any>(null)

    const fetchMyProducts = () => {
        setLoading(true)
        fetch('/api/c2c/products/me')
            .then((res) => res.json())
            .then((data) => {
                if (data.success) setProducts(data.data.products)
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchMyProducts()
    }, [])

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/c2c/products/${id}`, {
                method: 'DELETE',
            })
            const data = await res.json()
            if (data.success) {
                showMessage.success(t('deletedSuccessfully'))
                fetchMyProducts()
            } else throw new Error(data.message)
        } catch (error: any) {
            showMessage.error(error.message || t('deleteError'))
        }
    }

    const markAsSold = async (id: string) => {
        try {
            const res = await fetch(`/api/c2c/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'sold' }),
            })
            const data = await res.json()
            if (data.success) {
                showMessage.success(t('markedAsSold'))
                fetchMyProducts()
            } else throw new Error(data.message)
        } catch (error: any) {
            showMessage.error(error.message || t('error'))
        }
    }

    const columns = [
        {
            title: t('product'),
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: any) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                        {record.images && record.images?.length > 0 ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={record.images?.[0]}
                                alt={text}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <PictureOutlined className="text-gray-300 text-lg" />
                        )}
                    </div>
                    <Link
                        href={`/san-pham/${record._id}`}
                        className="font-medium !text-[var(--primary)] hover:opacity-80 transition-opacity line-clamp-1"
                    >
                        {text || record.name || t('noTitle')}
                    </Link>
                </div>
            ),
        },
        {
            title: t('postDateColumn'),
            dataIndex: 'createdAt',
            key: 'createdAt',
            align: 'center',
            render: (val: string) => (
                <span className="text-gray-500">
                    {new Date(val).toLocaleDateString('vi-VN')}
                </span>
            ),
        },
        {
            title: t('price'),
            dataIndex: 'price',
            key: 'price',
            align: 'right',
            render: (val: number) => (
                <span className="font-bold text-red-500">
                    {val?.toLocaleString()} đ
                </span>
            ),
        },
        {
            title: t('condition'),
            dataIndex: 'condition',
            key: 'condition',
            align: 'center',
            render: (val: string) => (
                <Tag
                    className="!rounded-full !border-0 !px-3 !py-0.5 !font-medium"
                    color={
                        val === 'new'
                            ? 'cyan'
                            : val === 'like_new'
                                ? 'blue'
                                : 'gold'
                    }
                >
                    {val === 'new'
                        ? t('conditionNew')
                        : val === 'like_new'
                            ? t('conditionLikeNew')
                            : t('conditionUsed')}
                </Tag>
            ),
        },
        {
            title: t('status'),
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            render: (val: string) => (
                <Tag
                    className="!rounded-full !border-0 !px-3 !py-0.5 !font-medium"
                    color={
                        val === 'active'
                            ? 'green'
                            : val === 'sold'
                                ? 'default'
                                : val === 'pending'
                                    ? 'gold'
                                    : val === 'rejected'
                                        ? 'red'
                                        : 'default'
                    }
                >
                    {val === 'active'
                        ? t('statusActive')
                        : val === 'sold'
                            ? t('statusSold')
                            : val === 'pending'
                                ? t('statusPending')
                                : val === 'rejected'
                                    ? t('statusRejected')
                                    : t('statusHidden')}
                </Tag>
            ),
        },
        {
            title: t('action'),
            key: 'action',
            align: 'center',
            render: (_: any, record: any) => (
                <div className="flex items-center justify-center gap-2">
                    {record.status === 'active' && (
                        <>
                            <Tooltip title={t('edit')}>
                                <Button
                                    shape="circle"
                                    icon={<EditOutlined />}
                                    className="!border-gray-200 !text-gray-500 hover:!border-[var(--primary)] hover:!text-[var(--primary)]"
                                    onClick={() => {
                                        setEditingProduct(record)
                                        setModalOpen(true)
                                    }}
                                />
                            </Tooltip>
                            <Tooltip title={t('markAsSold')}>
                                <Button
                                    shape="circle"
                                    icon={<CheckOutlined />}
                                    className="!border-blue-200 !text-blue-500 hover:!border-blue-400 hover:!text-blue-600"
                                    onClick={() => markAsSold(record._id)}
                                />
                            </Tooltip>
                        </>
                    )}
                    <Popconfirm
                        title={t('confirmDelete')}
                        onConfirm={() => handleDelete(record._id)}
                    >
                        <Tooltip title={t('delete')}>
                            <Button
                                shape="circle"
                                danger
                                icon={<DeleteOutlined />}
                                className="!border-red-200 hover:!border-red-400"
                            />
                        </Tooltip>
                    </Popconfirm>
                </div>
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
            align: 'center',
        },
        {
            title: t('totalAmount'),
            dataIndex: 'total',
            key: 'total',
            align: 'right',
        },
        {
            title: t('status'),
            dataIndex: 'status',
            key: 'status',
            align: 'center',
        },
    ]

    return (
        <Card className="shadow-sm !rounded-2xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{t('manageFleaMarket')}</h2>
                <Button
                    type="primary"
                    onClick={() => {
                        setEditingProduct(null)
                        setModalOpen(true)
                    }}
                    className="!bg-[var(--brand-btn-bg)] hover:!bg-[var(--brand-btn-hover)] !border-none !text-white !rounded-full !h-10 !px-5 !font-semibold transition-colors"
                >
                    <Plus size={15} /> {t('postNewAd')}
                </Button>
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
                                columns={columns as any}
                                dataSource={products}
                                rowKey="_id"
                                loading={loading}
                                rowClassName={() => 'align-middle'}
                                pagination={{
                                    pageSize: 10,
                                    hideOnSinglePage: true,
                                }}
                            />
                        ),
                    },
                    {
                        key: '2',
                        label: t('purchasedOrders'),
                        children: (
                            <Table
                                className="custom-table"
                                columns={orderColumns as any}
                                dataSource={[]}
                                locale={{ emptyText: t('noOrders') }}
                                pagination={{ hideOnSinglePage: true }}
                            />
                        ),
                    },
                    {
                        key: '3',
                        label: 'Người đăng ký mua',
                        children: (
                            <div className="space-y-4">
                                <NguoiDangKyPage
                                    products={products.filter(
                                        (p) => p.status === 'active',
                                    )}
                                />
                            </div>
                        ),
                    },
                    {
                        key: '4',
                        label: 'Sản phẩm đã được xác nhận',
                        children: <SanPhamXacNhanPage />,
                    },
                ]}
            />
            <DangBanModal
                open={modalOpen}
                product={editingProduct}
                onClose={() => setModalOpen(false)}
                onSuccess={() => {
                    setModalOpen(false)
                    fetchMyProducts()
                }}
            />
        </Card>
    )
}
