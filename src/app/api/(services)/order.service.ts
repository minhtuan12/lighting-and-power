import { getGhtkShippingFee } from "@/lib/ghtk"
import { buildPayosUrls, payos, PAYOS_PAYMENT_LINK_TTL_MS } from "@/lib/payos"
import Cart from "@/models/cart"
import { generateOrderCode } from "@/models/counter"
import Order from "@/models/order"
import PaymentWebhookEvent from "@/models/payment-webhook-event"
import Product from "@/models/product"
import { NotificationService } from "@/app/api/(services)/notification.service"
import { EOrderStatus, EPaymentProvider, EPaymentStatus } from "@/types/order"
import mongoose from "mongoose"

export class OrderService {
    // ---------------------------------------------------------------------
    // Tạo đơn hàng (COD hoặc payOS) — có idempotency + transaction + saga
    // ---------------------------------------------------------------------
    static async createOrder(
        userId: string,
        data: {
            customerInfo: { name: string; phone: string; email?: string }
            shippingAddress: { province: string; ward: string; address: string }
            paymentMethod: EPaymentProvider
            note?: string
            selectedProductIds?: string[]
            clientRequestId: string // BẮT BUỘC — idempotency key từ FE
        },
    ) {
        if (!data.clientRequestId) {
            throw new Error("Thiếu clientRequestId")
        }

        // 1) Idempotency check: nếu đơn đã tạo trước đó (retry/double-click) -> trả lại luôn
        const existing = await Order.findOne({
            userId,
            clientRequestId: data.clientRequestId,
        })
        if (existing) {
            return this.ensurePayosPaymentLink(existing)
        }

        const session = await mongoose.startSession()
        let order: any

        try {
            await session.withTransaction(async () => {
                const cart = await Cart.findOne({ userId }).session(session)
                if (!cart || cart.items.length === 0) {
                    throw new Error("Giỏ hàng trống")
                }

                const selectedSet =
                    data.selectedProductIds && data.selectedProductIds.length > 0
                        ? new Set(data.selectedProductIds.map(String))
                        : null
                const cartItems = selectedSet
                    ? cart.items.filter((item: any) =>
                        selectedSet.has(String(item.productId)),
                    )
                    : cart.items

                if (cartItems.length === 0) {
                    throw new Error("Không có sản phẩm được chọn")
                }

                const orderItems = []
                let subtotal = 0

                // Trừ kho có điều kiện (atomic) TRONG transaction — nếu bất kỳ item nào
                // hết hàng, toàn bộ transaction rollback, không có trạng thái nửa vời.
                for (const item of cartItems) {
                    const product = await Product.findOneAndUpdate(
                        { _id: item.productId, stock: { $gte: item.quantity } },
                        { $inc: { stock: -item.quantity, soldCount: item.quantity } },
                        { new: true, session },
                    )

                    if (!product) {
                        throw new Error(`${item.productName} đã hết hàng hoặc không đủ số lượng`)
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

                // Tính phí ship SERVER-SIDE — không tin số liệu client gửi lên,
                // vì số tiền này sẽ được gửi thẳng cho payOS.
                let shippingFee = 0
                try {
                    const feeResult = await getGhtkShippingFee({
                        province: data.shippingAddress.province,
                        district: data.shippingAddress.ward, // theo cấu trúc hiện tại của bạn
                        ward: data.shippingAddress.ward,
                        address: data.shippingAddress.address,
                        subtotal,
                    })
                    shippingFee = Number((feeResult as any)?.fee ?? 0) || 0
                } catch {
                    shippingFee = 30000 // fallback nếu API GHTK lỗi
                }

                const discount = 0
                const total = subtotal + shippingFee - discount

                let orderNumber = ""
                const count = await Order.countDocuments().session(session)
                const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
                orderNumber = `ORD${dateStr}${String(count + 1).padStart(5, "0")}`

                const isPayos = data.paymentMethod === EPaymentProvider.payos
                const payment = isPayos
                    ? {
                        provider: EPaymentProvider.payos,
                        orderCode: await generateOrderCode(session),
                        expiredAt: new Date(Date.now() + PAYOS_PAYMENT_LINK_TTL_MS),
                    }
                    : { provider: EPaymentProvider.cod }

                const createdDocs = await Order.create(
                    [
                        {
                            orderNumber,
                            userId,
                            items: orderItems,
                            customerInfo: data.customerInfo,
                            shippingAddress: data.shippingAddress,
                            subtotal,
                            shippingFee,
                            discount,
                            total,
                            paymentMethod: data.paymentMethod,
                            payment,
                            clientRequestId: data.clientRequestId,
                            note: data.note,
                            status: EOrderStatus.pending,
                            paymentStatus: EPaymentStatus.pending,
                        },
                    ],
                    { session },
                )
                order = createdDocs[0]

                // Xóa các item đã đặt khỏi giỏ hàng
                cart.items = selectedSet
                    ? cart.items.filter(
                        (item: any) => !selectedSet.has(String(item.productId)),
                    )
                    : []
                await cart.save({ session })
            })
        } finally {
            await session.endSession()
        }

        if (data.paymentMethod === EPaymentProvider.payos) {
            return this.ensurePayosPaymentLink(order)
        }

        return order
    }

    // ---------------------------------------------------------------------
    // Tạo/khôi phục link thanh toán payOS cho 1 đơn (idempotent)
    // Gọi lại nhiều lần an toàn: nếu đã có checkoutUrl còn hạn -> trả luôn,
    // nếu payOS báo "đã tồn tại" -> lấy lại thông tin thay vì tạo trùng.
    // ---------------------------------------------------------------------
    static async ensurePayosPaymentLink(order: any) {
        if (!order.total || order.total <= 0) {
            await this.compensateFailedPayosOrder(order, "Số tiền đơn hàng không hợp lệ")
            throw new Error("Số tiền đơn hàng không hợp lệ, vui lòng thử lại")
        }

        if (order.paymentMethod !== EPaymentProvider.payos) return order

        // Đã thanh toán rồi -> không làm gì thêm
        if (order.paymentStatus === EPaymentStatus.paid) return order

        // Đã có link còn hạn -> trả lại luôn (idempotent)
        if (
            order.payment?.checkoutUrl &&
            order.payment?.expiredAt &&
            new Date(order.payment.expiredAt).getTime() > Date.now()
        ) {
            return order
        }

        const { returnUrl, cancelUrl } = buildPayosUrls(String(order._id))
        const orderCode = order.payment.orderCode

        try {
            const paymentLink = await payos.paymentRequests.create({
                orderCode,
                amount: order.total,
                description: `Thanh toan ${order.orderNumber}`.slice(0, 25),
                buyerName: order.customerInfo.name,
                buyerPhone: order.customerInfo.phone,
                buyerEmail: order.customerInfo.email,
                items: order.items.map((i: any) => ({
                    name: i.productName,
                    quantity: i.quantity,
                    price: i.price,
                })),
                cancelUrl,
                returnUrl,
                expiredAt: Math.floor(
                    (order.payment.expiredAt
                        ? new Date(order.payment.expiredAt).getTime()
                        : Date.now() + PAYOS_PAYMENT_LINK_TTL_MS) / 1000,
                ),
            })

            order.payment.paymentLinkId = paymentLink.paymentLinkId
            order.payment.checkoutUrl = paymentLink.checkoutUrl
            order.payment.qrCode = paymentLink.qrCode
            await order.save()
            return order
        } catch (error: any) {
            // orderCode đã tồn tại bên payOS (do retry) -> lấy lại info thay vì lỗi
            const message = String(error?.message || "")
            if (message.includes("tồn tại") || error?.code === "231") {
                try {
                    const info = await payos.paymentRequests.get(orderCode)
                    order.payment.paymentLinkId = (info as any).id
                    order.payment.checkoutUrl = (info as any).checkoutUrl
                    await order.save()
                    return order
                } catch {
                    // rơi xuống nhánh compensate bên dưới
                }
            }

            // SAGA bù trừ: tạo đơn + trừ kho đã commit ở DB nhưng tạo payment link
            // thất bại -> hủy đơn & hoàn kho để không "giam" hàng vô thời hạn.
            await this.compensateFailedPayosOrder(order, "Không tạo được link thanh toán payOS")
            throw new Error("Không thể khởi tạo thanh toán, vui lòng thử lại")
        }
    }

    private static async compensateFailedPayosOrder(order: any, reason: string) {
        const session = await mongoose.startSession()
        try {
            await session.withTransaction(async () => {
                const fresh = await Order.findById(order._id).session(session)
                if (!fresh || fresh.status === EOrderStatus.cancelled) return

                fresh.status = EOrderStatus.cancelled
                fresh.paymentStatus = EPaymentStatus.failed
                fresh.cancelReason = reason
                fresh.cancelledAt = new Date()
                await fresh.save({ session })

                for (const item of fresh.items) {
                    await Product.findByIdAndUpdate(
                        item.productId,
                        { $inc: { stock: item.quantity, soldCount: -item.quantity } },
                        { session },
                    )
                }
            })
        } finally {
            await session.endSession()
        }
    }

    // ---------------------------------------------------------------------
    // Xử lý webhook payOS (idempotent + transaction)
    // ---------------------------------------------------------------------
    static async handlePayosWebhook(webhookData: {
        orderCode: number
        amount: number
        reference: string
        transactionDateTime: string
        paymentLinkId: string
        desc: string
        code: string
    }) {
        // 1) Dedup theo reference giao dịch ngân hàng — nếu đã xử lý, bỏ qua ngay
        try {
            await PaymentWebhookEvent.create({
                reference: webhookData.reference,
                orderCode: webhookData.orderCode,
                paymentLinkId: webhookData.paymentLinkId,
                rawPayload: webhookData,
            })
        } catch (error: any) {
            if (error?.code === 11000) {
                return { alreadyProcessed: true }
            }
            throw error
        }

        const session = await mongoose.startSession()
        try {
            let result: any
            await session.withTransaction(async () => {
                const order = await Order.findOne({
                    "payment.orderCode": webhookData.orderCode,
                }).session(session)

                if (!order) {
                    result = { orderNotFound: true }
                    return
                }

                if (order.paymentStatus === EPaymentStatus.paid) {
                    result = { alreadyPaid: true, orderId: order._id }
                    return
                }

                if (order.status === EOrderStatus.cancelled) {
                    // Đơn đã bị hủy (VD hết hạn) nhưng khách vẫn chuyển khoản trễ.
                    // Không tự ý xác nhận — đánh dấu để xử lý thủ công.
                    order.paymentIssue = true
                    await order.save({ session })
                    result = { orderAlreadyCancelled: true, orderId: order._id }
                    return
                }

                // Kiểm tra số tiền khớp — phòng trường hợp dữ liệu bị thao túng
                // hoặc đơn đã bị thay đổi total sau khi tạo payment link.
                if (order.total !== webhookData.amount) {
                    order.paymentIssue = true
                    await order.save({ session })
                    result = { amountMismatch: true, orderId: order._id }
                    return
                }

                order.paymentStatus = EPaymentStatus.paid
                order.status =
                    order.status === EOrderStatus.pending
                        ? EOrderStatus.confirmed
                        : order.status
                order.payment.paidAt = new Date()
                order.payment.reference = webhookData.reference
                order.payment.transactionDateTime = webhookData.transactionDateTime
                await order.save({ session })

                result = { success: true, orderId: order._id }
            })
            return result
        } finally {
            await session.endSession()
        }
    }

    // ---------------------------------------------------------------------
    // Cron: hủy đơn payOS quá hạn chưa thanh toán + hoàn kho
    // ---------------------------------------------------------------------
    static async expireStalePayosOrders() {
        const staleOrders = await Order.find({
            paymentMethod: EPaymentProvider.payos,
            paymentStatus: EPaymentStatus.pending,
            status: { $ne: EOrderStatus.cancelled },
            "payment.expiredAt": { $lt: new Date() },
        })

        for (const order of staleOrders) {
            // Double-check với payOS trước khi hủy — tránh race condition
            // (khách chuyển khoản đúng lúc hết hạn nhưng webhook đến trễ).
            try {
                const info: any = await payos.paymentRequests.get(order.payment.orderCode)
                if (info.status === "PAID") {
                    order.paymentStatus = EPaymentStatus.paid
                    order.status = EOrderStatus.confirmed
                    order.payment.paidAt = new Date()
                    await order.save()
                    continue
                }
                if (info.status === "PENDING") {
                    await payos.paymentRequests.cancel(order.payment.orderCode, "Hết hạn thanh toán")
                }
            } catch {
                // link có thể đã bị hủy/không tồn tại — vẫn tiếp tục hủy đơn nội bộ
            }

            await this.compensateFailedPayosOrder(order, "Hết hạn thanh toán")
        }

        return { cancelled: staleOrders.length }
    }

    // ---------------------------------------------------------------------
    // Các hàm cũ giữ nguyên
    // ---------------------------------------------------------------------
    static async getUserOrders(
        userId: string,
        options?: { page?: number; limit?: number; status?: EOrderStatus },
    ) {
        const page = options?.page || 1
        const limit = options?.limit || 10
        const skip = (page - 1) * limit
        const filter: any = { userId }
        if (options?.status) filter.status = options.status

        const [orders, total] = await Promise.all([
            Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Order.countDocuments(filter),
        ])

        return { orders, page, limit, total, totalPages: Math.ceil(total / limit) }
    }

    static async getOrderDetail(userId: string, orderId: string) {
        const order = await Order.findOne({ _id: orderId, userId }).lean()
        if (!order) throw new Error("Đơn hàng không tồn tại")
        return order
    }

    static async cancelOrder(userId: string, orderId: string, reason: string) {
        const session = await mongoose.startSession()
        try {
            let order: any
            await session.withTransaction(async () => {
                order = await Order.findOne({ _id: orderId, userId }).session(session)
                if (!order) throw new Error("Đơn hàng không tồn tại")

                if (![EOrderStatus.pending, EOrderStatus.confirmed].includes(order.status)) {
                    throw new Error("Không thể hủy đơn hàng này")
                }

                const wasPendingPayment =
                    order.paymentMethod === EPaymentProvider.payos &&
                    order.paymentStatus === EPaymentStatus.pending
                order.status = EOrderStatus.cancelled
                if (wasPendingPayment) {
                    order.paymentStatus = EPaymentStatus.failed
                }
                order.cancelReason = reason
                order.cancelledAt = new Date()
                await order.save({ session })

                for (const item of order.items) {
                    await Product.findByIdAndUpdate(
                        item.productId,
                        { $inc: { stock: item.quantity, soldCount: -item.quantity } },
                        { session },
                    )
                }
            })

            // Hủy link thanh toán payOS best-effort, ngoài transaction DB
            if (
                order.paymentMethod === EPaymentProvider.payos &&
                order.payment?.orderCode
            ) {
                try {
                    await payos.paymentRequests.cancel(order.payment.orderCode, reason)
                } catch {
                    // đã hủy/hết hạn từ trước cũng không sao
                }
            }

            return order
        } finally {
            await session.endSession()
        }
    }

    /**
     * PayOS cancelUrl only means the customer left/cancelled the payment page.
     * It must not cancel the order or restore stock: the order remains active
     * and can be paid again later.
     */
    static async markPayosPaymentCancelled(userId: string, orderId: string) {
        const order = await Order.findOne({ _id: orderId, userId })
        if (!order) throw new Error("Đơn hàng không tồn tại")

        if (order.paymentMethod !== EPaymentProvider.payos) {
            throw new Error("Đơn hàng không sử dụng thanh toán PayOS")
        }

        // A late/repeated cancel redirect must never overwrite a successful payment.
        if (order.paymentStatus !== EPaymentStatus.paid) {
            order.status = EOrderStatus.processing
            order.paymentStatus = EPaymentStatus.pending
            await order.save()
        }

        return order
    }

    static async getProductsCanFeedback(userId: string) {
        const orders = await Order.find({ userId, status: EOrderStatus.delivered }).lean()
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

    static async getAllOrders(options?: {
        page?: number
        limit?: number
        status?: EOrderStatus
        paymentStatus?: EPaymentStatus
        search?: string
    }) {
        const page = options?.page || 1
        const limit = options?.limit || 20
        const skip = (page - 1) * limit
        const filter: any = {}
        if (options?.status) filter.status = options.status
        if (options?.paymentStatus) filter.paymentStatus = options.paymentStatus
        if (options?.search) {
            const keyword = options.search.trim()
            filter.$or = [
                { orderNumber: { $regex: keyword, $options: "i" } },
                { "customerInfo.name": { $regex: keyword, $options: "i" } },
                { "customerInfo.phone": { $regex: keyword, $options: "i" } },
            ]
        }
        const [orders, total] = await Promise.all([
            Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Order.countDocuments(filter),
        ])
        return { orders, page, limit, total, totalPages: Math.ceil(total / limit) }
    }

    static async updateOrderStatus(orderId: string, status: EOrderStatus, cancelReason?: string, actorId?: string) {
        const order = await Order.findById(orderId)
        if (!order) throw new Error("Đơn hàng không tồn tại")
        if (!Object.values(EOrderStatus).includes(status)) throw new Error("Trạng thái không hợp lệ")

        const previousStatus = order.status
        order.status = status
        if (status === EOrderStatus.delivered) order.deliveredAt = new Date()
        if (status === EOrderStatus.cancelled) {
            order.cancelReason = cancelReason || order.cancelReason
            order.cancelledAt = order.cancelledAt || new Date()

            if (previousStatus !== EOrderStatus.cancelled) {
                for (const item of order.items) {
                    await Product.findByIdAndUpdate(item.productId, {
                        $inc: { stock: item.quantity, soldCount: -item.quantity },
                    })
                }
            }
        }

        await order.save()
        if (previousStatus !== status && actorId) {
            await NotificationService.createOrderStatusUpdated(
                actorId,
                String(order.userId),
                String(order._id),
                order.orderNumber,
                status,
            )
        }
        return order
    }
}
