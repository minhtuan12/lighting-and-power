import { DocumentCategoryService } from "@/app/api/(services)/document-category.service"
import { withMiddleware } from "@/lib/api-handler"
import { requireRole, verifyToken } from "@/lib/middleware"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { EUserRole } from "@/types/user"
import { NextRequest, NextResponse } from "next/server"

async function updateCategory(
    request: NextRequest,
    context?: { params: Promise<{ id: string }> },
) {
    try {
        const params = await context?.params
        if (!params?.id) {
            return NextResponse.json(
                { success: false, message: "Category ID is required" },
                { status: 400 },
            )
        }

        const body = await request.json()
        const category = await DocumentCategoryService.update(params.id, body)

        return NextResponse.json({
            success: true,
            message: "Category updated successfully",
            data: category,
        })
    } catch (error: any) {
        console.error("Update document category error:", error)
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 },
        )
    }
}

async function deleteCategory(
    request: NextRequest,
    context?: { params: Promise<{ id: string }> },
) {
    try {
        const params = await context?.params
        if (!params?.id) {
            return NextResponse.json(
                { success: false, message: "Category ID is required" },
                { status: 400 },
            )
        }

        const result = await DocumentCategoryService.delete(params.id)

        return NextResponse.json({
            success: true,
            message: result.message,
        })
    } catch (error: any) {
        console.error("Delete document category error:", error)
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 },
        )
    }
}

export const PATCH = withMiddleware(
    updateCategory,
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin),
)

export const DELETE = withMiddleware(
    deleteCategory,
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin),
)
