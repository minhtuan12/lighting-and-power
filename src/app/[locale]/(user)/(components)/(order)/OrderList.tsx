'use client'

import Loading from '@/components/Loading'
import { useCancelOrder, useOrders } from '@/hooks/user/use-orders'
import { EOrderStatus, EPaymentStatus, IOrder } from '@/types/order'
import {
    Button,
    Col,
    Empty,
    Flex,
    Input,
    message,
    Modal,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Typography
} from 'antd'
import { Eye, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

const { Text, Title } = Typography
const { TextArea, Search } = Input

type StatusFilter = EOrderStatus | EOrderStatus[] | undefined

const formatCurrency = (value?: number, short?: boolean) =>
    typeof value === 'number'
        ? value.toLocaleString('vi-VN') + (short ? ' đ' : ' VND')
        : '-'

const formatDateTime = (value?: string | Date) => {
    if (!value) return '-'
    const date = value instanceof Date ? value : new Date(value)
    return date.toLocaleString('vi-VN')
}

const isCancelable = (status?: EOrderStatus) =>
    status === EOrderStatus.pending || status === EOrderStatus.confirmed

const toStatusArray = (status?: StatusFilter) =>
    Array.isArray(status) ? status : status ? [status] : []

export default function OrderList({ statusFilter }: { statusFilter?: StatusFilter }) {
    const t = useTranslations('orders')
    const tc = useTranslations('common')

    const queryStatus = Array.isArray(statusFilter) ? undefined : statusFilter
    const { orders, isLoading, isFetching } = useOrders({
        page: 1,
        limit: 100,
        status: queryStatus,
    })
    const { cancelOrderAsync, isCancelling } = useCancelOrder()

    const [searchText, setSearchText] = useState('')
    const [paymentFilter, setPaymentFilter] = useState<
        EPaymentStatus | 'all'
    >('all')
    const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [cancelOpen, setCancelOpen] = useState(false)
    const [cancelReason, setCancelReason] = useState('')

    const statusList = toStatusArray(statusFilter)

    const filteredOrders = useMemo(() => {
        let data = orders ?? []

        if (statusList.length > 0) {
            data = data.filter((o) => statusList.includes(o.status))
        }

        if (paymentFilter !== 'all') {
            data = data.filter((o) => o.paymentStatus === paymentFilter)
        }

        const keyword = searchText.trim().toLowerCase()
        if (keyword) {
            data = data.filter((o) => {
                const orderNumber = o.orderNumber?.toLowerCase() ?? ''
                const customerName =
                    o.customerInfo?.name?.toLowerCase() ?? ''
                const productHit = o.items?.some((i) =>
                    i.productName?.toLowerCase().includes(keyword),
                )
                return (
                    orderNumber.includes(keyword) ||
                    customerName.includes(keyword) ||
                    productHit
                )
            })
        }

        return data
    }, [orders, searchText, paymentFilter, statusList])

    const openDetail = (order: IOrder) => {
        setSelectedOrder(order)
        setDetailOpen(true)
    }

    const openCancel = (order: IOrder) => {
        setSelectedOrder(order)
        setCancelReason('')
        setCancelOpen(true)
    }

    const handleCancel = async () => {
        if (!selectedOrder?._id) return
        const reason = cancelReason.trim()
        if (!reason) {
            message.warning(t('cancelModal.placeholder'))
            return
        }

        try {
            await cancelOrderAsync({
                orderId: selectedOrder._id,
                reason,
            })
            message.success(t('cancelModal.success'))
            setCancelOpen(false)
        } catch (err: any) {
            message.error(err?.message || t('cancelModal.failed'))
        }
    }

    const columns = [
        {
            title: t('table.orderNumber'),
            dataIndex: 'orderNumber',
            key: 'orderNumber',
            width: 180,
            align: 'center',
            render: (value: string) => (
                <Text className="font-semibold !text-[var(--primary)] text-ellipsis overflow-hidden !w-full line-clamp-2">
                    {value}
                </Text>
            ),
        },
        {
            title: t('table.items'),
            dataIndex: 'items',
            key: 'items',
            width: 200,
            render: (items: IOrder['items']) => {
                const first = items?.[0]
                return (
                    <Flex
                        align="center"
                        gap={10}
                        className="min-w-0"
                    >
                        <div className="min-w-0">
                            <div className="text-sm font-semibold line-clamp-1">
                                {first?.productName || tc('NA')}
                            </div>
                            <div className="text-xs text-gray-500">
                                {t('summary.items', {
                                    count: items?.length ?? 0,
                                })}
                            </div>
                        </div>
                    </Flex>
                )
            },
        },
        {
            title: t('table.createdAt'),
            dataIndex: 'createdAt',
            align: 'center',
            key: 'createdAt',
            width: 170,
            render: (value: string) => (
                <Text className="text-xs">{formatDateTime(value)}</Text>
            ),
        },
        {
            title: t('table.total'),
            dataIndex: 'total',
            key: 'total',
            align: 'right',
            width: 170,
            render: (value: number) => (
                <Text className="font-semibold">{formatCurrency(value, true)}</Text>
            ),
        },
        // {
        //     title: t('table.payment'),
        //     dataIndex: 'paymentStatus',
        //     key: 'paymentStatus',
        //     width: 120,
        //     render: (value: EPaymentStatus) => (
        //         <Tag color={paymentTagColor(value)} variant='outlined'>
        //             {t(`paymentStatus.${value}`)}
        //         </Tag>
        //     ),
        // },
        {
            title: t('table.status'),
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            width: 100,
            render: (value: EOrderStatus) => (
                <Tag color={statusTagColor(value)} variant='outlined'>
                    {t(`status.${value}`)}
                </Tag>
            ),
        },
        {
            title: t('table.actions'),
            key: 'actions',
            align: 'center',
            width: 140,
            render: (_: any, record: IOrder) => (
                <Space className='!flex flex-col'>
                    <Button
                        size="small"
                        type="link"
                        icon={<Eye size={16} />}
                        onClick={() => openDetail(record)}
                    >
                        {t('actions.view')}
                    </Button>
                    {isCancelable(record.status) && (
                        <Button
                            size="small"
                            type="link"
                            danger
                            icon={<XCircle size={16} />}
                            onClick={() => openCancel(record)}
                        >
                            {t('actions.cancel')}
                        </Button>
                    )}
                </Space>
            ),
        },
    ]

    return (
        <Flex
            vertical
            gap={16}
            className="!mt-2"
        >
            <Flex
                justify="space-between"
                align="center"
                gap={12}
                className="flex-wrap"
            >
                <Search
                    allowClear
                    placeholder={t('search')}
                    onSearch={(value) => setSearchText(value)}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="max-w-[320px]"
                />
                <Select
                    value={paymentFilter}
                    onChange={(value) =>
                        setPaymentFilter(value as EPaymentStatus | 'all')
                    }
                    className="min-w-[160px]"
                    options={[
                        { value: 'all', label: t('filters.payment') },
                        {
                            value: EPaymentStatus.pending,
                            label: t('paymentStatus.pending'),
                        },
                        {
                            value: EPaymentStatus.paid,
                            label: t('paymentStatus.paid'),
                        },
                        {
                            value: EPaymentStatus.failed,
                            label: t('paymentStatus.failed'),
                        },
                        {
                            value: EPaymentStatus.refunded,
                            label: t('paymentStatus.refunded'),
                        },
                    ]}
                />
            </Flex>

            {isLoading ? (
                <Loading size="large" />
            ) : (
                <Table
                    rowKey={(record) => record._id ?? record.orderNumber}
                    columns={columns as any}
                    dataSource={filteredOrders}
                    loading={isFetching}
                    pagination={{ pageSize: 6, hideOnSinglePage: true }}
                    className="order-table"
                    locale={{
                        emptyText: (
                            <Empty
                                description={t('empty')}
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        ),
                    }}
                    scroll={{ x: 300 }}
                />
            )}

            <Modal
                open={detailOpen}
                onCancel={() => setDetailOpen(false)}
                footer={null}
                width={700}
                title="Chi tiết đơn hàng"
            >
                {selectedOrder && (
                    <div className="space-y-4">
                        <Row gutter={24}>
                            {/* Cột trái: thông tin khách hàng */}
                            <Col span={12}>
                                <Title level={5} className="!mb-3 !text-[var(--primary)]">
                                    Thông tin khách hàng
                                </Title>

                                <Space orientation="vertical" size={12} className="w-full text-sm">
                                    <div>
                                        <Text strong>Họ tên: </Text>
                                        <Text>{selectedOrder.customerInfo.name}</Text>
                                    </div>
                                    <div>
                                        <Text strong>Số điện thoại: </Text>
                                        <Text>{selectedOrder.customerInfo.phone}</Text>
                                    </div>
                                    {selectedOrder.customerInfo.email && (
                                        <div>
                                            <Text strong>Email: </Text>
                                            <Text>{selectedOrder.customerInfo.email}</Text>
                                        </div>
                                    )}
                                    <div>
                                        <Text strong>Địa chỉ giao hàng: </Text>
                                        <Text>
                                            {[
                                                selectedOrder.shippingAddress.address,
                                                selectedOrder.shippingAddress.ward,
                                                selectedOrder.shippingAddress.province,
                                            ]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </Text>
                                    </div>

                                    <Flex align="center" gap={8}>
                                        <Text strong>Trạng thái:</Text>
                                        <Tag color={statusTagColor(selectedOrder.status)}>
                                            {statusLabel(selectedOrder.status)}
                                        </Tag>
                                    </Flex>

                                    <Flex align="center" gap={8}>
                                        <Text strong>Thanh toán:</Text>
                                        <Tag color={paymentTagColor(selectedOrder.paymentStatus)}>
                                            {paymentLabel(selectedOrder.paymentStatus)}
                                        </Tag>
                                    </Flex>

                                    {selectedOrder.note && (
                                        <div>
                                            <Text type="secondary" className="block !mb-1">
                                                Ghi chú:
                                            </Text>
                                            <Text>{selectedOrder.note}</Text>
                                        </div>
                                    )}

                                    {selectedOrder.cancelReason && (
                                        <div>
                                            <Text type="secondary" className="block !mb-1">
                                                Lý do huỷ:
                                            </Text>
                                            <Text>{selectedOrder.cancelReason}</Text>
                                        </div>
                                    )}
                                </Space>
                            </Col>

                            {/* Cột phải: danh sách sản phẩm */}
                            <Col span={12}>
                                <Title level={5} className="!mb-3 !text-[var(--primary)]">
                                    Sản phẩm
                                </Title>

                                <Space orientation="vertical" size={12} className="w-full">
                                    {selectedOrder.items?.map((item: any) => (
                                        <Flex
                                            key={`${item.productId}-${item.productName}`}
                                            align="center"
                                            justify="space-between"
                                            gap={12}
                                            className="border border-gray-200 rounded-[10px] !pr-3 overflow-hidden"
                                        >
                                            <Flex align="center" gap={10} className="min-w-0">
                                                {item.productImage ? (
                                                    <img
                                                        src={item.productImage}
                                                        title={item.productName}
                                                        className="w-14 h-14 rounded-l-[10px] !rounded-r-none border-none"
                                                    />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-l-[10px] bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                                                        IMG
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold line-clamp-1">
                                                        {item.productName}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        SL: {item.quantity}
                                                    </div>
                                                </div>
                                            </Flex>
                                            <Text className="font-semibold whitespace-nowrap">
                                                {formatCurrency(item.subtotal ?? item.price)}
                                            </Text>
                                        </Flex>
                                    ))}
                                </Space>

                                <Flex
                                    justify="end"
                                    align="center"
                                    gap={8}
                                    className="!mt-4 pt-3"
                                >
                                    <Text type="secondary" className='!text-gray-600'>Tổng cộng:</Text>
                                    <Text className="font-semibold text-[var(--primary)]">
                                        {formatCurrency(selectedOrder.total)}
                                    </Text>
                                </Flex>
                            </Col>
                        </Row>
                    </div>
                )}
            </Modal>

            <Modal
                open={cancelOpen}
                onCancel={() => setCancelOpen(false)}
                onOk={handleCancel}
                okText={t('cancelModal.confirm')}
                confirmLoading={isCancelling}
                title={t('cancelModal.title')}
            >
                <TextArea
                    rows={4}
                    value={cancelReason}
                    placeholder={t('cancelModal.placeholder')}
                    onChange={(e) => setCancelReason(e.target.value)}
                />
            </Modal>
        </Flex>
    )
}

function statusTagColor(status: EOrderStatus) {
    switch (status) {
        case EOrderStatus.pending:
            return 'gold'
        case EOrderStatus.confirmed:
            return 'blue'
        case EOrderStatus.processing:
            return 'cyan'
        case EOrderStatus.shipping:
            return 'geekblue'
        case EOrderStatus.delivered:
            return 'green'
        case EOrderStatus.cancelled:
            return 'red'
        case EOrderStatus.refunded:
            return 'volcano'
        default:
            return 'default'
    }
}

function paymentTagColor(status: EPaymentStatus) {
    switch (status) {
        case EPaymentStatus.pending:
            return 'gold'
        case EPaymentStatus.paid:
            return 'green'
        case EPaymentStatus.failed:
            return 'red'
        case EPaymentStatus.refunded:
            return 'volcano'
        default:
            return 'default'
    }
}

function statusLabel(status: EOrderStatus) {
    switch (status) {
        case EOrderStatus.pending:
            return 'Chờ xác nhận'
        case EOrderStatus.confirmed:
            return 'Đã xác nhận'
        case EOrderStatus.processing:
            return 'Đang xử lý'
        case EOrderStatus.shipping:
            return 'Đang giao'
        case EOrderStatus.delivered:
            return 'Đã giao'
        case EOrderStatus.cancelled:
            return 'Đã huỷ'
        case EOrderStatus.refunded:
            return 'Đã hoàn tiền'
        default:
            return status
    }
}

function paymentLabel(status: EPaymentStatus) {
    switch (status) {
        case EPaymentStatus.pending:
            return 'Chờ thanh toán'
        case EPaymentStatus.paid:
            return 'Đã thanh toán'
        case EPaymentStatus.failed:
            return 'Thất bại'
        case EPaymentStatus.refunded:
            return 'Đã hoàn tiền'
        default:
            return status
    }
}
