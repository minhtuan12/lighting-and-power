import { OrderService } from "@/app/api/(services)/order.service"
import { withMiddleware } from "@/lib/api-handler"
import { getRequestUser } from "@/lib/context"
import { verifyToken } from "@/lib/middleware"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { NextRequest, NextResponse } from "next/server"

// POST /api/orders/[id]/payment-cancelled
// PayOS cancelUrl callback: cancel payment attempt, not the order.
async function markPaymentCancelled(
    request: NextRequest,
    context?: { params: Promise<{ id: string }> },
) {
    const user = getRequestUser(request)
    const params = await context?.params

    if (!user?.userId || !params?.id) {
        return NextResponse.json(
            { success: false, message: "Order ID or user not found" },
            { status: 400 },
        )
    }

    try {
        const order = await OrderService.markPayosPaymentCancelled(
            user.userId,
            params.id,
        )
        return NextResponse.json({ success: true, data: order })
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error?.message || "Unable to update payment" },
            { status: 400 },
        )
    }
}

export const POST = withMiddleware(
    markPaymentCancelled,
    connectDbMiddleware,
    verifyToken,
)
