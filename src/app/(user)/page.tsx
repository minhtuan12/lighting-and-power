import { getCategories } from "@/fetch-data/categories";
import { getDocuments } from "@/fetch-data/documents";
import { Flex } from "antd";
import Image from "next/image";
import IntroductionCard from "./(components)/(home)/IntroductionCard";
import TopDocuments from "./(components)/(home)/TopDocument";
import TopProducts from "./(components)/(home)/TopProducts";

const introductions = [
    { text: 'Giao hàng nhanh', icon: '/images/ship.png' },
    { text: 'Tư vấn chuyên nghiệp', icon: '/images/support.png' },
    { text: 'Sản phẩm chất lượng', icon: '/images/quality.png' },
    { text: 'Thanh toán linh hoạt', icon: '/images/payment.png' },
]

export default async function Home() {
    const { data: categories } = await getCategories();
    const { data: documentsData } = await getDocuments();

    return <Flex vertical gap={30}>
        <Image
            src={'/images/banner.png'}
            alt='Banner L&P'
            className="object-cover"
            priority
            width={1140}
            height={372}
        />
        <Flex className="w-full h-17" gap={16}>
            {introductions.map(({ text, icon }) => <IntroductionCard key={text} text={text} icon={icon} />)}
        </Flex>
        <TopProducts category={categories?.[0]} />
        <TopProducts category={categories?.[1]} />
        <TopDocuments documents={documentsData.documents} />
    </Flex>
}
