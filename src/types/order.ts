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

export interface IOrderItem {
    productId: string
    productName: string
    productSlug: string
    productImage?: string
    quantity: number
    price: number
    subtotal: number
    hasFeedback?: boolean // đã feedback chưa
}

export interface IOrder {
    _id?: string
    orderNumber: string // Mã đơn hàng tự động
    userId: string
    items: IOrderItem[]

    // Thông tin khách hàng
    customerInfo: {
        name: string
        phone: string
        email?: string
    }

    // Địa chỉ giao hàng
    shippingAddress: {
        province: string
        ward: string
        address: string
    }

    // Giá tiền
    subtotal: number
    shippingFee: number
    discount: number
    total: number

    // Trạng thái
    status: EOrderStatus
    paymentStatus: EPaymentStatus
    paymentMethod: string // COD, Banking, ...

    // Ghi chú
    note?: string
    cancelReason?: string

    // Tracking
    deliveredAt?: Date
    cancelledAt?: Date

    createdAt?: Date
    updatedAt?: Date
}
