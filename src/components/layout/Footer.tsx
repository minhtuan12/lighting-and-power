import { ICategory } from '@/types/category';
import { IConfig } from '@/types/config';
import { Col, Flex, Row } from 'antd';
import Link from 'next/link';
import { Icon } from '../Icon';

const social = [
    { key: 'facebook', icon: <Icon src='/images/fb.png' /> },
    { key: 'tiktok', icon: <Icon src='/images/tiktok.png' /> },
    { key: 'youtube', icon: <Icon src='/images/youtube.png' /> },
];

export default async function Footer({ config, categories }: { config: IConfig, categories: ICategory[] }) {
    return (
        <footer className="bg-[#363636] text-gray-100">
            <div className="max-w-[1140px] mx-auto px-4 py-12">
                {/* Main Content */}
                <Row gutter={64}>
                    <Col span={10} className='flex flex-col justify-between'>
                        <Flex vertical>
                            <div className="flex items-center gap-2 mb-6">
                                <Icon src='/images/logo.png' size={250} />
                            </div>

                            <div className="mb-6">
                                <h3 className="font-semibold text-white mb-1.5 text-xl">
                                    {config.companyName.toUpperCase()}
                                </h3>
                                <div className="space-y-2 text-sm text-white font-normal text-[12px]">
                                    <p>Địa chỉ: {config.address}</p>
                                    <div className="flex items-center text-white">
                                        Email:&nbsp;<a
                                            href={`mailto:${config.email}`}
                                            className="hover:text-orange-500 transition-colors"
                                        >
                                            {config.email}
                                        </a>
                                    </div>
                                    <div className="flex items-center">
                                        Hotline:&nbsp;<a
                                            href={`tel:${config.hotline.replace(/\s/g, '')}`}
                                            className="hover:text-orange-500 transition-colors"
                                        >
                                            Hotline: {config.hotline}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </Flex>

                        {/* Social Links */}
                        <Flex gap={12} align='center'>
                            <p className="text-sm font-semibold text-gray-300">Liên hệ:</p>
                            <div className="flex gap-3">
                                {social.map(({ key, icon }) => {
                                    const url = config?.social && config.social?.[key as keyof typeof config.social] !== undefined ?
                                        config.social[key as keyof typeof config.social] : '#';
                                    return (
                                        <Link
                                            key={key}
                                            href={url as string}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-gray-700 hover:bg-orange-500 flex items-center justify-center transition-colors"
                                        >
                                            {icon}
                                        </Link>
                                    );
                                })}
                            </div>
                        </Flex>
                    </Col>

                    <Col span={7}>
                        {/* Categories Columns */}
                        <ul className="space-y-2">
                            {categories.slice(0, 10).map((item) => (
                                <li key={item._id}>
                                    <Link
                                        href={`/category/${item.slug}`}
                                        className="text-gray-400 hover:text-orange-500 text-sm transition-colors flex items-center gap-2"
                                    >
                                        <Icon src='/images/right-arrow.png' size={8} />
                                        <span className="line-clamp-1">{item.name}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Col>

                    <Col span={7}>
                        {/* Categories Columns */}
                        <ul className="space-y-2">
                            {categories.slice(11, 20).map((item) => (
                                <li key={item._id}>
                                    <Link
                                        href={`/category/${item.slug}`}
                                        className="text-gray-400 hover:text-orange-500 text-sm transition-colors flex items-center gap-2"
                                    >
                                        <Icon src='/images/right-arrow.png' size={8} />
                                        <span className="line-clamp-1 text-ellipsis">{item.name}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Col>
                </Row>

                {/* Divider */}
                <div className="border-t border-gray-700 mt-10"></div>

                {/* Bottom Section */}
                <div className="pt-6 text-center text-sm text-gray-400">
                    <p>&copy; {new Date().getFullYear()} {config.companyName}. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}