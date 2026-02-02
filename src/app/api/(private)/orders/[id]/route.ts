import { OrderService } from "@/app/api/(services)/order.service";
import { withMiddleware } from "@/lib/api-handler";
import { authContext } from "@/lib/context";
import { verifyToken } from "@/lib/middleware";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/orders/[id] - Lấy chi tiết đơn hàng
async function getOrderDetail(
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

        const order = await OrderService.getOrderDetail(user.userId, params.id);

        return NextResponse.json({
            success: true,
            data: order
        });

    } catch (error: any) {
        console.error('Get order detail error:', error);

        if (error.message === 'Order not found') {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

export const GET = withMiddleware(
    getOrderDetail,
    connectDbMiddleware,
    verifyToken
);
