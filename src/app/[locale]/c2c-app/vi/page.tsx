'use client'

import { useEffect, useState } from "react"
import { Card, Button, Table, Tag, Modal, Form, Input, InputNumber, message, Statistic } from "antd"
import { Wallet, ArrowDownToLine, History } from "lucide-react"

export default function WalletPage() {
    const [wallet, setWallet] = useState<any>(null)
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [form] = Form.useForm()

    const fetchWallet = () => {
        setLoading(true)
        fetch("/api/c2c/wallet/me")
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setWallet(data.data.wallet)
                    setTransactions(data.data.transactions)
                    
                    // Populate default bank info if exists
                    form.setFieldsValue({
                        bankCode: data.data.wallet.bankCode,
                        bankAccountName: data.data.wallet.bankAccountName,
                        bankAccountNumber: data.data.wallet.bankAccountNumber
                    })
                }
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchWallet()
    }, [])

    const handlePayout = async (values: any) => {
        if (values.amount > wallet.balance) {
            message.error("Số dư không đủ")
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch("/api/c2c/wallet/payout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values)
            })
            const data = await res.json()
            if (data.success) {
                message.success("Tạo lệnh rút tiền thành công. Vui lòng chờ admin duyệt.")
                setIsModalOpen(false)
                form.resetFields(["amount"])
                fetchWallet()
            } else throw new Error(data.error)
        } catch (error: any) {
            message.error(error.message || "Lỗi rút tiền")
        } finally {
            setSubmitting(false)
        }
    }

    const columns = [
        {
            title: "Mã GD",
            dataIndex: '_id',
            key: 'id',
            render: (val: string) => <span className="text-xs text-gray-500">{val.slice(-6).toUpperCase()}</span>
        },
        {
            title: "Thời gian",
            dataIndex: 'createdAt',
            key: 'date',
            render: (val: string) => <span className="text-gray-500">{new Date(val).toLocaleString('vi-VN')}</span>
        },
        {
            title: "Loại giao dịch",
            dataIndex: 'type',
            key: 'type',
            render: (val: string) => (
                <Tag color={val === 'escrow_release' ? 'green' : val === 'payout' ? 'blue' : 'red'}>
                    {val === 'escrow_release' ? 'Nhận tiền bán hàng' : val === 'payout' ? 'Rút tiền' : 'Hoàn tiền'}
                </Tag>
            )
        },
        {
            title: "Số tiền",
            dataIndex: 'amount',
            key: 'amount',
            render: (val: number, record: any) => (
                <span className={`font-bold ${record.type === 'escrow_release' ? 'text-green-600' : 'text-red-600'}`}>
                    {record.type === 'escrow_release' ? '+' : '-'}{val?.toLocaleString()} đ
                </span>
            )
        },
        {
            title: "Trạng thái",
            dataIndex: 'status',
            key: 'status',
            render: (val: string) => (
                <Tag color={val === 'completed' ? 'green' : val === 'pending' ? 'gold' : 'red'}>
                    {val === 'completed' ? 'Thành công' : val === 'pending' ? 'Đang xử lý' : 'Thất bại'}
                </Tag>
            )
        },
        {
            title: "Ghi chú",
            dataIndex: 'note',
            key: 'note',
            render: (val: string, record: any) => (
                <span className="text-gray-600 text-xs">
                    {val} 
                    {record.referenceOrderId && ` (Đơn ${record.referenceOrderId.payosOrderCode})`}
                </span>
            )
        }
    ]

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Wallet className="text-blue-600" /> Ví C2C (Bán hàng)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg border-0">
                    <Statistic
                        title={<span className="text-blue-100">Số dư khả dụng (VND)</span>}
                        value={wallet?.balance || 0}
                        precision={0}
                        valueStyle={{ color: '#fff', fontSize: '2.5rem', fontWeight: 'bold' }}
                        suffix="đ"
                        loading={loading}
                    />
                    <div className="mt-6 flex justify-between items-end">
                        <div>
                            <div className="text-blue-200 text-sm">Đang chờ rút</div>
                            <div className="font-medium text-lg">{wallet?.frozenBalance?.toLocaleString() || 0} đ</div>
                        </div>
                        <Button 
                            type="primary" 
                            className="bg-white text-blue-600 hover:!bg-gray-100 hover:!text-blue-700 border-none font-bold flex items-center gap-2 h-10 px-6"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <ArrowDownToLine size={18} /> Rút Tiền
                        </Button>
                    </div>
                </Card>

                <Card title="Hướng dẫn rút tiền" className="shadow-sm border-gray-200">
                    <ul className="list-disc pl-5 text-gray-600 space-y-2">
                        <li>Số dư khả dụng là số tiền bạn nhận được từ việc bán hàng thành công (khi người mua xác nhận đã nhận hàng).</li>
                        <li>Lệnh rút tiền sẽ được xử lý thủ công bởi Admin trong vòng <b>24-48 giờ</b> làm việc.</li>
                        <li>Đảm bảo nhập chính xác thông tin tài khoản ngân hàng để tránh thất lạc tiền.</li>
                    </ul>
                </Card>
            </div>

            <Card title={<div className="flex items-center gap-2"><History size={18}/> Lịch sử giao dịch</div>} className="shadow-sm">
                <Table
                    className="custom-table"
                    columns={columns}
                    dataSource={transactions}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10, hideOnSinglePage: true }}
                />
            </Card>

            <Modal
                title={<div className="text-lg font-bold">Tạo lệnh rút tiền</div>}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                destroyOnClose
            >
                <div className="bg-blue-50 p-4 rounded-lg mb-6 text-center">
                    <div className="text-gray-500 mb-1">Số dư khả dụng</div>
                    <div className="text-2xl font-bold text-blue-600">{wallet?.balance?.toLocaleString() || 0} đ</div>
                </div>

                <Form form={form} layout="vertical" onFinish={handlePayout}>
                    <Form.Item 
                        name="amount" 
                        label="Số tiền cần rút" 
                        rules={[
                            { required: true, message: 'Vui lòng nhập số tiền' },
                            { type: 'number', min: 10000, message: 'Số tiền rút tối thiểu 10.000đ' }
                        ]}
                    >
                        <InputNumber
                            className="w-full"
                            size="large"
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                            addonAfter="VND"
                        />
                    </Form.Item>

                    <Form.Item name="bankCode" label="Tên Ngân Hàng (VD: Vietcombank, Techcombank)" rules={[{ required: true, message: 'Vui lòng nhập tên ngân hàng' }]}>
                        <Input size="large" />
                    </Form.Item>

                    <Form.Item name="bankAccountNumber" label="Số tài khoản" rules={[{ required: true, message: 'Vui lòng nhập số tài khoản' }]}>
                        <Input size="large" />
                    </Form.Item>

                    <Form.Item name="bankAccountName" label="Tên chủ tài khoản (Viết hoa không dấu)" rules={[{ required: true, message: 'Vui lòng nhập tên chủ tài khoản' }]}>
                        <Input size="large" className="uppercase" />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" className="w-full h-12 text-lg font-bold mt-2" loading={submitting}>
                        Gửi yêu cầu rút tiền
                    </Button>
                </Form>
            </Modal>
        </div>
    )
}
