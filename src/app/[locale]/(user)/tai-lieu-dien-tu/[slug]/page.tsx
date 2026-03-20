import DefaultImage from "@/components/DefaultImage";
import FileViewer from "@/components/FileViewer";
import Loading from "@/components/Loading";
import RichTextContent from "@/components/RichTextContent";
import { routes } from "@/constants/routes";
import { getDocumentDetail } from "@/fetch-data/documents";
import { routing } from "@/i18n/routing";
import { Flex } from "antd";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

export const revalidate = 3600;

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const locale = await getLocale();
    const t = await getTranslations();
    const { data: doc } = await getDocumentDetail(slug);
    const title = doc?.title ?? t("common.document");
    const description =
        doc?.description ??
        (locale === "vi"
            ? "Tài liệu kỹ thuật chi tiết theo thiết bị."
            : "Detailed technical document by device.");
    const localizedPath = routing.pathnames[
        routes.taiLieuDienTu.url as keyof typeof routing.pathnames
    ] as { en?: string; vi?: string } | string | undefined;
    const basePath =
        typeof localizedPath === "string"
            ? localizedPath
            : localizedPath?.[locale as "en" | "vi"] ??
              routes.taiLieuDienTu.url;
    const canonical = `${basePath}/${slug}`;
    const keywords = Array.from(
        new Set(
            [
                title,
                doc?.type,
                locale === "vi" ? "tài liệu kỹ thuật" : "technical document",
            ].filter(Boolean) as string[],
        ),
    );

    return {
        title,
        description,
        keywords,
        robots: {
            index: true,
            follow: true,
        },
        alternates: {
            canonical,
        },
        openGraph: {
            title,
            description,
            url: canonical,
            type: "article",
            siteName: "Lighting & Power",
            locale: locale === "vi" ? "vi_VN" : "en_US",
            images: doc?.thumbnail
                ? [
                      {
                          url: doc.thumbnail,
                          width: 1200,
                          height: 630,
                          alt: title,
                      },
                  ]
                : [
                      {
                          url: "/images/logo-vertical.png",
                          width: 800,
                          height: 600,
                          alt: title,
                      },
                  ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [
                doc?.thumbnail ? doc.thumbnail : "/images/logo-vertical.png",
            ],
        },
    };
}

export default async function DocumentDetail({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { data: doc } = await getDocumentDetail(slug);

    if (!doc) {
        return null;
    }

    return <Suspense fallback={<Loading />}>
        <Flex gap={20} vertical className="!mt-5 !mb-20">
            <h3 className="font-semibold text-xl text-center mb-3">{doc.title.toUpperCase()}</h3>
            {doc.thumbnail && <DefaultImage src={doc.thumbnail} className="w-full h-[400px]" title={doc.title} />}
            {doc.description && <div className="text-[17px] text-align">{doc.description}</div>}
            {doc.content && doc.contentType === "text" && <RichTextContent html={doc.content} />}
            {doc.fileUrl && doc.contentType === "file" && <FileViewer documents={[{ uri: doc.fileUrl }]} />}
        </Flex>
    </Suspense>
}
