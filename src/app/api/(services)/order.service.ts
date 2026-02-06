import Cart from "@/models/cart"
import Order from "@/models/order"
import Product from "@/models/product"
import { EOrderStatus, EPaymentStatus } from "@/types/order"

export class OrderService {
    // Tạo đơn hàng từ giỏ hàng
    static async createOrder(
        userId: string,
        data: {
            customerInfo: {
                name: string
                phone: string
                email?: string
            }
            shippingAddress: {
                province: string
                district: string
                ward: string
                address: string
            }
            paymentMethod: string
            note?: string
        },
    ) {
        // Lấy giỏ hàng
        const cart = await Cart.findOne({ userId })
        if (!cart || cart.items.length === 0) {
            throw new Error("Giỏ hàng trống")
        }

        // Validate và tính toán
        const orderItems = []
        let subtotal = 0

        for (const item of cart.items) {
            const product = await Product.findById(item.productId)

            if (!product || product.stock < item.quantity) {
                throw new Error(`${item.productName} đã hết hàng`)
            }

            const itemSubtotal = item.price * item.quantity
            subtotal += itemSubtotal

            orderItems.push({
                productId: item.productId,
                productName: item.productName,
                productSlug: item.productSlug,
                productImage: item.productImage,
                quantity: item.quantity,
                price: item.price,
                subtotal: itemSubtotal,
                hasFeedback: false,
            })
        }

        // Tính phí ship (có thể tích hợp API tính phí)
        const shippingFee = 30000 // Tạm hardcode
        const total = subtotal + shippingFee

        // Tạo mã đơn hàng
        let orderNumber = ""
        const count = await Order.countDocuments()
        const date = new Date()
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "")
        orderNumber = `ORD${dateStr}${String(count + 1).padStart(5, "0")}`

        // Tạo order
        const order = await Order.create({
            orderNumber,
            userId,
            items: orderItems,
            customerInfo: data.customerInfo,
            shippingAddress: data.shippingAddress,
            subtotal,
            shippingFee,
            discount: 0,
            total,
            paymentMethod: data.paymentMethod,
            note: data.note,
            status: EOrderStatus.pending,
            paymentStatus: EPaymentStatus.pending,
        })

        // Trừ stock
        for (const item of orderItems) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: {
                    stock: -item.quantity,
                    soldCount: item.quantity,
                },
            })
        }

        // Xóa giỏ hàng
        cart.items = []
        await cart.save()

        return order
    }

    // Lấy danh sách đơn hàng của user
    static async getUserOrders(
        userId: string,
        options?: {
            page?: number
            limit?: number
            status?: EOrderStatus
        },
    ) {
        const page = options?.page || 1
        const limit = options?.limit || 10
        const skip = (page - 1) * limit

        const filter: any = { userId }
        if (options?.status) {
            filter.status = options.status
        }

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(filter),
        ])

        return {
            orders,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        }
    }

    // Lấy chi tiết đơn hàng
    static async getOrderDetail(userId: string, orderId: string) {
        const order = await Order.findOne({
            _id: orderId,
            userId,
        }).lean()

        if (!order) {
            throw new Error("Đơn hàng không tồn tại")
        }

        return order
    }

    // Hủy đơn hàng
    static async cancelOrder(userId: string, orderId: string, reason: string) {
        const order = await Order.findOne({
            _id: orderId,
            userId,
        })

        if (!order) {
            throw new Error("Đơn hàng không tồn tại")
        }

        // Chỉ cho phép hủy khi đơn hàng đang pending hoặc confirmed
        if (
            ![EOrderStatus.pending, EOrderStatus.confirmed].includes(
                order.status,
            )
        ) {
            throw new Error("Không thể hủy đơn hàng này")
        }

        order.status = EOrderStatus.cancelled
        order.cancelReason = reason
        order.cancelledAt = new Date()
        await order.save()

        // Hoàn trả stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: {
                    stock: item.quantity,
                    soldCount: -item.quantity,
                },
            })
        }

        return order
    }

    // Lấy sản phẩm có thể feedback
    static async getProductsCanFeedback(userId: string) {
        const orders = await Order.find({
            userId,
            status: EOrderStatus.delivered,
        }).lean()

        const products = []

        for (const order of orders) {
            for (const item of order.items) {
                if (!item.hasFeedback) {
                    products.push({
                        orderId: order._id,
                        orderNumber: order.orderNumber,
                        productId: item.productId,
                        productName: item.productName,
                        productSlug: item.productSlug,
                        productImage: item.productImage,
                        deliveredAt: order.deliveredAt,
                    })
                }
            }
        }

        return products
    }
}
