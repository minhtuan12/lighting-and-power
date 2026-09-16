import { EOrderStatus, EPaymentProvider, EPaymentStatus, IOrder } from "@/types/order"
import mongoose, { Schema } from "mongoose"

const OrderItemSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        productName: { type: String, required: true },
        productSlug: { type: String, required: true },
        productImage: String,
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
        subtotal: { type: Number, required: true, min: 0 },
        hasFeedback: { type: Boolean, default: false },
    },
    { _id: false },
)

const OrderPaymentSchema = new Schema(
    {
        provider: {
            type: String,
            enum: Object.values(EPaymentProvider),
            required: true,
        },
        orderCode: { type: Number },
        paymentLinkId: String,
        checkoutUrl: String,
        qrCode: String,
        expiredAt: Date,
        paidAt: Date,
        reference: String,
        transactionDateTime: String,
        cancelledAt: Date,
        cancelReason: String,
    },
    { _id: false },
)

const OrderSchema = new Schema(
    {
        orderNumber: { type: String, required: true, unique: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
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
        subtotal: { type: Number, required: true, min: 0 },
        shippingFee: { type: Number, default: 0, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        total: { type: Number, required: true, min: 0 },
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
            enum: Object.values(EPaymentProvider),
            required: true,
        },
        payment: OrderPaymentSchema,
        clientRequestId: { type: String },
        paymentIssue: { type: Boolean, default: false },
        note: String,
        cancelReason: String,
        deliveredAt: Date,
        cancelledAt: Date,
    },
    { timestamps: true },
)

OrderSchema.index({ userId: 1, createdAt: -1 })
OrderSchema.index({ status: 1 })
OrderSchema.index({ createdAt: -1 })
// Idempotency: 1 user không thể tạo 2 đơn với cùng clientRequestId
OrderSchema.index(
    { userId: 1, clientRequestId: 1 },
    { unique: true, sparse: true },
)
// payOS orderCode phải duy nhất toàn hệ thống
OrderSchema.index({ "payment.orderCode": 1 }, { unique: true, sparse: true })
// Dùng cho cron quét đơn payOS hết hạn
OrderSchema.index({ paymentMethod: 1, paymentStatus: 1, "payment.expiredAt": 1 })

const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema)

export default Order
