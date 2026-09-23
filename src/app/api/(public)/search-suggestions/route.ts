import { withMiddleware } from "@/lib/api-handler"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { EProductStatus } from "@/types/product"
import { NextRequest, NextResponse } from "next/server"
import { DocumentService } from "../../(services)/document.service"
import { ProductService } from "../../(services)/product.service"

async function getSearchSuggestions(request: NextRequest) {
    const search = request.nextUrl.searchParams.get("q")?.trim() || ""
    if (search.length < 2) return NextResponse.json({ success: true, data: [] })

    const [products, documents] = await Promise.all([
        ProductService.getAll({ search, page: 1, status: EProductStatus.active }),
        DocumentService.getAll({ search, page: 1, isPublished: true }),
    ])

    return NextResponse.json({
        success: true,
        data: [
            ...products.products.slice(0, 5).map((item: any) => ({
                kind: "product",
                id: item._id,
                title: item.name,
                slug: item.slug,
            })),
            ...documents.documents.slice(0, 5).map((item: any) => ({
                kind: "document",
                id: item._id,
                title: item.title,
                slug: item.slug,
            })),
        ],
    })
}

export const GET = withMiddleware(getSearchSuggestions, connectDbMiddleware)
