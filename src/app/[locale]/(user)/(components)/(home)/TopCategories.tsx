import Carousel from "@/components/Carousel";
import DefaultImage from "@/components/DefaultImage";
import { routes } from "@/constants/routes";
import { ICategory } from "@/types/category";
import { Flex } from "antd";
import Link from "next/link";

export default async function TopCategories({ category }: { category: ICategory }) {
    return <Flex vertical gap={12}>
        <div
            className="w-full text-white h-10 flex items-center justify-center"
            style={{
                background: 'linear-gradient(90deg, #FFFFFF 15%, #0028BB 50%, #0052FF 40%, #0028BB 20%, #FFFFFF 85%)',
            }}
        >
            <h3 className="font-semibold text-[17px]">
                {category.name.toUpperCase()}
            </h3>
        </div>
        <Carousel<ICategory>
            items={category.children as ICategory[]}
            pathToRedirect="san-pham"
        >
            {
                (category.children ?? []).map(item => <Link key={item.name} href={`${routes.sanPham.url}/${item.slug}`} className="!w-full">
                    <Flex gap={15} vertical align="center">
                        <DefaultImage src={item.image} className="w-full h-40" />
                        <div className="text-center text-[15px] font-bold text-black">{item.name}</div>
                    </Flex>
                </Link>)
            }
        </Carousel>
    </Flex >
}
