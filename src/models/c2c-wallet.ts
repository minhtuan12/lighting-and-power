import mongoose, { Schema } from "mongoose"

const C2CWalletSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        balance: { type: Number, default: 0, min: 0 },
        frozenBalance: { type: Number, default: 0, min: 0 }, // Tiền đang chờ rút
        
        // Thông tin ngân hàng của User để rút tiền
        bankCode: String,
        bankAccountName: String,
        bankAccountNumber: String,
    },
    { timestamps: true }
)

if (mongoose.models.C2CWallet) {
    delete mongoose.models.C2CWallet
}

export default mongoose.model("C2CWallet", C2CWalletSchema)
