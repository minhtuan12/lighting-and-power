import { routes } from "@/constants/routes"
import { fetchDocumentCategories } from "@/fetch-data/documents"
import { routing } from "@/i18n/routing"
import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import DocumentBrowser from "../(components)/(document)/DocumentBrowser"

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations()
    const locale = await getLocale()
    const localizedPath = routing.pathnames[
        routes.taiLieuDienTu.url as keyof typeof routing.pathnames
    ] as { en?: string; vi?: string } | string | undefined
    const canonical =
        typeof localizedPath === "string"
            ? localizedPath
            : localizedPath?.[locale as "en" | "vi"] ??
            routes.taiLieuDienTu.url

    const title = t("common.document")
    const description =
        locale === "vi"
            ? "Tài liệu kỹ thuật theo thiết bị: định nghĩa, cấu tạo, hướng dẫn và tài liệu liên quan."
            : "Technical documents by device: definitions, structures, guides, and related references."
    let categories: { name?: string }[] = []
    try {
        categories = await fetchDocumentCategories()
    } catch {
        categories = []
    }
    const categoryKeywords = categories
        .map((category) => category.name?.trim())
        .filter(Boolean) as string[]
    const baseKeywords =
        locale === "vi"
            ? [
                "tài liệu kỹ thuật",
                "tài liệu điện tử",
                "hướng dẫn",
                "cấu tạo",
                "định nghĩa",
                "thông số kỹ thuật",
            ]
            : [
                "technical documents",
                "device documentation",
                "user guide",
                "structure",
                "definition",
                "technical specifications",
            ]
    const keywords = Array.from(
        new Set([title, ...baseKeywords, ...categoryKeywords]),
    )

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
            languages:
                typeof localizedPath === "string"
                    ? {
                        en: localizedPath,
                        vi: localizedPath,
                    }
                    : {
                        en: localizedPath?.en ?? "/documents",
                        vi:
                            localizedPath?.vi ??
                            routes.taiLieuDienTu.url,
                    },
        },
        openGraph: {
            title,
            description,
            url: canonical,
            type: "website",
            siteName: "Lighting & Power",
            locale: locale === "vi" ? "vi_VN" : "en_US",
            images: [
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
            images: ["/images/logo-vertical.png"],
        },
    }
}

export default async function DocumentPage() {
    const categories = await fetchDocumentCategories()
    return <DocumentBrowser categories={categories} />
}
