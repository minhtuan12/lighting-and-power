import mongoose, { Schema } from 'mongoose'

const NotificationSchema = new Schema({
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, trim: true },
    readAt: { type: Date, default: null },
}, { timestamps: true })

NotificationSchema.index({ recipientId: 1, createdAt: -1 })
NotificationSchema.index({ recipientId: 1, readAt: 1 })

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema)
