import mongoose, { Schema } from 'mongoose'

const FriendshipSchema = new Schema(
    {
        requesterId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        addresseeId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'blocked'],
            default: 'pending',
        },
    },
    { timestamps: true },
)

FriendshipSchema.index({ requesterId: 1, addresseeId: 1 }, { unique: true })
FriendshipSchema.index({ addresseeId: 1, status: 1 })

export default mongoose.models.Friendship ||
    mongoose.model('Friendship', FriendshipSchema)
