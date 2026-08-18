import mongoose, { Schema } from 'mongoose'

const MessageSchema = new Schema(
    {
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
        },
        senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true, trim: true, maxlength: 5000 },
        readAt: { type: Date, default: null },
    },
    { timestamps: true },
)
MessageSchema.index({ conversationId: 1, createdAt: 1 })

export default mongoose.models.Message ||
    mongoose.model('Message', MessageSchema)
