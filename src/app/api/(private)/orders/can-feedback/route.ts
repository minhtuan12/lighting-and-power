import { OrderService } from "@/app/api/(services)/order.service";
import { withMiddleware } from "@/lib/api-handler";
import { getRequestUser } from "@/lib/context";
import { verifyToken } from "@/lib/middleware";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/orders/can-feedback - Lấy sản phẩm có thể feedback
async function getProductsCanFeedback(request: NextRequest) {
    try {
        const user = getRequestUser(request);

        if (!user?.userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 }
            );
        }

        const products = await OrderService.getProductsCanFeedback(user.userId);

        return NextResponse.json({
            success: true,
            data: products
        });

    } catch (error: any) {
        console.error('Get products can feedback error:', error);
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

export const GET = withMiddleware(
    getProductsCanFeedback,
    connectDbMiddleware,
    verifyToken
);
