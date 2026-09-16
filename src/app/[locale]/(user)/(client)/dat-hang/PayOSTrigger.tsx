'use client'

import { usePayOS } from "@payos/payos-checkout"
import { useEffect } from "react"

export default function PayOSPopupTrigger({
	order,
	onSuccess,
	onCancel,
	onExit,
}: {
	order: any
	onSuccess: () => void
	onCancel: () => void
	onExit: () => void
}) {
	const { open } = usePayOS({
		RETURN_URL: `${process.env.NEXT_PUBLIC_APP_URL!}/dat-hang/thanh-cong?orderId=${order._id}`,
		ELEMENT_ID: "payos-embedded-container",
		CHECKOUT_URL: order.payment.checkoutUrl,
		embedded: false, // popup
		onSuccess,
		onCancel,
		onExit,
	})

	// Vì component này chỉ mount khi checkoutUrl đã sẵn sàng,
	// config ở đây luôn đúng ngay từ đầu -> gọi open() an toàn
	useEffect(() => {
		window.location.assign(order.payment.checkoutUrl)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return null
}
