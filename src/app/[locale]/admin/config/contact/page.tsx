'use client'

import SearchBar from '@/components/SearchBar'
import { PAGE_LIMIT } from '@/constants/common'
import { routes } from '@/constants/routes'
import { useContactInquiries } from '@/hooks/admin/use-contact-inquiries'
import useDebounce from '@/hooks/use-debounce'
import { breadcrumbAtom } from '@/stores/ui'
import { EContactStatus, IContactForm } from '@/types/contact-form'
import { LoadingOutlined } from '@ant-design/icons'
import { Card, Modal, Select, Table, Tag } from 'antd'
import { useSetAtom } from 'jotai'
import { useCallback, useEffect, useMemo, useState } from 'react'

const STATUS_MAP = {
	pending: { label: 'Chưa xử lý', color: 'red' },
	inProgress: { label: 'Đang xử lý', color: 'blue' },
	resolved: { label: 'Đã phản hồi', color: 'green' },
}

const ContactIContactForm = () => {
	const [searchText, setSearchText] = useState('')
	const [debounceSearchText, setDebounceSearchText] = useState('')
	const [selectedIContactForm, setSelectedIContactForm] =
		useState<IContactForm | null>(null)
	const setBreadcrumb = useSetAtom(breadcrumbAtom)

	const { data, error, isLoading, updateStatusAsync, isUpdating } = useContactInquiries({
		search: debounceSearchText,
	})

	const handleChangeStatus = async (id: string, value: any) => {
		await updateStatusAsync({
			id,
			status: value,
		})
	}

	const columns = useMemo(
		() => [
			{
				title: 'Họ và tên',
				key: 'fullName',
				width: 200,
				render: (_: any, record: IContactForm) => (
					<div className="font-semibold text-gray-900">
						{record.fullName}
					</div>
				),
			},
			{
				title: 'Email/Số điện thoại',
				dataIndex: 'emailOrPhone',
				key: 'emailOrPhone',
				width: 220,
				align: 'center' as const,
				render: (text: string) => (
					<div className="text-gray-700">{text || '-'}</div>
				),
			},
			{
				title: 'Chủ đề',
				dataIndex: 'subject',
				key: 'subject',
				render: (text: string) => (
					<div
						className="text-gray-600 truncate max-w-xs"
						title={text}
					>
						{text}
					</div>
				),
			},
			{
				title: 'Nội dung',
				dataIndex: 'content',
				key: 'content',
				render: (text: string) => (
					<div
						className="text-gray-600 truncate max-w-xs"
						title={text}
					>
						{text}
					</div>
				),
			},
			{
				title: 'Trạng thái',
				dataIndex: 'status',
				key: 'status',
				width: 140,
				align: 'center' as const,
				render: (status: IContactForm['status'], rec: any) => {
					return (
						<Select
							value={status}
							onChange={value => handleChangeStatus(rec._id, value)}
							options={Object.entries(STATUS_MAP).map(
								([key, value]) => ({
									label: value.label,
									value: key,
								}),
							)}
						/>
					)
				},
			},
			{
				title: 'Ngày gửi',
				dataIndex: 'createdAt',
				key: 'createdAt',
				width: 160,
				align: 'center' as const,
				render: (date: string) => (
					<div className="text-gray-500 text-sm">
						{new Date(date).toLocaleString('vi-VN')}
					</div>
				),
			},
			{
				title: 'Thao tác',
				key: 'action',
				width: 100,
				align: 'center' as const,
				render: (_: any, record: IContactForm) => (
					<button
						onClick={() => setSelectedIContactForm(record)}
						className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors cursor-pointer"
					>
						Chi tiết
					</button>
				),
			},
		],
		[],
	)

	const debounceSearch = useDebounce((value: string) => {
		setDebounceSearchText(value)
	}, 300)

	const handleSearch = useCallback(
		(value: string) => {
			setSearchText(value)
			debounceSearch(value)
		},
		[debounceSearch],
	)

	useEffect(() => {
		setBreadcrumb([
			{
				key: routes.lienHe.url,
				title: routes.lienHe.title,
			},
		])
	}, [setBreadcrumb])

	const unreadCount =
		data?.inquiries?.filter(
			(i: IContactForm) => i.status === EContactStatus.pending,
		).length ?? 0

	return (
		<div className="p-6 bg-gray-50">
			<Card
				variant="borderless"
				className="rounded-xl shadow-sm [&>.ant-card-body]:!pb-2"
			>
				{/* Header */}
				<div className="mb-6">
					<div className="flex justify-between items-center w-full">
						<div className="flex items-center gap-3">
							<SearchBar
								className="!w-80"
								value={searchText}
								onChange={(e) => handleSearch(e.target.value)}
								placeholder="Tìm theo tên, email hoặc số điện thoại"
							/>
						</div>
					</div>
				</div>

				{/* Table */}
				<Table
					rowKey="_id"
					loading={{
						indicator: <LoadingOutlined />,
						spinning: isLoading || isUpdating,
					}}
					columns={columns}
					dataSource={data?.inquiries || []}
					rowClassName={(record: IContactForm) =>
						record.status === EContactStatus.pending
							? 'bg-blue-50 font-medium'
							: ''
					}
					pagination={{
						pageSize: PAGE_LIMIT,
						showTotal: (total) => `Tổng: ${total} câu hỏi`,
						className: '!mt-6 !px-6 !text-black custom-pagination',
					}}
					className="custom-table rounded-lg"
					scroll={{ y: 'calc(100vh - 340px)' }}
				/>
			</Card>

			{/* Detail Modal */}
			<Modal
				open={!!selectedIContactForm}
				onCancel={() => setSelectedIContactForm(null)}
				footer={null}
				title="Chi tiết câu hỏi liên hệ"
				width={540}
			>
				{selectedIContactForm && (
					<div className="flex flex-col gap-4 pt-2">
						<div className="flex gap-6">
							<div className="flex-1">
								<div className="text-xs text-gray-400 mb-1">
									Họ và tên
								</div>
								<div className="font-semibold text-gray-900">
									{selectedIContactForm.fullName}
								</div>
							</div>
							<div className="flex-1">
								<div className="text-xs text-gray-400 mb-1">
									Trạng thái
								</div>
								<Tag
									color={
										STATUS_MAP[
											selectedIContactForm.status as keyof typeof STATUS_MAP
										].color
									}
								>
									{
										STATUS_MAP[
											selectedIContactForm.status as keyof typeof STATUS_MAP
										].label
									}
								</Tag>
							</div>
						</div>

						<div>
							<div className="text-xs text-gray-400 mb-1">
								Email/Số điện thoại
							</div>
							<div className="text-gray-800">
								{selectedIContactForm.emailOrPhone}
							</div>
						</div>

						<div>
							<div className="text-xs text-gray-400 mb-1">
								Chủ đề
							</div>
							<div className="bg-gray-50 rounded-lg p-3 text-gray-800 text-sm leading-relaxed border border-gray-100">
								{selectedIContactForm.subject}
							</div>
						</div>

						<div>
							<div className="text-xs text-gray-400 mb-1">
								Nội dung
							</div>
							<div className="bg-gray-50 rounded-lg p-3 text-gray-800 text-sm leading-relaxed border border-gray-100">
								{selectedIContactForm.content}
							</div>
						</div>

						<div>
							<div className="text-xs text-gray-400 mb-1">
								Ngày gửi
							</div>
							<div className="text-gray-600 text-sm">
								{new Date(
									selectedIContactForm.createdAt,
								).toLocaleString('vi-VN')}
							</div>
						</div>
					</div>
				)}
			</Modal>
		</div>
	)
}

export default ContactIContactForm
