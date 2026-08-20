import mongoose, { Schema } from "mongoose"

const C2CWalletTransactionSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        amount: { type: Number, required: true },
        type: {
            type: String,
            enum: ["escrow_release", "payout", "refund"],
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "completed", "rejected"],
            default: "pending",
        },
        referenceOrderId: { type: Schema.Types.ObjectId, ref: "C2COrder" },
        // Nếu type là payout, lưu lại thông tin ngân hàng lúc rút
        bankInfo: {
            bankCode: String,
            bankAccountName: String,
            bankAccountNumber: String,
        },
        note: String,
    },
    { timestamps: true }
)

C2CWalletTransactionSchema.index({ userId: 1, createdAt: -1 })
C2CWalletTransactionSchema.index({ status: 1 })

if (mongoose.models.C2CWalletTransaction) {
    delete mongoose.models.C2CWalletTransaction
}

export default mongoose.model("C2CWalletTransaction", C2CWalletTransactionSchema)
