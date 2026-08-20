import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import connectDB from "@/lib/db"
import C2CWallet from "@/models/c2c-wallet"
import C2CWalletTransaction from "@/models/c2c-wallet-transaction"
import mongoose from "mongoose"

export async function POST(req: NextRequest) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await verifyAuth(req)
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { amount, bankCode, bankAccountName, bankAccountNumber } = body

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
        }

        if (!bankCode || !bankAccountName || !bankAccountNumber) {
            return NextResponse.json({ error: "Missing bank details" }, { status: 400 })
        }

        await connectDB()

        const wallet = await C2CWallet.findOne({ userId: user.id }).session(session)
        if (!wallet || wallet.balance < amount) {
            return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
        }

        // 1. Move money from balance to frozenBalance
        wallet.balance -= amount
        wallet.frozenBalance += amount
        
        // Update preferred bank details
        wallet.bankCode = bankCode
        wallet.bankAccountName = bankAccountName
        wallet.bankAccountNumber = bankAccountNumber
        
        await wallet.save({ session })

        // 2. Create pending payout transaction
        const transaction = await C2CWalletTransaction.create([{
            userId: user.id,
            amount: amount,
            type: "payout",
            status: "pending",
            bankInfo: {
                bankCode,
                bankAccountName,
                bankAccountNumber
            },
            note: "Yêu cầu rút tiền"
        }], { session })

        await session.commitTransaction()
        session.endSession()

        return NextResponse.json({ 
            success: true, 
            message: "Payout request submitted successfully",
            transaction: transaction[0]
        })

    } catch (error: any) {
        await session.abortTransaction()
        session.endSession()
        
        console.error("Payout Request Error:", error)
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        )
    }
}
