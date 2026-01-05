import { routes } from '@/constants/routes';
import { ICategory } from '@/types/category';
import { IConfig } from '@/types/config';
import { Badge, Button, Col, Flex, Input, Menu, MenuProps, Row } from 'antd';
import { ChevronDown, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Icon } from '../Icon';

type MenuItem = Required<MenuProps>['items'][number];

function convertCategories(categories: ICategory[]): MenuItem[] {
    return categories.map((cat: ICategory) => ({
        key: cat._id,
        label: cat.name,
        ...((cat?.children && cat.children.length > 0) ? { children: convertCategories(cat?.children || []) } : {})
    }))
}

export default async function Header({ config, categories }: { config: IConfig; categories: ICategory[] }) {
    const items: MenuItem[] = [
        {
            label: <Link href={routes.trangChu.url}>{routes.trangChu.title.toUpperCase()}</Link>,
            key: routes.trangChu.url,
        },
        {
            label: <Flex align='center' gap={6} className='!text-white !text-[17px]'>
                {routes.sanPham.title.toUpperCase()}
                <ChevronDown size={20} />
            </Flex>,
            key: routes.sanPham.url,
            children: convertCategories(categories),
        },
        {
            label: <Link href={routes.taiLieuDienTu.url}>{routes.taiLieuDienTu.title.toUpperCase()}</Link>,
            key: routes.taiLieuDienTu.url,
        },
        {
            label: <Link href={routes.lienHe.url}>{routes.lienHe.title.toUpperCase()}</Link>,
            key: routes.lienHe.url,
        },
    ];

    return (
        <header className='fixed top-0 z-[9999] w-[100vw]'>
            <Flex justify='space-between' align='end' className="!bg-white !text-gray-100 !h-[120px] !gap-34 !py-4 !mx-auto max-w-[1140px]">
                <Row className='w-full' align={'bottom'}>
                    <Col span={8} style={{ display: 'flex', justifyContent: 'left' }}>
                        <Input placeholder='Search' className='!bg-[#E3E3E3] !rounded-[10px] !w-[258px] !h-[25px] !border-[#B4B4B4]' />
                    </Col>
                    <Col span={8} style={{ display: 'flex', justifyContent: 'center' }}>
                        <Icon src="/images/logo-vertical.png" alt="Vertical Logo" size={200} />
                    </Col>
                    <Col span={8} style={{ display: 'flex', justifyContent: 'right' }}>
                        <Flex gap={7} align='center' className='text-[#C40000] font-bold w-['>
                            <Icon src='/images/header-phone.png' />
                            {config.hotline}
                        </Flex>
                    </Col>
                </Row>
            </Flex>
            <div className='bg-[#000F8F] w-full h-[54px]'>
                <Flex className='max-w-[1140px] !mx-auto !text-white !text-base [&>ul::before]:!hidden [&>ul]:!gap-8 h-full' align='center' gap={35} justify='space-between'>
                    <Menu
                        items={items}
                        mode='horizontal'
                        className='[&_li:first-child]:!pl-0 !bg-[#000F8F] [&>li]:!flex [&>li]:!items-center [&>.ant-menu-item]:!text-white [&>.ant-menu-item]:!text-[17px] [&>.ant-menu-item:hover::after]:!border-none [&>.ant-menu]:!rounded-[4px]'
                    />
                    <Flex gap={35}>
                        <Flex gap={35}>
                            <Button className='!bg-[#0063CD] !rounded-[10px] !border-[#0063CD] !text-white'>
                                <Link href={routes.dangKy.url}>{routes.dangKy.title.toUpperCase()}</Link>
                            </Button>
                            <Button className='!bg-[#0063CD] !rounded-[10px] !border-[#0063CD] !text-white'>
                                <Link href={routes.dangNhap.url}>{routes.dangNhap.title.toUpperCase()}</Link>
                            </Button>
                        </Flex>
                        <Link href={routes.gioHang.url} className='flex items-center gap-2'>
                            <Badge count={0} showZero size='small'>
                                <ShoppingCart className='text-white' />
                            </Badge>
                            {routes.gioHang.title}
                        </Link>
                    </Flex>
                </Flex>
            </div>
        </header>
    );
}
