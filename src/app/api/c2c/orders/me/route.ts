import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import connectDB from "@/lib/db"
import C2COrder from "@/models/c2c-order"
import "@/models/c2c-product"
import "@/models/user"

export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        // Fetch purchases
        const purchases = await C2COrder.find({ buyerId: user.id })
            .populate("productId", "title images condition")
            .populate("sellerId", "fullName phone avatar")
            .sort({ createdAt: -1 })
            .lean()

        // Fetch sales
        const sales = await C2COrder.find({ sellerId: user.id })
            .populate("productId", "title images condition")
            .populate("buyerId", "fullName phone avatar")
            .sort({ createdAt: -1 })
            .lean()

        return NextResponse.json({
            success: true,
            data: {
                purchases,
                sales
            }
        })

    } catch (error: any) {
        console.error("Fetch My Orders Error:", error)
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        )
    }
}
