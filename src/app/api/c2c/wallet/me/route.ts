import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import connectDB from "@/lib/db"
import C2CWallet from "@/models/c2c-wallet"
import C2CWalletTransaction from "@/models/c2c-wallet-transaction"

export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        let wallet = await C2CWallet.findOne({ userId: user.id })
        
        if (!wallet) {
            wallet = await C2CWallet.create({
                userId: user.id,
                balance: 0,
                frozenBalance: 0
            })
        }

        const transactions = await C2CWalletTransaction.find({ userId: user.id })
            .populate("referenceOrderId", "payosOrderCode productId")
            .sort({ createdAt: -1 })
            .limit(50)

        return NextResponse.json({
            success: true,
            data: {
                wallet,
                transactions
            }
        })

    } catch (error: any) {
        console.error("Fetch Wallet Error:", error)
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        )
    }
}
