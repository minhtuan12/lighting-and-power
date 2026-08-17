'use client'

import Loading from '@/components/Loading'
import { routes } from '@/constants/routes'
import { useAuth } from '@/hooks/use-me'
import { Avatar, Breadcrumb, Card, Flex, Row, Typography } from 'antd'
import { Heart, Lock, Package, StickyNote, UserRound } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { lazy, Suspense, useCallback, useMemo, useState } from 'react'

const { Title, Text } = Typography

const LazyInfoTab = lazy(() => import('./(tabs)/info'))
const LazyChangePasswordTab = lazy(() => import('./(tabs)/password'))
const LazyOrdersTab = lazy(() => import('./(tabs)/orders'))
const MyCommunityPostsTab = lazy(() => import('./(tabs)/my-community-posts'))
const FavouriteProductsTab = lazy(() => import('./(tabs)/favourite-products'))

export default function () {
    const t = useTranslations()
    const { user } = useAuth()

    const [activeTab, setActiveTab] = useState('info')

    const getColor = useCallback(
        (key: string) => {
            return activeTab === key ? '#3c50e0' : '#707070'
        },
        [activeTab],
    )

    const menu = useMemo(
        () => [
            {
                key: 'info',
                icon: (
                    <UserRound
                        size={25}
                        color={getColor('info')}
                    />
                ),
            },
            {
                key: 'password',
                icon: (
                    <Lock
                        size={25}
                        color={getColor('password')}
                    />
                ),
            },
            {
                key: 'orders',
                icon: (
                    <Package
                        size={25}
                        color={getColor('orders')}
                    />
                ),
            },
            {
                key: 'community',
                icon: (
                    <StickyNote
                        size={25}
                        color={getColor('community')}
                    />
                ),
            },
            {
                key: 'favourites',
                icon: <Heart size={25} color={getColor('favourites')} />,
            },
        ],
        [activeTab, getColor],
    )

    const renderTab = useCallback(() => {
        switch (activeTab) {
            case 'orders':
                return <LazyOrdersTab />
            case 'info':
                return <LazyInfoTab />
            case 'password':
                return <LazyChangePasswordTab />
            case 'community':
                return <MyCommunityPostsTab />
            case 'favourites':
                return <FavouriteProductsTab />
            default:
                return <LazyInfoTab />
        }
    }, [activeTab])

    if (!user) {
        return (
            <Loading
                size="large"
                className="!mt-50"
            />
        )
    }

    return (
        <Flex
            gap={10}
            vertical
            className="custom-breadcrumb !mb-30"
        >
            <Breadcrumb
                items={[
                    { title: t('common.home'), href: routes.trangChu.url },
                    { title: t('common.profile') },
                ]}
                separator=">"
            />
            <Flex
                gap={30}
                className="!mt-2"
            >
                <Card
                    className="!sticky top-50 self-start w-[330px] h-fit backdrop-blur-lg bg-white/30 border border-white/20 shadow-xl"
                    style={{
                        background: 'rgba(255, 255, 255, 0.21)',
                        backdropFilter: 'blur(3.5px)',
                        WebkitBackdropFilter: 'blur(3.5px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.75)',
                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <Flex
                        gap={20}
                        align="center"
                        className="!border-b !border-gray-200 !h-15 !pb-5"
                    >
                        <Avatar
                            src={user.avatar}
                            icon={<UserRound />}
                            size={45}
                        />
                        <Flex vertical>
                            <Title
                                level={5}
                                style={{ marginBottom: 0 }}
                            >
                                {user.fullName}
                            </Title>
                            <Text className='!text-gray-500'>
                                {t('profile.memberSince', {
                                    date: new Date(
                                        user.createdAt as string,
                                    ).getFullYear(),
                                })}
                            </Text>
                        </Flex>
                    </Flex>
                    <Flex
                        vertical
                        className="!mt-4"
                        gap={10}
                    >
                        {menu.map((item) => {
                            const isActive = activeTab === item.key;
                            return (
                                <Row
                                    key={item.key}
                                    onClick={() => setActiveTab(item.key)}
                                    className={`${isActive ? 'font-semibold' : ''} gap-4 h-13 px-4 py-3 cursor-pointer rounded-md items-center hover:!bg-[var(--light-primary)]`}
                                    style={{
                                        background:
                                            isActive
                                                ? 'var(--light-primary)'
                                                : '#f9fafb',
                                    }}
                                >
                                    {item.icon}
                                    <Text style={{ color: getColor(item.key) }}>
                                        {t(`profile.${item.key}`)}
                                    </Text>
                                </Row>
                            )
                        })}
                    </Flex>
                </Card>
                <Card
                    className="flex-1 backdrop-blur-lg bg-white/30 border border-white/20 shadow-xl pt-5"
                    style={{
                        background: 'rgba(255, 255, 255, 0.21)',
                        backdropFilter: 'blur(3.5px)',
                        WebkitBackdropFilter: 'blur(3.5px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.75)',
                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <Suspense fallback={<Loading />}>
                        {renderTab()}
                    </Suspense>
                </Card>
            </Flex>
        </Flex>
    )
}
