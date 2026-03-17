import { ProductService } from "@/app/api/(services)/product.service"
import { withMiddleware } from "@/lib/api-handler"
import { getRequestUser } from "@/lib/context"
import { requireRole, verifyToken } from "@/lib/middleware"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { EUserRole } from "@/types/user"
import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

async function bulkDeleteBoothProducts(request: NextRequest) {
    try {
        const user = getRequestUser(request)
        if (!user?.userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 },
            )
        }

        const body = await request.json()
        const { ids } = body

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { success: false, message: "IDs array is required" },
                { status: 400 },
            )
        }

        const result = await ProductService.deleteMany(ids, {
            ownerAccountId: user.userId,
        })

        revalidateTag("products", { expire: 0 })

        return NextResponse.json({
            success: true,
            data: result,
        })
    } catch (error: any) {
        console.error("Bulk delete booth products error:", error)
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 },
        )
    }
}

export const POST = withMiddleware(
    bulkDeleteBoothProducts,
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.user),
)
