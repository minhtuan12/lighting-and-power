'use client'

import DefaultImage from '@/components/DefaultImage'
import Loading from '@/components/Loading'
import { useCancelOrder, useOrders } from '@/hooks/user/use-orders'
import { EOrderStatus, EPaymentStatus, IOrder } from '@/types/order'
import {
    Button,
    Col,
    Divider,
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
    Typography,
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
                />
            )}

            <Modal
                open={detailOpen}
                onCancel={() => setDetailOpen(false)}
                footer={null}
                width={820}
                title={t('detail.title')}
            >
                {selectedOrder && (
                    <div className="space-y-4">
                        <Row gutter={20}>
                            <Col span={12}>
                                <Title
                                    level={5}
                                    className="!mb-2"
                                >
                                    {t('detail.customer')}
                                </Title>
                                <div className="text-sm">
                                    <div>
                                        <b>{selectedOrder.customerInfo.name}</b>
                                    </div>
                                    <div>{selectedOrder.customerInfo.phone}</div>
                                    {selectedOrder.customerInfo.email && (
                                        <div>
                                            {selectedOrder.customerInfo.email}
                                        </div>
                                    )}
                                </div>
                            </Col>
                            <Col span={12}>
                                <Title
                                    level={5}
                                    className="!mb-2"
                                >
                                    {t('detail.shipping')}
                                </Title>
                                <div className="text-sm">
                                    {[
                                        selectedOrder.shippingAddress.address,
                                        selectedOrder.shippingAddress.ward,
                                        selectedOrder.shippingAddress.province,
                                    ]
                                        .filter(Boolean)
                                        .join(', ')}
                                </div>
                            </Col>
                        </Row>

                        <Row gutter={20}>
                            <Col span={12}>
                                <Text type="secondary">{t('table.status')}</Text>
                                <div className="mt-1">
                                    <Tag color={statusTagColor(selectedOrder.status)}>
                                        {t(`status.${selectedOrder.status}`)}
                                    </Tag>
                                </div>
                            </Col>
                            <Col span={12}>
                                <Text type="secondary">{t('table.payment')}</Text>
                                <div className="mt-1">
                                    <Tag
                                        color={paymentTagColor(
                                            selectedOrder.paymentStatus,
                                        )}
                                    >
                                        {t(
                                            `paymentStatus.${selectedOrder.paymentStatus}`,
                                        )}
                                    </Tag>
                                </div>
                            </Col>
                        </Row>

                        {selectedOrder.note && (
                            <>
                                <Divider className="!my-3" />
                                <Text type="secondary">{t('detail.note')}</Text>
                                <div className="text-sm mt-1">
                                    {selectedOrder.note}
                                </div>
                            </>
                        )}

                        {selectedOrder.cancelReason && (
                            <>
                                <Divider className="!my-3" />
                                <Text type="secondary">
                                    {t('detail.cancelReason')}
                                </Text>
                                <div className="text-sm mt-1">
                                    {selectedOrder.cancelReason}
                                </div>
                            </>
                        )}

                        <Divider className="!my-3" />

                        <Title
                            level={5}
                            className="!mb-2"
                        >
                            {t('detail.itemsTitle')}
                        </Title>
                        <Table
                            size="small"
                            rowKey={(record) =>
                                `${record.productId}-${record.productName}`
                            }
                            pagination={false}
                            dataSource={selectedOrder.items}
                            columns={[
                                {
                                    title: t('table.items'),
                                    dataIndex: 'productName',
                                    key: 'productName',
                                    render: (value: string, record: any) => (
                                        <Flex
                                            align="center"
                                            gap={10}
                                        >
                                            {record.productImage ? (
                                                <DefaultImage
                                                    src={record.productImage}
                                                    title={record.productName}
                                                    className="w-10 h-10"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-[8px] border border-gray-200 flex items-center justify-center text-[10px] text-gray-400">
                                                    IMG
                                                </div>
                                            )}
                                            <span className="text-sm">
                                                {value}
                                            </span>
                                        </Flex>
                                    ),
                                },
                                {
                                    title: t('detail.quantity'),
                                    dataIndex: 'quantity',
                                    key: 'quantity',
                                    width: 90,
                                },
                                {
                                    title: t('detail.price'),
                                    dataIndex: 'price',
                                    key: 'price',
                                    width: 120,
                                    render: (value: number) =>
                                        formatCurrency(value),
                                },
                                {
                                    title: t('detail.subtotal'),
                                    dataIndex: 'subtotal',
                                    key: 'subtotal',
                                    width: 120,
                                    render: (value: number) =>
                                        formatCurrency(value),
                                },
                            ]}
                        />

                        <Flex
                            justify="space-between"
                            className="!mt-4 border-t pt-4"
                        >
                            <Text type="secondary">{t('table.total')}</Text>
                            <Text className="font-semibold text-[var(--primary)]">
                                {formatCurrency(selectedOrder.total)}
                            </Text>
                        </Flex>
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
