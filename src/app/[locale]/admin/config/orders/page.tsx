"use client"

import DefaultImage from "@/components/DefaultImage"
import SearchBar from "@/components/SearchBar"
import { PAGE_LIMIT } from "@/constants/common"
import { routes } from "@/constants/routes"
import { useAdminOrders } from "@/hooks/admin/use-orders"
import useDebounce from "@/hooks/use-debounce"
import { showMessage } from "@/hooks/use-message"
import { getProvinceAndWardNameByCode } from "@/lib/utils"
import { breadcrumbAtom } from "@/stores/ui"
import { EOrderStatus, EPaymentStatus, IOrder } from "@/types/order"
import { LoadingOutlined } from "@ant-design/icons"
import { Card, Col, Flex, Image, Input, Modal, Row, Select, Table, Tag, Typography } from "antd"
import { useSetAtom } from "jotai"
import { useCallback, useEffect, useMemo, useState } from "react"

const { Text, Title } = Typography
const { TextArea } = Input

const STATUS_OPTIONS: { value: EOrderStatus; label: string; color: string }[] = [
    { value: EOrderStatus.pending, label: "Chờ xác nhận", color: "gold" },
    { value: EOrderStatus.confirmed, label: "Đã xác nhận", color: "blue" },
    { value: EOrderStatus.processing, label: "Đang xử lý", color: "cyan" },
    { value: EOrderStatus.shipping, label: "Đang giao", color: "geekblue" },
    { value: EOrderStatus.delivered, label: "Đã giao", color: "green" },
    { value: EOrderStatus.cancelled, label: "Đã hủy", color: "red" },
    { value: EOrderStatus.refunded, label: "Hoàn tiền", color: "volcano" },
]

const PAYMENT_STATUS_OPTIONS: {
    value: EPaymentStatus
    label: string
    color: string
}[] = [
        { value: EPaymentStatus.pending, label: "Chờ thanh toán", color: "gold" },
        { value: EPaymentStatus.paid, label: "Đã thanh toán", color: "green" },
        { value: EPaymentStatus.failed, label: "Thất bại", color: "red" },
        { value: EPaymentStatus.refunded, label: "Hoàn tiền", color: "volcano" },
    ]

