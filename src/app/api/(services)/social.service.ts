import CommunityLike from '@/models/community-like'
import Conversation from '@/models/conversation'
import Friendship from '@/models/friendship'
import Message from '@/models/message'
import User from '@/models/user'
import { NotificationService } from '@/app/api/(services)/notification.service'
import { emitToUser } from '@/lib/realtime'
import mongoose from 'mongoose'

const oid = (value: string) => {
    if (!mongoose.isValidObjectId(value)) throw new Error('Invalid user id')
    return new mongoose.Types.ObjectId(value)
}
const serialize = (value: unknown) => JSON.parse(JSON.stringify(value))

export const SocialService = {
    async getPublicProfile(userId: string, viewerId?: string) {
        const user: any = await User.findOne({
            _id: oid(userId),
            role: { $ne: 'admin' },
        })
            .select('fullName username avatar role createdAt phone email')
            .lean()
        if (!user) return null
        const relation =
            viewerId && viewerId !== userId
                ? await Friendship.findOne({
                    $or: [
                        { requesterId: oid(viewerId), addresseeId: user._id },
                        { requesterId: user._id, addresseeId: oid(viewerId) },
                    ],
                })
                    .select('requesterId addresseeId status')
                    .lean()
                : null
        const posts: any[] = await (
            await import('@/models/community-post')
        ).default
            .find({ authorId: user._id, visibility: 'public' })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('authorId', 'fullName username avatar role')
            .lean()
        const [friendsCount, likesCount] = await Promise.all([
            Friendship.countDocuments({
                status: 'accepted',
                $or: [{ requesterId: user._id }, { addresseeId: user._id }],
            }),
            CommunityLike.countDocuments({
                postId: { $in: posts.map((post) => post._id) },
            }),
        ])
        return serialize({
            ...user,
            relation,
            friendsCount,
            likesCount,
            posts: posts.map((post) => ({
                ...post,
                author: post.authorId,
                authorId: undefined,
            })),
        })
    },
    async friendship(
        userId: string,
        otherId: string,
        action: 'request' | 'accept' | 'reject' | 'remove',
    ) {
        const me = oid(userId),
            other = oid(otherId)
        if (me.equals(other)) throw new Error('You cannot add yourself')
        if (!(await User.exists({ _id: other })))
            throw new Error('User not found')
        const existing: any = await Friendship.findOne({
            $or: [
                { requesterId: me, addresseeId: other },
                { requesterId: other, addresseeId: me },
            ],
        })
        if (action === 'remove') {
            if (existing) {
                const update = { type: 'friendship:update', requesterId: existing.requesterId.toString(), addresseeId: existing.addresseeId.toString(), status: 'none' }
                await existing.deleteOne()
                emitToUser(existing.requesterId.toString(), 'friendship:update', update)
                emitToUser(existing.addresseeId.toString(), 'friendship:update', update)
            }
            return { status: 'none' }
        }
        if (action === 'request') {
            if (existing?.status === 'accepted') return { status: 'accepted' }
            if (existing) {
                existing.requesterId = me
                existing.addresseeId = other
                existing.status = 'pending'
                await existing.save()
                return serialize(existing)
            }
            const friendship = await Friendship.create({ requesterId: me, addresseeId: other })
            await NotificationService.createFriendRequest(userId, otherId)
            return serialize(friendship)
        }
        if (!existing || !existing.addresseeId.equals(me))
            throw new Error('Friend request not found')
        existing.status = action === 'accept' ? 'accepted' : 'rejected'
        await existing.save()
        const update = { type: 'friendship:update', requesterId: existing.requesterId.toString(), addresseeId: existing.addresseeId.toString(), status: existing.status }
        emitToUser(existing.requesterId.toString(), 'friendship:update', update)
        emitToUser(existing.addresseeId.toString(), 'friendship:update', update)
        if (action === 'accept') await NotificationService.createFriendAccepted(userId, existing.requesterId.toString())
        return serialize(existing)
    },
    async listFriends(userId: string) {
        const me = oid(userId)
        const rows: any[] = await Friendship.find({
            $or: [{ requesterId: me }, { addresseeId: me }],
        })
            .populate('requesterId addresseeId', 'fullName username avatar')
            .lean()
        return serialize(rows)
    },
    async getOrCreateConversation(userId: string, otherId: string) {
        const me = oid(userId),
            other = oid(otherId)
        const ids = [me, other].sort((a, b) => a.toString().localeCompare(b.toString()))
        let conversation = await Conversation.findOne({ participantIds: { $all: ids, $size: 2 } })
        if (!conversation) conversation = await Conversation.create({ participantIds: ids })
        return serialize(conversation)
        const friendship = await Friendship.findOne({
            status: 'accepted',
            $or: [
                { requesterId: me, addresseeId: other },
                { requesterId: other, addresseeId: me },
            ],
        })
        if (!friendship) throw new Error('Cần kết bạn trước khi chat')
        const ids2 = [me, other].sort((a, b) =>
            a.toString().localeCompare(b.toString()),
        )
        return serialize(
            await Conversation.findOneAndUpdate(
                { participantIds: { $all: ids2, $size: 2 } },
                { $setOnInsert: { participantIds: ids2 } },
                { upsert: true, new: true },
            ),
        )
    },
    async listConversations(userId: string) {
        const me = oid(userId)
        const conversations: any[] = await Conversation.find({ participantIds: me })
            .populate('participantIds', 'fullName username avatar').sort({ updatedAt: -1 }).lean()
        const result = await Promise.all(conversations.map(async (conversation) => {
            const other = conversation.participantIds.find((participant: any) => participant._id.toString() !== userId)
            const latest: any = await Message.findOne({ conversationId: conversation._id }).sort({ createdAt: -1 }).lean()
            const unread = await Message.countDocuments({ conversationId: conversation._id, senderId: { $ne: me }, readAt: null })
            return { ...conversation, other, latest, unread }
        }))
        return serialize(result)
    },
    async markConversationRead(userId: string, conversationId: string) {
        const conversation = await Conversation.findOne({ _id: oid(conversationId), participantIds: oid(userId) })
        if (!conversation) throw new Error('Conversation not found')
        await Message.updateMany({ conversationId: conversation._id, senderId: { $ne: oid(userId) }, readAt: null }, { $set: { readAt: new Date() } })
        return { success: true }
    },
    async listMessages(userId: string, conversationId: string) {
        const conversation = await Conversation.findOne({
            _id: oid(conversationId),
            participantIds: oid(userId),
        })
        if (!conversation) throw new Error('Conversation not found')
        return serialize(
            await Message.find({ conversationId: conversation._id })
                .sort({ createdAt: 1 })
                .limit(100)
                .lean(),
        )
    },
    async sendMessage(userId: string, conversationId: string, content: string) {
        const conversation = await Conversation.findOne({
            _id: oid(conversationId),
            participantIds: oid(userId),
        })
        const text = String(content || '').trim()
        if (!conversation) throw new Error('Conversation not found')
        if (!text) throw new Error('Message content is required')
        const message = await Message.create({
                conversationId: conversation._id,
                senderId: oid(userId),
                content: text,
            })
        const recipients = conversation.participantIds.filter((participant: any) => participant.toString() !== userId)
        recipients.forEach((recipient: any) => emitToUser(recipient.toString(), 'message:new', serialize(message)))
        return serialize(message)
    },
}
