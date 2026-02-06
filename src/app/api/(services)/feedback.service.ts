import Feedback from "@/models/feedback"
import Order from "@/models/order"
import Product from "@/models/product"
import { EOrderStatus, IOrderItem } from "@/types/order"

export class FeedbackService {
    // Tạo feedback mới
    static async createFeedback(
        userId: string,
        data: {
            productId: string
            orderId: string
            rating: number
            comment?: string
            images?: string[]
        },
    ) {
        // Kiểm tra order có tồn tại và thuộc user này không
        const order = await Order.findOne({
            _id: data.orderId,
            userId,
        })

        if (!order) {
            throw new Error("Order not found")
        }

        // Chỉ cho phép feedback khi đơn hàng đã giao
        if (order.status !== EOrderStatus.delivered) {
            throw new Error("You can only feedback on delivered orders")
        }

        // Kiểm tra product có trong order không
        const orderItem = order.items.find(
            (item: IOrderItem) => item.productId.toString() === data.productId,
        )

        if (!orderItem) {
            throw new Error("Product not found in this order")
        }

        // Kiểm tra đã feedback chưa
        const existingFeedback = await Feedback.findOne({
            userId,
            productId: data.productId,
            orderId: data.orderId,
        })

        if (existingFeedback) {
            throw new Error("You have already reviewed this product")
        }

        // Tạo feedback
        const feedback = await Feedback.create({
            userId,
            productId: data.productId,
            orderId: data.orderId,
            rating: data.rating,
            comment: data.comment,
            images: data.images || [],
            isVerifiedPurchase: true,
        })

        // Cập nhật hasFeedback trong order
        orderItem.hasFeedback = true
        await order.save()

        // Cập nhật rating cho product
        await this.updateProductRating(data.productId)

        return feedback
    }

    // Cập nhật feedback
    static async updateFeedback(
        userId: string,
        feedbackId: string,
        data: {
            rating?: number
            comment?: string
            images?: string[]
        },
    ) {
        const feedback = await Feedback.findOne({
            _id: feedbackId,
            userId,
        })

        if (!feedback) {
            throw new Error("Feedback not found")
        }

        if (data.rating !== undefined) feedback.rating = data.rating
        if (data.comment !== undefined) feedback.comment = data.comment
        if (data.images !== undefined) feedback.images = data.images

        await feedback.save()

        // Cập nhật lại rating của product
        await this.updateProductRating(feedback.productId.toString())

        return feedback
    }

    // Xóa feedback
    static async deleteFeedback(userId: string, feedbackId: string) {
        const feedback = await Feedback.findOne({
            _id: feedbackId,
            userId,
        })

        if (!feedback) {
            throw new Error("Feedback not found")
        }

        const productId = feedback.productId.toString()

        await Feedback.deleteOne({ _id: feedbackId })

        // Cập nhật hasFeedback trong order
        await Order.updateOne(
            {
                _id: feedback.orderId,
                "items.productId": feedback.productId,
            },
            {
                $set: { "items.$.hasFeedback": false },
            },
        )

        // Cập nhật rating của product
        await this.updateProductRating(productId)

        return { success: true }
    }

    // Lấy danh sách feedback của 1 sản phẩm
    static async getProductFeedbacks(
        productId: string,
        options?: {
            page?: number
            limit?: number
            rating?: number
            sort?: string
        },
    ) {
        const page = options?.page || 1
        const limit = options?.limit || 10
        const skip = (page - 1) * limit

        const filter: any = { productId }
        if (options?.rating) {
            filter.rating = options.rating
        }

        let sort: any = { createdAt: -1 }
        if (options?.sort === "helpful") {
            sort = { helpful: -1, createdAt: -1 }
        } else if (options?.sort === "rating_high") {
            sort = { rating: -1, createdAt: -1 }
        } else if (options?.sort === "rating_low") {
            sort = { rating: 1, createdAt: -1 }
        }

        const [feedbacks, total] = await Promise.all([
            Feedback.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate("userId", "name avatar")
                .lean(),
            Feedback.countDocuments(filter),
        ])

        return {
            feedbacks,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        }
    }

    // Lấy feedback của user
    static async getUserFeedbacks(
        userId: string,
        options?: {
            page?: number
            limit?: number
        },
    ) {
        const page = options?.page || 1
        const limit = options?.limit || 10
        const skip = (page - 1) * limit

        const [feedbacks, total] = await Promise.all([
            Feedback.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("productId", "name slug thumbnail")
                .lean(),
            Feedback.countDocuments({ userId }),
        ])

        return {
            feedbacks,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        }
    }

    // Đánh dấu feedback hữu ích
    static async markHelpful(feedbackId: string) {
        const feedback = await Feedback.findByIdAndUpdate(
            feedbackId,
            { $inc: { helpful: 1 } },
            { new: true },
        )

        if (!feedback) {
            throw new Error("Feedback not found")
        }

        return feedback
    }

    // Cập nhật rating trung bình cho product
    static async updateProductRating(productId: string) {
        const stats = await Feedback.aggregate([
            { $match: { productId } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: "$rating" },
                    count: { $sum: 1 },
                },
            },
        ])

        const rating = stats[0]?.avgRating || 0
        const reviewCount = stats[0]?.count || 0

        await Product.findByIdAndUpdate(productId, {
            rating: Math.round(rating * 10) / 10, // làm tròn 1 chữ số
            reviewCount,
        })
    }

    // Lấy thống kê rating
    static async getRatingStats(productId: string) {
        const stats = await Feedback.aggregate([
            { $match: { productId: productId } },
            {
                $group: {
                    _id: "$rating",
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: -1 } },
        ])

        const total = stats.reduce((sum, item) => sum + item.count, 0)

        const distribution = {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0,
        }

        stats.forEach((item) => {
            distribution[item._id as keyof typeof distribution] = item.count
        })

        return {
            total,
            distribution,
            percentage: {
                5: total > 0 ? Math.round((distribution[5] / total) * 100) : 0,
                4: total > 0 ? Math.round((distribution[4] / total) * 100) : 0,
                3: total > 0 ? Math.round((distribution[3] / total) * 100) : 0,
                2: total > 0 ? Math.round((distribution[2] / total) * 100) : 0,
                1: total > 0 ? Math.round((distribution[1] / total) * 100) : 0,
            },
        }
    }
}
