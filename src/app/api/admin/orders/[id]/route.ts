import { withMiddleware } from "@/lib/api-handler"
import { requireRole, verifyToken } from "@/lib/middleware"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { EOrderStatus } from "@/types/order"
import { EUserRole } from "@/types/user"
import { NextRequest, NextResponse } from "next/server"
import { OrderService } from "../../../(services)/order.service"

// ===================== PATCH /api/admin/orders/[id] =====================
async function updateOrderStatus(
    request: NextRequest,
    context?: { params: Promise<{ id: string }> },
) {
    try {
        const params = await context?.params
        if (!params?.id) {
            return NextResponse.json(
                { success: false, message: "Order ID is required" },
                { status: 400 },
            )
        }

        const body = await request.json()
        const { status, cancelReason } = body

        if (!status) {
            return NextResponse.json(
                { success: false, message: "Status is required" },
                { status: 400 },
            )
        }

        const order = await OrderService.updateOrderStatus(
            params.id,
            status as EOrderStatus,
            cancelReason,
        )

        return NextResponse.json({
            success: true,
            message: "Order status updated",
            data: order,
        })
    } catch (error: any) {
        console.error("Update order status error:", error)
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 },
        )
    }
}

export const PATCH = withMiddleware(
    updateOrderStatus,
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin),
)
