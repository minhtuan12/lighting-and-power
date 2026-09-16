'use client'

import { EOrderStatus } from '@/types/order'
import { Tabs, TabsProps } from 'antd'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import OrderList from '../../../(components)/(order)/OrderList'

export default function Orders({ orderId }: { orderId?: string }) {
    const t = useTranslations('orders')
    const searchParams = useSearchParams()
    const [activeKey, setActiveKey] = useState(searchParams.get('orderTab') || 'all')

    const items: TabsProps['items'] = [
        {
            key: 'all',
            label: t('tabs.all'),
            children: <OrderList initialOrderId={orderId} />,
        },
        {
            key: 'reception',
            label: t('tabs.reception'),
            children: <OrderList
                statusFilter={[EOrderStatus.pending, EOrderStatus.confirmed]}
            />,
        },
        {
            key: 'shipper',
            label: t('tabs.shipper'),
            children: <OrderList statusFilter={EOrderStatus.processing} />,
        },
        {
            key: 'delivering',
            label: t('tabs.delivering'),
            children: <OrderList
                statusFilter={[EOrderStatus.shipping, EOrderStatus.delivered]}
            />,
        },
        {
            key: 'cancel',
            label: t('tabs.cancel'),
            children: <OrderList statusFilter={EOrderStatus.cancelled} />,
        },
    ]

    return (
        <Tabs
            activeKey={activeKey}
            onChange={setActiveKey}
            items={items}
            className="order-tabs"
        />
    )
}
