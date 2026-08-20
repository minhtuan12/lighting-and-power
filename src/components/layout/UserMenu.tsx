'use client'

import { routes } from '@/constants/routes'
import { useLogout } from '@/hooks/use-me'
import { useIsMobile, useIsTablet } from '@/hooks/use-media-query'
import { IUser } from '@/types/user'
import { UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Col, Drawer, Dropdown, Flex, Row, Space } from 'antd'
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
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Loading from '../Loading'
import { useSetAtom } from 'jotai'
import { loginModalAtom, authModalTabAtom } from '@/stores/ui'

interface IProps {
    user?: IUser
}

export default function UserMenu({ user }: IProps) {
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
    const items = [
        {
            key: routes.trangChu.url,
            label: (
                <Link
                    href={routes.trangChu.url}
                    className={`gap-1 !text-black ${styles.fontSize}`}
                >
                    <Space className="pl-4 w-full py-3">
                        <Home size={styles.iconSize} />
                        {t('common.home')}
                    </Space>
                </Link>
            ),
        },
        ...(user
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
                    key: routes.sanPham.url,
                    label: (
                        <Link
                            href={routes.sanPham.url}
                            className={`flex gap-1 !text-black ${styles.fontSize} !w-full -mt-4`}
                        >
                            <Space className="border-gray-200 w-full py-5 justify-center">
                                <Container size={styles.iconSize} />
                                {t('common.product')}
                            </Space>
                        </Link>
                    ),
                },
                {
                    key: routes.taiLieuDienTu.url,
                    label: (
                        <Link
                            href={routes.taiLieuDienTu.url}
                            className={`flex gap-1 !text-black ${styles.fontSize} !w-full`}
                        >
                            <Space className="border-gray-200 w-full py-5 justify-center">
                                <BookText size={styles.iconSize} />
                                {t('common.document')}
                            </Space>
                        </Link>
                    ),
                },
                {
                    key: routes.lienHe.url,
                    label: (
                        <Link
                            href={routes.lienHe.url}
                            className={`flex gap-1 !text-black ${styles.fontSize} !w-full mb-8`}
                        >
                            <Space className="border-gray-200 w-full py-5 justify-center">
                                <Mail size={styles.iconSize} />
                                {t('common.contact')}
                            </Space>
                        </Link>
                    ),
                },
                {
                    key: routes.dangKy.url,
                    label: (
                        <div onClick={() => { setActiveTab('register'); setLoginModal(true); setOpen(false); }}>
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
                    key: routes.dangNhap.url,
                    label: (
                        <div onClick={() => { setActiveTab('login'); setLoginModal(true); setOpen(false); }}>
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
            ]),
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
                                <div className='w-full line-clamp-1 pl-2'>
                                    {t('auth.loginSuccess', {
                                        name: user.fullName,
                                    })}
                                </div>
                            ) : (
                                ''
                            )
                        }
                        className='custom-drawer'
                        placement={'right'}
                        size={500}
                        onClose={() => setOpen(false)}
                        open={open}
                    >
                        <Row
                            gutter={8}
                            className="!-mt-2"
                        >
                            {items.map((i) => (
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
                    menu={{ items }}
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
