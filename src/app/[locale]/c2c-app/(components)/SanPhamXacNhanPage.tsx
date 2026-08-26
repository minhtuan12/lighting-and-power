'use client'

import { Button, Checkbox, Empty, Tag } from 'antd'
import { CircleArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

export default function SanPhamXacNhanPage() {
    const [items, setItems] = useState<any[]>([])
    const [selected, setSelected] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const load = () =>
        fetch('/api/c2c/interests')
            .then((r) => r.json())
            .then((d) => setItems(d.success ? d.data : []))
            .finally(() => setLoading(false))
    useEffect(() => {
        load()
    }, [])
    const chosen = useMemo(
        () => items.filter((i) => selected.includes(i._id)),
        [items, selected],
    )
    const total = chosen.reduce((sum, i) => sum + (i.productId?.price || 0), 0)
    if (loading)
        return (
            <div className="py-12 text-center text-gray-500">Đang tải...</div>
        )
    return (
        <div className="space-y-4">
            <div className="text-right w-full">
                <span className="text-gray-500">{items.length} sản phẩm</span>
            </div>
            {!items.length ? (
                <Empty description="Chưa có sản phẩm được xác nhận" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
                items.map((interest: any) => {
                    const p = interest.productId
                    const expired =
                        new Date(interest.expiresAt).getTime() <= Date.now()
                    return (
                        <div
                            key={interest._id}
                            className={`flex items-center gap-4 rounded-2xl border p-4 ${expired ? 'opacity-45' : 'bg-white'}`}
                        >
                            <Checkbox
                                disabled={expired}
                                checked={selected.includes(interest._id)}
                                onChange={(e) =>
                                    setSelected((v) =>
                                        e.target.checked
                                            ? [...v, interest._id]
                                            : v.filter(
                                                (x) => x !== interest._id,
                                            ),
                                    )
                                }
                            />
                            <div className="h-16 w-16 rounded-xl bg-gray-50" />{' '}
                            <div className="min-w-0 flex-1">
                                <div className="font-semibold">{p?.title}</div>
                                <div className="font-semibold text-[#b02b2b]">
                                    {p?.price?.toLocaleString('vi-VN')} đ
                                </div>
                                <div className="text-sm text-gray-500">
                                    Người bán:{' '}
                                    {p?.sellerId?.fullName ||
                                        p?.sellerId?.username}
                                </div>
                            </div>
                            <Tag color={expired ? 'default' : 'gold'}>
                                {expired
                                    ? 'Hết hạn'
                                    : `Còn ${Math.max(0, Math.ceil((new Date(interest.expiresAt).getTime() - Date.now()) / 36e5))} giờ`}
                            </Tag>
                        </div>
                    )
                })
            )}
            <div className="flex items-center justify-between rounded-2xl border bg-white p-4">
                <span>
                    Đã chọn {chosen.length} sản phẩm ·{' '}
                    <b>{total.toLocaleString('vi-VN')} đ</b>
                </span>
                <Button
                    type="link"
                    disabled={!chosen.length}
                    onClick={() =>
                        router.push(
                            `/c2c-app/dat-hang?ids=${selected.join(',')}`,
                        )
                    }
                    className="!rounded-full !bg-transparent"
                >
                    Tạo đơn hàng <CircleArrowRight size={20} />
                </Button>
            </div>
        </div>
    )
}
