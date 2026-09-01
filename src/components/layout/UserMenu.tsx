'use client'

import { routes } from '@/constants/routes'
import { useLogout } from '@/hooks/use-me'
import { useIsMobile, useIsTablet } from '@/hooks/use-media-query'
import { authModalTabAtom, loginModalAtom } from '@/stores/ui'
import { IUser } from '@/types/user'
import { UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Col, Drawer, Dropdown, Flex, Row, Space } from 'antd'
import { useSetAtom } from 'jotai'
import {
    BookText,
    ChevronDown,
    Container,
    Home,
    LogIn,
    LogOut,
    Mail,
    TextAlignJustify,
    User,
    UserPlus,
    Users,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Loading from '../Loading'

interface IProps {
    user?: IUser
    isC2C?: boolean
}

export default function UserMenu({ user, isC2C = false }: IProps) {
    const [open, setOpen] = useState(false)
    const setLoginModal = useSetAtom(loginModalAtom)
    const setActiveTab = useSetAtom(authModalTabAtom)
    const t = useTranslations()
    const { logoutAsync } = useLogout()
    const isMobile = useIsMobile()
    const isTablet = useIsTablet()
    const styles = {
        iconSize: isMobile || isTablet ? 20 : 16,
        fontSize: isMobile || isTablet ? 'text-[16px]' : '',
    }
    const pathname = usePathname()
    const navigationItems = [
        {
            key: routes.trangChu.url,
            label: (
                <Link
                    href={routes.trangChu.url}
                    className={`gap-1 !text-black ${styles.fontSize}`}
                >
                    <Space className="pl-4 w-full py-4">
                        <Home size={styles.iconSize} />
                        {t('common.home')}
                    </Space>
                </Link>
            ),
            disabledDesktop: true,
        },
        ...(isC2C
            ? [
                {
                    key: '/quan-ly',
                    label: (
                        <Link
                            href="/quan-ly"
                            className={`flex gap-1 !text-black ${styles.fontSize} !w-full`}
                        >
                            <Space className="pl-4 w-full py-4">
                                <Container size={styles.iconSize} />
                                {t('c2c.manageTransactions')}
                            </Space>
                        </Link>
                    ),
                },
            ]
            : [
                {
                    key: routes.sanPham.url,
                    label: (
                        <Link
                            href={routes.sanPham.url}
                            className={`flex gap-1 !text-black ${styles.fontSize} !w-full`}
                        >
                            <Space className="pl-4 w-full py-4">
                                <Container size={styles.iconSize} />
                                {t('common.product')}
                            </Space>
                        </Link>
                    ),
                    disabledDesktop: true,
                },
                {
                    key: routes.taiLieuDienTu.url,
                    label: (
                        <Link
                            href={routes.taiLieuDienTu.url}
                            className={`flex gap-1 !text-black ${styles.fontSize} !w-full`}
                        >
                            <Space className="pl-4 w-full py-4">
                                <BookText size={styles.iconSize} />
                                {t('common.document')}
                            </Space>
                        </Link>
                    ),
                    disabledDesktop: true,
                },
                {
                    key: routes.congDong.url,
                    label: (
                        <Link
                            href={routes.congDong.url}
                            className={`flex gap-1 !text-black ${styles.fontSize} !w-full`}
                        >
                            <Space className="pl-4 w-full py-4">
                                <Users size={styles.iconSize} />
                                {t('common.community')}
                            </Space>
                        </Link>
                    ),
                    disabledDesktop: true,
                },
                {
                    key: routes.lienHe.url,
                    label: (
                        <Link
                            href={routes.lienHe.url}
                            className={`flex gap-1 !text-black ${styles.fontSize} !w-full`}
                        >
                            <Space className="pl-4 w-full py-4">
                                <Mail size={styles.iconSize} />
                                {t('common.contact')}
                            </Space>
                        </Link>
                    ),
                    disabledDesktop: true,
                },
            ]),
    ]

    const items = user
        ? [
            {
                key: routes.trangCaNhan.url,
                label: (
                    <Link
                        href={routes.trangCaNhan.url}
                        className={`gap-1 !text-black ${styles.fontSize}`}
                    >
                        <Space className="pl-4 w-full py-3">
                            <User size={styles.iconSize} />
                            {t('common.profile')}
                        </Space>
                    </Link>
                ),
            },
            {
                key: 'logout',
                label: (
                    <Flex
                        gap={5}
                        align="center"
                        className={`!cursor-pointer ${styles.fontSize} !w-full`}
                        onClick={() => logoutAsync()}
                    >
                        <Space className="pl-4 w-full py-3">
                            <LogOut size={styles.iconSize} />
                            {t('common.logout')}
                        </Space>
                    </Flex>
                ),
            },
        ]
        : [
            {
                key: 'register',
                label: (
                    <div
                        onClick={() => {
                            setActiveTab('register')
                            setLoginModal(true)
                            setOpen(false)
                        }}
                        className='mt-5'
                    >
                        <Button
                            className="w-full !bg-[var(--light-primary)]"
                            size="large"
                        >
                            <UserPlus
                                size={16}
                                className="-mt-0.5"
                            />
                            {t('common.register')}
                        </Button>
                    </div>
                ),
            },
            {
                key: 'login',
                label: (
                    <div
                        onClick={() => {
                            setActiveTab('login')
                            setLoginModal(true)
                            setOpen(false)
                        }}
                        className='mt-5'
                    >
                        <Button
                            type="primary"
                            className="w-full"
                            size="large"
                        >
                            <LogIn
                                size={16}
                                className="-mt-0.5"
                            />
                            {t('common.login')}
                        </Button>
                    </div>
                ),
            },
        ]

    const menuItems: any = [...navigationItems, ...items]
    const mobileMenuItems = [
        // {
        //     key: 'c2c-toggle',
        //     label: (
        //         <div className="px-4 py-3">
        //             <C2CToggle />
        //         </div>
        //     ),
        // },
        ...menuItems,
    ]

    useEffect(() => {
        setOpen(false)
    }, [pathname])

    return (
        <Suspense fallback={<Loading size="small" />}>
            {isMobile || isTablet ? (
                <>
                    <TextAlignJustify
                        color="white"
                        onClick={() => setOpen(true)}
                    />
                    <Drawer
                        title={
                            user ? (
                                <div className="w-full line-clamp-1 pl-2">
                                    {t('auth.loginSuccess', {
                                        name: user.fullName,
                                    })}
                                </div>
                            ) : (
                                ''
                            )
                        }
                        className="custom-drawer"
                        placement={'right'}
                        size={500}
                        onClose={() => setOpen(false)}
                        open={open}
                    >
                        <Row
                            gutter={8}
                            className="!-mt-2"
                        >
                            {mobileMenuItems.map((i) => (
                                <Col
                                    span={
                                        i.key === 'login' ||
                                            i.key === 'register'
                                            ? 12
                                            : 24
                                    }
                                    key={i.key}
                                    className={`${pathname.includes(i.key) ? 'bg-[var(--light-primary)]' : ''} rounded-lg`}
                                >
                                    {i.label}
                                </Col>
                            ))}
                        </Row>
                    </Drawer>
                </>
            ) : (
                <Dropdown
                    menu={{ items: menuItems.filter((i: any) => !i.disabledDesktop) }}
                    trigger={['click']}
                >
                    <Flex
                        align="center"
                        gap={2}
                        className="cursor-pointer"
                    >
                        <Avatar
                            size="large"
                            src={user?.avatar}
                            icon={<UserOutlined />}
                        />
                        <ChevronDown size={18} />
                    </Flex>
                </Dropdown>
            )}
        </Suspense>
    )
}
