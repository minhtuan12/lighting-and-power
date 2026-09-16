export enum EOrderStatus {
    pending = "pending",
    confirmed = "confirmed",
    processing = "processing",
    shipping = "shipping",
    delivered = "delivered",
    cancelled = "cancelled",
    refunded = "refunded",
}

export enum EPaymentStatus {
    pending = "pending",
    paid = "paid",
    failed = "failed",
    refunded = "refunded",
}

// MỚI
export enum EPaymentProvider {
    cod = "cod",
    payos = "payos",
}

export interface IOrderPayment {
    provider: EPaymentProvider
    orderCode?: number          // mã số nguyên gửi cho payOS (khác orderNumber dạng string)
    paymentLinkId?: string
    checkoutUrl?: string
    qrCode?: string
    expiredAt?: Date            // hết hạn link thanh toán -> job cron sẽ hủy đơn
    paidAt?: Date
    reference?: string          // mã giao dịch ngân hàng, dùng để dedup webhook
    transactionDateTime?: string
    cancelledAt?: Date
    cancelReason?: string
}

export interface IOrderItem {
    productId: string
    productName: string
    productSlug: string
    productImage?: string
    quantity: number
    price: number
    subtotal: number
    hasFeedback?: boolean
}

export interface IOrder {
    _id?: string
    orderNumber: string
    userId: string
    items: IOrderItem[]

    customerInfo: {
        name: string
        phone: string
        email?: string
    }

    shippingAddress: {
        province: string
        ward: string
        address: string
    }

    subtotal: number
    shippingFee: number
    discount: number
    total: number

    status: EOrderStatus
    paymentStatus: EPaymentStatus
    paymentMethod: EPaymentProvider // "cod" | "payos"
    payment?: IOrderPayment

    clientRequestId?: string    // idempotency key khi tạo đơn
    paymentIssue?: boolean      // cờ cảnh báo khi số tiền webhook không khớp

    note?: string
    cancelReason?: string

    deliveredAt?: Date
    cancelledAt?: Date

    createdAt?: Date
    updatedAt?: Date
}
