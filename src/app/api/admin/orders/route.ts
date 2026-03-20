import { withMiddleware } from "@/lib/api-handler"
import { requireRole, verifyToken } from "@/lib/middleware"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { EOrderStatus, EPaymentStatus } from "@/types/order"
import { EUserRole } from "@/types/user"
import { NextRequest, NextResponse } from "next/server"
import { OrderService } from "../../(services)/order.service"

// ===================== GET /api/admin/orders =====================
async function getOrders(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")
        const status = searchParams.get("status")
        const paymentStatus = searchParams.get("paymentStatus")
        const search = searchParams.get("search") || ""

        const data = await OrderService.getAllOrders({
            page,
            limit,
            status:
                status && status !== "all"
                    ? (status as EOrderStatus)
                    : undefined,
            paymentStatus:
                paymentStatus && paymentStatus !== "all"
                    ? (paymentStatus as EPaymentStatus)
                    : undefined,
            search: search || undefined,
        })

        return NextResponse.json({
            success: true,
            data,
        })
    } catch (error: any) {
        console.error("Get orders error:", error)
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 },
        )
    }
}

const adminMiddleware = [
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin),
]

export const GET = withMiddleware(getOrders, ...adminMiddleware)
