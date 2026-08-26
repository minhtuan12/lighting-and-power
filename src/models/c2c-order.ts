import mongoose, { Schema } from 'mongoose'

const C2COrderSchema = new Schema(
    {
        buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        items: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
                    ref: 'C2CProduct',
                    required: true,
                },
                title: String,
                price: Number,
                sellerId: { type: Schema.Types.ObjectId, ref: 'User' },
            },
        ],
        total: { type: Number, required: true },
        recipientName: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true },
        note: { type: String, default: '', trim: true },
        paymentMethod: {
            type: String,
            enum: ['vietqr', 'cod'],
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled'],
            default: 'pending',
        },
    },
    { timestamps: true },
)

C2COrderSchema.index({ buyerId: 1, createdAt: -1 })
export default mongoose.models.C2COrder ||
    mongoose.model('C2COrder', C2COrderSchema)
