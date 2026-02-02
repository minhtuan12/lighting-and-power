import { OrderService } from "@/app/api/(services)/order.service";
import { withMiddleware } from "@/lib/api-handler";
import { authContext } from "@/lib/context";
import { verifyToken } from "@/lib/middleware";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { NextRequest, NextResponse } from "next/server";

// POST /api/orders/[id]/cancel - Hủy đơn hàng
async function cancelOrder(
    request: NextRequest,
    context?: { params: Promise<{ id: string }> }
) {
    try {
        const user = authContext.getStore();
        const params = await context?.params;

        if (!params?.id) {
            return NextResponse.json(
                { success: false, message: "Order ID not found" },
                { status: 404 }
            );
        }

        if (!user?.userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { reason } = body;

        if (!reason) {
            return NextResponse.json(
                { success: false, message: "Cancel reason is required" },
                { status: 400 }
            );
        }

        const order = await OrderService.cancelOrder(user.userId, params.id, reason);

        return NextResponse.json({
            success: true,
            message: "Order cancelled successfully",
            data: order
        });

    } catch (error: any) {
        console.error('Cancel order error:', error);

        if (error.message.includes('not found') ||
            error.message.includes('Cannot cancel')) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

export const POST = withMiddleware(
    cancelOrder,
    connectDbMiddleware,
    verifyToken
);
