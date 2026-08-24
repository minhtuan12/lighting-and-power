'use client'

import { dateLabel, dayKey, timeLabel, useChat } from '@/hooks/use-chat'
import { UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Input, Skeleton } from 'antd'
import {
	ArrowLeft,
	Download,
	FileText,
	Paperclip,
	Plus,
	Send,
	Trash2,
	Users,
	X,
} from 'lucide-react'
import Link from 'next/link'
import { Fragment } from 'react'
import { Icon } from '../Icon'

function ConversationAvatar({
	conversation,
	online,
}: {
	conversation: any
	online: boolean
}) {
	if (conversation.isGroup) {
		return (
			<div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#218daf] text-white">
				<Users size={18} />
			</div>
		)
	}
	return (
		<div className="relative flex-none">
			<Avatar
				src={conversation.other?.avatar}
				icon={<UserOutlined />}
				size={40}
			/>
			{online && (
				<span className="absolute bottom-0 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#31a24c]" />
			)}
		</div>
	)
}

export default function MessengerPageView() {
	const m = useChat({ autoOpen: true })
	if (!m.user) return null

	return (
		<div className="overflow-hidden">
			{/* Thanh thương hiệu — Mẫu 2 */}
			<div className="relative flex items-center justify-center bg-[#092638] px-4 py-4">
				<Link
					href="http://lighting-and-power.com"
					aria-label="Về trang chủ"
					className="absolute left-4 flex items-center gap-1.5 text-sm text-white/80 hover:text-white"
				>
					<ArrowLeft size={18} />
					<span className="hidden sm:inline">Trang chủ</span>
				</Link>
				<Icon
					src="/images/logo.png"
					alt="Lighting & Power"
					size={450}
				/>
			</div>

			<section className="grid min-h-[calc(100vh-51px)] w-full grid-cols-[280px_minmax(0,1fr)] overflow-hidden border border-[#d9e2e8] bg-white">
				{/* Left: conversation list */}
				<div className="flex min-h-0 flex-col border-r border-[#e2e7eb] bg-[#f8fafb] user-none">
					<div className="flex items-center justify-between px-4 py-4">
						<strong className="text-[#082c40]">Tin nhắn</strong>
						<button
							aria-label="Tạo hội thoại mới"
							onClick={() => m.setGroupMode((v) => !v)}
							className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#f4511e] text-white"
						>
							{m.groupMode ? <X size={15} /> : <Plus size={15} />}
						</button>
					</div>

					{m.groupMode && (
						<div className="m-3 rounded-xl border border-[#e4e8ec] p-3">
							<div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#082c40]">
								<Users size={16} /> Tạo nhóm
							</div>
							<Input
								placeholder="Tên nhóm"
								value={m.groupName}
								onChange={(e) => m.setGroupName(e.target.value)}
							/>
							<div className="my-2 max-h-28 overflow-y-auto">
								{m.friends.map((friend) => (
									<label
										key={friend._id}
										className="flex items-center gap-2 py-1 text-sm"
									>
										<input
											type="checkbox"
											checked={m.groupMemberIds.includes(
												friend._id,
											)}
											onChange={() =>
												m.setGroupMemberIds((ids) =>
													ids.includes(friend._id)
														? ids.filter(
															(id) =>
																id !==
																friend._id,
														)
														: [...ids, friend._id],
												)
											}
										/>
										{friend.fullName}
									</label>
								))}
							</div>
							<Button
								disabled={
									!m.groupName || m.groupMemberIds?.length < 2
								}
								onClick={m.createGroup}
								className="w-full cursor-pointer rounded-lg bg-[#f4511e] py-2 text-sm text-white"
							>
								Tạo nhóm
							</Button>
						</div>
					)}

					<div className="flex-1 overflow-y-auto p-1 !pt-0">
						{m.conversations.length ? (
							m.conversations.map((conversation) => (
								<button
									key={conversation._id}
									onClick={() => m.setSelected(conversation)}
									className={`relative flex w-full cursor-pointer items-center gap-3 border-b border-[#edf0f2] px-4 py-3 text-left transition-colors hover:bg-white ${m.selected?._id === conversation._id
										? 'bg-[#ffe1d8] rounded-md'
										: ''
										}`}
								>
									{conversation.unread > 0 && (
										<span className="absolute left-0.5 h-2 w-2 rounded-full border-2 border-white bg-[#f4511e]" />
									)}
									<ConversationAvatar
										conversation={conversation}
										online={m.onlineUserIds.includes(
											String(conversation.other?._id),
										)}
									/>
									<span className="min-w-0 flex-1">
										<span className="flex items-center justify-between">
											<strong
												className={`truncate text-sm text-gray-600 font-medium ${conversation.unread > 0 ? '!font-semibold' : ''}`}
											>
												{conversation.displayName ||
													conversation.other
														?.fullName}
											</strong>
											<small
												className={`pl-2 text-[11px] text-gray-400 ${conversation.unread > 0 ? 'font-semibold !text-[#f4511e]' : ''}`}
											>
												{timeLabel(
													conversation.latest
														?.createdAt,
												)}
											</small>
										</span>
										<small
											className={`block truncate text-xs text-gray-500 ${conversation.unread > 0 ? '!text-black font-semibold' : ''}`}
										>
											{conversation.latest?.content ||
												conversation.latest?.attachmentUrl
												? <i>Đã gửi 1 file đính kèm</i>
												: 'Bắt đầu trò chuyện'}
										</small>
									</span>
								</button>
							))
						) : (
							<p className="p-6 text-center text-sm text-gray-500">
								Chưa có cuộc trò chuyện
							</p>
						)}
					</div>
				</div>

				{/* Right: thread detail */}
				<div className="min-h-0 p-3 bg-gray-100">
					<div className="flex flex-col h-full rounded-lg bg-white border border-gray-200">
						{m.error ? (
							<div className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
								{m.error}
							</div>
						) : m.selected ? (
							<>
								<div className="rounded-t-lg flex items-center justify-between border-b border-[#e2e7eb] px-5 py-3">
									<div className="flex items-center gap-3">
										<ConversationAvatar
											conversation={m.selected}
											online={m.onlineUserIds.includes(
												String(m.selected.other?._id),
											)}
										/>
										<div>
											<strong className="block text-[#082c40]">
												{m.selected.displayName ||
													m.selected.other.fullName}
											</strong>
											{/* {!m.selected.isGroup && (
											<span className="text-sm text-[#218daf]">
												<span className="absolute bottom-0 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#31a24c]" />{' '}
												Đang hoạt động
											</span>
										)} */}
										</div>
									</div>
									{m.selected.isGroup &&
										m.selected.ownerId === m.user._id && (
											<div className="flex items-center gap-3">
												<button
													onClick={() =>
														m.setGroupAddMode(
															(v) => !v,
														)
													}
													className="cursor-pointer text-gray-500"
													aria-label="Quản lý thành viên"
												>
													<Users size={18} />
												</button>
												<button
													onClick={m.deleteGroup}
													className="cursor-pointer text-red-500"
													aria-label="Xóa nhóm"
												>
													<Trash2 size={17} />
												</button>
											</div>
										)}
								</div>

								{m.groupAddMode && (
									<div className="border-b border-[#e4e8ec] p-3">
										<div className="mb-1 text-xs font-semibold text-[#082c40]">
											Thêm / bớt thành viên
										</div>
										{m.friends.map((friend) => (
											<label
												key={friend._id}
												className="mr-3 inline-flex items-center gap-1 text-xs"
											>
												<input
													type="checkbox"
													checked={m.groupMemberIds.includes(
														friend._id,
													)}
													onChange={() =>
														m.setGroupMemberIds(
															(ids) =>
																ids.includes(
																	friend._id,
																)
																	? ids.filter(
																		(
																			id,
																		) =>
																			id !==
																			friend._id,
																	)
																	: [
																		...ids,
																		friend._id,
																	],
														)
													}
												/>
												{friend.fullName}
											</label>
										))}
										<div className="mt-2 flex gap-2">
											<button
												onClick={m.addGroupMembers}
												className="cursor-pointer rounded bg-[#f4511e] px-2 py-1 text-xs text-white"
											>
												Thêm
											</button>
											<button
												onClick={m.removeGroupMembers}
												className="cursor-pointer rounded border border-[#e4e8ec] px-2 py-1 text-xs text-[#082c40]"
											>
												Xóa khỏi nhóm
											</button>
										</div>
									</div>
								)}

								<div className="max-h-[calc(100vh-220px)] scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4">
									{m.loadingMsg ? (
										<Skeleton />
									) : (
										m.messages.map((message, index) => {
											const showDate =
												index === 0 ||
												dayKey(
													m.messages[index - 1]
														.createdAt,
												) !== dayKey(message.createdAt)
											return (
												<Fragment key={message._id}>
													{showDate && (
														<div className="pt-2 text-center text-[11px] font-medium text-gray-400">
															{dateLabel(
																message.createdAt,
															)}
														</div>
													)}
													{message.attachmentUrl ? (
														<div
															className={`flex w-fit max-w-[60%] flex-col ${message.senderId ===
																m.user?._id
																? 'ml-auto items-end'
																: 'items-start'
																}`}
														>
															<a
																href={
																	message.attachmentUrl
																}
																target="_blank"
																rel="noreferrer"
																className="flex w-full max-w-[220px] items-center gap-2 rounded-xl border border-[#e2e7eb] bg-white px-2.5 py-2 shadow-sm transition-colors hover:bg-[#f8fafb]"
															>
																<span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-[#f4511e]/10">
																	<FileText
																		size={
																			16
																		}
																		className="text-[#f4511e]"
																	/>
																</span>
																<span className="min-w-0 flex-1">
																	<span className="block truncate text-xs font-medium text-[#082c40]">
																		{message.attachmentName ||
																			'Tệp đính kèm'}
																	</span>
																	<span className="block text-[10px] text-gray-400">
																		Nhấn để
																		xem
																	</span>
																</span>
																<Download
																	size={14}
																	className="flex-none text-gray-400"
																/>
															</a>
															<small className="mt-1 text-[10px] text-gray-400">
																{timeLabel(
																	message.createdAt,
																)}
															</small>
														</div>
													) : (
														<div
															className={`w-fit max-w-[60%] rounded-2xl px-3 py-2 text-sm ${message.senderId ===
																m.user?._id
																? 'ml-auto bg-[#f4511e] text-white rounded-br-[3px]'
																: 'rounded-bl-[3px] bg-[#f1f4f5] text-[#082c40]'
																}`}
														>
															<div>
																{
																	message.content
																}
															</div>
															<small
																className={`flex ${message.senderId ===
																	m.user?._id
																	? 'justify-end'
																	: ''
																	} mt-1 block text-[10px] opacity-70`}
															>
																{timeLabel(
																	message.createdAt,
																)}
															</small>
														</div>
													)}
												</Fragment>
											)
										})
									)}
									<div ref={m.messagesEndRef} />
								</div>

								<div className="flex items-center gap-4 px-4 py-3">
									<input
										ref={m.fileRef}
										type="file"
										className="hidden"
										onChange={(event) => {
											const file = event.target.files?.[0]
											if (file) m.sendAttachment(file)
											event.currentTarget.value = ''
										}}
									/>
									<button
										disabled={m.uploading}
										onClick={() =>
											m.fileRef.current?.click()
										}
										className="cursor-pointer text-gray-500"
										aria-label="Đính kèm file"
									>
										<Paperclip size={19} />
									</button>
									<Input
										value={m.content}
										onChange={(event) =>
											m.setContent(event.target.value)
										}
										onPressEnter={m.send}
										placeholder="Nhập tin nhắn..."
										className="!h-[44px] !rounded-full !border-[#d9e2e8] !px-4 shadow-none"
									/>
									<button
										onClick={m.send}
										className="flex h-10 w-11 cursor-pointer items-center justify-center rounded-full bg-[#f4511e] text-white hover:opacity-90"
									>
										<Send size={15} />
									</button>
								</div>
							</>
						) : (
							<div className="flex flex-1 flex-col items-center justify-center gap-4">
								<Icon
									src="/images/logo-only.png"
									alt="Lighting & Power"
									size={150}
								/>
								<div className="text-md text-gray-400">
									Chọn một cuộc trò chuyện để bắt đầu
								</div>
							</div>
						)}
					</div>
				</div>
			</section>
		</div>
	)
}
