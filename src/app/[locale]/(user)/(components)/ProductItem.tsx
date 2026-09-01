"use client"

import { routes } from "@/constants/routes"
import { IProduct } from "@/types/product"
import { Card, Flex } from "antd"
import { useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import RemainingStock from "./(product)/RemainingStock"
import AddToFavourite from "./AddToFavourite"

interface IProps {
    item: IProduct
    wrapClassName?: string
    className?: string
    enableAddToCart?: boolean // Kept for compatibility with existing callers.
}

function ItemContent({ item, className, enableAddToCart }: IProps) {
    const t = useTranslations("product")

    return (
        <Card
            style={{
                border: "1px solid #b0b0b0",
            }}
            className={`overflow-hidden rounded-[5px] [&>.ant-card-body]:!px-0 [&>.ant-card-body]:!pt-0 max-md:[&>.ant-card-body]:!pb-0 [&>.ant-card-body]:!pb-3 w-full ${className}`}
        >
            <div className="absolute top-0 right-0 z-10 bg-gray-600 rounded-bl-[6px] p-1.5">
                <AddToFavourite product={item} />
            </div>
            <Flex className="w-full h-full max-md:flex-row flex-col" gap={7}>
                <div className="relative w-full h-[173px]">
                    <Link
                        target="_blank"
                        href={`${routes.chiTietSanPham.url}/${item.slug}`}
                    >
                        <Image
                            alt={item.name ?? ""}
                            src={item.images?.[0] ?? ""}
                            className="w-full h-full absolute object-cover"
                            fill
                            loading="lazy"
                        />
                    </Link>
                </div>
                <Flex vertical className="!flex-1 !px-3 max-md:!py-2" gap={8} justify="space-between">
                    <Flex align="center" justify="space-between" gap={8}>
                        <Link
                            target="_blank"
                            href={`${routes.chiTietSanPham.url}/${item.slug}`}
                            style={{ textDecoration: "none" }}
                            className="line-clamp-3 !text-black flex-1 font-semibold"
                        >
                            {item.name}
                        </Link>
                    </Flex>
                    <Flex vertical className="!flex-1" gap={8} justify="end">
                        {item.price && (
                            <Flex gap={1}>
                                <p className="line-clamp-4 text-[var(--primary)] font-black text-[15px]">
                                    {item.price?.toLocaleString("vi-VN")}đ
                                </p>
                                <span>/{item.unit}</span>
                            </Flex>
                        )}
                        {item.stock && <RemainingStock stock={item.stock} />}
                        {/* {enableAddToCart && (
                            <AddToCart
                                product={item}
                                minQuantity={item.minOrderQuantity}
                                maxQuantity={item.stock}
                            />
                        )} */}
                    </Flex>
                </Flex>
            </Flex>
        </Card>
    )
}

export default function ProductItem({
    item,
    className = "",
    wrapClassName = "",
    enableAddToCart = false,
}: IProps) {
    const content = enableAddToCart ? <ItemContent item={item} className={className} enableAddToCart /> : <Link
        href={`${routes.sanPham.url}/${item.slug}`}
        style={{
            textDecoration: "none",
        }}
        aria-label={`Browse ${item.name}`}
        className={`h-auto flex ${wrapClassName}`}
    >
        <ItemContent item={item} className={className} enableAddToCart />
    </Link>

    return <>
        {content}
    </>
}
