import C2CInterest from '@/models/c2c-interest'
import C2CProduct from '@/models/c2c-product'
import Notification from '@/models/notification'
import User from '@/models/user'
import { emitToUser } from '@/lib/realtime'
import mongoose from 'mongoose'

const oid = (v: string) => {
    if (!mongoose.isValidObjectId(v)) throw new Error('Invalid id')
    return new mongoose.Types.ObjectId(v)
}
const cleanExpired = async (filter: any = {}) =>
    C2CInterest.updateMany(
        { ...filter, status: 'confirmed', expiresAt: { $lte: new Date() } },
        { $set: { status: 'expired' } },
    )

export const C2CInterestService = {
    async getBuyerInterest(productId: string, buyerId: string) {
        await cleanExpired({ productId: oid(productId), buyerId: oid(buyerId) })
        const interest = await C2CInterest.findOne({ productId: oid(productId), buyerId: oid(buyerId) }).lean()
        return interest ? JSON.parse(JSON.stringify(interest)) : null
    },
    async register(productId: string, buyerId: string) {
        const product: any = await C2CProduct.findById(oid(productId)).lean()
        if (!product || product.status !== 'active')
            throw new Error('Sản phẩm không có sẵn')
        if (String(product.sellerId) === buyerId)
            throw new Error('Người bán không thể đăng ký')
        await cleanExpired({ productId: oid(productId) })
        const existing: any = await C2CInterest.findOne({
            productId: oid(productId),
            buyerId: oid(buyerId),
        })
        if (existing && ['pending', 'confirmed'].includes(existing.status))
            throw new Error('Bạn đã đăng ký trước đó rồi')
        const interest: any = existing
            ? await C2CInterest.findByIdAndUpdate(
                existing._id,
                { status: 'pending', confirmedAt: null, expiresAt: null },
                { new: true },
            )
            : await C2CInterest.create({
                productId: oid(productId),
                buyerId: oid(buyerId),
            })
        const buyer: any = await User.findById(oid(buyerId))
            .select('fullName username')
            .lean()
        await Notification.create({
            recipientId: product.sellerId,
            actorId: oid(buyerId),
            type: 'c2c_interest',
            title: 'Có người đăng ký mua sản phẩm',
            message: `${buyer?.fullName || buyer?.username || 'Một người mua'} đã đăng ký mua ${product.title}`,
            link: `/quan-ly?product=${productId}`,
        })
        return JSON.parse(JSON.stringify(interest))
    },
    async sellerList(productId: string, sellerId: string) {
        await cleanExpired({ productId: oid(productId) })
        const product = await C2CProduct.findOne({
            _id: oid(productId),
            sellerId: oid(sellerId),
        }).lean()
        if (!product) throw new Error('Not found')
        return JSON.parse(
            JSON.stringify(
                await C2CInterest.find({ productId: oid(productId) })
                    .sort({ createdAt: 1 })
                    .populate('buyerId', 'fullName username avatar')
                    .lean(),
            ),
        )
    },
    async confirm(interestId: string, sellerId: string) {
        await cleanExpired()
        const interest: any = await C2CInterest.findById(oid(interestId))
            .populate('productId')
            .lean()
        if (!interest || String(interest.productId.sellerId) !== sellerId)
            throw new Error('Not found')
        const existing = await C2CInterest.findOne({
            productId: interest.productId._id,
            status: 'confirmed',
            expiresAt: { $gt: new Date() },
        })
        if (existing) throw new Error('Another buyer is already confirmed')
        const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        const updated = await C2CInterest.findByIdAndUpdate(
            interestId,
            { status: 'confirmed', confirmedAt: new Date(), expiresAt },
            { new: true },
        )
        await C2CInterest.updateMany(
            {
                productId: interest.productId._id,
                _id: { $ne: oid(interestId) },
                status: 'pending',
            },
            { $set: { status: 'rejected' } },
        )
        const notification = await Notification.create({
            recipientId: interest.buyerId,
            actorId: oid(sellerId),
            type: 'c2c_confirmed',
            title: 'Người bán đã xác nhận bạn',
            message: `${interest.productId.title} đã được xác nhận cho bạn trong 3 ngày`,
            link: '/quan-ly?tab=confirmed',
        })
        const populatedNotification = await Notification.findById(notification._id)
            .populate('actorId', 'fullName username avatar')
            .lean()
        emitToUser(String(interest.buyerId), 'notification:new', populatedNotification)
        return JSON.parse(JSON.stringify(updated))
    },
    async confirmed(buyerId: string) {
        await cleanExpired({ buyerId: oid(buyerId) })
        return JSON.parse(
            JSON.stringify(
                await C2CInterest.find({
                    buyerId: oid(buyerId),
                    status: 'confirmed',
                    expiresAt: { $gt: new Date() },
                })
                    .populate({
                        path: 'productId',
                        populate: {
                            path: 'sellerId',
                            select: 'fullName username',
                        },
                    })
                    .lean(),
            ),
        )
    },
}
