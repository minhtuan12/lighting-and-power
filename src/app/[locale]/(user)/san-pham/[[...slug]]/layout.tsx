import { Icon } from "@/components/Icon";
import Loading from "@/components/Loading";
import { routes } from "@/constants/routes";
import { capitalizeFirstLetterEachWord, CategoryChainResult, getCategoryChain } from "@/lib/utils";
import { Breadcrumb, Flex } from "antd";
import { ItemType } from "antd/es/breadcrumb/Breadcrumb";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
    title: "Sản phẩm",
    description: "Sản phẩm của Lighting and Power",
};

function buildBreadcrumbFromChain(categories: CategoryChainResult['categories']) {
    const currentBreadcrumb: ItemType[] = [
        { title: <Icon src="/images/home.png" size={20} />, href: '/' },
        { title: 'Sản phẩm', href: routes.sanPham.url },
    ];
    let currentPath = routes.sanPham.url;

    categories.forEach(ctg => {
        currentPath = `${currentPath}/${ctg.slug}`;
        currentBreadcrumb.push({
            title: ctg.name,
            href: currentPath
        });
    });

    return currentBreadcrumb;
}

export default async function ProductLayout(
    {
        sidebar,
        content,
        params,
    }: Readonly<{
        sidebar: React.ReactNode;
        content: React.ReactNode;
        params: Promise<{ slug?: string[] }>;
    }>
) {
    const { slug: slugs } = await params;
    const { categories, isLastChild } = await getCategoryChain(slugs || []);
    const breadcrumb = buildBreadcrumbFromChain(categories);

    return (
        <Suspense fallback={<div className="pt-[174px]"><Loading /></div>}>
            <Flex gap={10} vertical className="!pt-5 custom-breadcrumb">
                <Breadcrumb items={breadcrumb} separator='>' />
                {
                    isLastChild && <Flex className="!mb-2">
                        <h4 className="text-lg">
                            {capitalizeFirstLetterEachWord(categories[categories.length - 1].name ?? '')}
                        </h4>
                    </Flex>
                }
                <Flex gap={16} justify="space-between">
                    {sidebar}
                    {content}
                </Flex>
            </Flex>
        </Suspense>
    );
}
