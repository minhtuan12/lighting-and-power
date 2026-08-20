import C2CProduct from "@/models/c2c-product"
import { withMiddleware } from "@/lib/api-handler"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { verifyToken } from "@/lib/middleware"
import { NextRequest, NextResponse } from "next/server"

async function getAdminC2CProducts(request: NextRequest) {
    const url = new URL(request.url)
    const status = url.searchParams.get("status") || "pending"
    const page = parseInt(url.searchParams.get("page") || "1", 10)
    const limit = parseInt(url.searchParams.get("limit") || "20", 10)

    try {
        const filter: any = {}
        if (status && status !== "all") {
            filter.status = status
        }

        const skip = (page - 1) * limit
        const [products, total] = await Promise.all([
            C2CProduct.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate({ path: "sellerId", select: "fullName username avatar" })
                .lean(),
            C2CProduct.countDocuments(filter)
        ])

        return NextResponse.json({
            success: true,
            data: { products, total, page, limit }
        })
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
}

export const GET = withMiddleware(getAdminC2CProducts, connectDbMiddleware, verifyToken)
