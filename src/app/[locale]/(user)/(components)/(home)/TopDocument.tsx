import Carousel from "@/components/Carousel"
import { IDocument } from "@/types/document"
import { Flex } from "antd"
import Image from "next/image"
import Link from "next/link"

function DocumentItem({ item }: { item: IDocument }) {
    return (
        <Link
            href={`tai-lieu/${item._id}`}
            style={{
                textDecoration: "none",
            }}
            aria-label={`Browse ${item.title}`}
            className="h-auto lg:!w-[321px] !w-full flex snap-start"
        >
            <Flex vertical className="w-full h-auto" gap={16}>
                <div className="relative w-full h-[173px] border-[#B7B7B7] border">
                    <Image
                        alt={item.title ?? ""}
                        src={"/images/electronic.jpg"}
                        className="w-full h-full absolute"
                        fill
                        objectFit="cover"
                        loading="lazy"
                    />
                </div>
                <h5 className="text-center text-black text-[14px] text-justify">
                    {item.title}
                </h5>
            </Flex>
        </Link>
    )
}

export default function TopDocuments({
    documents,
}: {
    documents: IDocument[]
}) {
    return (
        <Flex vertical gap={12} className="max-md:!px-6 max-lg:!px-10 !mb-20">
            <h3
                className="text-center text-white font-semibold w-full h-9 flex items-center justify-center bg-[var(--primary)] lg:bg-[linear-gradient(90deg,_#FFFFFF_15%,_#0028BB_50%,_#0052FF_40%,_#0028BB_20%,_#FFFFFF_85%)]"
            >
                SỔ TAY NGÀNH ĐIỆN TỬ
            </h3>
            <Carousel<IDocument>
                items={documents}
                className="auto-cols-[100%] md:auto-cols-[calc(50%-16px)] lg:auto-cols-[321px] "
            >
                {documents.map((item) => (
                    <DocumentItem key={item._id} item={item} />
                ))}
            </Carousel>
        </Flex>
    )
}
