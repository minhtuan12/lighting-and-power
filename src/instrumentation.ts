export async function register() {
	// Chỉ chạy trên Node.js runtime (không chạy ở edge runtime),
	// và không chạy khi `next build` (chỉ chạy khi server thực sự start).
	if (process.env.NEXT_RUNTIME !== "nodejs") return

	const cron = await import("node-cron")
	const connectDb = (await import("@/lib/db")).default
	const { OrderService } = await import("@/app/api/(services)/order.service")
	const { acquireCronLock } = await import("@/models/cron-lock")

	// Chạy mỗi 5 phút
	cron.schedule("*/5 * * * *", async () => {
		try {
			await connectDb()

			const gotLock = await acquireCronLock("expire-payos-orders", 4 * 60 * 1000)
			if (!gotLock) return // process khác đang chạy job này

			const result = await OrderService.expireStalePayosOrders()
			if (result.cancelled > 0) {
				console.log(`[cron] Đã hủy ${result.cancelled} đơn payOS quá hạn`)
			}
		} catch (error) {
			console.error("[cron] expire-payos-orders lỗi:", error)
		}
	})

	console.log("[instrumentation] Đã đăng ký cron job: expire-payos-orders (mỗi 5 phút)")
}
