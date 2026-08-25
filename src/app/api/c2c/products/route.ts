import { C2CService } from "@/app/api/(services)/c2c.service"
import { withMiddleware } from "@/lib/api-handler"
import { getRequestUser } from "@/lib/context"
import { optionalVerifyToken, verifyToken } from "@/lib/middleware"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { NextRequest, NextResponse } from "next/server"

async function getProducts(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get("page") || 1))
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 12)))
    const sort = searchParams.get("sort") || "newest"

    const result = await C2CService.listProducts({ page, limit, sort })
    return NextResponse.json({ success: true, data: result })
}

async function createProduct(request: NextRequest) {
    const user = getRequestUser(request)
    if (!user?.userId) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    try {
        const input = await request.json()
        const result = await C2CService.createProduct(user.userId, input)
        return NextResponse.json({ success: true, data: result }, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
}

export const GET = withMiddleware(getProducts, connectDbMiddleware, optionalVerifyToken)
export const POST = withMiddleware(createProduct, connectDbMiddleware, verifyToken)
