import mongoose, { Schema } from 'mongoose'

const ConversationSchema = new Schema(
    {
        participantIds: {
            type: [Schema.Types.ObjectId],
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true },
)
ConversationSchema.index({ participantIds: 1 })

export default mongoose.models.Conversation ||
    mongoose.model('Conversation', ConversationSchema)
