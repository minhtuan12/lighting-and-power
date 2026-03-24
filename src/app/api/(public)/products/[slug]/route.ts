import { CategoryService } from "@/app/api/(services)/category.service"
import { CommentService } from "@/app/api/(services)/comment.service"
import { ProductService } from "@/app/api/(services)/product.service"
import { withMiddleware } from "@/lib/api-handler"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { isValidObjectId } from "mongoose"
import { NextRequest, NextResponse } from "next/server"

// ===================== GET /api/products/:slug | id (Public Detail) =====================
async function getProductBySlug(
    request: NextRequest,
    context?: { params: Promise<{ slug: string }> },
) {
    try {
        const params = await context?.params
        if (!params?.slug) {
            return NextResponse.json(
                { success: false, message: "Product not found" },
                { status: 404 },
            )
        }

        let product = null
        if (isValidObjectId(params.slug)) {
            product = await ProductService.getById(params.slug)
        } else {
            product = await ProductService.getBySlug(params.slug)
        }

        let comments = []
        if (product) {
            const commentsData = await CommentService.getProductComments(product._id.toString(), { limit: 5 });
            comments = commentsData.comments
            product = product.toObject()
            product.comments = comments
        }

        const categoryBreadcrumb = await CategoryService.getBreadcrumb(
            product.categoryId,
        )

        // Increment view count asynchronously
        ProductService.incrementViewCount(product._id.toString()).catch(
            console.error,
        )

        return NextResponse.json({
            success: true,
            data: { product, categoryBreadcrumb },
        })
    } catch (error: any) {
        console.error("Get product by slug error:", error)

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

export const GET = withMiddleware(getProductBySlug, connectDbMiddleware)
