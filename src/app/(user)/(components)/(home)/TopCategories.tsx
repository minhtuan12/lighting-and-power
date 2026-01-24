import Carousel from "@/components/Carousel";
import { ICategory } from "@/types/category";
import { Flex } from "antd";

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
            {(category.children ?? []).map(item => <div key={item.name} className="text-center text-[15px] font-bold">{item.name}</div>)}
        </Carousel>
    </Flex>
}
