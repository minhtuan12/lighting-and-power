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
        attachmentUrl: { type: String, trim: true, maxlength: 2000 },
        attachmentName: { type: String, trim: true, maxlength: 255 },
        attachmentMimeType: { type: String, trim: true, maxlength: 150 },
        attachmentSize: { type: Number, min: 0 },
        readAt: { type: Date, default: null },
    },
    { timestamps: true },
)
MessageSchema.index({ conversationId: 1, createdAt: 1 })

export default mongoose.models.Message ||
    mongoose.model('Message', MessageSchema)
