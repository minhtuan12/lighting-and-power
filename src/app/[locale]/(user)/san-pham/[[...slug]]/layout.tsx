import { Icon } from "@/components/Icon"
import Loading from "@/components/Loading"
import { routes } from "@/constants/routes"
import {
    CategoryChainResult,
    getCategoryChain
} from "@/lib/utils"
import { Breadcrumb, Flex } from "antd"
import { ItemType } from "antd/es/breadcrumb/Breadcrumb"
import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import React, { Suspense } from "react"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug?: string[] }>
}): Promise<Metadata> {
    const t = await getTranslations();
    const locale = await getLocale();
    const { slug: slugs } = await params
    const { categories, isLastChild } = await getCategoryChain(slugs || [])

    const title = isLastChild && categories.length > 0
        ? categories[categories.length - 1].name
        : t('common.product')

    return {
        title,
        description: locale === 'vi' ? "Sản phẩm của Lighting and Power" : "Lighting and Power's Products",
    }
}

function buildBreadcrumbFromChain(
    categories: CategoryChainResult["categories"],
) {
    const currentBreadcrumb: ItemType[] = [
        { title: <Icon src="/images/home.png" size={20} />, href: "/" },
        { title: routes.sanPham.title, href: routes.sanPham.url },
    ]
    let currentPath = routes.sanPham.url

    categories.forEach((ctg) => {
        currentPath = `${currentPath}/${ctg.slug}`
        currentBreadcrumb.push({
            title: ctg.name,
            href: currentPath,
        })
    })

    return currentBreadcrumb
}

export default async function ProductLayout({
    sidebar,
    content,
    params,
}: Readonly<{
    sidebar: React.ReactNode
    content: React.ReactNode
    params: Promise<{ slug?: string[] }>
}>) {
    const { slug: slugs } = await params
    const { categories } = await getCategoryChain(slugs || [])
    const breadcrumb = buildBreadcrumbFromChain(categories)

    return (
        <Suspense
            fallback={
                <div className="pt-[174px]">
                    <Loading />
                </div>
            }
        >
            <Flex gap={10} vertical className="custom-breadcrumb max-xl:!px-6 max-lg:!mt-20 !mb-20">
                <Breadcrumb items={breadcrumb} separator=">" />
                <Flex gap={16} justify="space-between" className="max-md:!flex-col">
                    {sidebar}
                    {content}
                </Flex>
            </Flex>
        </Suspense>
    )
}
