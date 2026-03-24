'use client'

import { FloatingInput } from '@/components/inputs/FloatingInputs'
import SearchBar from '@/components/SearchBar'
import { PAGE_LIMIT } from '@/constants/common'
import { routes } from '@/constants/routes'
import { useUserComments } from '@/hooks/admin/use-user-comments'
import useDebounce from '@/hooks/use-debounce'
import { breadcrumbAtom } from '@/stores/ui'
import { IComment } from '@/types/comment'
import { EContactStatus, IContactForm } from '@/types/contact-form'
import { LoadingOutlined } from '@ant-design/icons'
import { Button, Card, Modal, Table } from 'antd'
import { useSetAtom } from 'jotai'
import { useCallback, useEffect, useMemo, useState } from 'react'

const ReplyUserComment = () => {
	const [searchText, setSearchText] = useState('')
	const [replyText, setReplyText] = useState('')
	const [debounceSearchText, setDebounceSearchText] = useState('')
	const [selectedIComment, setSelectedIComment] =
		useState<IComment | null>(null)
	const setBreadcrumb = useSetAtom(breadcrumbAtom)

	const { data, error, isLoading, isReplying, replyAsync } = useUserComments({
		search: debounceSearchText,
	})

	const columns = useMemo(
		() => [
			{
				title: 'Họ và tên',
				key: 'userId.fullName',
				width: 200,
				render: (_: any, record: IContactForm) => (
					<div className="font-semibold text-gray-900">
						{record.fullName || 'Người dùng ẩn danh'}
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
				render: (_: any, record: IComment) => (
					<button
						onClick={() => setSelectedIComment(record)}
						className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors cursor-pointer"
					>
						Trả lời
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
						spinning: isLoading || isReplying,
					}}
					columns={columns as any}
					dataSource={data?.comments || []}
					pagination={{
						pageSize: PAGE_LIMIT,
						showTotal: (total) => `Tổng: ${total} bình luận`,
						className: '!mt-6 !px-6 !text-black custom-pagination',
					}}
					className="custom-table rounded-lg"
					scroll={{ y: 'calc(100vh - 340px)' }}
				/>
			</Card>

			{/* Detail Modal */}
			<Modal
				open={!!selectedIComment}
				onCancel={() => setSelectedIComment(null)}
				footer={null}
				title="Chi tiết bình luận"
				width={540}
			>
				<div className="flex flex-col gap-4 pt-2">
					<FloatingInput
						label="Nội dung phản hồi"
						placeholder="Nhập nội dung phản hồi..."
						value={replyText || ''}
						onChange={(e) => setReplyText(e.target.value)}
					/>
					<Button
						type="primary"
						onClick={async () => {
							if (!selectedIComment) return
							await replyAsync({
								commentId: selectedIComment._id as string,
								content: replyText,
							})
							setReplyText('')
							setSelectedIComment(null)
						}}
					>
						Gửi
					</Button>
				</div>
			</Modal>
		</div>
	)
}

export default ReplyUserComment
