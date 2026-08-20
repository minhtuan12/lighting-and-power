import { C2CService } from "@/app/api/(services)/c2c.service"
import { getRequestUser } from "@/lib/context"
import { withMiddleware } from "@/lib/api-handler"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { optionalVerifyToken, verifyToken } from "@/lib/middleware"
import { NextRequest, NextResponse } from "next/server"

type RouteContext = { params: Promise<{ id: string }> }

async function getProduct(request: NextRequest, context?: RouteContext) {
    const { id } = await context!.params
    const result = await C2CService.getProduct(id)
    if (!result) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true, data: result })
}

async function updateProduct(request: NextRequest, context?: RouteContext) {
    const user = getRequestUser(request)
    if (!user?.userId) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    
    try {
        const { id } = await context!.params
        const input = await request.json()
        const result = await C2CService.updateProduct(id, user.userId, input)
        return NextResponse.json({ success: true, data: result })
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
}

async function deleteProduct(request: NextRequest, context?: RouteContext) {
    const user = getRequestUser(request)
    if (!user?.userId) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    
    try {
        const { id } = await context!.params

        const result = await C2CService.deleteProduct(id, user.userId)
        return NextResponse.json({ success: true, data: result })
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
}

export const GET = withMiddleware(getProduct, connectDbMiddleware, optionalVerifyToken)
export const PUT = withMiddleware(updateProduct, connectDbMiddleware, verifyToken)
export const DELETE = withMiddleware(deleteProduct, connectDbMiddleware, verifyToken)
