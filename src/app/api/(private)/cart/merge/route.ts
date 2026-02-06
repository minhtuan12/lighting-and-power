import { CartService } from "@/app/api/(services)/cart.service"
import { withMiddleware } from "@/lib/api-handler"
import { getRequestUser } from "@/lib/context"
import { verifyToken } from "@/lib/middleware"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { NextRequest, NextResponse } from "next/server"

// POST /api/cart/merge - Merge guest cart with user cart (after login)
async function mergeCart(request: NextRequest) {
    try {
        const user = getRequestUser(request)

        if (!user?.userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 },
            )
        }

        const body = await request.json()
        const { guestCartItems } = body

        if (!guestCartItems || !Array.isArray(guestCartItems)) {
            return NextResponse.json(
                { success: false, message: "Guest cart items are required" },
                { status: 400 },
            )
        }

        const cart = await CartService.mergeCarts(user.userId, guestCartItems)

        return NextResponse.json({
            success: true,
            message: "Carts merged successfully",
            data: cart,
        })
    } catch (error: any) {
        console.error("Merge cart error:", error)

        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 },
        )
    }
}

export const POST = withMiddleware(mergeCart, connectDbMiddleware, verifyToken)
