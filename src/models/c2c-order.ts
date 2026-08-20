import mongoose, { Schema } from "mongoose"

const C2COrderSchema = new Schema(
    {
        buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        productId: { type: Schema.Types.ObjectId, ref: "C2CProduct", required: true },
        
        amount: { type: Number, required: true, min: 0 },
        // PayOS order code must be a number <= 9007199254740991
        payosOrderCode: { type: Number, required: true, unique: true },
        
        status: {
            type: String,
            enum: ["pending_payment", "paid", "completed", "cancelled", "disputed"],
            default: "pending_payment",
        },
        
        // Tracking timestamps
        paidAt: Date,
        completedAt: Date,
        cancelledAt: Date,
        
        // Contact info that buyer leaves for seller to ship
        shippingPhone: String,
        shippingAddress: String,
        shippingNote: String
    },
    { timestamps: true }
)

C2COrderSchema.index({ buyerId: 1, createdAt: -1 })
C2COrderSchema.index({ sellerId: 1, createdAt: -1 })
C2COrderSchema.index({ payosOrderCode: 1 })
C2COrderSchema.index({ status: 1 })

if (mongoose.models.C2COrder) {
    delete mongoose.models.C2COrder
}

export default mongoose.model("C2COrder", C2COrderSchema)
