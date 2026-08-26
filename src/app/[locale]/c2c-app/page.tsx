'use client'

import { Icon } from '@/components/Icon'
import { useMe } from '@/hooks/use-me'
import { loginModalAtom } from '@/stores'
import { UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Col, Dropdown, Row, Skeleton } from 'antd'
import { useSetAtom } from 'jotai'
import {
    ArrowUpDown,
    Check,
    ChevronDown,
    Clock,
    Plus,
    TrendingDown,
    TrendingUp,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import DangBanModal from './DangBanModal'

const conditionStyle: Record<string, { bg: string; text: string }> = {
    new: { bg: '#e1f5ee', text: '#085041' },
    like_new: { bg: '#e7edff', text: '#2540a8' },
    used: { bg: '#fdf1e0', text: '#8a5a00' },
}

const SKELETON_COUNT = 8

const sortOptions = [
    { value: 'newest', icon: Clock, key: 'sortNewest' },
    { value: 'oldest', icon: Clock, key: 'sortOldest' },
    { value: 'price_asc', icon: TrendingUp, key: 'sortPriceAsc' },
    { value: 'price_desc', icon: TrendingDown, key: 'sortPriceDesc' },
] as const

function ProductCardSkeleton() {
    return (
        <div className="h-full overflow-hidden rounded-lg border border-[#e2e7eb] bg-white">
            <Skeleton.Image
                active
                className="[&_.ant-skeleton-image]:!w-full [&_.ant-skeleton-image]:!h-48 !h-48 !w-full"
            />
            <div className="p-4">
                <Skeleton
                    active
                    title={{ width: '80%' }}
                    paragraph={{ rows: 1, width: '40%' }}
                />
                <div className="mt-3 flex items-center gap-2 border-t border-[#edf0f2] pt-3">
                    <Skeleton.Avatar
                        active
                        size={40}
                    />
                    <Skeleton.Input
                        active
                        size="small"
                        style={{ width: 100 }}
                    />
                </div>
            </div>
        </div>
    )
}

function SortControl({
    value,
    onChange,
    t,
}: {
    value: string
    onChange: (v: string) => void
    t: (k: string) => string
}) {
    const current = sortOptions.find((o) => o.value === value) || sortOptions[0]

    return (
        <Dropdown
            trigger={['click']}
            menu={{ items: [] }} // menu thật render ở dropdownRender bên dưới
            popupRender={() => (
                <div className="w-[200px] overflow-hidden rounded-lg border border-[#e2e7eb] bg-white shadow-lg">
                    {sortOptions.map((option, index) => {
                        const OptionIcon = option.icon
                        const active = option.value === value
                        return (
                            <button
                                key={option.value}
                                onClick={() => onChange(option.value)}
                                className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-[13px] ${active
                                    ? 'bg-[#fff0e9] font-medium text-[#f4511e]'
                                    : 'text-[#082c40] hover:bg-[#f8fafb]'
                                    } ${index === 2 ? 'border-t border-[#e2e7eb]' : ''}`}
                            >
                                <OptionIcon
                                    size={15}
                                    className={
                                        active
                                            ? 'text-[#f4511e]'
                                            : 'text-gray-400'
                                    }
                                />
                                {t(option.key)}
                                {active && (
                                    <Check
                                        size={14}
                                        className="ml-auto"
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>
            )}
        >
            <button className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#e2e7eb] bg-white px-3.5 py-2 text-[13px] font-medium text-[#082c40] hover:border-[#218daf]">
                <ArrowUpDown
                    size={14}
                    className="text-[#218daf]"
                />
                {t(current.key)}
                <ChevronDown
                    size={14}
                    className="text-gray-400"
                />
            </button>
        </Dropdown>
    )
}

export default function C2CFeedPage() {
    const t = useTranslations('c2c')
    const { user } = useMe()
    const setLoginOpen = useSetAtom(loginModalAtom)
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [sort, setSort] = useState('newest')
    const [sellModalOpen, setSellModalOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
        setLoading(true)
        fetch(`/api/c2c/products?sort=${sort}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) setProducts(data.data.products)
            })
            .finally(() => setLoading(false))
    }, [sort, refreshKey])

    const conditionLabel = (condition: string) =>
        condition === 'new'
            ? t('new')
            : condition === 'like_new'
                ? t('likeNew')
                : t('old')

    return (
        <div className="">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center justify-between w-full">
                    <SortControl
                        value={sort}
                        onChange={setSort}
                        t={t}
                    />
                    <Button
                        type="primary"
                        onClick={() => {
                            if (!user) {
                                setLoginOpen(true)
                                return
                            }
                            setSellModalOpen(true)
                        }}
                        className='!rounded-full !h-[40px]'
                    >
                        <Plus size={18} />
                        Đăng bán
                    </Button>
                </div>
            </div>

            {loading ? (
                <Row gutter={[20, 20]}>
                    {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                        <Col
                            xs={24}
                            sm={12}
                            md={8}
                            lg={5}
                            key={index}
                        >
                            <ProductCardSkeleton />
                        </Col>
                    ))}
                </Row>
            ) : products.length === 0 ? (
                <div className="rounded-lg bg-white py-20 text-center text-gray-500 shadow-sm">
                    {t('noProductsForSale')}
                </div>
            ) : (
                <Row gutter={[20, 20]}>
                    {products.map((product) => {
                        const cond =
                            conditionStyle[product.condition] ||
                            conditionStyle.used
                        return (
                            <Col
                                xs={24}
                                sm={12}
                                md={8}
                                lg={5}
                                key={product._id}
                            >
                                <Link
                                    href={`/san-pham/${product._id}`}
                                    className="!w-full block h-full overflow-hidden rounded-lg border border-[#e2e7eb] bg-white transition-shadow hover:!opacity-100 hover:shadow-sm"
                                >
                                    <div className="flex h-48 items-center justify-center overflow-hidden bg-[#f8fafb]">
                                        {product.images?.[0] ? (
                                            <img
                                                alt={product.title}
                                                src={product.images[0]}
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover/photo:scale-110"
                                            />
                                        ) : (
                                            <Icon
                                                src="/images/logo-only.png"
                                                size={120}
                                            />
                                        )}
                                    </div>

                                    <div className="p-4">
                                        <h2 className="mb-2 line-clamp-1 text-base font-medium text-[#082c40]">
                                            {product.title}
                                        </h2>
                                        <div className="mb-2 text-lg font-semibold text-[#f4511e]">
                                            {product.price.toLocaleString(
                                                'vi-VN',
                                            )}{' '}
                                            đ
                                        </div>
                                        <div className="mb-3 flex items-center gap-2">
                                            <span
                                                className="rounded px-2 py-0.5 text-[11px] font-medium"
                                                style={{
                                                    background: cond.bg,
                                                    color: cond.text,
                                                }}
                                            >
                                                {conditionLabel(
                                                    product.condition,
                                                )}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(
                                                    product.createdAt,
                                                ).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex items-center justify-between border-t border-[#edf0f2] pt-3">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <Avatar
                                                    src={product.seller?.avatar}
                                                    icon={<UserOutlined />}
                                                    size={30}
                                                />
                                                <span className="truncate text-sm text-gray-600">
                                                    {product.seller?.fullName}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </Col>
                        )
                    })}
                </Row>
            )}
            <DangBanModal
                open={sellModalOpen}
                onClose={() => setSellModalOpen(false)}
                onSuccess={() => {
                    setSellModalOpen(false)
                    setRefreshKey((key) => key + 1)
                }}
            />
        </div>
    )
}
