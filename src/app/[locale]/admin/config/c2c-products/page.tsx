'use client'

import { Avatar, Button, message, Modal, Space, Table, Tabs, Tag } from "antd"
import { Check, Eye, User, X } from "lucide-react"
import { useEffect, useState } from "react"

export default function AdminC2CProductsPage() {
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState("pending")
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
    const [selectedProduct, setSelectedProduct] = useState<any>(null)

    const fetchProducts = (status: string, page: number = 1) => {
        setLoading(true)
        fetch(`/api/admin/c2c-products?status=${status}&page=${page}&limit=${pagination.pageSize}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setProducts(data.data.products)
                    setPagination({
                        ...pagination,
                        current: data.data.page,
                        total: data.data.total
                    })
                }
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchProducts(statusFilter, 1)
    }, [statusFilter])

    const handleTableChange = (newPagination: any) => {
        fetchProducts(statusFilter, newPagination.current)
    }

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/admin/c2c-products/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            })
            const data = await res.json()
            if (data.success) {
                message.success(newStatus === "active" ? "Đã duyệt tin" : "Đã từ chối tin")
                fetchProducts(statusFilter, pagination.current)
            } else {
                throw new Error(data.message)
            }
        } catch (err: any) {
            message.error(err.message || "Có lỗi xảy ra")
        }
    }

    const columns = [
        {
            title: "Người đăng",
            key: "seller",
            render: (_: any, record: any) => (
                <div className="flex items-center gap-2">
                    <Avatar src={record.sellerId?.avatar} icon={<User size={14} />} />
                    <span>{record.sellerId?.fullName || record.sellerId?.username}</span>
                </div>
            )
        },
        {
            title: "Tiêu đề",
            dataIndex: "title",
            key: "title",
            render: (text: string) => <div className="font-medium max-w-[200px] truncate">{text}</div>
        },
        {
            title: "Giá (VNĐ)",
            dataIndex: "price",
            key: "price",
            render: (val: number) => <span className="font-bold text-red-500">{val?.toLocaleString()}</span>
        },
        {
            title: "Tình trạng",
            dataIndex: "condition",
            key: "condition",
            render: (val: string) => (
                <Tag color={val === 'new' ? 'green' : val === 'like_new' ? 'blue' : 'orange'}>
                    {val === 'new' ? 'Mới 100%' : val === 'like_new' ? 'Như mới' : 'Cũ'}
                </Tag>
            )
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (val: string) => {
                const map: any = {
                    pending: { color: "gold", text: "Chờ duyệt" },
                    active: { color: "green", text: "Đang bán" },
                    rejected: { color: "red", text: "Từ chối" },
                    sold: { color: "default", text: "Đã bán" },
                    hidden: { color: "default", text: "Ẩn" }
                }
                return <Tag color={map[val]?.color}>{map[val]?.text}</Tag>
            }
        },
        {
            title: "Ngày đăng",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (val: string) => new Date(val).toLocaleDateString('vi-VN')
        },
        {
            title: "Thao tác",
            key: "action",
            render: (_: any, record: any) => (
                <Space>
                    <Button
                        size="small"
                        icon={<Eye size={14} />}
                        onClick={() => setSelectedProduct(record)}
                    >
                        Xem
                    </Button>
                    {record.status === "pending" && (
                        <>
                            <Button
                                size="small"
                                type="primary"
                                className="bg-green-600 hover:bg-green-700"
                                icon={<Check size={14} />}
                                onClick={() => updateStatus(record._id, "active")}
                            >
                                Duyệt
                            </Button>
                            <Button
                                size="small"
                                danger
                                icon={<X size={14} />}
                                onClick={() => updateStatus(record._id, "rejected")}
                            >
                                Từ chối
                            </Button>
                        </>
                    )}
                    {record.status === "rejected" && (
                        <Button
                            size="small"
                            type="primary"
                            className="bg-green-600 hover:bg-green-700"
                            icon={<Check size={14} />}
                            onClick={() => updateStatus(record._id, "active")}
                        >
                            Duyệt
                        </Button>
                    )}
                </Space>
            )
        }
    ]

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Duyệt đăng bán sản phẩm</h2>
            </div>

            <Tabs
                activeKey={statusFilter}
                onChange={(k) => setStatusFilter(k)}
                items={[
                    { key: 'pending', label: 'Chờ duyệt' },
                    { key: 'active', label: 'Đang hiển thị' },
                    { key: 'rejected', label: 'Bị từ chối' },
                    { key: 'all', label: 'Tất cả' }
                ]}
            />

            <Table
                columns={columns}
                dataSource={products}
                rowKey="_id"
                loading={loading}
                pagination={{
                    ...pagination,
                    showSizeChanger: false,
                }}
                onChange={handleTableChange}
            />

            <Modal
                title="Chi tiết tin rao vặt"
                open={!!selectedProduct}
                onCancel={() => setSelectedProduct(null)}
                footer={null}
                width={800}
            >
                {selectedProduct && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-bold">{selectedProduct.title}</h3>
                            <div className="text-red-500 font-bold text-xl">{selectedProduct.price?.toLocaleString()} VNĐ</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p><strong>Người đăng:</strong> {selectedProduct.sellerId?.fullName || selectedProduct.sellerId?.username}</p>
                                <p><strong>Liên hệ:</strong> {selectedProduct.contactInfo}</p>
                                <p><strong>Tình trạng:</strong> {selectedProduct.condition === 'new' ? 'Mới 100%' : selectedProduct.condition === 'like_new' ? 'Như mới' : 'Cũ'}</p>
                                <p><strong>Trạng thái:</strong> {selectedProduct.status}</p>
                            </div>
                        </div>

                        {selectedProduct.images?.length > 0 && (
                            <div>
                                <p><strong>Hình ảnh:</strong></p>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {selectedProduct.images.map((img: string, i: number) => (
                                        <img key={i} src={img} alt="Product" className="w-24 h-24 object-cover border rounded" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedProduct.description && (
                            <div>
                                <p><strong>Mô tả:</strong></p>
                                <div
                                    className="p-4 bg-gray-50 rounded border mt-2 max-h-64 overflow-y-auto"
                                    dangerouslySetInnerHTML={{ __html: selectedProduct.description }}
                                />
                            </div>
                        )}

                        {selectedProduct.status === "pending" && (
                            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                                <Button
                                    danger
                                    onClick={() => {
                                        updateStatus(selectedProduct._id, "rejected")
                                        setSelectedProduct(null)
                                    }}
                                >
                                    Từ chối
                                </Button>
                                <Button
                                    type="primary"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                        updateStatus(selectedProduct._id, "active")
                                        setSelectedProduct(null)
                                    }}
                                >
                                    Duyệt cho phép hiển thị
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    )
}
