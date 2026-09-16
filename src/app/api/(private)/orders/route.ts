import { withMiddleware } from "@/lib/api-handler"
import { getRequestUser } from "@/lib/context"
import { verifyToken } from "@/lib/middleware"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { EPaymentProvider } from "@/types/order"
import { NextRequest, NextResponse } from "next/server"
import { OrderService } from "../../(services)/order.service"

async function createOrder(request: NextRequest) {
    try {
        const user = getRequestUser(request)
        if (!user?.userId) {
            return NextResponse.json({ success: false, message: "User ID not found" }, { status: 401 })
        }

        const body = await request.json()
        const {
            customerInfo,
            shippingAddress,
            paymentMethod,
            note,
            selectedProductIds,
            clientRequestId,
        } = body

        if (!clientRequestId) {
            return NextResponse.json(
                { success: false, message: "Thiếu clientRequestId" },
                { status: 400 },
            )
        }

        const normalizedCustomerInfo = {
            name: String(customerInfo?.name ?? "").trim(),
            phone: String(customerInfo?.phone ?? "").trim(),
            email: customerInfo?.email ? String(customerInfo.email).trim() : undefined,
        }

        const normalizedShippingAddress = {
            province: String(shippingAddress?.province ?? "").trim(),
            ward: String(shippingAddress?.ward ?? "").trim(),
            address: String(shippingAddress?.address ?? "").trim(),
        }

        if (!normalizedCustomerInfo.name || !normalizedCustomerInfo.phone) {
            return NextResponse.json({ success: false, message: "Customer info is required" }, { status: 400 })
        }

        if (
            !normalizedShippingAddress.province ||
            !normalizedShippingAddress.ward ||
            !normalizedShippingAddress.address
        ) {
            return NextResponse.json({ success: false, message: "Shipping address is required" }, { status: 400 })
        }

        if (!Object.values(EPaymentProvider).includes(paymentMethod)) {
            return NextResponse.json({ success: false, message: "Payment method is required" }, { status: 400 })
        }

        if (
            selectedProductIds &&
            (!Array.isArray(selectedProductIds) || selectedProductIds.length === 0)
        ) {
            return NextResponse.json({ success: false, message: "Selected items are required" }, { status: 400 })
        }

        const order = await OrderService.createOrder(user.userId, {
            customerInfo: normalizedCustomerInfo,
            shippingAddress: normalizedShippingAddress,
            paymentMethod,
            note,
            selectedProductIds,
            clientRequestId: String(clientRequestId),
        })

        if (paymentMethod === EPaymentProvider.payos && !order.payment.checkoutUrl) {
            throw new Error('Đã có lỗi xảy ra trong quá trình thanh toán');
        }
        return NextResponse.json({
            success: true,
            message: "Order created successfully",
            data: order,
        })
    } catch (error: any) {
        console.error("Create order error:", error)

        if (
            error.message?.includes("hết hàng") ||
            error.message?.includes("trống") ||
            error.message?.includes("thanh toán")
        ) {
            return NextResponse.json({ success: false, message: error.message }, { status: 400 })
        }

        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 },
        )
    }
}

async function getOrders(request: NextRequest) {
    try {
        const user = getRequestUser(request)
        if (!user?.userId) {
            return NextResponse.json({ success: false, message: "User ID not found" }, { status: 401 })
        }
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "10")
        const status = searchParams.get("status") as any
        const result = await OrderService.getUserOrders(user.userId, { page, limit, status })
        return NextResponse.json({ success: true, data: result })
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 },
        )
    }
}

export const POST = withMiddleware(createOrder, connectDbMiddleware, verifyToken)
export const GET = withMiddleware(getOrders, connectDbMiddleware, verifyToken)
