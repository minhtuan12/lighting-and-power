import { OrderService } from "@/app/api/(services)/order.service"
import connectDb from "@/lib/db"
import { payos } from "@/lib/payos"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
	await connectDb()

	let body: any
	try {
		body = await request.json()
	} catch {
		return NextResponse.json({ success: false }, { status: 400 })
	}

	// 1) Xác thực chữ ký — bắt buộc, không tin bất kỳ payload nào chưa verify
	let verifiedData: any
	try {
		verifiedData = payos.webhooks.verify(body)
	} catch (error) {
		console.error("Webhook payOS: chữ ký không hợp lệ", error)
		return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 400 })
	}

	try {
		const result = await OrderService.handlePayosWebhook({
			orderCode: verifiedData.orderCode,
			amount: verifiedData.amount,
			reference: verifiedData.reference,
			transactionDateTime: verifiedData.transactionDateTime,
			paymentLinkId: verifiedData.paymentLinkId,
			desc: verifiedData.desc,
			code: verifiedData.code,
		})

		if (result?.amountMismatch) {
			console.error("Webhook payOS: số tiền không khớp", verifiedData)
		}
		if (result?.orderAlreadyCancelled) {
			console.warn("Webhook payOS: nhận thanh toán cho đơn đã hủy", verifiedData)
		}

		// Luôn trả 2xx khi đã verify chữ ký thành công để payOS không retry vô ích,
		// trừ trường hợp lỗi hệ thống thật sự (throw ở trên) -> muốn payOS gửi lại.
		return NextResponse.json({ success: true })
	} catch (error: any) {
		console.error("Webhook payOS: lỗi xử lý", error)
		// Trả lỗi 500 để payOS thử gửi lại webhook sau
		return NextResponse.json({ success: false, message: error.message }, { status: 500 })
	}
}
