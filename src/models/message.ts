import mongoose, { Schema } from 'mongoose'

const MessageSchema = new Schema(
    {
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
        },
        senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, enum: ['text', 'call'], default: 'text' },
        // Attachment-only messages intentionally use an empty content string.
        // SocialService.sendMessage validates that either content or an attachment exists.
        content: { type: String, default: '', trim: true, maxlength: 5000 },
        attachmentUrl: { type: String, trim: true, maxlength: 2000 },
        attachmentName: { type: String, trim: true, maxlength: 255 },
        attachmentMimeType: { type: String, trim: true, maxlength: 150 },
        attachmentSize: { type: Number, min: 0 },
        // Chỉ tồn tại khi type === 'call'
        call: {
            callType: { type: String, enum: ['audio', 'video'] },
            status: {
                type: String,
                enum: ['completed', 'missed', 'rejected', 'cancelled'],
            },
            durationSec: { type: Number, min: 0, default: 0 },
            // Những ai thực sự đã tham gia (bắt máy), không tính người gọi
            participantIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        },
        readAt: { type: Date, default: null },
    },
    { timestamps: true },
)
MessageSchema.index({ conversationId: 1, createdAt: 1 })

export default mongoose.models.Message ||
    mongoose.model('Message', MessageSchema)
