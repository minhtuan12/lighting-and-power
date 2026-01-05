import { withMiddleware } from "@/lib/api-handler";
import { NextRequest, NextResponse } from "next/server";

async function syncCart(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id');

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 }
            );
        }

        const cart = await CartService.syncCart(userId);

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

export const POST_SYNC = withMiddleware(
    syncCart,
    connectDbMiddleware,
    verifyToken
);
