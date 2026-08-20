import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import C2COrder from "@/models/c2c-order"
import C2CProduct from "@/models/c2c-product"
import payos from "@/lib/payos"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        
        // Verify webhook data
        const webhookData = payos.verifyPaymentWebhookData(body)

        if (webhookData.code === "00") {
            // Payment success
            const orderCode = webhookData.orderCode
            
            await connectDB()
            
            const order = await C2COrder.findOne({ payosOrderCode: orderCode })
            if (order && order.status === "pending_payment") {
                order.status = "paid"
                order.paidAt = new Date()
                await order.save()
                
                // Update product status to sold so others can't buy it
                await C2CProduct.findByIdAndUpdate(order.productId, {
                    status: "sold"
                })
            }
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("PayOS Webhook Error:", error)
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        )
    }
}
