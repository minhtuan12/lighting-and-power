'use client'

import Loading from '@/components/Loading'
import { CHECKOUT_FLOW_KEY } from '@/constants/common'
import { routes } from '@/constants/routes'
import { showMessage } from '@/hooks/use-message'
import { fetchAPI } from '@/lib/api-client'
import { getProvinceAndWardNameByCode } from '@/lib/utils'
import { checkedOutItemsAtom } from '@/stores'
import { EOrderStatus, EPaymentStatus, IOrder } from '@/types/order'
import {
    Button,
    Card,
    Divider,
    Flex,
    Input,
    Modal,
    Steps,
    Table,
    Typography,
} from 'antd'
import { useSetAtom } from 'jotai'
import {
    CheckCircle2,
    CircleX,
    FileText,
    MapPin,
    Phone,
    Printer,
    Truck,
    XCircle,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const { Text, Title } = Typography

const formatPrice = (value: number) => value.toLocaleString('vi-VN') + ' đ'

const statusSteps = [
    {
        key: EOrderStatus.pending,
        title: 'Tiếp nhận',
        description: '1 ngày',
        icon: <FileText size={18} />,
    },
    {
        key: EOrderStatus.confirmed,
        title: 'Đang soạn',
        description: '1 ngày',
        icon: <FileText size={18} />,
    },
    {
        key: EOrderStatus.processing,
        title: 'Soạn xong',
        description: '2 ngày',
        icon: <CheckCircle2 size={18} />,
    },
    {
        key: EOrderStatus.shipping,
        title: 'Giao hàng',
        description: '2 ngày',
        icon: <Truck size={18} />,
    },
]

const shippingResults = {
    delivered: {
        key: EOrderStatus.delivered,
        title: 'Giao hàng thành công',
        description: '',
        icon: <Truck size={18} />,
    },
    cancelled: {
        key: EOrderStatus.cancelled,
        title: 'Đã hủy',
        description: '',
        icon: <CircleX color="#fe2a2a" size={18} />,
    },
}

const getStepIndex = (status?: EOrderStatus) => {
    if (!status) return 0
    const index = statusSteps.findIndex((step) => step.key === status)
    return index === -1 ? 0 : index
}

export default function OrderSuccessPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const orderId = searchParams.get('orderId')

    const setCheckedOutItems = useSetAtom(checkedOutItemsAtom)

    const [order, setOrder] = useState<IOrder | null>(null)
    const [loading, setLoading] = useState(true)
    const [cancelOpen, setCancelOpen] = useState(false)
    const [cancelReason, setCancelReason] = useState('')
    const [isCancelling, setIsCancelling] = useState(false)
    const [address, setAddress] = useState({ provinceName: '', wardName: '' })

    useEffect(() => {
        if (!orderId) {
            router.replace(routes.trangCaNhan.url)
            return
        }

        let isMounted = true
        setLoading(true)
        fetchAPI(`/orders/${orderId}`)
            .then((res) => {
                if (isMounted) {
                    setOrder(res?.data ?? null)
                    if (
                        res?.data?.shippingAddress.province &&
                        res?.data?.shippingAddress.ward
                    ) {
                        getProvinceAndWardNameByCode(
                            Number(res?.data?.shippingAddress.province),
                            Number(res?.data?.shippingAddress.ward),
                        ).then((res) => setAddress(res))
                    }
                }
            })
            .catch((error: any) => {
                showMessage.error(
                    error?.message || 'Không thể tải thông tin đơn hàng.',
                )
                router.replace(routes.trangCaNhan.url)
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false)
                }
            })

        return () => {
            isMounted = false
        }
    }, [orderId, router])

    const createdAt = order?.createdAt ? new Date(order.createdAt) : null
    const orderMeta = useMemo(
        () =>
            [
                order?.orderNumber ? `Mã đơn hàng #${order.orderNumber}` : '',
                createdAt
                    ? `Giờ hàng | ${createdAt.toLocaleTimeString('vi-VN')}`
                    : '',
                createdAt ? createdAt.toLocaleDateString('vi-VN') : '',
                order?.paymentStatus === EPaymentStatus.paid
                    ? 'Đã thanh toán'
                    : 'Chưa thanh toán',
            ].filter(Boolean),
        [order, createdAt],
    )

    const canCancel =
        order?.status === EOrderStatus.pending ||
        order?.status === EOrderStatus.confirmed

    const handleCancel = async () => {
        if (!orderId) return
        const reason = cancelReason.trim()
        if (!reason) {
            showMessage.warning('Vui lòng nhập lý do hủy đơn.')
            return
        }

        setIsCancelling(true)
        try {
            const res = await fetchAPI(`/orders/${orderId}/cancel`, {
                method: 'POST',
                body: JSON.stringify({ reason }),
            })
            setOrder(res?.data ?? order)
            showMessage.success('Đã hủy đơn hàng.')
            setCancelOpen(false)
            setCancelReason('')
        } catch (error: any) {
            showMessage.error(error?.message || 'Không thể hủy đơn hàng.')
        } finally {
            setIsCancelling(false)
        }
    }

    const columns = [
        {
            title: 'No',
            dataIndex: 'index',
            key: 'index',
            width: 60,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: 'Sản phẩm',
            dataIndex: 'productName',
            key: 'productName',
            render: (_: any, record: any) => (
                <Flex
                    gap={10}
                    align="center"
                >
                    {record.productImage ? (
                        <Image
                            src={record.productImage}
                            alt={record.productName}
                            width={48}
                            height={48}
                            className="object-contain rounded border border-gray-100"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded border border-gray-200 bg-gray-50" />
                    )}
                    <Text>{record.productName}</Text>
                </Flex>
            ),
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 110,
            render: (value: number) => `${value} con`,
        },
        {
            title: 'Đơn giá',
            dataIndex: 'price',
            key: 'price',
            width: 140,
            render: (value: number) => formatPrice(value),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'subtotal',
            key: 'subtotal',
            width: 140,
            render: (value: number) => (
                <Text className="text-red-500">{formatPrice(value)}</Text>
            ),
        },
    ]

    useEffect(() => {
        sessionStorage.removeItem(CHECKOUT_FLOW_KEY)
        setCheckedOutItems([])
    }, [])

    const steps = useMemo(() => {
        if (order) {
            if (Object.keys(shippingResults).includes(order.status)) {
                return [
                    ...statusSteps,
                    shippingResults[order.status as keyof typeof shippingResults],
                ];
            }
            return statusSteps;
        }
    }, [order]);

    if (loading) {
        return <Loading className="!mt-20" />
    }

    if (!order) {
        return null
    }

    return (
        <div className="w-full max-w-[980px] mx-auto !mt-4 !mb-20">
            <Card className="shadow-md border border-gray-100">
                <Title
                    level={4}
                    className="!mb-1"
                >
                    Đặt hàng thành công!
                </Title>
                <Text type="secondary">
                    Quý khách vui lòng kiểm tra đơn hàng của tôi hoặc email để
                    có thông tin thanh toán và chi tiết đơn hàng.
                </Text>
                <div className="mt-3 text-sm text-gray-500">
                    {orderMeta.join(' | ')}
                </div>

                <Divider className="!my-4" />

                <Steps
                    current={getStepIndex(order.status)}
                    items={statusSteps.map((step) => ({
                        title: step.title,
                        content: step.description,
                        icon: step.icon,
                    }))}
                />

                <Divider className="!my-5" />

                <Flex
                    justify="space-between"
                    gap={20}
                    wrap
                >
                    <div className="min-w-[260px]">
                        <Text
                            strong
                            className="uppercase text-xs text-gray-500"
                        >
                            Địa chỉ người nhận
                        </Text>
                        <div className="mt-2 space-y-2">
                            <Flex
                                gap={8}
                                align="center"
                            >
                                <MapPin size={16} />
                                <Text>
                                    {
                                        `${order.shippingAddress.address}${address.wardName ? `, ${address.wardName}` : ''}${address.provinceName ? `, ${address.provinceName}` : ''}`
                                    }
                                </Text>
                            </Flex>
                            <Flex
                                gap={8}
                                align="center"
                            >
                                <Phone size={16} />
                                <Text>{order.customerInfo.phone}</Text>
                            </Flex>
                        </div>
                    </div>

                    <div className="min-w-[260px]">
                        <Text
                            strong
                            className="uppercase text-xs text-gray-500"
                        >
                            Thanh toán &amp; giao hàng
                        </Text>
                        <div className="mt-2 space-y-2 text-sm flex flex-col">
                            <Text>
                                <strong>Thanh toán:</strong>{' '}
                                {order.paymentMethod === 'cod'
                                    ? 'Thanh toán tiền mặt khi nhận hàng (COD).'
                                    : 'Chuyển khoản ngân hàng.'}
                            </Text>
                            <Text>
                                <strong>Giao hàng:</strong> Chuyển phát nhanh
                            </Text>
                        </div>
                    </div>
                </Flex>

                <Divider className="!my-5" />

                <Table
                    columns={columns}
                    dataSource={order.items}
                    pagination={false}
                    rowKey={(record) => record.productId}
                    size="small"
                    className="order-table"
                />

                <div className="mt-4 border border-gray-200 rounded-md">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 text-sm">
                        <Text type="secondary">Phí vận chuyển</Text>
                        <Text>{formatPrice(order.shippingFee)}</Text>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 text-sm">
                        <Text type="secondary">Giảm giá</Text>
                        <Text>-{formatPrice(order.discount || 0)}</Text>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2 text-sm">
                        <Text strong>Tổng tiền</Text>
                        <Text
                            strong
                            className="text-red-500"
                        >
                            {formatPrice(order.total)}
                        </Text>
                    </div>
                </div>

                <Flex
                    justify="end"
                    gap={10}
                    className="!mt-5"
                >
                    {canCancel ? (
                        <Button
                            danger
                            icon={<XCircle size={16} />}
                            onClick={() => setCancelOpen(true)}
                        >
                            Hủy đơn hàng
                        </Button>
                    ) : null}
                    <Button
                        type="primary"
                        icon={<Printer size={16} />}
                        onClick={() => window.print()}
                    >
                        In
                    </Button>
                </Flex>
            </Card>

            <Modal
                title="Hủy đơn hàng"
                open={cancelOpen}
                onCancel={() => setCancelOpen(false)}
                onOk={handleCancel}
                okText="Xác nhận"
                cancelText="Đóng"
                confirmLoading={isCancelling}
            >
                <Input.TextArea
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Nhập lý do hủy đơn..."
                />
            </Modal>
        </div>
    )
}
