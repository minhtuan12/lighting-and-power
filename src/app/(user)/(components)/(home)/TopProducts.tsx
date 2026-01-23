import Carousel from "@/components/Carousel";
import { getProducts } from "@/fetch-data/products";
import { ICategory } from "@/types/category";
import { IProduct } from "@/types/product";
import { Flex } from "antd";
import ProductItem from "../ProductItem";

export default async function TopProducts({ category }: { category: ICategory }) {
    const { data } = await getProducts({ categoryId: category._id });

    return <Flex vertical gap={12}>
        <h3 className="bg-[#000F8F] text-center text-white font-semibold w-full h-9 flex items-center justify-center">
            {category.name.toUpperCase()}
        </h3>
        <Carousel<IProduct>
            items={data.products}
            pathToRedirect="san-pham"
        >
            {data.products.map(item => <ProductItem key={item._id} item={item} wrapClassName="!w-[215px]" />)}
        </Carousel>
    </Flex>
}
