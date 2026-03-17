import { withMiddleware } from "@/lib/api-handler"
import { getRequestUser } from "@/lib/context"
import { requireRole, verifyToken } from "@/lib/middleware"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { cloudinaryService } from "@/service/cloudinary"
import { EUserRole } from "@/types/user"
import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"
import { ProductService } from "../../../../(services)/product.service"

async function getBoothProductById(
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
                { success: false, message: "Product ID is required" },
                { status: 400 },
            )
        }

        const product = await ProductService.getById(params.id, {
            ownerAccountId: user.userId,
        })

        return NextResponse.json({
            success: true,
            data: product,
        })
    } catch (error: any) {
        console.error("Get booth product error:", error)

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

async function updateBoothProduct(
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
                { success: false, message: "Product ID is required" },
                { status: 400 },
            )
        }

        const body = await request.json()

        const existingProduct = await ProductService.getById(params.id, {
            ownerAccountId: user.userId,
        })

        if (body.images && Array.isArray(body.images)) {
            const oldImages = existingProduct.images || []
            const newImages = body.images || []
            const removedImages = oldImages.filter(
                (oldImg: string) => !newImages.includes(oldImg),
            )

            for (const imageUrl of removedImages) {
                try {
                    const urlParts = imageUrl.split("/")
                    const publicId = urlParts[urlParts.length - 1].split(".")[0]
                    const folder = urlParts[urlParts.length - 2]
                    await cloudinaryService.deleteFile(`${folder}/${publicId}`)
                } catch (error) {
                    console.warn("Failed to delete old image:", imageUrl, error)
                }
            }
        }

        const product = await ProductService.update(params.id, body, {
            ownerAccountId: user.userId,
        })

        revalidateTag(`product:${params.id}`, { expire: 0 })
        revalidateTag(`product:${product.slug}`, { expire: 0 })

        return NextResponse.json({
            success: true,
            message: "Product updated successfully",
            data: product,
        })
    } catch (error: any) {
        console.error("Update booth product error:", error)

        if (error.message === "Product not found") {
            return NextResponse.json(
                { success: false, message: "Product not found" },
                { status: 404 },
            )
        }

        if (error.message.includes("Category not found")) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 404 },
            )
        }

        if (error.message.includes("related products")) {
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

async function deleteBoothProduct(
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
                { success: false, message: "Product ID is required" },
                { status: 400 },
            )
        }

        const product = await ProductService.getById(params.id, {
            ownerAccountId: user.userId,
        })
        if (product.images && Array.isArray(product.images)) {
            for (const imageUrl of product.images) {
                try {
                    const urlParts = imageUrl.split("/")
                    const publicId = urlParts[urlParts.length - 1].split(".")[0]
                    const folder = urlParts[urlParts.length - 2]
                    await cloudinaryService.deleteFile(`${folder}/${publicId}`)
                } catch (error) {
                    console.warn(
                        "Failed to delete gallery image:",
                        imageUrl,
                        error,
                    )
                }
            }
        }

        const result = await ProductService.delete(params.id, {
            ownerAccountId: user.userId,
        })

        revalidateTag("products", { expire: 0 })

        return NextResponse.json({
            success: true,
            message: result.message,
        })
    } catch (error: any) {
        console.error("Delete booth product error:", error)

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

const boothMiddleware = [
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.user),
]

export const GET = withMiddleware(getBoothProductById, ...boothMiddleware)
export const PUT = withMiddleware(updateBoothProduct, ...boothMiddleware)
export const DELETE = withMiddleware(deleteBoothProduct, ...boothMiddleware)
