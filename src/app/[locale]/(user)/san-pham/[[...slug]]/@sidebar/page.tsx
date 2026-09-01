import Filters from "@/app/[locale]/(user)/(components)/(product)/filter/Filters"
import DefaultImage from "@/components/DefaultImage"
import { routes } from "@/constants/routes"
import { getCategories } from "@/fetch-data/categories"
import { getProducts, IProductResponse } from "@/fetch-data/products"
import { capitalizeFirstLetterEachWord, getCategoryChain } from "@/lib/utils"
import { ICategory } from "@/types/category"
import { SearchParams } from "@/types/general"
import { IProduct } from "@/types/product"
import { Card, Flex } from "antd"
import { getTranslations } from "next-intl/server"
import Link from "next/link"

async function CategorySidebar({
    slugs,
    categories,
}: {
    slugs: string[]
    categories: ICategory[]
}) {
    const t = await getTranslations();
    return (
        <Card title={t('common.category')} className="w-full card-custom">
            <Flex className="!flex-col max-lg:!p-4 max-lg:!overflow-x-auto max-lg:!gap-4 scrollbar-thin max-lg:max-h-[250px]">
                {categories.map((c, index) => {
                    const link = routes.sanPham.url + `/${[...slugs, c.slug].join("/")}`
                    return <Link
                        href={link}
                        key={index}
                        className={`
                            !text-[13px] !text-black !py-3 !px-4 !w-full
                            ${index === categories.length - 1 ? "" : "!border-b-[#CCCCCC] !border-b"}
                            hover:!bg-[#c0e8fe] last:hover:!rounded-b-[8px]
                            max-lg:!text-[14px] max-lg:!min-w-30 max-lg:!text-center max-lg:!px-5 max-lg:!py-2 max-lg:!rounded-full max-lg:!border-[var(--primary)] max-lg:border-1
                        `}
                    >
                        {c.name}
                    </Link>
                })}
            </Flex>
            <div className="h-1.5" />
        </Card>
    )
}

async function TopProductsSidebar({ products }: { products: IProduct[] }) {
    const t = await getTranslations();
    return (
        <Card title={t('product.featuredProducts')} className="w-full card-custom">
            <Flex className="!flex-col max-lg:!p-4 max-lg:!overflow-x-auto max-lg:!gap-4 scrollbar-thin max-lg:max-h-[250px]">
                {products.length < 0 ? (
                    products.map((p) => (
                        <Flex
                            gap={14}
                            align="center"
                            className="lg:max-w-full w-[400px]"
                            key={p._id}
                        >
                            <DefaultImage
                                src={p.images[0]}
                                className="w-20 h-18"
                                title={p.name}
                            />
                            <h5 className="text-[13px] text-black flex-1 line-clamp-3">
                                {p.name}
                            </h5>
                        </Flex>
                    ))
                ) : (
                    <i className="text-center text-gray-400 mt-3 mb-1">{t('common.NA')}</i>
                )}
            </Flex>
            <div className="h-1.5" />
        </Card>
    )
}

interface SidebarProps {
    params: Promise<{ slug: string[] }>
    searchParams: Promise<SearchParams>
}

export default async function ({ params, searchParams }: SidebarProps) {
    const { slug: slugs } = await params
    const { lastSlug, isLastChild, isProductDetail, categories } = await getCategoryChain(slugs || [])

    const [categoriesData, productsData] = await Promise.all([
        ...(isProductDetail
            ? [Promise.resolve({ data: [] })]
            : isLastChild
                ? [getProducts({ categorySlug: lastSlug })]
                : [getCategories(lastSlug ? { parentSlug: lastSlug } : {})]),
        getProducts({ isFeatured: true }),
    ])

    return (
        <Flex gap={6} className={`w-full lg:w-[260px] !h-fit lg:!sticky lg:!top-41`} vertical>
            {isLastChild && (
                <Flex className="!mb-2 lg:!sticky lg:!top-[160px]">
                    <h4 className="text-lg font-semibold">
                        {capitalizeFirstLetterEachWord(
                            categories[categories.length - 1].name ?? "",
                        )}
                    </h4>
                </Flex>
            )}
            <Flex gap={30} className={`w-full lg:w-[260px] !h-fit lg:!sticky lg:!top-50`} vertical>
                {isLastChild && !isProductDetail ? (
                    <Filters searchParams={(await searchParams) as any} />
                ) : !isProductDetail ? (
                    <CategorySidebar
                        slugs={slugs || []}
                        categories={categoriesData.data as ICategory[]}
                    />
                ) : null}
                <TopProductsSidebar
                    products={(productsData as IProductResponse).data.products}
                />
            </Flex>
        </Flex>
    )
}
