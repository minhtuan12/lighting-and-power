'use client'

import { Icon } from "@/components/Icon";
import { addToCartAtom } from "@/stores";
import { IProduct } from "@/types/product";
import { Button, Col, Flex, InputNumber, Row } from "antd";
import { useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

interface IProps {
    product: IProduct;
    minQuantity?: number;
    maxQuantity: number;
    size?: 'small' | 'large';
}

export default function AddToCart(
    { product, minQuantity, maxQuantity, size = 'small' }: IProps
) {
    const t = useTranslations('product');
    const [quantity, setQuantity] = useState(minQuantity ?? 1);
    const isSmallSize = size === 'small';
    const outOfStock = useMemo(() => !product.stock, [product?.stock]);
    const addToCart = useSetAtom(addToCartAtom);

    function handleChangeQuantity(type: string) {
        if (!outOfStock) {
            setQuantity(prev =>
                type === 'minus' ? ((prev - 1) < (minQuantity ?? 1) ? 1 : prev - 1) :
                    ((prev + 1) > maxQuantity ? maxQuantity : (prev + 1))
            );
        }
    }

    function handleAddToCart() {
        addToCart({
            productId: product._id,
            price: product.price,
            productName: product.name,
            productSlug: product.slug,
            quantity,
        });
    }

    return <Flex vertical gap={12} className="w-full">
        <Row className="w-full border border-[#BEBEBE] rounded-[5px]">
            <Col span={8} className="text-center pt-1 hover:bg-gray-200 cursor-pointer select-none" onClick={() => handleChangeQuantity('minus')}>-</Col>
            <Col span={8} className="text-center border-x border-x-[#BEBEBE] custom-input-number">
                <InputNumber
                    value={quantity}
                    controls={false}
                    onWheel={() => { }}
                    min={minQuantity ?? 1}
                    max={maxQuantity}
                    onChange={value => setQuantity(value ?? minQuantity ?? 1)}
                    className="!w-full"
                />
            </Col>
            <Col span={8} className="text-center pt-1 hover:bg-gray-200 cursor-pointer select-none" onClick={() => handleChangeQuantity('plus')}>+</Col>
        </Row>
        <Button disabled={outOfStock} onClick={handleAddToCart} className={`w-full rounded-[5px] flex items-center gap-3 !bg-[var(--primary)] hover:!bg-blue-800 ${isSmallSize ? '!h-[30px]' : '!h-[34px]'}`} type="primary">
            <Icon src="/images/cart.png" size={15} />
            <span className={`${isSmallSize ? 'text-[12px]' : 'text-[14px]'}`}>
                {t('addToCart')}
            </span>
        </Button>
    </Flex>
}
