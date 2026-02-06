import { withMiddleware } from "@/lib/api-handler"
import { requireRole, verifyToken } from "@/lib/middleware"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { EUserRole } from "@/types/user"
import { NextRequest, NextResponse } from "next/server"
import { ProductService } from "../../(services)/product.service"
import { revalidateTag, updateTag } from "next/cache"

// ===================== GET /api/admin/products =====================
async function getProducts(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1")
        const categoryId = searchParams.get("categoryId")
        const status = searchParams.get("status")
        const isFeatured = searchParams.get("isFeatured")
        const tags = searchParams.get("tags")?.split(",")
        const search = searchParams.get("search")
        const minPrice = searchParams.get("minPrice")
        const maxPrice = searchParams.get("maxPrice")
        const sortBy =
            (searchParams.get("sortBy") as
                | "name"
                | "price"
                | "soldCount"
                | "rating"
                | "newest") || "newest"
        const sortOrder =
            (searchParams.get("sortOrder") as "asc" | "desc") || "desc"

        const filters: any = { page }

        if (categoryId) filters.categoryId = categoryId
        if (status && status !== "all") filters.status = status
        if (isFeatured !== null) filters.isFeatured = isFeatured === "true"
        if (tags && tags.length > 0 && tags[0]) filters.tags = tags
        if (search) filters.search = search
        if (minPrice) filters.minPrice = parseFloat(minPrice)
        if (maxPrice) filters.maxPrice = parseFloat(maxPrice)
        if (sortBy) filters.sortBy = sortBy
        filters.sortOrder = sortOrder

        const data = await ProductService.getAll(filters)

        return NextResponse.json({
            success: true,
            data,
        })
    } catch (error: any) {
        console.error("Get products error:", error)
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 },
        )
    }
}

// ===================== POST /api/admin/products =====================
async function createProduct(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            name,
            sku,
            description,
            shortDescription,
            categoryId,
            manufacturer,
            origin,
            price,
            priceTiers,
            stock,
            lowStockThreshold,
            unit,
            minOrderQuantity,
            images,
            thumbnail,
            specifications,
            metaTitle,
            metaDescription,
            metaKeywords,
            datasheet,
            weight,
            dimensions,
            status,
            isFeatured,
            tags,
            relatedProducts,
        } = body

        const product = await ProductService.create({
            name,
            sku,
            description,
            shortDescription,
            categoryId,
            manufacturer,
            origin,
            price,
            priceTiers,
            stock,
            lowStockThreshold,
            unit,
            minOrderQuantity,
            images,
            thumbnail,
            specifications,
            metaTitle,
            metaDescription,
            metaKeywords,
            datasheet,
            weight,
            dimensions,
            status,
            isFeatured,
            tags,
            relatedProducts,
        })

        updateTag("products")
        revalidateTag("products", { expire: 0 })

        return NextResponse.json(
            {
                success: true,
                message: "Product created successfully",
                data: product,
            },
            { status: 201 },
        )
    } catch (error: any) {
        console.error("Create product error:", error)

        if (error.message.includes("Category not found")) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 404 },
            )
        }

        if (
            error.message.includes("already exists") ||
            error.message.includes("duplicate")
        ) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 409 },
            )
        }

        if (error.message.includes("is required")) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 400 },
            )
        }

        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 },
        )
    }
}

// ===================== GET /api/admin/products/stats =====================
async function getStats(request: NextRequest) {
    try {
        const stats = await ProductService.getStats()

        return NextResponse.json({
            success: true,
            data: stats,
        })
    } catch (error: any) {
        console.error("Get stats error:", error)
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 },
        )
    }
}

// ===================== Middleware Setup =====================
const adminMiddleware = [
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin),
]

export const GET = withMiddleware(getProducts, ...adminMiddleware)
export const POST = withMiddleware(createProduct, ...adminMiddleware)
