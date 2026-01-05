'use client'

import { Icon } from '@/components/Icon';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { routes } from '@/constants/routes';
import { useMessage } from '@/hooks/use-message';
import { breadcrumbAtom } from '@/stores/ui';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined
} from '@ant-design/icons';
import { Breadcrumb, Button, Layout, Menu, theme } from 'antd';
import { useAtomValue } from 'jotai';
import { AlignStartVertical, Book, Settings, Store, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from "react";
import "../../globals.css";

const { Header, Sider, Content } = Layout;

const menu = [
    {
        icon: <User size={20} />,
        label: <Link href={routes.account.url}>{routes.account.title}</Link>,
        url: routes.account.url,
        key: routes.account.url,
    },
    {
        icon: <AlignStartVertical size={20} />,
        label: <Link href={routes.category.url}>{routes.category.title}</Link>,
        url: routes.category.url,
        key: routes.category.url,
    },
    {
        icon: <Store size={20} />,
        label: <Link href={routes.product.url}>{routes.product.title}</Link>,
        url: routes.product.url,
        key: routes.product.url,
    },
    {
        icon: <Book size={20} />,
        label: <Link href={routes.document.url}>{routes.document.title}</Link>,
        url: routes.document.url,
        key: routes.document.url,
    },
    {
        icon: <Settings size={20} />,
        label: <Link href={routes.config.url}>{routes.config.title}</Link>,
        url: routes.config.url,
        key: routes.config.url,
    },
]

export default function RootLayout(
    {
        children,
    }: {
        children: React.ReactNode
    }) {
    const [collapsed, setCollapsed] = useState(false);
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();
    const { contextHolder } = useMessage();
    const breadcrumb = useAtomValue(breadcrumbAtom);
    const pathname = usePathname();

    const pathnameParts = pathname.split('/').filter(Boolean);
    const selectedKey = menu.find(item => {
        const keyParts = item.key.split('/').filter(Boolean);
        return (
            pathnameParts.length >= keyParts.length &&
            keyParts.every((part, index) => part === pathnameParts[index])
        );
    })?.url;


    return (
        <ProtectedRoute requireAdmin>
            <Layout className='h-screen'>
                {contextHolder}
                <Sider trigger={null} collapsible collapsed={collapsed} theme='dark'>
                    <Link href={routes.account.url}>
                        <div className='px-4 my-6'>
                            <Icon src={'/images/logo.png'} size={180} />
                        </div>
                    </Link>
                    <Menu
                        theme="dark"
                        mode="inline"
                        items={menu as any}
                        selectedKeys={selectedKey ? [selectedKey] : []}
                    />
                </Sider>
                <Layout>
                    <Header style={{ padding: 0, background: colorBgContainer }} className='flex items-center !pr-5'>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{
                                fontSize: '16px',
                                width: 64,
                                height: 64,
                            }}
                        />
                        <Breadcrumb items={breadcrumb} />
                    </Header>
                    <Content
                        style={{
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                        }}
                        className='flex-1'
                    >
                        <div className="p-6 bg-gray-50 max-h-full overflow-auto !h-full">
                            {children}
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </ProtectedRoute>
    );
}
