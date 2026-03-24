import DefaultImage from "@/components/DefaultImage";
import { IProduct } from "@/types/product";
import { Flex, Typography } from "antd";

export default function RelatedProducts({ products }: { products: IProduct[] }) {
	return (
		<Flex gap={16} className="w-full overflow-x-auto scrollbar-thin">
			{products.map((product) => (
				<Flex key={product._id} gap={5} className="flex-col items-center w-[180px]">
					<DefaultImage src={product.images?.[0] || '/images/logo-only.png'} className="w-[180px] h-[180px]" />
					<Typography.Text className="font-semibold text-md text-center">{product.name}</Typography.Text>
				</Flex>
			))}
		</Flex>
	);
}
