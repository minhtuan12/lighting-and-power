import { EOrderStatus, EPaymentStatus, IOrder } from "@/types/order"
import mongoose, { Schema } from "mongoose"

const OrderItemSchema = new Schema(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        productName: {
            type: String,
            required: true,
        },
        productSlug: {
            type: String,
            required: true,
        },
        productImage: String,
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
        hasFeedback: {
            type: Boolean,
            default: false,
        },
    },
    { _id: false },
)

const OrderSchema = new Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        items: {
            type: [OrderItemSchema],
            required: true,
            validate: {
                validator: (items: any[]) => items.length > 0,
                message: "Order must have at least one item",
            },
        },
        customerInfo: {
            name: { type: String, required: true },
            phone: { type: String, required: true },
            email: { type: String },
        },
        shippingAddress: {
            province: { type: String, required: true },
            ward: { type: String, required: true },
            address: { type: String, required: true },
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
        shippingFee: {
            type: Number,
            default: 0,
            min: 0,
        },
        discount: {
            type: Number,
            default: 0,
            min: 0,
        },
        total: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: Object.values(EOrderStatus),
            default: EOrderStatus.pending,
        },
        paymentStatus: {
            type: String,
            enum: Object.values(EPaymentStatus),
            default: EPaymentStatus.pending,
        },
        paymentMethod: {
            type: String,
            required: true,
        },
        note: String,
        cancelReason: String,
        deliveredAt: Date,
        cancelledAt: Date,
    },
    {
        timestamps: true,
    },
)

// Indexes
OrderSchema.index({ userId: 1, createdAt: -1 })
OrderSchema.index({ status: 1 })
OrderSchema.index({ createdAt: -1 })

const Order =
    mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema)

export default Order
