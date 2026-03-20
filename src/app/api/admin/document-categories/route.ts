import { DocumentCategoryService } from "@/app/api/(services)/document-category.service"
import { withMiddleware } from "@/lib/api-handler"
import { requireRole, verifyToken } from "@/lib/middleware"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { EUserRole } from "@/types/user"
import { NextRequest, NextResponse } from "next/server"

async function getCategories(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get("search") || undefined
        const isPublished = searchParams.get("isPublished")

        const data = await DocumentCategoryService.getAll({
            search,
            isPublished:
                isPublished !== null ? isPublished === "true" : undefined,
        })

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error("Get document categories error:", error)
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 },
        )
    }
}

async function createCategory(request: NextRequest) {
    try {
        const body = await request.json()
        const category = await DocumentCategoryService.create(body)

        return NextResponse.json(
            {
                success: true,
                message: "Category created successfully",
                data: category,
            },
            { status: 201 },
        )
    } catch (error: any) {
        console.error("Create document category error:", error)
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 },
        )
    }
}

export const GET = withMiddleware(
    getCategories,
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin),
)

export const POST = withMiddleware(
    createCategory,
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin),
)
