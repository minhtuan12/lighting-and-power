import { IFeedback } from "@/types/feedback"
import mongoose, { Schema } from "mongoose"

const FeedbackSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        orderId: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        images: {
            type: [String],
            default: [],
        },
        isVerifiedPurchase: {
            type: Boolean,
            default: true,
        },
        helpful: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    },
)

// Indexes
FeedbackSchema.index({ userId: 1, productId: 1 })
FeedbackSchema.index({ productId: 1, createdAt: -1 })
FeedbackSchema.index({ orderId: 1 })
FeedbackSchema.index({ rating: -1 })

const Feedback =
    mongoose.models.Feedback ||
    mongoose.model<IFeedback>("Feedback", FeedbackSchema)

export default Feedback
