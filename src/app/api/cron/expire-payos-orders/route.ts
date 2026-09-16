import { OrderService } from "@/app/api/(services)/order.service"
import connectDb from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
	// Bảo vệ endpoint cron bằng secret header, tránh ai cũng gọi được
	const auth = request.headers.get("authorization")
	if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
		return NextResponse.json({ success: false }, { status: 401 })
	}

	await connectDb()
	const result = await OrderService.expireStalePayosOrders()
	return NextResponse.json({ success: true, ...result })
}
