import { IDocument } from "@/types/document"
import { IDocumentCategory } from "@/types/document-category"

interface IDcoumentResponse {
    success: boolean
    data: {
        documents: IDocument[]
        totalPages: number
        total: number
        page: number
    }
}

interface IDcoumentDetailResponse {
    success: boolean
    data: IDocument | null
}

export async function getDocuments(): Promise<IDcoumentResponse> {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL!}/api/documents`,
            {
                next: {
                    revalidate: 3600 * 3, // Cache for 3 hour
                    tags: ["documents"],
                },
            },
        )

        if (!res.ok) {
            throw new Error("Failed to fetch documents")
        }

        return res.json()
    } catch (error) {
        console.error("Error fetching documents:", error)

        // Fallback data
        return {
            success: false,
            data: {
                page: 1,
                documents: [],
                total: 0,
                totalPages: 0,
            },
        }
    }
}

export async function getDocumentDetail(slug: string): Promise<IDcoumentDetailResponse> {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL!}/api/documents/${slug}`,
            {
                next: {
                    revalidate: 3600 * 3, // Cache for 3 hour
                    tags: ["documents", `document:${slug}`],
                },
            },
        )

        if (!res.ok) {
            throw new Error("Failed to fetch documents")
        }

        return res.json()
    } catch (error) {
        console.error("Error fetching documents:", error)

        // Fallback data
        return {
            success: true,
            data: null,
        }
    }
}

export async function fetchDocumentCategories(): Promise<IDocumentCategory[]> {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL!}/api/document-categories`,
        {
            next: {
                revalidate: 3600 * 3, // Cache for 3 hour
                tags: ["document-category"],
            },
        },
    )
    if (!res.ok) return []
    const json = await res.json()
    return json.data || []
}
