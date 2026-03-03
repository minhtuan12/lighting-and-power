import PaginationClient from "@/app/[locale]/(user)/(components)/(product)/filter/PaginationClient"
import ProductDetail from "@/app/[locale]/(user)/(components)/(product)/ProductDetail"
import ProductItem from "@/app/[locale]/(user)/(components)/ProductItem"
import DefaultImage from "@/components/DefaultImage"
import { PAGE_LIMIT } from "@/constants/common"
import { routes } from "@/constants/routes"
import { getCategories } from "@/fetch-data/categories"
import { getProducts } from "@/fetch-data/products"
import { getCategoryChain } from "@/lib/utils"
import { ICategory } from "@/types/category"
import { SlugPageProps } from "@/types/general"
import { IProduct } from "@/types/product"
import { Flex } from "antd"
import Link from "next/link"

interface IProductContent {
    data: IProduct[]
}

interface ICategoryContent {
    categories: ICategory[]
    slugs: string[]
}

function CategoriesContent({ categories, slugs }: ICategoryContent) {
    return (
        <>
            {categories.map((c) => {
                const link =
                    slugs?.length > 0
                        ? `${routes.sanPham.url}/${slugs?.join("/")}/${c.slug}`
                        : `${routes.sanPham.url}/${c.slug}`
                return (
                    <Link
                        href={link}
                        className="hover:shadow-md flex flex-col !w-full gap-3 border border-[#D6D6D6] rounded-[10px] !px-3 !pt-3 !pb-5 h-[218px]"
                        key={c._id}
                    >
                        <DefaultImage
                            src={"/images/electronic.jpg"}
                            className="w-full h-[135px]"
                        />
                        <h3 className="line-clamp-2 w-full text-[13px] text-black px-1">
                            {c.name}
                        </h3>
                    </Link>
                )
            })}
        </>
    )
}

async function ProductsContent({ data }: IProductContent) {
    return (
        <>
            {data.map((p) => (
                <ProductItem
                    item={p}
                    enableAddToCart
                    key={p._id}
                    className="!w-full"
                    wrapClassName="!w-full"
                />
            ))}
        </>
    )
}

export default async function ({ params, searchParams }: SlugPageProps) {
    const { slug: slugs } = await params
    const query = await searchParams
    const { isLastChild, lastSlug } = await getCategoryChain(slugs || [])
    let categories: ICategory[] = []
    let productsData: IProduct[] = []
    let pagination = {
        total: 0,
        page: 1,
        totalPages: 1,
    }

    if (isLastChild) {
        if (slugs.includes("chi-tiet") || slugs.includes("detail")) {
            // Product Detail
            return <ProductDetail slug={lastSlug} />
        } else {
            // Product List
            const { products, page, total, totalPages } = (
                await getProducts({ ...query, categorySlug: lastSlug })
            ).data
            pagination = {
                total,
                totalPages,
                page,
            }
            productsData = products
        }
    } else {
        if (!slugs) {
            // Parent category (level 0)
            categories = (await getCategories()).data
        } else {
            // Child category
            categories = (await getCategories({ parentSlug: lastSlug })).data
        }
    }

    // ========= Product List or Category List ==========
    return (
        <Flex vertical gap={24} className="flex-1 max-lg:!mt-3">
            <div className={`grid ${isLastChild ? 'max-[465px]:grid-cols-[repeat(auto-fill,100%)] grid-cols-[repeat(auto-fill,200px)]' : 'max-[465px]:grid-cols-[repeat(auto-fill,100%)] grid-cols-[repeat(auto-fill,190px)]'} gap-3 justify-end max-lg:justify-start h-fit`}>
                {isLastChild ? (
                    <ProductsContent data={productsData} />
                ) : (
                    <CategoriesContent categories={categories} slugs={slugs} />
                )}
            </div>
            {isLastChild && (
                <Flex className="w-full" justify="center">
                    <PaginationClient
                        total={pagination.total}
                        pageSize={PAGE_LIMIT}
                        current={pagination.page}
                    />
                </Flex>
            )}
        </Flex>
    )
}
