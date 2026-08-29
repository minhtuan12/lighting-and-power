'use client'

import { Button, Empty, Select, Tag, message } from 'antd'
import { useEffect, useState } from 'react'

export default function NguoiDangKyPage({ products }: { products: any[] }) {
	const [selectedProductId, setSelectedProductId] = useState(products[0]?._id || '')
	const [rows, setRows] = useState<any[]>([])
	const productId = selectedProductId
	const load = () =>
		fetch(`/api/c2c/interests/${productId}`)
			.then((r) => r.json())
			.then((d) => d.success && setRows(d.data))
	useEffect(() => {
		load()
	}, [productId])
	const confirm = async (id: string) => {
		const r = await fetch(`/api/c2c/interests/${id}`, { method: 'POST' })
		const d = await r.json()
		d.success
			? (message.success('Đã xác nhận người mua'), load())
			: message.error(d.message)
	}
	return (
		<>
			<Select
				value={selectedProductId || undefined}
				placeholder="Chọn sản phẩm"
				className="mb-3 w-[380px] max-md:w-full h-[38px] !border-[var(--brand-btn-bg)]"
				onChange={setSelectedProductId}
				options={products.map((product) => ({ label: product.title, value: product._id }))}
			/>
			<div className="mt-4 rounded-xl border bg-white p-4">
				{!rows.length ? (
					<Empty
						image={Empty.PRESENTED_IMAGE_SIMPLE}
						description="Chưa có người đăng ký"
					/>
				) : (
					rows.map((r) => (
						<div
							key={r._id}
							className="flex items-center justify-between py-3"
						>
							<div>
								<b>{r.buyerId?.fullName || r.buyerId?.username}</b>
								<div className="text-sm text-gray-400">
									Đăng ký lúc{' '}
									{new Date(r.createdAt).toLocaleString('vi-VN')}
								</div>
							</div>
							{r.status === 'confirmed' ? (
								<Tag className='!text-[14px] !px-3 !py-2 !rounded-full' color="green">Đã xác nhận</Tag>
							) : r.status === 'rejected' ? (
								<Tag className='!text-[14px] !px-3 !py-2 !rounded-full'>Không được chọn</Tag>
							) : (
								<Button
									type="primary"
									onClick={() => confirm(r._id)}
									className="!rounded-full"
								>
									Xác nhận
								</Button>
							)}
						</div>
					))
				)}
			</div>
		</>
	)
}
