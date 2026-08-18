import { emitToUser } from '@/lib/realtime'
import Notification from '@/models/notification'
import User from '@/models/user'
import mongoose from 'mongoose'

const oid = (value: string) => {
    if (!mongoose.isValidObjectId(value))
        throw new Error('Invalid notification id')
    return new mongoose.Types.ObjectId(value)
}
const serialize = (value: unknown) => JSON.parse(JSON.stringify(value))

export const NotificationService = {
    async list(userId: string) {
        const notifications: any[] = await Notification.find({
            recipientId: oid(userId),
        })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('actorId', 'fullName username avatar')
            .lean()
        const unread = await Notification.countDocuments({
            recipientId: oid(userId),
            readAt: null,
        })
        return { notifications: serialize(notifications), unread }
    },
    async markRead(userId: string, notificationId: string) {
        return serialize(
            await Notification.findOneAndUpdate(
                { _id: oid(notificationId), recipientId: oid(userId) },
                { $set: { readAt: new Date() } },
                { new: true },
            ).lean(),
        )
    },
    async createFriendRequest(actorId: string, recipientId: string) {
        const actor: any = await User.findById(oid(actorId))
            .select('fullName')
            .lean()
        if (!actor) return null
        const notification = await Notification.create({
            recipientId: oid(recipientId),
            actorId: oid(actorId),
            type: 'friend_request',
            title: 'Lời mời kết bạn',
            message: `${actor.fullName} đã gửi lời mời kết bạn cho bạn`,
            link: `/thanh-vien/${actorId}`,
        })
        const populated = await Notification.findById(notification._id)
            .populate('actorId', 'fullName username avatar')
            .lean()
        emitToUser(recipientId, 'notification:new', populated)
        return notification
    },
    async createFriendAccepted(actorId: string, recipientId: string) {
        const actor: any = await User.findById(oid(actorId)).select('fullName').lean()
        if (!actor) return null
        const notification = await Notification.create({ recipientId: oid(recipientId), actorId: oid(actorId), type: 'friend_accepted', title: 'Lời mời kết bạn được chấp nhận', message: `${actor.fullName} đã chấp nhận lời mời kết bạn`, link: `/thanh-vien/${actorId}` })
        const populated = await Notification.findById(notification._id).populate('actorId', 'fullName username avatar').lean()
        emitToUser(recipientId, 'notification:new', populated)
        return notification
    },
}
