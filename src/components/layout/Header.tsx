import { routes } from '@/constants/routes'
import { getCurrentUser } from '@/fetch-data/auth'
import { ICategory } from '@/types/category'
import { IConfig } from '@/types/config'
import { Button, Col, Flex, Input, Menu, MenuProps, Row } from 'antd'
import { ChevronDown } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import Cart from '../Cart'
import { Icon } from '../Icon'
import LanguageCurrencySwitcher from '../LanguageCurrencySwitcher'
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
    const { success, data } = await getCurrentUser()
    const items: MenuItem[] = [
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
                <Link href={routes.lienHe.url}>
                    {t(routes.lienHe.key).toUpperCase()}
                </Link>
            ),
            key: routes.lienHe.url,
        },
    ]

    return (
        <header className="fixed top-0 z-[999] w-full bg-white">
            <Flex
                justify="space-between"
                align="end"
                className="!bg-white !text-gray-100 !h-[120px] !gap-34 !py-4 !mx-auto xl:max-w-[1140px] lg:!w-full lg:!px-6 xl:!px-0 max-lg:!hidden"
            >
                <Row
                    className="w-full"
                    align={'bottom'}
                >
                    <Col
                        span={8}
                        style={{ display: 'flex', justifyContent: 'left' }}
                    >
                        <Input
                            placeholder={t('search')}
                            className="!bg-[#E3E3E3] !rounded-[10px] !w-[258px] !h-[35px] !border-[#B4B4B4]"
                        />
                    </Col>
                    <Col
                        span={8}
                        style={{ display: 'flex', justifyContent: 'center' }}
                    >
                        <Icon
                            src="/images/logo-vertical.png"
                            alt="Vertical Logo"
                            size={200}
                        />
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
                            <LanguageCurrencySwitcher />
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
                    <Flex gap={35}>
                        {!success && (
                            <Flex gap={35}>
                                <Button className="!bg-[#0063CD] !rounded-[10px] !border-[#0063CD] !text-white">
                                    <Link href={routes.dangKy.url}>
                                        {t(routes.dangKy.key).toUpperCase()}
                                    </Link>
                                </Button>
                                <Button className="!bg-[#0063CD] !rounded-[10px] !border-[#0063CD] !text-white">
                                    <Link href={routes.dangNhap.url}>
                                        {t(routes.dangNhap.key).toUpperCase()}
                                    </Link>
                                </Button>
                            </Flex>
                        )}
                        <Link
                            href={routes.gioHang.url}
                            className="flex items-center gap-2"
                        >
                            <Cart />
                        </Link>
                        {success && data && <UserMenu user={data} />}
                    </Flex>
                </Flex>
            </div>
            <Row className="h-[60px] px-10 max-md:!px-6 bg-[var(--primary)] lg:!hidden">
                <Col span={2} className='!flex !items-center !justify-start'>
                    <Icon
                        src="/images/logo-only.png"
                        alt="Header Logo Only"
                        size={40}
                    />
                </Col>
                <Col span={20} className='!flex !items-center !justify-center'>
                    <Input
                        placeholder={t('search')}
                        className="!bg-[#E3E3E3] !rounded-[10px] !w-2/3 !h-[35px] !border-[#B4B4B4]"
                    />
                </Col>
                <Col span={2} className='!flex !items-center !justify-end'>
                    <UserMenu user={data} />
                </Col>
            </Row>
        </header>
    )
}
