import { PayOS } from "@payos/node";

if (
	!process.env.PAYOS_CLIENT_ID ||
	!process.env.PAYOS_API_KEY ||
	!process.env.PAYOS_CHECKSUM_KEY
) {
	console.warn("[payos] Thiếu biến môi trường PAYOS_CLIENT_ID/PAYOS_API_KEY/PAYOS_CHECKSUM_KEY")
}

export const payos = new PayOS({
	clientId: process.env.PAYOS_CLIENT_ID!,
	apiKey: process.env.PAYOS_API_KEY!,
	checksumKey: process.env.PAYOS_CHECKSUM_KEY!,
})

// Đồng bộ với CHECKOUT_FLOW_TTL_MS bạn đã có (15 phút)
export const PAYOS_PAYMENT_LINK_TTL_MS = 15 * 60 * 1000

export function buildPayosUrls(orderId: string) {
	const base = process.env.NEXT_PUBLIC_APP_URL
	// Dùng dialog nhúng nên returnUrl/cancelUrl trỏ lại đúng trang checkout
	// (RETURN_URL ở FE PHẢI trùng path này).
	return {
		returnUrl: `${base}/dat-hang/thanh-cong?orderId=${orderId}`,
		cancelUrl: `${base}/dat-hang?orderId=${orderId}`,
	}
}
