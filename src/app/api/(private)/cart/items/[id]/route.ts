import { CartService } from "@/app/api/(services)/cart.service";
import { withMiddleware } from "@/lib/api-handler";
import { verifyToken } from "@/lib/middleware";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { NextRequest, NextResponse } from "next/server";

async function updateCartItem(
    request: NextRequest,
    context?: { params: Promise<{ id: string }> }
) {
    try {
        const userId = request.headers.get('x-user-id') ?? '';
        const params = await context?.params;

        if (!params?.id) {
            return NextResponse.json(
                { success: false, message: "Item ID is required" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { quantity } = body;

        if (!quantity || quantity < 1) {
            return NextResponse.json(
                { success: false, message: "Valid quantity is required" },
                { status: 400 }
            );
        }

        const cart = await CartService.updateItemQuantity(
            userId,
            params.id,
            quantity
        );

        return NextResponse.json({
            success: true,
            message: "Cart updated",
            data: cart
        });

    } catch (error: any) {
        console.error('Update cart item error:', error);

        if (error.message.includes('not found') ||
            error.message.includes('available') ||
            error.message.includes('Minimum order')) {
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

// DELETE /api/cart/items/[itemId] - Remove item from cart
async function removeCartItem(
    request: NextRequest,
    context?: { params: Promise<{ id: string }> }
) {
    try {
        const userId = request.headers.get('x-user-id') ?? '';
        const params = await context?.params;

        if (!params?.id) {
            return NextResponse.json(
                { success: false, message: "Item ID is required" },
                { status: 400 }
            );
        }
        const cart = await CartService.removeItem(userId, params.id);

        return NextResponse.json({
            success: true,
            message: "Item removed from cart",
            data: cart
        });

    } catch (error: any) {
        console.error('Remove cart item error:', error);

        if (error.message.includes('not found')) {
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

export const PATCH = withMiddleware(
    updateCartItem,
    connectDbMiddleware,
    verifyToken,
);

export const DELETE = withMiddleware(
    removeCartItem,
    connectDbMiddleware,
    verifyToken,
);
