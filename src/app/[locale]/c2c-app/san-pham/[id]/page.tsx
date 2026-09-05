'use client'

import RichTextContent from '@/components/RichTextContent'
import { useMe } from '@/hooks/use-me'
import { showMessage } from '@/hooks/use-message'
import { loginModalAtom } from '@/stores'
import { UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Skeleton, Tag } from 'antd'
import { useSetAtom } from 'jotai'
import { Clock, MessageCircle, Phone, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const conditionStyle: Record<string, { bg: string; text: string }> = {
    new: { bg: '#e1f5ee', text: '#085041' },
    like_new: { bg: '#e7edff', text: '#2540a8' },
    used: { bg: '#fdf1e0', text: '#8a5a00' },
}

const conditionLabel: Record<string, string> = {
    new: 'Mới',
    like_new: 'Như mới',
    used: 'Đã dùng',
}

const statusLabel: Record<string, string> = {
    pending: 'Đang chờ duyệt',
    sold: 'Đã bán',
    hidden: 'Đã ẩn',
    rejected: 'Bị từ chối',
}

function DetailSkeleton() {
    return (
        <div className="mx-auto flex max-w-4xl gap-5 px-4 py-8">
            <div className="flex-1">
                <Skeleton.Image
                    active
                    className="!h-[280px] !w-full [&_.ant-skeleton-image]:!h-[280px] [&_.ant-skeleton-image]:!w-full"
                />
                <Skeleton
                    active
                    className="mt-4"
                    paragraph={{ rows: 4 }}
                />
            </div>
            <div className="w-[220px] flex-none">
                <Skeleton
                    active
                    avatar
                    paragraph={{ rows: 2 }}
                />
            </div>
        </div>
    )
}

export default function ProductDetailPage() {
    const params = useParams()
    const id = params?.id
    const [product, setProduct] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showContact, setShowContact] = useState(false)
    const [activeImage, setActiveImage] = useState(0)
    const zoomImageRef = useRef<HTMLImageElement>(null)
    const { user } = useMe()
    const setLoginOpen = useSetAtom(loginModalAtom)
    const router = useRouter()
    const [interestLoading, setInterestLoading] = useState(false)
    const [interestStatus, setInterestStatus] = useState<string | null>(null)

    const handleZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const img = zoomImageRef.current
        if (!img) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        img.style.transformOrigin = `${x}% ${y}%`
    }

    useEffect(() => {
        if (!id) return
        fetch(`/api/c2c/products/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    if (data.data.status !== 'active') {
                        router.replace('/')
                        return
                    }
                    setProduct(data.data)
                }
            })
            .finally(() => setLoading(false))
    }, [id])

    useEffect(() => {
        if (!id || !user?._id) {
            setInterestStatus(null)
            return
        }
        fetch(`/api/c2c/interests?productId=${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) setInterestStatus(data.data?.status || null)
            })
    }, [id, user?._id])

    const openChatWithSeller = () => {
        if (!user) {
            setLoginOpen(true)
            return
        }
        if (!product?.seller) return
        window.dispatchEvent(
            new CustomEvent('messenger:open', { detail: product.seller }),
        )
    }

    const registerInterest = async () => {
        if (!user) {
            setLoginOpen(true)
            return
        }
        setInterestLoading(true)
        try {
            const res = await fetch('/api/c2c/interests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: id }),
            })
            const data = await res.json()
            if (data.success) setInterestStatus('pending')
            data.success
                ? showMessage.success(
                    'Đã đăng ký mua, hãy chờ người bán xác nhận',
                )
                : showMessage.error(data.message)
        } finally {
            setInterestLoading(false)
        }
    }

    if (loading) return <DetailSkeleton />
    if (!product)
        return (
            <div className="py-20 text-center text-red-500">
                Không tìm thấy tin đăng này
            </div>
        )

    const cond = conditionStyle[product.condition] || conditionStyle.used
    const images: string[] = product.images?.length ? product.images : []
    const isOwner = Boolean(
        user?._id &&
        product.seller?._id &&
        String(user._id) === String(product.seller._id),
    )

    return (
        <div className="mx-auto max-w-6xl px-16 pb-6 max-md:max-w-none max-md:px-3">
            <Link
                href="/"
                className="mb-4 inline-block text-[14px] !text-gray-600 hover:text-[#218daf]"
            >
                &larr;&nbsp; Quay lại danh sách
            </Link>

            <div className="flex flex-col gap-6 md:flex-row">
                {/* Left: gallery + info */}
                <div className="min-w-0 flex-1">
                    <div className="grid grid-cols-6 gap-5 w-full">
                        <div
                            className="group col-span-5 relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-[#e2e7eb] bg-[#f8fafb] md:aspect-auto"
                            onMouseMove={handleZoomMove}
                        >
                            {images[activeImage] ? (
                                <img
                                    ref={zoomImageRef}
                                    src={images[activeImage]}
                                    alt={product.title}
                                    className="h-full w-full object-cover transition-transform duration-150 ease-out group-hover:scale-[2.2]"
                                />
                            ) : (
                                <span className="text-sm text-gray-400 h-[300px] flex items-center justify-center">
                                    Không có ảnh
                                </span>
                            )}
                            {product.status && product.status !== 'active' && (
                                <span className="absolute left-2.5 top-2.5 rounded-md bg-[#f4511e] px-2.5 py-1 text-[11px] font-semibold text-white">
                                    {statusLabel[product.status] ||
                                        product.status}
                                </span>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="flex-col flex gap-2">
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveImage(i)}
                                        className={`aspect-square cursor-pointer overflow-hidden rounded-lg border-2 ${i === activeImage
                                            ? 'border-[#f4511e]'
                                            : 'border-[#e2e7eb]'
                                            }`}
                                    >
                                        <img
                                            src={img}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-5">
                        <h1 className="mb-2 text-xl font-semibold text-[#082c40]">
                            {product.title}
                        </h1>
                        <div className="mb-3 text-2xl font-bold text-[#f4511e]">
                            {product.price.toLocaleString('vi-VN')} đ
                        </div>
                        <div className="mb-4 flex flex-wrap items-center gap-3">
                            <span
                                className="rounded-md px-2.5 py-1 text-[12px] font-medium"
                                style={{
                                    background: cond.bg,
                                    color: cond.text,
                                }}
                            >
                                Tình trạng:{' '}
                                {conditionLabel[product.condition] ||
                                    conditionLabel.used}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock size={13} />
                                Đăng ngày{' '}
                                {new Date(product.createdAt).toLocaleDateString(
                                    'vi-VN',
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-[#e2e7eb] pt-4">
                        <h3 className="mb-2 text-[13.5px] font-semibold text-[#082c40]">
                            Mô tả chi tiết
                        </h3>
                        <div className="text-[13px] leading-7 text-[#354951]">
                            {product.description ? (
                                <RichTextContent html={product.description} />
                            ) : (
                                'Người bán chưa thêm mô tả'
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: seller + contact */}
                <div className="w-full flex-none md:sticky md:top-42 md:h-fit md:w-[220px]">
                    <div className="mb-3 rounded-xl border border-[#e2e7eb] p-4">
                        <div className="mb-3 flex items-center gap-2.5">
                            <Avatar
                                size={44}
                                src={product.seller?.avatar}
                                icon={<UserOutlined />}
                                className="!shrink-0 !rounded-full overflow-hidden"
                            />
                            <div className="flex items-center justify-between w-full">
                                <div className="min-w-0">
                                    <div className="flex min-w-0 items-center gap-2 text-[13.5px] font-semibold text-[#082c40]">
                                        {product.seller?.fullName}
                                    </div>
                                    <div className="text-[11px] text-gray-400">
                                        Thành viên
                                    </div>
                                </div>
                                {isOwner && (
                                    <Tag
                                        color="orange"
                                        variant="outlined"
                                        className="mr-0"
                                    >
                                        Bạn
                                    </Tag>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                if (!user) {
                                    setLoginOpen(true)
                                    return
                                }
                                setShowContact(true)
                            }}
                            className="mb-2 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#f4511e] text-[13px] font-semibold text-white hover:opacity-90"
                        >
                            <Phone size={15} />
                            {showContact
                                ? product.contactInfo
                                : 'Bấm để xem SĐT'}
                        </button>
                        {!isOwner && (
                            <Button
                                loading={interestLoading}
                                disabled={
                                    interestStatus === 'pending' ||
                                    interestStatus === 'confirmed'
                                }
                                onClick={registerInterest}
                                className="!mb-2 !h-auto !min-h-10 !w-full !rounded-full !border-none !bg-[#2878d7] !px-3 !py-2 !font-semibold !leading-5 !text-white !whitespace-normal disabled:!bg-[#11335b] disabled:!text-gray-300"
                            >
                                {interestStatus == 'pending'
                                    ? 'Đã đăng ký'
                                    : interestStatus === 'confirmed'
                                        ? 'Đã được xác nhận'
                                        : 'Đăng ký mua'}
                            </Button>
                        )}
                        <button
                            onClick={openChatWithSeller}
                            disabled={isOwner}
                            className="cursor-pointer flex h-[38px] w-full items-center justify-center gap-2 rounded-full border border-[#218daf] text-[13px] font-semibold text-[#218daf] hover:bg-[#218daf]/5 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
                        >
                            <MessageCircle size={15} />
                            Nhắn tin
                        </button>
                        <div className="mt-2 text-center text-[11px] text-gray-400">
                            Liên hệ trực tiếp với người bán
                        </div>
                    </div>

                    <div className="rounded-xl border border-[#e2e7eb] bg-[#f8fafb] p-4">
                        <div className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-[#082c40]">
                            <ShieldCheck
                                size={15}
                                className="text-[#218daf]"
                            />
                            Mẹo an toàn giao dịch
                        </div>
                        <ul className="list-disc space-y-1.5 pl-4 text-[11.5px] leading-relaxed text-gray-500">
                            <li>Kiểm tra kỹ sản phẩm trước khi thanh toán</li>
                            <li>Gặp mặt tại nơi công khai, an toàn</li>
                            <li>Không chuyển khoản đặt cọc trước</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
