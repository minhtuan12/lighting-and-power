'use client'

import {
    FloatingInput,
    FloatingInputNumber,
} from '@/components/inputs/FloatingInputs'
import Loading from '@/components/Loading'
import useDebounce from '@/hooks/use-debounce'
import { useCart } from '@/hooks/user/use-cart'
import { useClientProducts } from '@/hooks/user/use-client-product'
import {
    addToCartAtom,
    cartItemsAtom,
    checkedOutItemsAtom,
    removeFromCartAtom,
    updateCartQuantityAtom,
} from '@/stores'
import { ICartItem } from '@/types/cart'
import { IProduct } from '@/types/product'
import {
    Image as AntImage,
    Button,
    Card,
    Checkbox,
    Col,
    Divider,
    Empty,
    Flex,
    Row,
    Typography
} from 'antd'
import { useSetAtom } from 'jotai'
import { Trash } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import RemainingStock from '../../(components)/(product)/RemainingStock'

const { Text } = Typography

const formatPrice = (p: number) => p.toLocaleString('vi-VN') + ' đ'
const CHECKOUT_FLOW_KEY = "lp_checkout_flow"

/** Returns the effective unit price for a given quantity based on price tiers */
const getEffectivePrice = (
    quantity: number,
    priceTiers?: { minQuantity: number; price: number }[],
    fallbackPrice?: number,
): number => {
    if (!priceTiers || priceTiers.length === 0) return fallbackPrice ?? 0

    // Sort descending by minQuantity, find the first tier the quantity qualifies for
    const sorted = [...priceTiers].sort((a, b) => b.minQuantity - a.minQuantity)
    const tier = sorted.find((t) => quantity >= t.minQuantity)
    return tier ? tier.price : (fallbackPrice ?? priceTiers[0].price)
}

function SeachedProducts({
    products,
    setSelectedProduct,
    selectedProdId,
}: {
    products: IProduct[]
    setSelectedProduct: any
    selectedProdId: string
}) {
    return (
        <Flex
            vertical
            className="h-full !overflow-y-auto scrollbar-thin"
            justify="start"
        >
            {products.length === 0 ? (
                <Empty />
            ) : (
                products.map((p) => (
                    <Row
                        key={p._id}
                        gutter={10}
                        className={`w-full h-auto py-4 pl-2 cursor-pointer border-b border-b-gray-100 hover:bg-gray-100 ${p._id === selectedProdId ? 'bg-gray-200' : ''}`}
                        onClick={() => setSelectedProduct(p)}
                    >
                        <Col span={4}>
                            {p?.images?.[0] && (
                                <Image
                                    src={p.images[0]}
                                    width={50}
                                    height={50}
                                    alt={p.name}
                                />
                            )}
                        </Col>
                        <Col
                            span={13}
                            className="text-black text-md !line-clamp-1 text-ellipsis"
                        >
                            {p.name}
                        </Col>
                        <Col
                            span={7}
                            className="text-black text-[13px] font-semibold !text-[var(--primary)]"
                        >
                            {formatPrice(p.price)}/{p.unit}
                        </Col>
                    </Row>
                ))
            )}
        </Flex>
    )
}