const AdminOrders = () => {
    const setBreadcrumb = useSetAtom(breadcrumbAtom)
    const [searchText, setSearchText] = useState("")
    const [debounceSearchText, setDebounceSearchText] = useState("")
    const [statusFilter, setStatusFilter] = useState<EOrderStatus | "all">(
        "all",
    )
    const [paymentFilter, setPaymentFilter] = useState<EPaymentStatus | "all">(
        "all",
    )
    const [page, setPage] = useState(1)
    const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null)
    const [pendingStatus, setPendingStatus] = useState<EOrderStatus | null>(null)
    const [cancelReason, setCancelReason] = useState("")
    const [statusModalOpen, setStatusModalOpen] = useState(false)
    const [address, setAddress] = useState({ provinceName: '', wardName: '' });

    useEffect(() => {
        if (selectedOrder) {
            getProvinceAndWardNameByCode(
                Number(selectedOrder.shippingAddress.province),
                Number(selectedOrder.shippingAddress.ward),
            ).then((res) => setAddress(res))
        }
    }, [selectedOrder]);

    const { data, isLoading, isFetching, updateStatusAsync, isUpdating } =
        useAdminOrders({
            page,
            limit: PAGE_LIMIT,
            search: debounceSearchText,
            status: statusFilter,
            paymentStatus: paymentFilter,
        })

    const debounceSearch = useDebounce((value: string) => {
        setDebounceSearchText(value)
    }, 300)

    const handleSearch = useCallback(
        (value: string) => {
            setSearchText(value)
            debounceSearch(value)
            setPage(1)
        },
        [debounceSearch],
    )

    const handleStatusChange = (record: IOrder, value: EOrderStatus) => {
        if (record.status === value) return

        if (value === EOrderStatus.cancelled) {
            setSelectedOrder(record)
            setPendingStatus(value)
            setCancelReason("")
            setStatusModalOpen(true)
            return
        }

        updateStatusAsync({ id: record._id as string, status: value })
            .then(() => showMessage.success("Cập nhật trạng thái thành công"))
            .catch((err: any) =>
                showMessage.error(err?.message || "Cập nhật thất bại"),
            )
    }

    const handleConfirmStatus = async () => {
        if (!selectedOrder || !pendingStatus) return

        if (pendingStatus === EOrderStatus.cancelled && !cancelReason.trim()) {
            showMessage.warning("Vui lòng nhập lý do hủy")
            return
        }

        try {
            await updateStatusAsync({
                id: selectedOrder._id as string,
                status: pendingStatus,
                cancelReason: cancelReason.trim(),
            })
            showMessage.success("Cập nhật trạng thái thành công")
            setStatusModalOpen(false)
            setPendingStatus(null)
        } catch (err: any) {
            showMessage.error(err?.message || "Cập nhật thất bại")
        }
    }

    const columns = useMemo(
        () => [
            {
                title: "Mã đơn",
                dataIndex: "orderNumber",
                key: "orderNumber",
                width: 150,
                render: (text: string) => (
                    <div className="font-semibold text-gray-900">{text}</div>
                ),
            },
            {
                title: "Khách hàng",
                key: "customerInfo",
                width: 220,
                render: (_: any, record: IOrder) => (
                    <div>
                        <div className="font-semibold text-gray-900">
                            {record.customerInfo?.name}
                        </div>
                        <div className="text-gray-500 text-sm">
                            {record.customerInfo?.phone}
                        </div>
                    </div>
                ),
            },
            {
                title: "Sản phẩm",
                key: "items",
                width: 300,
                render: (_: any, record: IOrder) => {
                    const first = record.items?.[0]
                    return (
                        <div className="flex items-center gap-3">
                            {first?.productImage ? (
                                <DefaultImage
                                    src={first.productImage}
                                    title={first.productName}
                                    className="w-10 h-10"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-[8px] border border-gray-200 flex items-center justify-center text-[10px] text-gray-400">
                                    IMG
                                </div>
                            )}
                            <div className="min-w-0">
                                <div className="text-sm font-semibold line-clamp-1">
                                    {first?.productName || "-"}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {record.items?.length || 0} sản phẩm
                                </div>
                            </div>
                        </div>
                    )
                },
            },
            {
                title: "Tổng tiền",
                dataIndex: "total",
                key: "total",
                align: 'right' as const,
                width: 180,
                render: (value: number) => (
                    <div className="font-semibold">
                        {value?.toLocaleString("vi-VN")} VND
                    </div>
                ),
            },
            {
                title: "Thanh toán",
                dataIndex: "paymentStatus",
                key: "paymentStatus",
                width: 140,
                align: "center" as const,
                render: (status: EPaymentStatus) => {
                    const item = PAYMENT_STATUS_OPTIONS.find(
                        (opt) => opt.value === status,
                    )
                    return (
                        <Tag color={item?.color || "default"} variant="outlined">
                            {item?.label || status}
                        </Tag>
                    )
                },
            },
            {
                title: "Trạng thái",
                dataIndex: "status",
                key: "status",
                width: 170,
                align: "center" as const,
                render: (status: EOrderStatus, record: IOrder) => (
                    <Select
                        value={status}
                        className="min-w-[150px]"
                        onChange={(value) =>
                            handleStatusChange(record, value as EOrderStatus)
                        }
                        options={STATUS_OPTIONS.map((opt) => ({
                            label: opt.label,
                            value: opt.value,
                        }))}
                    />
                ),
            },
            {
                title: "Ngày tạo",
                dataIndex: "createdAt",
                key: "createdAt",
                width: 160,
                align: "center" as const,
                render: (date: string) => (
                    <div className="text-gray-500 text-sm">
                        {new Date(date).toLocaleString("vi-VN")}
                    </div>
                ),
            },
            {
                title: "Thao tác",
                key: "action",
                width: 110,
                align: "center" as const,
                render: (_: any, record: IOrder) => (
                    <button
                        onClick={() => setSelectedOrder(record)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors cursor-pointer"
                    >
                        Chi tiết
                    </button>
                ),
            },
        ],
        [],
    )

    useEffect(() => {
        setBreadcrumb([
            {
                key: routes.order.url,
                title: routes.order.title,
            },
        ])
    }, [setBreadcrumb])

    return (
        <div className="bg-gray-50">
            <Card
                variant="borderless"
                className="rounded-xl shadow-sm [&>.ant-card-body]:!pb-2"
            >
                <div className="mb-6">
                    <div className="flex flex-wrap gap-3 items-center justify-between w-full">
                        <SearchBar
                            className="!w-80"
                            value={searchText}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Tìm theo mã đơn hoặc khách hàng"
                        />
                        <div className="flex gap-3">
                            <Select
                                value={statusFilter}
                                className="min-w-[170px]"
                                onChange={(value) => {
                                    setStatusFilter(value as any)
                                    setPage(1)
                                }}
                                options={[
                                    { label: "Tất cả trạng thái", value: "all" },
                                    ...STATUS_OPTIONS.map((opt) => ({
                                        label: opt.label,
                                        value: opt.value,
                                    })),
                                ]}
                            />
                            <Select
                                value={paymentFilter}
                                className="min-w-[190px]"
                                onChange={(value) => {
                                    setPaymentFilter(value as any)
                                    setPage(1)
                                }}
                                options={[
                                    {
                                        label: "Tất cả thanh toán",
                                        value: "all",
                                    },
                                    ...PAYMENT_STATUS_OPTIONS.map((opt) => ({
                                        label: opt.label,
                                        value: opt.value,
                                    })),
                                ]}
                            />
                        </div>
                    </div>
                </div>

                <Table
                    rowKey={"_id"}
                    loading={{
                        indicator: <LoadingOutlined />,
                        spinning: isLoading || isFetching || isUpdating,
                    }}
                    columns={columns as any}
                    dataSource={data?.orders || []}
                    pagination={{
                        current: page,
                        pageSize: PAGE_LIMIT,
                        total: data?.total || 0,
                        onChange: (nextPage) => setPage(nextPage),
                        showTotal: (total) => `Tổng: ${total} đơn hàng`,
                        className: "!mt-6 !px-6 !text-black custom-pagination",
                    }}
                    className="custom-table rounded-lg"
                    scroll={{ y: "calc(100vh - 340px)" }}
                />
            </Card>

            <Modal
                open={!!selectedOrder}
                onCancel={() => setSelectedOrder(null)}
                footer={null}
                title="Chi tiết đơn hàng"
                width={850}
            >
                {selectedOrder && (
                    <div className="space-y-4">
                        <Row gutter={50} className="mt-4">
                            <Col span={10}>
                                <Title level={5} className="!mb-2 !text-blue-900">
                                    Thông tin khách hàng
                                </Title>
                                <Flex orientation="vertical" gap={10}>
                                    <div className="text-[15px]">
                                        <b>Họ tên: </b>{selectedOrder.customerInfo.name}
                                    </div>
                                    <div className="text-[15px]">
                                        <b>Số điện thoại: </b>{selectedOrder.customerInfo.phone}
                                    </div>
                                    {selectedOrder.customerInfo.email && (<div className="text-[15px]">
                                        <b>Email:</b>{selectedOrder.customerInfo.email}
                                    </div>
                                    )}
                                    <div className="text-[15px]">
                                        <b>Địa chỉ giao hàng:</b> {[
                                            selectedOrder.shippingAddress.address,
                                            address.wardName,
                                            address.provinceName,
                                        ]
                                            .filter(Boolean)
                                            .join(", ")}
                                    </div>
                                    <div className="text-[15px] flex items-center gap-2">
                                        <b>Trạng thái: </b>
                                        <Tag
                                            color={
                                                STATUS_OPTIONS.find(
                                                    (i) => i.value === selectedOrder.status,
                                                )?.color || "default"
                                            }
                                            variant="outlined"
                                        >
                                            {
                                                STATUS_OPTIONS.find(
                                                    (i) => i.value === selectedOrder.status,
                                                )?.label
                                            }
                                        </Tag>
                                    </div>
                                    <div className="text-[15px] flex items-center gap-2">
                                        <b>Thanh toán: </b>
                                        <Tag
                                            color={
                                                PAYMENT_STATUS_OPTIONS.find(
                                                    (i) =>
                                                        i.value ===
                                                        selectedOrder.paymentStatus,
                                                )?.color || "default"
                                            }
                                            variant="outlined"
                                        >
                                            {
                                                PAYMENT_STATUS_OPTIONS.find(
                                                    (i) =>
                                                        i.value ===
                                                        selectedOrder.paymentStatus,
                                                )?.label
                                            }
                                        </Tag>
                                    </div>
                                    {selectedOrder.note && (
                                        <div className="text-[15px] flex items-center gap-2">
                                            <b>Ghi chú: </b>
                                            {selectedOrder.note}
                                        </div>
                                    )}
                                    {selectedOrder.cancelReason && (
                                        <div className="text-[15px] flex items-center gap-2">
                                            <b className="!text-[red]">Lý do hủy: </b>
                                            {selectedOrder.cancelReason}
                                        </div>
                                    )}
                                </Flex>
                            </Col>
                            <Col span={14}>
                                <Title level={5} className="!mb-2 !text-blue-900">
                                    Sản phẩm
                                </Title>
                                <div className="space-y-3">
                                    {selectedOrder.items?.map((item) => (
                                        <div
                                            key={`${item.productId}-${item.productName}`}
                                            className="flex items-center justify-between border rounded-sm p-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                {item.productImage ? (
                                                    // <DefaultImage
                                                    //     src={item.productImage}
                                                    //     title={item.productName}
                                                    //     className="w-10 h-10"
                                                    // />
                                                    <Image src={item.productImage} className="!w-14 !h-14 rounded-sm" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-[8px] border border-gray-200 flex items-center justify-center text-[10px] text-gray-400">
                                                        IMG
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-semibold text-gray-900">
                                                        {item.productName}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        SL: {item.quantity}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-sm font-semibold">
                                                {item.subtotal?.toLocaleString(
                                                    "vi-VN",
                                                )}{" "}
                                                VND
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Col>
                        </Row>
                    </div>
                )}
            </Modal>

            <Modal
                open={statusModalOpen}
                onCancel={() => setStatusModalOpen(false)}
                onOk={handleConfirmStatus}
                confirmLoading={isUpdating}
                title="Cập nhật trạng thái"
                okText="Xác nhận"
            >
                <div className="space-y-4">
                    <div>
                        <div className="text-xs text-gray-400 mb-1">
                            Trạng thái mới
                        </div>
                        <Select
                            value={pendingStatus || undefined}
                            className="w-full"
                            onChange={(value) =>
                                setPendingStatus(value as EOrderStatus)
                            }
                            options={STATUS_OPTIONS.map((opt) => ({
                                label: opt.label,
                                value: opt.value,
                            }))}
                        />
                    </div>

                    {pendingStatus === EOrderStatus.cancelled && (
                        <div>
                            <div className="text-xs text-gray-400 mb-1">
                                Lý do hủy
                            </div>
                            <TextArea
                                rows={3}
                                value={cancelReason}
                                onChange={(e) =>
                                    setCancelReason(e.target.value)
                                }
                                placeholder="Nhập lý do hủy đơn hàng"
                            />
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    )
}

export default AdminOrders
