import { withMiddleware } from "@/lib/api-handler";
import { verifyToken } from "@/lib/middleware";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { NextRequest, NextResponse } from "next/server";
import { OrderService } from "../../(services)/order.service";
import { getRequestUser } from "@/lib/context";

// POST /api/orders - Tạo đơn hàng mới
async function createOrder(request: NextRequest) {
    try {
        const user = getRequestUser(request);

        if (!user?.userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { customerInfo, shippingAddress, paymentMethod, note } = body;

        // Validate required fields
        if (!customerInfo?.name || !customerInfo?.phone) {
            return NextResponse.json(
                { success: false, message: "Customer info is required" },
                { status: 400 }
            );
        }

        if (!shippingAddress?.province || !shippingAddress?.district ||
            !shippingAddress?.ward || !shippingAddress?.address) {
            return NextResponse.json(
                { success: false, message: "Shipping address is required" },
                { status: 400 }
            );
        }

        if (!paymentMethod) {
            return NextResponse.json(
                { success: false, message: "Payment method is required" },
                { status: 400 }
            );
        }

        const order = await OrderService.createOrder(user.userId, {
            customerInfo,
            shippingAddress,
            paymentMethod,
            note
        });

        return NextResponse.json({
            success: true,
            message: "Order created successfully",
            data: order
        });

    } catch (error: any) {
        console.error('Create order error:', error);

        if (error.message.includes('Cart is empty') ||
            error.message.includes('out of stock')) {
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

// GET /api/orders - Lấy danh sách đơn hàng của user
async function getOrders(request: NextRequest) {
    try {
        const user = getRequestUser(request);

        if (!user?.userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const status = searchParams.get('status') as any;

        const result = await OrderService.getUserOrders(user.userId, {
            page,
            limit,
            status
        });

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error('Get orders error:', error);
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

export const POST = withMiddleware(
    createOrder,
    connectDbMiddleware,
    verifyToken
);

export const GET = withMiddleware(
    getOrders,
    connectDbMiddleware,
    verifyToken
);
