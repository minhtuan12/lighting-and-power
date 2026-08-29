import { routes } from '@/constants/routes'
import { getCurrentUser } from '@/fetch-data/auth'
import { ICategory } from '@/types/category'
import { IConfig } from '@/types/config'
import { Col, Flex, Menu, MenuProps, Row } from 'antd'
import { ChevronDown } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { headers } from 'next/headers'
import Link from 'next/link'
import Cart from '../Cart'
import { Icon } from '../Icon'
import C2CToggle from './C2CToggle'
import HeaderAuthButtons from './HeaderAuthButtons'
import NotificationBell from './NotificationBell'
import UserMenu from './UserMenu'

type MenuItem = Required<MenuProps>['items'][number]

function convertCategories(
    categories: ICategory[],
    parentUrl: string = routes.sanPham.url,
): MenuItem[] {
    return categories.map((cat: ICategory) => {
        const currentUrl = parentUrl + `/${cat.slug}`
        return {
            key: cat._id,
            label: <Link href={currentUrl}>{cat.name}</Link>,
            ...(cat?.children && cat.children.length > 0
                ? { children: convertCategories(cat.children, currentUrl) }
                : {}),
        }
    })
}

export default async function Header({
    config,
    categories,
}: {
    config: IConfig
    categories: ICategory[]
}) {
    const t = await getTranslations('common')
    const tC2c = await getTranslations('c2c')
    const { success, data } = await getCurrentUser()
    const headersList = await headers()
    const host = headersList.get('host') || ''
    const isC2C = host.startsWith('c2c.')

    const defaultItems: MenuItem[] = [
        {
            label: (
                <Link href={routes.trangChu.url}>
                    {t(routes.trangChu.key).toUpperCase()}
                </Link>
            ),
            key: routes.trangChu.url,
        },
        {
            label: (
                <Flex
                    align="center"
                    gap={6}
                    className="!text-white !text-[17px]"
                >
                    <Link href={routes.sanPham.url}>
                        {t(routes.sanPham.key).toUpperCase()}
                    </Link>
                    <ChevronDown size={20} />
                </Flex>
            ),
            key: routes.sanPham.url,
            children: convertCategories(categories),
        },
        {
            label: (
                <Link href={routes.taiLieuDienTu.url}>
                    {t(routes.taiLieuDienTu.key).toUpperCase()}
                </Link>
            ),
            key: routes.taiLieuDienTu.url,
        },
        {
            label: (
                <Link href={routes.congDong.url}>
                    {t(routes.congDong.key).toUpperCase()}
                </Link>
            ),
            key: routes.congDong.url,
        },
        {
            label: (
                <Link href={routes.lienHe.url}>
                    {t(routes.lienHe.key).toUpperCase()}
                </Link>
            ),
            key: routes.lienHe.url,
        },
    ]

    const c2cItems: MenuItem[] = [
        {
            label: (
                <Link href={routes.trangChu.url}>
                    {t(routes.trangChu.key).toUpperCase()}
                </Link>
            ),
            key: routes.trangChu.url,
        },
        {
            label: (
                <Link href="/quan-ly">
                    {tC2c('manageTransactions').toUpperCase()}
                </Link>
            ),
            key: "/quan-ly",
        },
    ]

    const items = isC2C ? c2cItems : defaultItems

    return (
        <header className="fixed top-0 z-[999] w-full bg-white">
            <Flex
                justify="space-between"
                align="end"
                className="!bg-white !text-gray-100 !h-[95px] !gap-34 !py-4 !mx-auto xl:max-w-[1140px] lg:!w-full lg:!px-6 xl:!px-0 max-lg:!hidden"
            >
                <Row
                    className="w-full"
                    align={'bottom'}
                >
                    <Col
                        span={8}
                        style={{ display: 'flex', justifyContent: 'left' }}
                    >
                        <C2CToggle />
                    </Col>
                    <Col
                        span={8}
                        style={{ display: 'flex', justifyContent: 'center' }}
                    >
                        <Link href={'/'}>
                            <Icon
                                src="/images/logo-vertical.png"
                                alt="Vertical Logo"
                                size={130}
                            />
                        </Link>
                    </Col>
                    <Col
                        span={8}
                        style={{ display: 'flex', justifyContent: 'right' }}
                    >
                        <Flex
                            gap={30}
                            className="items-end"
                        >
                            <Flex
                                gap={7}
                                align="center"
                                className="text-[#C40000] font-bold"
                            >
                                <Icon src="/images/header-phone.png" />
                                {config.hotline}
                            </Flex>
                            {/* <LanguageCurrencySwitcher /> */}
                        </Flex>
                    </Col>
                </Row>
            </Flex>
            <div className="bg-[var(--primary)] lg:px-6 w-full h-[54px] max-lg:hidden">
                <Flex
                    className="max-w-[1140px] !mx-auto !text-white !text-base [&>ul::before]:!hidden [&>ul]:!gap-8 h-full"
                    align="center"
                    gap={35}
                    justify="space-between"
                >
                    <Menu
                        items={items}
                        mode="horizontal"
                        rootClassName="w-70"
                        className="flex-1 [&_li:first-child]:!pl-0 !bg-transparent [&>li]:!flex [&>li]:!items-center [&>.ant-menu-item]:!text-white [&>.ant-menu-item]:!text-[17px] [&>.ant-menu-item:hover::after]:!border-none [&>.ant-menu]:!rounded-[4px]"
                    />
                    <Flex gap={35} align="center">
                        {!success && (
                            <HeaderAuthButtons
                                registerText={t(routes.dangKy.key).toUpperCase()}
                                loginText={t(routes.dangNhap.key).toUpperCase()}
                            />
                        )}
                        {success && data && (
                            <Flex
                                align="center"
                                gap={12}
                            >
                                {!isC2C &&
                                    <Link
                                        href={routes.gioHang.url}
                                        className="flex items-center mr-5"
                                    >
                                        <Cart />
                                    </Link>
                                }
                                <NotificationBell />
                                <UserMenu user={data} isC2C={isC2C} />
                            </Flex>
                        )}
                    </Flex>
                </Flex>
            </div>
            <Row className="h-[60px] px-10 max-md:!px-6 bg-[var(--primary)] lg:!hidden justify-between">
                <Col
                    span={20}
                    className="!flex !items-center !justify-start"
                >
                    <Link href={'/'}>
                        <Icon
                            src="/images/logo.png"
                            alt="Header Logo Only"
                            size={150}
                        />
                    </Link>
                </Col>
                <Col
                    span={2}
                    className="!flex !items-center !justify-end"
                >
                    <Flex
                        align="center"
                        gap={24}
                    >
                        <Flex align="center" gap={24}>
                            {success && data && !isC2C && (
                                <Link href={routes.gioHang.url} className="flex items-center">
                                    <Cart />
                                </Link>
                            )}
                            {success && data && <NotificationBell />}
                        </Flex>
                        <UserMenu user={data} isC2C={isC2C} />
                    </Flex>
                </Col>
            </Row>
        </header>
    )
}
