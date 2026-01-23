import ProductDetail from "@/app/(user)/(components)/(product)/ProductDetail";
import ProductItem from "@/app/(user)/(components)/ProductItem";
import DefaultImage from "@/components/DefaultImage";
import { PAGE_LIMIT } from "@/constants/common";
import { routes } from "@/constants/routes";
import { getCategories } from "@/fetch-data/categories";
import { getProducts } from "@/fetch-data/products";
import { getCategoryChain } from "@/lib/utils";
import { ICategory } from "@/types/category";
import { SlugPageProps } from "@/types/general";
import { IProduct } from "@/types/product";
import { Flex, Pagination } from "antd";
import Link from "next/link";

interface IProductContent {
    slugs: string[];
    data: IProduct[];
}

interface ICategoryContent {
    categories: ICategory[];
    slugs: string[];
}

function CategoriesContent({ categories, slugs }: ICategoryContent) {
    return <>
        {categories.map(c => {
            const link = slugs?.length > 0 ? `${routes.sanPham.url}/${slugs?.join('/')}/${c.slug}` : `${routes.sanPham.url}/${c.slug}`;
            return <Link href={link} className="hover:shadow-md flex flex-col justify-between !w-[190px] gap-3 border border-[#D6D6D6] rounded-[10px] !px-3 !pt-3 !pb-5 h-[218px]" key={c._id}>
                <DefaultImage src={'/images/electronic.jpg'} className="w-full h-[135px]" />
                <h3 className="line-clamp-2 w-full text-[13px] text-black">{c.name}</h3>
            </Link>
        })}
    </>
}

async function ProductsContent({ slugs, data, }: IProductContent) {
    return <>
        {data.map(p => <ProductItem item={p} enableAddToCart key={p._id} className="!w-full" />)}
    </>
}

export default async function ({ params, searchParams }: SlugPageProps) {
    const { slug: slugs } = await params;
    const query = await searchParams;
    const { isLastChild, lastSlug } = await getCategoryChain(slugs || []);
    let categories: ICategory[] = [];
    let productsData: IProduct[] = [];
    let pagination = {
        total: 0,
        page: 1,
        totalPages: 1,
    }

    if (isLastChild) {
        if (slugs.includes('chi-tiet')) {
            // Product Detail
            return <ProductDetail slug={lastSlug} />
        } else {
            // Product List
            const { products, page, total, totalPages } = (await getProducts(query)).data;
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
            categories = (await getCategories()).data;
        } else {
            // Child category
            categories = (await getCategories({ parentSlug: lastSlug })).data;
        }
    }

    // ========= Product List or Category List ==========
    return <Flex vertical gap={24} className="flex-1">
        <div className="grid grid-cols-[repeat(auto-fill,190px)] gap-5 justify-end h-fit">
            {
                isLastChild ? <ProductsContent slugs={slugs} data={productsData} /> :
                    <CategoriesContent categories={categories} slugs={slugs} />
            }
        </div>
        {
            isLastChild && <Flex className="w-full" justify="center">
                <Pagination
                    total={pagination.total}
                    pageSize={PAGE_LIMIT}
                    current={pagination.page}
                    className="custom-pagination"
                />
            </Flex>
        }
    </Flex>
}
