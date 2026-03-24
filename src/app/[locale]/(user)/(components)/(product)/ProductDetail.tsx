import BadgeRibbon from '@/components/BadgeRibbon'
import DefaultImage from '@/components/DefaultImage'
import RichTextContent from '@/components/RichTextContent'
import { getProductDetail } from '@/fetch-data/products'
import { IProduct } from '@/types/product'
import { Col, Flex, Row, Table } from 'antd'
import { getTranslations } from 'next-intl/server'
import AddToCart from '../AddToCart'
import ProductComments from './ProductComments'
import RelatedProducts from './RelatedProducts'

export default async function ProductDetail({
    slug,
    id,
}: {
    slug?: string
    id?: string
}) {
    const t = await getTranslations('product')
    const { data } = await getProductDetail({ slug, id })
    const product: IProduct | null = data.product

    if (!product) {
        return null
    }

    const details = [
        {
            label: t('filter.fields.manufacturers'),
            key: 'manufacturer',
        },
        {
            label: t('filter.fields.origins'),
            key: 'origin',
        },
        {
            label: t('shortDescription'),
            key: 'shortDescription',
        },
        {
            label: t('weight'),
            key: 'weight',
        },
        {
            label: t('dimensions.length'),
            key: 'dimensions.length',
        },
        {
            label: t('dimensions.width'),
            key: 'dimensions.width',
        },
        {
            label: t('dimensions.height'),
            key: 'dimensions.height',
        },
    ]

    const specColumns = [
        {
            title: t('filter.fields.specifications'),
            dataIndex: 'name',
            key: 'name',
            width: 180,
        },
        {
            title: t('value'),
            dataIndex: 'value',
            key: 'value',
        },
    ]

    return (
        <div className="flex-1 ml-6 space-y-10">
            <Row gutter={30}>
                <Col span={8}>
                    <Flex
                        vertical
                        className="w-full"
                        gap={10}
                    >
                        <BadgeRibbon
                            text={t('authentic')}
                            color="orange"
                            placement="start"
                        >
                            <DefaultImage
                                src={product.images[0]}
                                title={`${product.name}-${slug ?? id}`}
                                className="w-full h-[265px] border-none"
                            />
                        </BadgeRibbon>
                        <Flex
                            className="w-full overflow-x-auto scrollbar-thin"
                            gap={8}
                        >
                            {product.images.map((i) => (
                                <DefaultImage
                                    key={i}
                                    className="shrink-0 w-17 h-17"
                                    src={i}
                                    title={i}
                                />
                            ))}
                        </Flex>
                    </Flex>
                </Col>

                <Col span={16}>
                    <Flex
                        vertical
                        gap={20}
                    >
                        <h3 className="text-[24px] font-semibold text-black">
                            {product.name}
                        </h3>
                        <Flex
                            vertical
                            gap={8}
                        >
                            {details.map(({ label, key }) => {
                                const fields = key.split('.')
                                let value: string | number | undefined
                                if (fields.length > 1) {
                                    const parent =
                                        product[
                                        fields[0] as keyof typeof product
                                        ]
                                    if (
                                        parent &&
                                        typeof parent === 'object' &&
                                        parent !== null
                                    ) {
                                        value = (parent as Record<string, any>)[
                                            fields[1]
                                        ]
                                    }
                                } else {
                                    value = product[
                                        key as keyof typeof product
                                    ] as string | number | undefined
                                }
                                return value ? (
                                    <Row
                                        className="text-black text-[14px]"
                                        gutter={32}
                                    >
                                        <Col span={6}>{label}</Col>
                                        <Col span={14}>{value}</Col>
                                    </Row>
                                ) : (
                                    ''
                                )
                            })}
                        </Flex>
                        <Row gutter={40}>
                            <Col span={12}>
                                <Flex
                                    vertical
                                    justify="space-between"
                                    className="bg-[#D1FFD3] !w-full !h-19 !p-[12px_28px] !text-center !text-md !font-bold !text-[#005E06]"
                                >
                                    <div>
                                        {t('remaining')}: {product.stock}{' '}
                                        {product.unit}
                                    </div>
                                    <div>{t('sameDayDelivery')}</div>
                                </Flex>
                                <Flex
                                    vertical
                                    gap={12}
                                    className="!mt-[15px] w-full"
                                    justify="space-between"
                                >
                                    <Flex
                                        gap={8}
                                        className="w-full"
                                        justify="space-between"
                                    >
                                        <b>{t('quantity')}: </b>
                                        <span>
                                            {t('min')}:{' '}
                                            {product.minOrderQuantity}
                                        </span>
                                        <span>{t('multiple')}: 1</span>
                                    </Flex>
                                    <AddToCart
                                        product={product}
                                        size="large"
                                        minQuantity={product.minOrderQuantity}
                                        maxQuantity={product.stock}
                                    />
                                </Flex>
                            </Col>
                            {product.priceTiers &&
                                product.priceTiers.length > 0 && (
                                    <Col span={12}>
                                        <Row
                                            gutter={6}
                                            className="border-y border-y-[#BDBDBD] w-full py-2"
                                        >
                                            <Col
                                                span={12}
                                                className="text-center !text-md"
                                            >
                                                {t('quantity')} ({product.unit})
                                            </Col>
                                            <Col
                                                span={12}
                                                className="text-center !text-md"
                                            >
                                                {t('priceEach')} (VNĐ)
                                            </Col>
                                        </Row>
                                        {product.priceTiers.map(
                                            (tier, index) => (
                                                <Row
                                                    key={index}
                                                    gutter={6}
                                                    className="border-b border-b-[#BDBDBD] w-full py-2"
                                                >
                                                    <Col
                                                        span={12}
                                                        className="text-center !text-md"
                                                    >
                                                        {tier.minQuantity}+
                                                    </Col>
                                                    <Col
                                                        span={12}
                                                        className="text-center !text-md"
                                                    >
                                                        {tier.price.toLocaleString(
                                                            'vi-VN',
                                                        )}
                                                    </Col>
                                                </Row>
                                            ),
                                        )}
                                    </Col>
                                )}
                        </Row>
                    </Flex>
                </Col>
            </Row>

            {product.description && (
                <Flex
                    vertical
                    gap={5}
                >
                    <h3 className="text-[20px] font-semibold">
                        {t('description')}
                    </h3>
                    <RichTextContent html={product.description} />
                </Flex>
            )}

            {product.specifications && product.specifications.length > 0 && (
                <Row className="w-full mt-8">
                    <Col className="space-y-3 detail-product-table w-full">
                        <h3 className="text-[20px] font-semibold">
                            {t('filter.fields.specifications')}
                        </h3>
                        <Table
                            rowKey={'name'}
                            bordered
                            columns={specColumns}
                            dataSource={product.specifications}
                            className="!w-full"
                            pagination={false}
                        />
                    </Col>
                </Row>
            )}

            {product.relatedProducts && product.relatedProducts.length > 0 && (
                <Flex
                    vertical
                    gap={5}
                    className="w-full"
                >
                    <h3 className="text-[20px] font-semibold">
                        Các sản phẩm liên quan
                    </h3>
                    <RelatedProducts
                        products={product.relatedProducts as IProduct[]}
                    />
                </Flex>
            )}

            <ProductComments
                productId={product._id}
                comments={product.comments as any}
            />
        </div>
    )
}
