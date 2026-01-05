import { withMiddleware } from "@/lib/api-handler";
// import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { verifyToken } from "@/lib/middleware";
import { NextRequest, NextResponse } from "next/server";
import { CartService } from "../../(services)/cart.service";

// GET /api/cart - Get user's cart
async function getCart(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id');

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 }
            );
        }

        const cart = await CartService.getCart(userId);

        return NextResponse.json({
            success: true,
            data: cart
        });

    } catch (error: any) {
        console.error('Get cart error:', error);
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

// POST /api/cart - Add item to cart
async function addToCart(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id');

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { productId, variantSku, quantity } = body;

        if (!productId) {
            return NextResponse.json(
                { success: false, message: "Product ID is required" },
                { status: 400 }
            );
        }

        if (!quantity || quantity < 1) {
            return NextResponse.json(
                { success: false, message: "Valid quantity is required" },
                { status: 400 }
            );
        }

        const cart = await CartService.addItem(userId, {
            productId,
            variantSku,
            quantity
        });

        return NextResponse.json({
            success: true,
            message: "Item added to cart",
            data: cart
        });

    } catch (error: any) {
        console.error('Add to cart error:', error);

        if (error.message.includes('not found') ||
            error.message.includes('not available') ||
            error.message.includes('available in stock') ||
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

// DELETE /api/cart - Clear cart
async function clearCart(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id');

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 }
            );
        }

        const cart = await CartService.clearCart(userId);

        return NextResponse.json({
            success: true,
            message: "Cart cleared",
            data: cart
        });

    } catch (error: any) {
        console.error('Clear cart error:', error);

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

export const GET = withMiddleware(
    getCart,
    connectDbMiddleware,
    verifyToken
);

export const POST = withMiddleware(
    addToCart,
    connectDbMiddleware,
    verifyToken
);

export const DELETE = withMiddleware(
    clearCart,
    connectDbMiddleware,
    verifyToken
);
