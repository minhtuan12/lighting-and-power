import { withMiddleware } from "@/lib/api-handler"
import { getRequestUser } from "@/lib/context"
import { requireRole, verifyToken } from "@/lib/middleware"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { SlugGenerator } from "@/lib/slug"
import Category from "@/models/category"
import { EUserRole } from "@/types/user"
import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { CategoryService } from "../../../../(services)/category.service"

async function getBoothCategory(
    request: NextRequest,
    context?: { params: Promise<{ id: string }> },
) {
    try {
        const user = getRequestUser(request)
        if (!user?.userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 },
            )
        }

        const params = await context?.params
        if (!params?.id) {
            return NextResponse.json(
                { success: false, message: "Category ID is required" },
                { status: 400 },
            )
        }

        const category = await CategoryService.getById(params.id, {
            ownerAccountId: user.userId,
        })

        return NextResponse.json({
            success: true,
            data: category,
        })
    } catch (error: any) {
        console.error("Get booth category error:", error)

        if (error.message === "Category not found") {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 404 },
            )
        }

        return NextResponse.json(
            { success: false, message: "An error occurred" },
            { status: 500 },
        )
    }
}

async function updateBoothCategory(
    request: NextRequest,
    context?: { params: Promise<{ id: string }> },
) {
    try {
        const user = getRequestUser(request)
        if (!user?.userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 },
            )
        }

        const params = await context?.params
        if (!params?.id) {
            return NextResponse.json(
                { success: false, message: "Category ID is required" },
                { status: 400 },
            )
        }

        const body = await request.json()
        const {
            name,
            image,
            description,
            parentId,
            isActive,
            metaTitle,
            metaDescription,
            metaKeywords,
        } = body

        const category = await CategoryService.update(
            params.id,
            {
                name,
                ...(name
                    ? {
                          slug: await SlugGenerator.generateUniqueSlug(
                              name,
                              Category,
                              {
                                  excludeId: params.id,
                              },
                          ),
                      }
                    : {}),
                image,
                description,
                parentId,
                isActive,
                metaTitle,
                metaDescription,
                metaKeywords,
            },
            {
                ownerAccountId: user.userId,
            },
        )

        revalidateTag(`cagtegory:${category.slug}`, { expire: 0 })

        return NextResponse.json({
            success: true,
            message: "Category updated successfully",
            data: category,
        })
    } catch (error: any) {
        console.error("Update booth category error:", error)

        if (error.message === "Category not found") {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 404 },
            )
        }

        if (
            error.message === "Slug already exists" ||
            error.message.includes("Cannot move category") ||
            error.message.includes("Maximum category depth") ||
            error.message.includes("cannot be its own parent")
        ) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 400 },
            )
        }

        return NextResponse.json(
            { success: false, message: "An error occurred" },
            { status: 500 },
        )
    }
}

async function deleteBoothCategory(
    request: NextRequest,
    context?: { params: Promise<{ id: string }> },
) {
    try {
        const user = getRequestUser(request)
        if (!user?.userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 },
            )
        }

        const params = await context?.params
        if (!params?.id) {
            return NextResponse.json(
                { success: false, message: "Category ID is required" },
                { status: 400 },
            )
        }

        const result = await CategoryService.delete(params.id, {
            ownerAccountId: user.userId,
        })

        revalidateTag("categories", { expire: 0 })

        return NextResponse.json({
            success: true,
            message: result.message,
        })
    } catch (error: any) {
        console.error("Delete booth category error:", error)

        if (error.message === "Category not found") {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 404 },
            )
        }

        if (error.message.includes("Cannot delete category")) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 400 },
            )
        }

        return NextResponse.json(
            { success: false, message: "An error occurred" },
            { status: 500 },
        )
    }
}

const boothMiddleware = [
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.user),
]

export const GET = withMiddleware(getBoothCategory, ...boothMiddleware)
export const PATCH = withMiddleware(updateBoothCategory, ...boothMiddleware)
export const DELETE = withMiddleware(deleteBoothCategory, ...boothMiddleware)
