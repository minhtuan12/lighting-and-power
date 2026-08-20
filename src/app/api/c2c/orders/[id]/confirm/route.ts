import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import connectDB from "@/lib/db"
import C2COrder from "@/models/c2c-order"
import C2CWallet from "@/models/c2c-wallet"
import C2CWalletTransaction from "@/models/c2c-wallet-transaction"
import mongoose from "mongoose"

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await verifyAuth(req)
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const resolvedParams = await params;
        const orderId = resolvedParams.id;

        await connectDB()

        const order = await C2COrder.findById(orderId).session(session)
        
        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 })
        }

        // Only buyer can confirm delivery
        if (order.buyerId.toString() !== user.id) {
            return NextResponse.json({ error: "Only buyer can confirm delivery" }, { status: 403 })
        }

        if (order.status !== "paid") {
            return NextResponse.json({ error: "Order must be in paid status to confirm delivery" }, { status: 400 })
        }

        // 1. Update order status
        order.status = "completed"
        order.completedAt = new Date()
        await order.save({ session })

        // 2. Add money to seller's wallet
        let sellerWallet = await C2CWallet.findOne({ userId: order.sellerId }).session(session)
        if (!sellerWallet) {
            sellerWallet = new C2CWallet({
                userId: order.sellerId,
                balance: 0,
                frozenBalance: 0
            })
        }
        
        // Escrow release: Seller gets the full amount (Assuming 0% commission for now)
        sellerWallet.balance += order.amount
        await sellerWallet.save({ session })

        // 3. Create wallet transaction record
        await C2CWalletTransaction.create([{
            userId: order.sellerId,
            amount: order.amount,
            type: "escrow_release",
            status: "completed",
            referenceOrderId: order._id,
            note: `Nhận tiền từ đơn hàng ${order.payosOrderCode}`
        }], { session })

        await session.commitTransaction()
        session.endSession()

        return NextResponse.json({ success: true, message: "Delivery confirmed, funds released to seller" })

    } catch (error: any) {
        await session.abortTransaction()
        session.endSession()
        
        console.error("Confirm Delivery Error:", error)
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        )
    }
}
