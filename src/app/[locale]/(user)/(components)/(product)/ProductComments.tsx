'use client'

import DefaultImage from '@/components/DefaultImage'
import { COMPANY_NAME, USER_ROLE } from '@/constants/common'
import { showMessage } from '@/hooks/use-message'
import { useComments } from '@/hooks/user/use-comments'
import { IComment } from '@/types/comment'
import { IUser } from '@/types/user'
import { SendOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Flex, Input } from 'antd'
import { useEffect, useState } from 'react'

function ReplyItem({ reply }: { reply: IComment }) {
	const user = reply.userId ? (reply.userId as IUser) : null
	const isUnknownUser = !user || !user.fullName
	const isAdminReply = user?.role === USER_ROLE.ADMIN
	return (
		<div className="flex gap-3 mt-5">
			{isAdminReply ? (
				<DefaultImage
					className="!w-10 !h-9 border-none"
					src="/images/logo-only.png"
				/>
			) : (
				<Avatar
					src={user?.avatar}
					icon={<UserOutlined />}
					size={34}
				/>
			)}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 flex-wrap">
					<span className="text-sm font-semibold text-gray-800 leading-tight">
						{isAdminReply
							? COMPANY_NAME
							: isUnknownUser
								? 'Người dùng ẩn danh'
								: user.fullName}
					</span>
					{user?.role === USER_ROLE.ADMIN && (
						<span className="text-[10px] font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5 leading-none">
							Shop
						</span>
					)}
				</div>
				<p className="text-sm text-gray-600 mt-1 leading-relaxed">
					{reply.content}
				</p>
				<div className="flex items-center gap-3 mt-1.5">
					<span className="text-xs text-gray-400">
						{new Date(reply.createdAt || '').toLocaleString(
							'vi-VN',
							{
								day: '2-digit',
								month: '2-digit',
								year: 'numeric',
								hour: '2-digit',
								minute: '2-digit',
							},
						)}
					</span>
					{/* <button className="text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors">
						Trả lời
					</button> */}
				</div>
			</div>
		</div>
	)
}

function CommentItem({ comment }: { comment: IComment }) {
	const [showReplyBox, setShowReplyBox] = useState(false)
	const [replyText, setReplyText] = useState('')

	const user = comment.userId ? (comment.userId as IUser) : null

	return (
		<div className="py-3 border-b border-gray-100 last:border-0">
			{/* Main comment */}
			<div className="flex gap-3">
				<Avatar
					src={user?.avatar}
					icon={<UserOutlined />}
					size={34}
				/>
				<div className="flex-1 min-w-0">
					<div className="flex items-baseline gap-2 flex-wrap">
						<span className="text-sm font-semibold text-gray-800">
							{user?.fullName || 'Người dùng ẩn danh'}
						</span>
						<span className="text-sm text-gray-700 leading-relaxed">
							{comment.content}
						</span>
					</div>
					<div className="flex items-center gap-3 mt-1.5">
						<span className="text-xs text-gray-400">
							{new Date(comment.createdAt || '').toLocaleString(
								'vi-VN',
								{
									day: '2-digit',
									month: '2-digit',
									year: 'numeric',
									hour: '2-digit',
									minute: '2-digit',
								},
							)}
						</span>
						{/* <button
							onClick={() => setShowReplyBox((v) => !v)}
							className="text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors"
						>
							Trả lời
						</button> */}
					</div>

					{/* Replies */}
					{comment?.replies && comment.replies?.length > 0 && (
						<div className="mt-2 pl-3 border-l-2 border-gray-200 space-y-1">
							{comment?.replies.map((reply) => (
								<ReplyItem
									key={reply._id}
									reply={reply}
								/>
							))}
						</div>
					)}

					{/* Reply input */}
					{showReplyBox && (
						<div className="mt-3 flex gap-2 items-center">
							<input
								autoFocus
								value={replyText}
								onChange={(e) => setReplyText(e.target.value)}
								placeholder="Nhập phản hồi..."
								className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-full px-4 py-2 outline-none focus:border-blue-400 focus:bg-white transition-all placeholder-gray-400"
							/>
							<button
								disabled={!replyText.trim()}
								className="text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-full px-4 py-2 transition-colors"
							>
								Gửi
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

function Content({
	productId,
	comments,
}: {
	productId: string
	comments: IComment[]
}) {
	const [newComment, setNewComment] = useState('')
	const { sendCommentAsync, isSendingComment, data } = useComments({
		productId,
	})
	const [allComments, setAllComments] = useState<IComment[]>(comments || [])
	const totalComments = allComments.reduce(
		(total, comment) => total + 1 + (comment.replies?.length || 0),
		0,
	)

	async function handleSendComment() {
		if (!newComment.trim()) return
		sendCommentAsync({ content: newComment, productId })
			.then(() => {
				setNewComment('')
				showMessage.success('Bình luận của bạn đã được gửi!')
			})
			.catch((error) => {
				showMessage.error(
					'Có lỗi xảy ra khi gửi bình luận. Vui lòng thử lại.',
				)
			})
	}

	useEffect(() => {
		setAllComments(comments)
	}, [comments])

	useEffect(() => {
		if (data?.comments) {
			setAllComments(data.comments)
		}
	}, [data?.comments])

	return (
		<div className="bg-white max-w-full">
			<Flex
				vertical
				gap={10}
				className="w-full"
			>
				<h3 className="text-base font-semibold">
					Phản hồi{' '}
					<span className="text-gray-400 font-normal">
						({totalComments})
					</span>
				</h3>

				{allComments && allComments?.length > 0 && (
					<div className="divide-y divide-gray-100">
						{allComments.map((comment) => (
							<CommentItem
								key={comment._id}
								comment={comment}
							/>
						))}
					</div>
				)}

				{/* New comment input */}
				<div className="flex flex-col gap-3 items-end">
					<Input.TextArea
						autoFocus
						value={newComment}
						onChange={(e) => setNewComment(e.target.value)}
						placeholder="Nhập nội dung"
						rootClassName="!py-3 !px-4"
					/>
					{newComment.trim() && (
						<Button
							type="primary"
							icon={<SendOutlined />}
							onClick={handleSendComment}
							loading={isSendingComment}
						>
							Bình luận
						</Button>
					)}
				</div>
			</Flex>
		</div>
	)
}

export default function ProductComments({
	productId,
	comments,
}: {
	productId: string
	comments: IComment[]
}) {
	return (
		<Content
			productId={productId}
			comments={comments}
		/>
	)
}