export default function () {
    const {
        cart,
        addToCart: callAddToCart,
        removeItem,
        updateItem,
        isLoading: loadingCart,
    } = useCart()
    const t = useTranslations()
    const router = useRouter()

    const [items, setItems] = useState<(ICartItem & { checked: boolean })[]>(
        cart?.items || [],
    )
    const [searchText, setSearchText] = useState('')
    const [debounceSearchText, setDebounceSearchText] = useState('')
    const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(
        null,
    )
    const [selectedQty, setSelectedQty] = useState(null)

    const addToCart = useSetAtom(addToCartAtom)
    const setCartItems = useSetAtom(cartItemsAtom)
    const removeFromCart = useSetAtom(removeFromCartAtom)
    const updateCartQuantity = useSetAtom(updateCartQuantityAtom)
    const setCheckedOutItems = useSetAtom(checkedOutItemsAtom)
    const { isLoading: loadingSearchProducts, products } = useClientProducts(
        {
            search: debounceSearchText,
        },
        Boolean(searchText),
    )

    const checkedItems = items.filter((i) => i.checked)
    const checkedItemsForCheckout = useMemo(
        () => checkedItems.map(({ checked, ...rest }) => rest),
        [checkedItems],
    )
    const allChecked =
        items.length > 0 &&
        items.filter((i) => i.inStock).every((i) => i.checked)
    const someChecked = items.some((i) => i.checked) && !allChecked

    useEffect(() => {
        setCheckedOutItems(checkedItemsForCheckout)
    }, [checkedItemsForCheckout, setCheckedOutItems])

    // Subtotal uses effective tiered price for each checked item
    const subtotal = checkedItems.reduce((sum, item) => {
        const effectivePrice = getEffectivePrice(
            item.quantity,
            item.priceTiers,
            item.price,
        )
        return sum + effectivePrice * item.quantity
    }, 0)

    const toggleAll = (checked: boolean) =>
        setItems((prev) =>
            prev.filter((i) => i.inStock).map((i) => ({ ...i, checked })),
        )

    const toggleItem = (productId: string, checked: boolean) =>
        setItems((prev) =>
            prev.map((i) =>
                i.productId === productId ? { ...i, checked } : i,
            ),
        )

    const updateQty = (item: ICartItem, delta: number) => {
        const nextQty = Math.max(1, item.quantity + delta)

        setItems((prev) =>
            prev.map((i) =>
                i.productId === item.productId
                    ? { ...i, quantity: nextQty }
                    : i,
            ),
        )

        if (item._id) {
            updateItem({ itemId: item._id, data: { quantity: nextQty } })
        }
        updateCartQuantity({ productId: item.productId, quantity: nextQty })
    }

    const handleRemoveItem = (productId: string) =>
        (setItems((prev) => prev.filter((i) => i.productId !== productId)), removeFromCart(productId))

    const clearAll = () =>
        setItems((prev) => prev.map((i) => ({ ...i, checked: false })))

    const debounceSearch = useDebounce((value: string) => {
        setDebounceSearchText(value)
    }, 300)

    const handleSearchProducts = useCallback(
        (e: any) => {
            setSearchText(e.target.value)
            debounceSearch(e.target.value)
        },
        [setSearchText, debounceSearch],
    )

    const handleAddNewProdToCart = useCallback(() => {
        if (selectedProduct && selectedQty) {
            addToCart({
                productId: selectedProduct._id,
                price: selectedProduct.price,
                productName: selectedProduct.name,
                productSlug: selectedProduct.slug,
                quantity: selectedQty,
            })
            callAddToCart({
                productId: selectedProduct._id,
                quantity: selectedQty,
            })
            setSelectedProduct(null)
            setSelectedQty(null)
            setSearchText('')
            setDebounceSearchText('')
        }
    }, [selectedProduct, selectedQty, addToCart])

    useEffect(() => {
        if (cart?.items) setCartItems(cart.items)
        setItems((prev) => {
            const previousChecked = new Map(
                prev.map((item) => [item.productId, item.checked]),
            )
            return (cart?.items || []).map((item: ICartItem) => ({
                ...item,
                checked: previousChecked.get(item.productId) ?? false,
            }))
        })
    }, [cart, setCartItems])

    return (
        <Suspense fallback={<Loading />}>
            <Flex
                vertical
                gap={20}
                className="!mt-2 !mb-20 max-md:!px-3 max-md:!pt-4"
            >
                <Row gutter={[20, 20]}>
                    <Col
                        xs={24}
                        lg={17}
                        className="space-y-4"
                    >
                        <Row gutter={[14, 14]} className='max-md:!hidden'>
                            <Col
                                xs={24}
                                sm={12}
                                className="relative"
                            >
                                <FloatingInput
                                    onChange={handleSearchProducts}
                                    placeholder={t('cart.searchProd')}
                                    label={t('cart.searchProd')}
                                    className="!h-[40px]"
                                    value={searchText}
                                />
                                {searchText && (
                                    <div className="scrollbar-thin absolute top-15 z-10 max-h-[300px] min-h-[300px] w-full overflow-y-auto border border-gray-100 bg-white shadow-lg sm:w-[calc(100%-14px)]">
                                        {loadingSearchProducts ? (
                                            <Flex className="!w-full !h-[300px] justify-center items-center">
                                                <Loading />
                                            </Flex>
                                        ) : (
                                            <SeachedProducts
                                                products={
                                                    products?.data?.products ||
                                                    []
                                                }
                                                setSelectedProduct={
                                                    setSelectedProduct
                                                }
                                                selectedProdId={
                                                    selectedProduct?._id ?? ''
                                                }
                                            />
                                        )}
                                    </div>
                                )}
                            </Col>
                            <Col xs={12} sm={6}>
                                <FloatingInputNumber
                                    placeholder={t('cart.quantity')}
                                    label={t('cart.quantity')}
                                    className="!h-[40px]"
                                    value={selectedQty ?? null}
                                    onChange={(e) => setSelectedQty(e as any)}
                                    min={1}
                                    formatter={(value) =>
                                        `${value}`.replace(
                                            /\B(?=(\d{3})+(?!\d))/g,
                                            ',',
                                        )
                                    }
                                    parser={(value) =>
                                        parseInt(value!.replace(/,/g, ''))
                                    }
                                />
                            </Col>
                            <Col xs={12} sm={6}>
                                <Button
                                    type="primary"
                                    className="!h-[43px] w-full"
                                    onClick={handleAddNewProdToCart}
                                >
                                    {t('product.addToCart')}
                                </Button>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            {/* ── Cart items ── */}
                            <Col span={24}>
                                <Card className="shadow-md border border-gray-100">
                                    {/* Select-all bar */}
                                    <Flex
                                        align="center"
                                        justify="space-between"
                                        className="!mb-5 flex-wrap gap-2 border-b border-gray-300 !pb-2"
                                    >
                                        <Checkbox
                                            indeterminate={someChecked}
                                            checked={allChecked}
                                            onChange={(e) =>
                                                toggleAll(e.target.checked)
                                            }
                                        >
                                            <Text strong>
                                                {t('cart.selectAll', {
                                                    count: items.length,
                                                })}
                                            </Text>
                                            {checkedItems.length > 0 && (
                                                <Text
                                                    type="secondary"
                                                    className="ml-2"
                                                >
                                                    &nbsp;|&nbsp;
                                                    {t('cart.selected', {
                                                        count: checkedItems.length,
                                                    })}
                                                </Text>
                                            )}
                                        </Checkbox>
                                        <Button
                                            type="link"
                                            danger
                                            size="small"
                                            onClick={clearAll}
                                        >
                                            {t('cart.clearAll')}
                                        </Button>
                                    </Flex>

                                    {loadingCart ? (
                                        <Flex
                                            justify="center"
                                            align="center"
                                        >
                                            <Loading />
                                        </Flex>
                                    ) : (
                                        items.map((item, idx) => {
                                            const effectivePrice =
                                                getEffectivePrice(
                                                    item.quantity,
                                                    item.priceTiers,
                                                    item.price,
                                                )
                                            const isDiscounted =
                                                effectivePrice < item.price

                                            return (
                                                <div
                                                    key={item.productId}
                                                    className="mt-2"
                                                >
                                                    <Row gutter={6}>
                                                        <Flex
                                                            align="flex-start"
                                                            className="flex-wrap px-2 py-4 sm:flex-nowrap sm:px-4"
                                                        >
                                                            <Col span={1}>
                                                                {/* Checkbox */}
                                                                <Checkbox
                                                                    disabled={
                                                                        !item.inStock ||
                                                                        !item.availableStock
                                                                    }
                                                                    checked={
                                                                        item.checked
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        if (
                                                                            item.inStock
                                                                        ) {
                                                                            toggleItem(
                                                                                item.productId,
                                                                                e
                                                                                    .target
                                                                                    .checked,
                                                                            )
                                                                        }
                                                                    }}
                                                                    className="mt-1"
                                                                />
                                                            </Col>

                                                            <Col span={3}>
                                                                {/* Product image */}
                                                                <AntImage src={
                                                                    item.productImage
                                                                }
                                                                    alt={
                                                                        item.productName
                                                                    }
                                                                    className="w-16 h-16 object-contain rounded border border-gray-100 flex-shrink-0"
                                                                />
                                                                {/* <img
                                                                    src={
                                                                        item.productImage
                                                                    }
                                                                    alt={
                                                                        item.productName
                                                                    }
                                                                    className="w-16 h-16 object-contain rounded border border-gray-100 flex-shrink-0"
                                                                    onError={(
                                                                        e,
                                                                    ) => {
                                                                        ; (
                                                                            e.target as HTMLImageElement
                                                                        ).src =
                                                                            'https://placehold.co/64x64?text=IMG'
                                                                    }}
                                                                /> */}
                                                            </Col>

                                                            <Col span={10}>
                                                                {/* Info + pricing tiers */}
                                                                <Flex
                                                                    vertical
                                                                    gap={4}
                                                                    className="flex-1 min-w-0"
                                                                >
                                                                    <Text
                                                                        strong
                                                                        className="text-blue-600 leading-tight"
                                                                    >
                                                                        {
                                                                            item.productName
                                                                        }
                                                                    </Text>

                                                                    {/* Price tier badges */}
                                                                    {item.priceTiers &&
                                                                        item
                                                                            .priceTiers
                                                                            .length >
                                                                        0 && (
                                                                            <Flex
                                                                                gap={
                                                                                    6
                                                                                }
                                                                                wrap="wrap"
                                                                                className="!mt-1"
                                                                            >
                                                                                {[
                                                                                    ...item.priceTiers,
                                                                                ]
                                                                                    .sort(
                                                                                        (
                                                                                            a,
                                                                                            b,
                                                                                        ) =>
                                                                                            a.minQuantity -
                                                                                            b.minQuantity,
                                                                                    )
                                                                                    .map(
                                                                                        (
                                                                                            tier,
                                                                                        ) => {
                                                                                            const isActive =
                                                                                                item.quantity >=
                                                                                                tier.minQuantity &&
                                                                                                [
                                                                                                    ...(item.priceTiers as any),
                                                                                                ]
                                                                                                    .sort(
                                                                                                        (
                                                                                                            a,
                                                                                                            b,
                                                                                                        ) =>
                                                                                                            b.minQuantity -
                                                                                                            a.minQuantity,
                                                                                                    )
                                                                                                    .find(
                                                                                                        (
                                                                                                            t,
                                                                                                        ) =>
                                                                                                            item.quantity >=
                                                                                                            t.minQuantity,
                                                                                                    )
                                                                                                    ?.minQuantity ===
                                                                                                tier.minQuantity
                                                                                            return (
                                                                                                <span
                                                                                                    key={
                                                                                                        tier.minQuantity
                                                                                                    }
                                                                                                    className={`text-xs px-2 py-0.5 rounded-full border ${isActive
                                                                                                        ? 'bg-green-50 border-green-400 text-green-700 font-semibold'
                                                                                                        : 'bg-gray-50 border-gray-200 text-gray-400'
                                                                                                        }`}
                                                                                                >
                                                                                                    {
                                                                                                        tier.minQuantity
                                                                                                    }
                                                                                                    +:{' '}
                                                                                                    {formatPrice(
                                                                                                        tier.price,
                                                                                                    )}
                                                                                                </span>
                                                                                            )
                                                                                        },
                                                                                    )}
                                                                            </Flex>
                                                                        )}
                                                                </Flex>
                                                            </Col>

                                                            <Col span={4}>
                                                                {/* Quantity controls */}
                                                                <Flex
                                                                    vertical
                                                                    align="center"
                                                                    gap={8}
                                                                    className="flex-shrink-0"
                                                                >
                                                                    <Flex
                                                                        align="center"
                                                                        gap={0}
                                                                    >
                                                                        <Button
                                                                            size="small"
                                                                            className="!rounded-r-none !px-2"
                                                                            onClick={() =>
                                                                                updateQty(
                                                                                    item,
                                                                                    -1,
                                                                                )
                                                                            }
                                                                        >
                                                                            −
                                                                        </Button>
                                                                        <div className="border-t border-b border-gray-300 px-4 py-[1px] text-sm min-w-[40px] text-center">
                                                                            {
                                                                                item.quantity
                                                                            }
                                                                        </div>
                                                                        <Button
                                                                            size="small"
                                                                            className="!rounded-l-none !px-2"
                                                                            onClick={() =>
                                                                                updateQty(
                                                                                    item,
                                                                                    1,
                                                                                )
                                                                            }
                                                                        >
                                                                            +
                                                                        </Button>
                                                                    </Flex>
                                                                    <RemainingStock
                                                                        stock={
                                                                            item.availableStock ??
                                                                            0
                                                                        }
                                                                    />
                                                                </Flex>
                                                            </Col>

                                                            <Col span={5}>
                                                                {/* Unit price + subtotal */}
                                                                <Flex
                                                                    vertical
                                                                    align="flex-end"
                                                                    gap={4}
                                                                    className="w-auto flex-shrink-0 text-right md:w-32"
                                                                >
                                                                    <Flex
                                                                        vertical
                                                                        align="flex-end"
                                                                        gap={1}
                                                                    >
                                                                        {isDiscounted && (
                                                                            <Text className="text-xs text-gray-400 line-through">
                                                                                {formatPrice(
                                                                                    item.price,
                                                                                )}
                                                                            </Text>
                                                                        )}
                                                                        <Text
                                                                            className={`text-xs ${isDiscounted ? 'text-green-600 font-semibold' : 'text-gray-500'}`}
                                                                        >
                                                                            {t(
                                                                                'product.price',
                                                                            )}
                                                                            :{' '}
                                                                            {formatPrice(
                                                                                effectivePrice,
                                                                            )}
                                                                        </Text>
                                                                    </Flex>
                                                                    <Text
                                                                        strong
                                                                        className="text-sm"
                                                                    >
                                                                        {t(
                                                                            'cart.subtotal',
                                                                        )}
                                                                        :{' '}
                                                                        <span className="text-red-500">
                                                                            {formatPrice(
                                                                                effectivePrice *
                                                                                item.quantity,
                                                                            )}
                                                                        </span>
                                                                    </Text>
                                                                </Flex>
                                                            </Col>

                                                            <Col span={1}>
                                                                {/* Delete */}
                                                                <Button
                                                                    type="text"
                                                                    danger
                                                                    icon={
                                                                        <Trash
                                                                            size={
                                                                                16
                                                                            }
                                                                        />
                                                                    }
                                                                    onClick={() => {
                                                                        handleRemoveItem(
                                                                            item.productId,
                                                                        )
                                                                        removeItem(item.productId)
                                                                    }}
                                                                    className="flex-shrink-0 mt-1"
                                                                />
                                                            </Col>
                                                        </Flex>
                                                    </Row>
                                                    {idx < items.length - 1 && (
                                                        <Divider className="!my-4" />
                                                    )}
                                                </div>
                                            )
                                        })
                                    )}

                                    {!loadingCart && items.length === 0 && (
                                        <Flex
                                            justify="center"
                                            align="center"
                                            className="!py-16 text-gray-400"
                                        >
                                            {t('cart.empty')}
                                        </Flex>
                                    )}
                                </Card>
                            </Col>
                        </Row>
                    </Col>
                    <Col xs={24} lg={7}>
                        <Card
                            className="shadow-md border border-gray-100"
                            title={t('cart.orderSummary')}
                        >
                            <Flex
                                vertical
                                gap={10}
                            >
                                <Flex justify="space-between">
                                    <Text
                                        type="secondary"
                                        color="#000000"
                                    >
                                        {t('cart.subtotal')}
                                    </Text>
                                    <Text>{formatPrice(subtotal)}</Text>
                                </Flex>

                                <Divider className="!my-1" />

                                <Flex justify="space-between">
                                    <Text strong>{t('cart.total')}</Text>
                                    <Text
                                        strong
                                        className="text-red-500 text-base"
                                    >
                                        {formatPrice(subtotal)}
                                    </Text>
                                </Flex>

                                <Button
                                    type="primary"
                                    size="large"
                                    block
                                    disabled={checkedItems.length === 0}
                                    className="mt-2 !h-[44px] !text-white"
                                    onClick={() => {
                                        setCheckedOutItems(
                                            checkedItemsForCheckout,
                                        )
                                        sessionStorage.setItem(
                                            CHECKOUT_FLOW_KEY,
                                            Date.now().toString(),
                                        )
                                        router.push('/dat-hang')
                                    }}
                                >
                                    {t('cart.checkout')}
                                </Button>
                            </Flex>
                        </Card>
                    </Col>
                </Row>
            </Flex>
        </Suspense>
    )
}
