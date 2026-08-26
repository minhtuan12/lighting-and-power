'use client'

import { Button, Input, Radio, message } from 'antd'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DatHangPage() {
	const params = useSearchParams()
	const router = useRouter()
	const [items, setItems] = useState<any[]>([])
	const [form, setForm] = useState({
		recipientName: '',
		phone: '',
		address: '',
		note: '',
		paymentMethod: 'vietqr',
	})
	const ids = params.get('ids')?.split(',').filter(Boolean) || []
	useEffect(() => {
		fetch('/api/c2c/interests')
			.then((r) => r.json())
			.then((d) =>
				setItems(
					(d.data || []).filter((x: any) => ids.includes(x._id)),
				),
			)
	}, [params])
	const total = items.reduce((s, x) => s + (x.productId?.price || 0), 0)
	const submit = async () => {
		const r = await fetch('/api/c2c/orders', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ...form, interestIds: ids }),
		})
		const d = await r.json()
		d.success
			? (message.success('Đặt hàng thành công'), router.push('/quan-ly'))
			: message.error(d.message)
	}
	return (
		<div className="mx-auto max-w-xl space-y-3">
			<h1 className="text-2xl font-semibold">Tạo đơn hàng</h1>
			<div className="rounded-xl border bg-white p-4">
				{items.map((x) => (
					<div
						key={x._id}
						className="flex justify-between border-b py-3"
					>
						<span>{x.productId?.title}</span>
						<b className="text-[#b02b2b]">
							{x.productId?.price?.toLocaleString('vi-VN')} đ
						</b>
					</div>
				))}
			</div>
			<div className="space-y-3 rounded-xl border bg-white p-4">
				<b>Thông tin giao hàng</b>
				<Input
					placeholder="Người nhận"
					value={form.recipientName}
					onChange={(e) =>
						setForm({ ...form, recipientName: e.target.value })
					}
				/>
				<Input
					placeholder="Số điện thoại"
					value={form.phone}
					onChange={(e) =>
						setForm({ ...form, phone: e.target.value })
					}
				/>
				<Input
					placeholder="Số nhà, đường, phường, quận"
					value={form.address}
					onChange={(e) =>
						setForm({ ...form, address: e.target.value })
					}
				/>
				<Input.TextArea
					placeholder="Ghi chú cho người bán"
					value={form.note}
					onChange={(e) => setForm({ ...form, note: e.target.value })}
				/>
				<Radio.Group
					value={form.paymentMethod}
					onChange={(e) =>
						setForm({ ...form, paymentMethod: e.target.value })
					}
				>
					<Radio value="vietqr">Thanh toán qua VietQR</Radio>
					<Radio value="cod">Thanh toán khi nhận hàng (COD)</Radio>
				</Radio.Group>
				<div className="flex justify-between border-t pt-3">
					<b>Tổng cộng</b>
					<b className="text-[#b02b2b]">
						{total.toLocaleString('vi-VN')} đ
					</b>
				</div>
				<Button
					type="primary"
					block
					onClick={submit}
					className="!rounded-full !bg-[#2878d7]"
				>
					Đặt hàng
				</Button>
			</div>
		</div>
	)
}
