import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import connectDB from "@/lib/db"
import C2CProduct from "@/models/c2c-product"
import C2COrder from "@/models/c2c-order"
import payos from "@/lib/payos"

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req)
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const body = await req.json()
        const { productId, shippingPhone, shippingAddress, shippingNote } = body

        if (!productId) {
            return NextResponse.json({ error: "Missing productId" }, { status: 400 })
        }

        const product = await C2CProduct.findById(productId)
        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 })
        }

        if (product.status !== "active") {
            return NextResponse.json(
                { error: "Product is not available for purchase" },
                { status: 400 }
            )
        }

        if (product.sellerId.toString() === user.id) {
            return NextResponse.json(
                { error: "Cannot buy your own product" },
                { status: 400 }
            )
        }

        // Generate unique integer code for PayOS
        const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000))

        const newOrder = await C2COrder.create({
            buyerId: user.id,
            sellerId: product.sellerId,
            productId: product._id,
            amount: product.price,
            payosOrderCode: orderCode,
            status: "pending_payment",
            shippingPhone,
            shippingAddress,
            shippingNote
        })

        const YOUR_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || "http://c2c.localhost:4000"

        const bodyPayos = {
            orderCode: orderCode,
            amount: product.price,
            description: `TT don hang ${orderCode}`,
            items: [
                {
                    name: product.title.slice(0, 50),
                    quantity: 1,
                    price: product.price,
                },
            ],
            returnUrl: `${YOUR_DOMAIN}/c2c-app/dat-hang/thanh-cong?orderCode=${orderCode}`,
            cancelUrl: `${YOUR_DOMAIN}/c2c-app/dat-hang/that-bai?orderCode=${orderCode}`,
        }

        const paymentLinkResponse = await payos.createPaymentLink(bodyPayos)

        return NextResponse.json({
            message: "Order created successfully",
            orderId: newOrder._id,
            checkoutUrl: paymentLinkResponse.checkoutUrl,
        })
    } catch (error: any) {
        console.error("C2C Create Order Error:", error)
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        )
    }
}
