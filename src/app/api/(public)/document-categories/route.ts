import { DocumentCategoryService } from "@/app/api/(services)/document-category.service"
import { withMiddleware } from "@/lib/api-handler"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { NextRequest, NextResponse } from "next/server"

// ===================== GET /api/document-categories (Public List) =====================
async function getPublicCategories(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get("search") || undefined

        const data = await DocumentCategoryService.getAll({
            search,
            isPublished: true,
        })

        return NextResponse.json({
            success: true,
            data,
        })
    } catch (error: any) {
        console.error("Get public document categories error:", error)
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 },
        )
    }
}

export const GET = withMiddleware(getPublicCategories, connectDbMiddleware)
