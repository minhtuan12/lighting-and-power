import BadgeRibbon from "@/components/BadgeRibbon";
import DefaultImage from "@/components/DefaultImage";
import { getProductDetail } from "@/fetch-data/products";
import { IProduct } from "@/types/product";
import { Col, Flex, Row, Table } from "antd";
import AddToCart from "../AddToCart";

const details = [
    {
        label: 'Hãng sản xuất',
        key: 'manufacturer'
    },
    {
        label: 'Xuất xứ',
        key: 'origin'
    },
    {
        label: 'Mô tả ngắn',
        key: 'shortDescription'
    },
    {
        label: 'Trọng lượng',
        key: 'weight'
    },
    {
        label: 'Chiều dài',
        key: 'dimensions.length'
    },
    {
        label: 'Chiều rộng',
        key: 'dimensions.width'
    },
    {
        label: 'Chiều cao',
        key: 'dimensions.height'
    },
];

const specColumns = [
    {
        title: 'Thông số',
        dataIndex: 'name',
        key: 'name',
        width: 180,
    },
    {
        title: 'Giá trị',
        dataIndex: 'value',
        key: 'value',
    },
];

export default async function ProductDetail({ slug, id }: { slug?: string, id?: string }) {
    const { data } = await getProductDetail({ slug, id });
    const product: IProduct | null = data.product;

    if (!product) {
        return null;
    }

    return <div className="flex-1 ml-6 space-y-10">
        <Row gutter={30}>
            <Col span={8}>
                <Flex vertical className="w-full" gap={10}>
                    <BadgeRibbon text="Chính hãng" color="orange" placement="start">
                        <DefaultImage
                            src={product.images[0]}
                            title={`${product.name}-${slug ?? id}`}
                            className="w-full h-[265px] border-none"
                        />
                    </BadgeRibbon>
                    <Flex className="w-full overflow-x-auto scrollbar-thin" gap={8}>
                        {product.images.map(i => <DefaultImage key={i} className="shrink-0 w-17 h-17" src={i} title={i} />)}
                    </Flex>
                </Flex>
            </Col>

            <Col span={16}>
                <Flex vertical gap={20}>
                    <h3 className="text-[27px] text-black">{product.name}</h3>
                    <Flex vertical gap={8}>
                        {
                            details.map(
                                ({ label, key }) => {
                                    const fields = key.split('.');
                                    let value: string | number | undefined;
                                    if (fields.length > 1) {
                                        const parent = product[fields[0] as keyof typeof product];
                                        if (parent && typeof parent === 'object' && parent !== null) {
                                            value = (parent as Record<string, any>)[fields[1]];
                                        }
                                    } else {
                                        value = product[key as keyof typeof product] as string | number | undefined;
                                    }
                                    return value ? <Row className="text-black text-[14px]" gutter={32}>
                                        <Col span={6}>{label}</Col>
                                        <Col span={14}>{value}</Col>
                                    </Row> : ''
                                }
                            )
                        }
                    </Flex>
                    <Row gutter={40}>
                        <Col span={12}>
                            <Flex
                                vertical
                                justify="space-between"
                                className="bg-[#D1FFD3] !w-full !h-19 !p-[12px_28px] !text-center !text-base !font-bold !text-[#005E06]"
                            >
                                <div>Hàng còn: {product.stock} {product.unit}</div>
                                <div>(Gửi hàng trong ngày)</div>
                            </Flex>
                            <Flex vertical gap={12} className="!mt-[15px] w-full" justify="space-between">
                                <Flex gap={8} className="w-full" justify="space-between">
                                    <b>Số lượng mua: </b>
                                    <span>Min: {product.minOrderQuantity}</span>
                                    <span>Bội số: 1</span>
                                </Flex>
                                <AddToCart product={product} size="large" minQuantity={product.minOrderQuantity} maxQuantity={product.stock} />
                            </Flex>
                        </Col>
                        {
                            (product.priceTiers && product.priceTiers.length > 0) && <Col span={12}>
                                <Row gutter={6} className="border-y border-y-[#BDBDBD] w-full py-2">
                                    <Col span={12} className="text-center !text-[12px]">Số lượng mua ({product.unit})</Col>
                                    <Col span={12} className="text-center !text-[12px]">Đơn giá (VNĐ)</Col>
                                </Row>
                                {
                                    product.priceTiers.map((tier, index) =>
                                        <Row key={index} gutter={6} className="border-b border-b-[#BDBDBD] w-full py-2">
                                            <Col span={12} className="text-center !text-[12px]">
                                                {tier.minQuantity}+
                                            </Col>
                                            <Col span={12} className="text-center !text-[12px]">
                                                {tier.price.toLocaleString('vi-VN')}
                                            </Col>
                                        </Row>
                                    )
                                }
                            </Col>
                        }
                    </Row>
                </Flex>
            </Col>
        </Row>

        {
            product.description && <Row>
                <h3 className="text-[23px]">Thông số</h3>
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
            </Row>
        }

        {
            (product.specifications && product.specifications.length > 0) && <Row className="w-full">
                <Col className="space-y-3 detail-product-table w-full">
                    <h3 className="text-[23px]">Thông số</h3>
                    <Table
                        rowKey={'name'}
                        bordered
                        columns={specColumns}
                        dataSource={product.specifications}
                        className="!w-full"
                    />
                </Col>
            </Row>
        }

        {/* TODO: Feedback UI */}
    </div>
}
