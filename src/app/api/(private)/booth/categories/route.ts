import { withMiddleware } from "@/lib/api-handler"
import { getRequestUser } from "@/lib/context"
import { requireRole, verifyToken } from "@/lib/middleware"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { SlugGenerator } from "@/lib/slug"
import Category from "@/models/category"
import { EUserRole } from "@/types/user"
import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { CategoryService } from "../../../(services)/category.service"

async function getBoothCategories(request: NextRequest) {
    try {
        const user = getRequestUser(request)
        if (!user?.userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 },
            )
        }

        const { searchParams } = new URL(request.url)
        const view = searchParams.get("view")
        const parentId = searchParams.get("parentId")
        const level = searchParams.get("level")
        const isActive = searchParams.get("isActive")
        const search = searchParams.get("search")
        const page = parseInt(searchParams.get("page") || "1")

        if (view === "tree") {
            const isActiveOnly = isActive === "true"
            const data = await CategoryService.getTree(
                isActiveOnly,
                {},
                { ownerAccountId: user.userId },
            )

            return NextResponse.json({
                success: true,
                data,
                pagination: null,
            })
        }

        const filters: Record<string, any> = {
            ownerAccountId: user.userId,
        }
        if (parentId !== null && parentId !== undefined) {
            filters.parentId = parentId === "null" ? null : parentId
        }
        if (level) filters.level = parseInt(level)
        if (isActive) filters.isActive = isActive === "true"
        if (search) filters.search = search

        const result = await CategoryService.getAll(filters, { page })

        return NextResponse.json({
            success: true,
            ...result,
        })
    } catch (error: any) {
        console.error("Get booth categories error:", error)
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 },
        )
    }
}

async function createBoothCategory(request: NextRequest) {
    try {
        const user = getRequestUser(request)
        if (!user?.userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 },
            )
        }

        const body = await request.json()
        const {
            name,
            description,
            parentId,
            isActive,
            metaTitle,
            metaDescription,
            metaKeywords,
        } = body

        if (!name) {
            return NextResponse.json(
                { success: false, message: "Category name is required" },
                { status: 400 },
            )
        }

        const category = await CategoryService.create({
            name,
            slug: await SlugGenerator.generateUniqueSlug(name, Category),
            description,
            parentId,
            isActive,
            metaTitle,
            metaDescription,
            metaKeywords,
            ownerAccountId: user.userId,
        })

        revalidateTag("categories", { expire: 0 })

        return NextResponse.json(
            {
                success: true,
                message: "Category created successfully",
                data: category,
            },
            { status: 201 },
        )
    } catch (error: any) {
        console.error("Create booth category error:", error)

        if (error.message === "Slug already exists") {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 409 },
            )
        }

        if (
            error.message.includes("Parent category not found") ||
            error.message.includes("Maximum category depth")
        ) {
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

const boothMiddleware = [
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.user),
]

export const GET = withMiddleware(getBoothCategories, ...boothMiddleware)
export const POST = withMiddleware(createBoothCategory, ...boothMiddleware)
