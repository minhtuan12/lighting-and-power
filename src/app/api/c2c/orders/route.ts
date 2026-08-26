import { withMiddleware } from '@/lib/api-handler'
import { getRequestUser } from '@/lib/context'
import { verifyToken } from '@/lib/middleware'
import { connectDbMiddleware } from '@/lib/middleware/connect-db'
import C2CInterest from '@/models/c2c-interest'
import C2COrder from '@/models/c2c-order'
import { NextRequest, NextResponse } from 'next/server'

export const POST = withMiddleware(
	async (request: NextRequest) => {
		const user = getRequestUser(request)
		if (!user?.userId)
			return NextResponse.json(
				{ success: false, message: 'Unauthorized' },
				{ status: 401 },
			)
		try {
			const body = await request.json()
			const ids = Array.isArray(body.interestIds) ? body.interestIds : []
			const interests: any[] = await C2CInterest.find({
				_id: { $in: ids },
				buyerId: user.userId,
				status: 'confirmed',
				expiresAt: { $gt: new Date() },
			})
				.populate('productId')
				.lean()
			if (!ids.length || interests.length !== ids.length)
				throw new Error('Một sản phẩm đã hết hạn hoặc không còn hợp lệ')
			const items = interests.map((i) => ({
				productId: i.productId._id,
				title: i.productId.title,
				price: i.productId.price,
				sellerId: i.productId.sellerId,
			}))
			const required = ['recipientName', 'phone', 'address']
			if (required.some((k) => !String(body[k] || '').trim()))
				throw new Error('Vui lòng nhập đủ thông tin giao hàng')
			const order = await C2COrder.create({
				buyerId: user.userId,
				items,
				total: items.reduce((s, i) => s + i.price, 0),
				recipientName: String(body.recipientName).trim(),
				phone: String(body.phone).trim(),
				address: String(body.address).trim(),
				note: String(body.note || '').trim(),
				paymentMethod: body.paymentMethod === 'cod' ? 'cod' : 'vietqr',
			})
			await C2CInterest.updateMany(
				{ _id: { $in: ids } },
				{ $set: { status: 'rejected' } },
			)
			return NextResponse.json(
				{ success: true, data: JSON.parse(JSON.stringify(order)) },
				{ status: 201 },
			)
		} catch (e: any) {
			return NextResponse.json(
				{ success: false, message: e.message },
				{ status: 400 },
			)
		}
	},
	connectDbMiddleware,
	verifyToken,
)
