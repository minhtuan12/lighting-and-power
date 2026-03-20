'use client'

import { EOrderStatus } from '@/types/order'
import { Tabs, TabsProps } from 'antd'
import { useTranslations } from 'next-intl'
import OrderList from '../../../(components)/(order)/OrderList'

export default function Orders() {
    const t = useTranslations('orders')

    const items: TabsProps['items'] = [
        {
            key: 'all',
            label: t('tabs.all'),
            children: <OrderList />,
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
            defaultActiveKey="all"
            items={items}
            className="order-tabs"
        />
    )
}
