import { CartService } from "@/app/api/(services)/cart.service";
import { withMiddleware } from "@/lib/api-handler";
import { getRequestUser } from "@/lib/context";
import { verifyToken } from "@/lib/middleware";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { NextRequest, NextResponse } from "next/server";

async function syncCart(request: NextRequest) {
    try {
        const user = getRequestUser(request);

        if (!user?.userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 }
            );
        }

        const cart = await CartService.syncCart(user.userId);

        return NextResponse.json({
            success: true,
            message: "Cart synced",
            data: cart
        });

    } catch (error: any) {
        console.error('Sync cart error:', error);

        if (error.message === 'Cart not found') {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: false, message: "An error occurred" },
            { status: 500 }
        );
    }
}

export const POST = withMiddleware(
    syncCart,
    connectDbMiddleware,
    verifyToken,
);
