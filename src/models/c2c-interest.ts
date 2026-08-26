import mongoose, { Schema } from 'mongoose'

const C2CInterestSchema = new Schema(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'C2CProduct',
            required: true,
        },
        buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'expired', 'rejected'],
            default: 'pending',
        },
        confirmedAt: { type: Date, default: null },
        expiresAt: { type: Date, default: null },
    },
    { timestamps: true },
)

C2CInterestSchema.index({ productId: 1, buyerId: 1 }, { unique: true })
C2CInterestSchema.index({ buyerId: 1, status: 1, expiresAt: 1 })
C2CInterestSchema.index({ productId: 1, status: 1 })

export default mongoose.models.C2CInterest ||
    mongoose.model('C2CInterest', C2CInterestSchema)
