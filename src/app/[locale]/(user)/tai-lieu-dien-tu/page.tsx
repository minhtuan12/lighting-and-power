import DefaultImage from "@/components/DefaultImage";
import Loading from "@/components/Loading";
import { getDocuments } from "@/fetch-data/documents";
import { Col, Flex, Row } from "antd";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

export default async function Document() {
    const t = await getTranslations()
    const { data } = await getDocuments()

    return (
        <Suspense
            fallback={
                <div className="pt-[174px]">
                    <Loading />
                </div>
            }
        >
            <Flex
                vertical
                className="!mt-6"
                gap={40}
            >
                <h3 className="text-center text-lg text-white font-semibold w-full h-9 flex items-center justify-center bg-[var(--primary)] lg:bg-[linear-gradient(90deg,_#FFFFFF_15%,_#0028BB_50%,_#0052FF_40%,_#0028BB_20%,_#FFFFFF_85%)]">
                    {t('common.document').toUpperCase()}
                </h3>
                <Row gutter={30}>
                    {data.documents.map((d) => (
                        <Col key={d._id} span={6} className="h-[160px]">
                            <Link href={d.slug}>
                                <DefaultImage src={d.thumbnail || '/images/logo-vertical.png'} className="w-full h-full" />
                                <h5 className="font-semibold text-[15px] text-black line-clamp-3 mt-2 px-0.5">{d.title}</h5>
                            </Link>
                        </Col>
                    ))}
                </Row>
            </Flex>
        </Suspense>
    )
}
