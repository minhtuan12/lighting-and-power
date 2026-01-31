import Filters from "@/app/[locale]/(user)/(components)/(product)/filter/Filters";
import DefaultImage from "@/components/DefaultImage";
import { routes } from "@/constants/routes";
import { getCategories } from "@/fetch-data/categories";
import { getProducts, IProductResponse } from "@/fetch-data/products";
import { getCategoryChain } from "@/lib/utils";
import { ICategory } from "@/types/category";
import { SearchParams } from "@/types/general";
import { IProduct } from "@/types/product";
import { Card, Flex } from "antd";
import Link from "next/link";

function CategorySidebar({ slugs, categories }: { slugs: string[]; categories: ICategory[] }) {
    return <Card title='Danh mục' className="w-full card-custom">
        <Flex vertical className="py-2">
            {categories.map((c, index) => {
                const link = routes.sanPham.url + `/${[...slugs, c.slug].join('/')}`;
                return <Link href={link} key={index} className={`
                    !text-[13px] !text-black !py-3 !px-4 !w-full
                    ${index === categories.length - 1 ? '' : '!border-b-[#CCCCCC] !border-b'}
                    hover:!bg-[#c0e8fe] last:hover:!rounded-b-[8px]
                `}>
                    {c.name}
                </Link>
            })}
        </Flex>
    </Card>
}

function TopProductsSidebar({ products }: { products: IProduct[] }) {
    return <Flex vertical className="py-2 w-full" gap={13}>
        <h4 className="text-white text-[15px] bg-[var(--primary)] py-[11px] px-[15px] font-bold w-full h-10">Sản phẩm nổi bật</h4>
        <div className="max-h-[400px] overflow-y-auto gap-3 flex flex-col">
            {products.length < 0 ? products.map((p) => (
                <Flex gap={14} align="center" className="max-w-full" key={p._id}>
                    <DefaultImage src={p.images[0]} className="w-20 h-18" title={p.name} />
                    <h5 className="text-[13px] text-black flex-1 line-clamp-3">{p.name}</h5>
                </Flex>
            )) : <i className="text-center text-gray-400">Chưa có</i>}
        </div>
    </Flex>
}

interface SidebarProps {
    params: Promise<{ slug: string[] }>;
    searchParams: Promise<SearchParams>;
}

export default async function ({ params, searchParams }: SidebarProps) {
    const { slug: slugs } = await params;
    const { lastSlug, isLastChild } = await getCategoryChain(slugs || []);

    const [categoriesData, productsData] = await Promise.all([
        ...(
            isLastChild ? [getProducts({ categorySlug: lastSlug })] :
                [getCategories(lastSlug ? { parentSlug: lastSlug } : {})]
        ),
        getProducts({ isFeatured: true })
    ]);

    return <Flex gap={30} className={`w-[260px]`} vertical>
        {
            isLastChild ? <Filters searchParams={(await searchParams as any)} /> :
                <CategorySidebar slugs={slugs || []} categories={categoriesData.data as ICategory[]} />
        }
        <TopProductsSidebar products={(productsData as IProductResponse).data.products} />
    </Flex>
}
