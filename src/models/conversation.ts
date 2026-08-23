import mongoose, { Schema } from 'mongoose'

const ConversationSchema = new Schema(
    {
        participantIds: {
            type: [Schema.Types.ObjectId],
            ref: 'User',
            required: true,
        },
        isGroup: { type: Boolean, default: false },
        name: { type: String, trim: true, maxlength: 120 },
        ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true },
)
ConversationSchema.index({ participantIds: 1 })

export default mongoose.models.Conversation ||
    mongoose.model('Conversation', ConversationSchema)
