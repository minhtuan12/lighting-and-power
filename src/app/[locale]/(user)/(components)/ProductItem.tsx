"use client"

import { routes } from "@/constants/routes"
import { IProduct } from "@/types/product"
import { Card, Flex } from "antd"
import { useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import JotaiProvider from "../../(providers)/jotai-provider"
import QueryProvider from "../../(providers)/query-provider"
import RemainingStock from "./(product)/RemainingStock"
import AddToCart from "./AddToCart"

interface IProps {
    item: IProduct
    wrapClassName?: string
    className?: string
    enableAddToCart?: boolean
}

function ItemContent({ item, className, enableAddToCart }: IProps) {
    const t = useTranslations("product")

    return (
        <Card
            style={{
                border: "1px solid #b0b0b0",
            }}
            className={`hover:!border-[var(--primary)] overflow-hidden rounded-[5px] [&>.ant-card-body]:!px-[8px] [&>.ant-card-body]:!pt-2 [&>.ant-card-body]:!pb-3 w-full ${className}`}
        >
            <Flex className="w-full h-full" vertical gap={7}>
                <div className="relative w-full h-[173px] border-[#B7B7B7] border">
                    <Link
                        target="_blank"
                        href={`${routes.chiTietSanPham.url}/${item.slug}`}
                    >
                        <Image
                            alt={item.name ?? ""}
                            src={item.images?.[0] ?? ""}
                            className="w-full h-full absolute"
                            fill
                            objectFit="contain"
                            loading="lazy"
                        />
                    </Link>
                </div>
                <Flex vertical className="!flex-1" gap={8} justify="space-between">
                    <Link
                        target="_blank"
                        href={`${routes.chiTietSanPham.url}/${item.slug}`}
                        style={{
                            textDecoration: "none",
                        }}
                        className="line-clamp-3 !text-black"
                    >
                        {item.name}
                    </Link>
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
                        {enableAddToCart && (
                            <AddToCart
                                product={item}
                                minQuantity={item.minOrderQuantity}
                                maxQuantity={item.stock}
                            />
                        )}
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
    return <JotaiProvider>
        <QueryProvider>
            {content}
        </QueryProvider>
    </JotaiProvider>
}
