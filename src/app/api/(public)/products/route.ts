import { withMiddleware } from "@/lib/api-handler"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { EProductStatus } from "@/types/product"
import { NextRequest, NextResponse } from "next/server"
import { ProductService } from "../../(services)/product.service"

// ===================== GET /api/products (Public List) =====================
async function getPublicProducts(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1")
        const categoryId = searchParams.get("categoryId")
        const search = searchParams.get("search")
        const tags = searchParams.get("tags")?.split(",")
        const sortBy =
            (searchParams.get("sortBy") as
                | "name"
                | "price"
                | "soldCount"
                | "rating"
                | "newest") || "newest"
        const sortOrder =
            (searchParams.get("sortOrder") as "asc" | "desc") || "desc"

        const filters: any = {
            page,
            status: EProductStatus.active, // Only show active products
            sortBy,
            sortOrder,
        }

        // =========== normal filters ===========
        if (categoryId) filters.categoryId = categoryId
        if (search) filters.search = search
        if (tags && tags.length > 0 && tags[0]) filters.tags = tags

        // =========== advanced filters ===========
        let advancedFilters = {
            // Basic filters
            manufacturers: searchParams
                .get("manufacturers")
                ?.split(",")
                .filter(Boolean),
            origins: searchParams.get("origins")?.split(",").filter(Boolean),
            units: searchParams.get("units")?.split(",").filter(Boolean),

            // Price range
            priceMin: searchParams.get("priceMin")
                ? Number(searchParams.get("priceMin"))
                : undefined,
            priceMax: searchParams.get("priceMax")
                ? Number(searchParams.get("priceMax"))
                : undefined,

            // Weight range
            weightMin: searchParams.get("weightMin")
                ? Number(searchParams.get("weightMin"))
                : undefined,
            weightMax: searchParams.get("weightMax")
                ? Number(searchParams.get("weightMax"))
                : undefined,

            // Dimension ranges
            lengthMin: searchParams.get("lengthMin")
                ? Number(searchParams.get("lengthMin"))
                : undefined,
            lengthMax: searchParams.get("lengthMax")
                ? Number(searchParams.get("lengthMax"))
                : undefined,
            widthMin: searchParams.get("widthMin")
                ? Number(searchParams.get("widthMin"))
                : undefined,
            widthMax: searchParams.get("widthMax")
                ? Number(searchParams.get("widthMax"))
                : undefined,
            heightMin: searchParams.get("heightMin")
                ? Number(searchParams.get("heightMin"))
                : undefined,
            heightMax: searchParams.get("heightMax")
                ? Number(searchParams.get("heightMax"))
                : undefined,

            specifications: {},
        }
        const specifications: Record<string, string[]> = {}
        searchParams.forEach((value, key) => {
            if (key.startsWith("spec_")) {
                const specName = decodeURIComponent(key.replace("spec_", ""))
                specifications[specName] = value.split(",").filter(Boolean)
            }
        })

        if (Object.keys(specifications).length > 0) {
            advancedFilters.specifications = specifications
        }

        const data = await ProductService.getAll({
            ...filters,
            ...advancedFilters,
        })

        return NextResponse.json({
            success: true,
            data,
        })
    } catch (error: any) {
        console.error("Get public products error:", error)
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 },
        )
    }
}

// ===================== GET /api/products/sku/:sku (Public Get by SKU) =====================
async function getProductBySku(
    request: NextRequest,
    { params }: { params: { sku: string } },
) {
    try {
        const product = await ProductService.getBySku(params.sku)

        return NextResponse.json({
            success: true,
            data: product,
        })
    } catch (error: any) {
        console.error("Get product by SKU error:", error)

        if (error.message === "Product not found") {
            return NextResponse.json(
                { success: false, message: "Product not found" },
                { status: 404 },
            )
        }

        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 },
        )
    }
}

// ===================== GET /api/products/featured (Public Featured) =====================
async function getFeaturedProducts(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get("limit") || "10")

        const products = await ProductService.getFeatured(Math.min(limit, 50))

        return NextResponse.json({
            success: true,
            data: products,
        })
    } catch (error: any) {
        console.error("Get featured products error:", error)
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 },
        )
    }
}

// ===================== GET /api/products/:id/related (Public Related Products) =====================
async function getRelatedProducts(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get("limit") || "6")

        const products = await ProductService.getRelated(
            params.id,
            Math.min(limit, 20),
        )

        return NextResponse.json({
            success: true,
            data: products,
        })
    } catch (error: any) {
        console.error("Get related products error:", error)

        if (error.message === "Product not found") {
            return NextResponse.json(
                { success: false, message: "Product not found" },
                { status: 404 },
            )
        }

        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 },
        )
    }
}

// ===================== Public Routes (No Auth Required) =====================
export const GET = withMiddleware(getPublicProducts, connectDbMiddleware)

// Note: Create separate route files for dynamic routes:
// /api/products/[slug].ts
// /api/products/sku/[sku].ts
// /api/products/featured.ts
// /api/products/[id]/related.ts
