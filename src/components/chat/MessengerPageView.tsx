'use client'

import { useCall } from '@/hooks/use-call'
import {
	dateLabel,
	dayKey,
	formatDuration,
	timeLabel,
	useChat
} from '@/hooks/use-chat'
import { UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Empty, Flex, Input, Modal, Skeleton, Tooltip } from 'antd'
import {
	ArrowLeft,
	Download,
	FileText,
	Mic,
	Paperclip,
	Phone,
	Search,
	Send,
	Trash2,
	UserMinus,
	Users,
	Video,
	X
} from 'lucide-react'
import Link from 'next/link'
import { Fragment, useState } from 'react'
import { Icon } from '../Icon'
import VoiceMessageBubble from './VoiceMessageBubble'

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
	const [memberSearch, setMemberSearch] = useState('')
	const { startCall } = useCall()

	const [conversationSearch, setConversationSearch] = useState('')
	const filteredConversations = m.conversations.filter((conversation) => {
		const name = (
			conversation.displayName || conversation.other?.fullName || ''
		).toLowerCase()
		return name.includes(conversationSearch.trim().toLowerCase())
	})

	if (!m.user || !m.user._id) return null

	const handleStartCall = (callType: 'audio' | 'video') => {
		if (!m.selected) return
		const members = m.selected.isGroup
			? (m.selected.members ?? [])
				.filter((member: any) => member._id !== m.user?._id)
				.map((member: any) => ({ userId: member._id, fullName: member.fullName, avatar: member.avatar }))
			: m.selected.other
				? [{ userId: m.selected.other._id, fullName: m.selected.other.fullName, avatar: m.selected.other.avatar }]
				: []
		if (!members.length) return
		startCall(m.selected._id, callType, members)
	}

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
					size={150}
				/>
			</div>

			<section className="grid min-h-[calc(100vh-53px)] w-full grid-cols-[280px_minmax(0,1fr)] overflow-hidden border border-[#d9e2e8] bg-white">
				{/* Left: conversation list */}
				<div className="flex min-h-0 flex-col border-r border-[#e2e7eb] bg-[#f8fafb] user-none">
					<div className="flex items-center justify-between px-4 py-4">
						<strong className="text-[#082c40]">Tin nhắn</strong>
						<button
							aria-label="Tạo hội thoại mới"
							onClick={() => m.setGroupMode((v) => !v)}
							className="flex h-7 w-fit text-[12px] px-3 cursor-pointer items-center justify-center rounded-full bg-[#f4511e] text-white"
						>
							{m.groupMode ? <X size={13} className='mr-1' /> : <Users size={13} className='mr-1' />} {m.groupMode ? 'Hủy' : 'Tạo nhóm'}
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

					<div className="px-4 pb-3">
						<Input
							allowClear
							value={conversationSearch}
							onChange={(e) => setConversationSearch(e.target.value)}
							placeholder="Tìm kiếm cuộc trò chuyện..."
							prefix={<Search size={14} className="text-gray-400" />}
							className="!rounded-full"
						/>
					</div>

					<div className="flex-1 overflow-y-auto p-1 !pt-0">
						{filteredConversations.length ? (
							filteredConversations.map((conversation) => (
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
											{conversation.latest?.type === 'call' ? (
												<i>
													{conversation.isGroup ? `${conversation.latest.senderId.fullName}: ` : ''}
													{conversation.latest.call?.status === 'missed'
														? 'Cuộc gọi nhỡ'
														: conversation.latest.call?.status === 'rejected'
															? 'Cuộc gọi bị từ chối'
															: conversation.latest.call?.status === 'cancelled'
																? 'Cuộc gọi đã hủy'
																: 'Cuộc gọi đã kết thúc'}
												</i>
											) : conversation.latest?.content ? (
												conversation.isGroup ? `${conversation.latest.senderId.fullName}: ${conversation.latest.content}` : conversation.latest?.content
											) : conversation.latest?.attachmentUrl ? (
												<i>{conversation.latest.senderId.fullName} đã gửi 1 file đính kèm</i>
											) : (
												'Bắt đầu trò chuyện'
											)}
										</small>
									</span>
								</button>
							))
						) : (
							<p className="p-6 text-center text-sm text-gray-500">
								{conversationSearch
									? 'Không tìm thấy cuộc trò chuyện nào'
									: 'Chưa có cuộc trò chuyện'
								}
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
									<Flex align='center' gap={10}>
										<div className={`flex ${m.selected.isGroup && m.selected.ownerId === m.user._id ? 'bg-gray-100 rounded-md' : ''}`}>
											<Button className='!h-10' type='text' onClick={() => handleStartCall('audio')}><Phone size={18} color='#117bbd' fill="#117bbd" /></Button>
											<Button className='!h-10' type='text' onClick={() => handleStartCall('video')}><Video size={20} color='#117bbd' fill="#117bbd" /></Button>
										</div>
										{m.selected.isGroup &&
											m.selected.ownerId === m.user._id && (
												<div className="flex items-center gap-4 bg-gray-100 px-3 py-2.5 rounded-md">
													<button
														onClick={() => {
															m.setGroupAddMode((v) => !v)
															m.setAddMemberIds([])
															m.setRemoveMemberIds([])
															// setMemberSearch('')
														}}
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
									</Flex>
								</div>

								<Modal
									open={m.groupAddMode}
									onCancel={() => {
										m.setGroupAddMode(false)
										m.setAddMemberIds([])
										m.setRemoveMemberIds([])
										// setMemberSearch('')
									}}
									title={
										<div className="flex items-center gap-2 text-[#082c40]">
											<Users size={18} className="text-[#f4511e]" />
											Quản lý thành viên nhóm
										</div>
									}
									footer={
										<div className="flex justify-end gap-2">
											<Button
												onClick={() => {
													m.setGroupAddMode(false)
													m.setAddMemberIds([])
													m.setRemoveMemberIds([])
												}}
												className="rounded-lg"
											>
												Đóng
											</Button>
											<Button
												disabled={!m.removeMemberIds?.length}
												onClick={m.removeGroupMembers}
												className="!border-red-200 !text-red-500 rounded-lg"
											>
												Xóa khỏi nhóm ({m.removeMemberIds?.length})
											</Button>
											<Button
												type="primary"
												disabled={!m.addMemberIds?.length}
												onClick={m.addGroupMembers}
												className="!bg-[#f4511e] rounded-lg"
											>
												Thêm vào nhóm ({m.addMemberIds?.length})
											</Button>
										</div>
									}
									// width={420}
									styles={{ body: { paddingTop: 8 } }}
								>
									{/* Danh sách thành viên hiện tại */}
									<div className="mb-4">
										<div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
											Thành viên hiện tại ({m.selected?.members?.length ?? 0})
										</div>
										<div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-[#edf0f2] p-1 scrollbar-thin">
											{m.selected?.members?.length ? (
												m.selected.members.map((member: any) => (
													<div
														key={member._id}
														className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-[#f8fafb]"
													>
														<div className="flex items-center gap-2">
															<Avatar
																src={member.avatar}
																icon={<UserOutlined />}
																size={28}
															/>
															<span className="text-sm text-[#082c40]">
																{member.fullName}
																{member._id === m.selected.ownerId && (
																	<span className="ml-1.5 rounded-full bg-[#fff1ea] px-1.5 py-1 text-[10px] font-medium text-[#f4511e]">
																		Trưởng nhóm
																	</span>
																)}
															</span>
														</div>
														{member._id !== m.selected.ownerId && (
															<Tooltip title="Chọn để xóa">
																<button
																	onClick={() =>
																		m.setRemoveMemberIds((ids: string[]) =>
																			ids.includes(member._id)
																				? ids.filter((id) => id !== member._id)
																				: [...ids, member._id],
																		)
																	}
																	className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded-full transition-colors ${m.removeMemberIds.includes(member._id)
																		? 'bg-red-500 text-white'
																		: 'text-gray-400 hover:bg-red-50 hover:text-red-500'
																		}`}
																	aria-label={`Xóa ${member.fullName} khỏi nhóm`}
																>
																	<UserMinus size={16} />
																</button>
															</Tooltip>
														)}
													</div>
												))
											) : (
												<Empty
													image={Empty.PRESENTED_IMAGE_SIMPLE}
													description="Chưa có thành viên"
													className="py-3"
												/>
											)}
										</div>
									</div>

									{/* Thêm thành viên mới */}
									<div>
										<div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
											Thêm bạn bè vào nhóm
										</div>
										{/* <Input
											value={memberSearch}
											onChange={(e) => setMemberSearch(e.target.value)}
											placeholder="Tìm bạn bè..."
											prefix={<Search size={14} className="text-gray-400" />}
											className="mb-2 !rounded-lg"
										/> */}
										<div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-[#edf0f2] p-1">
											{(() => {
												const currentMemberIds = new Set(
													(m.selected?.members ?? []).map((mem: any) => String(mem._id)),
												)
												const filteredFriends = m.friends.filter(
													(friend: any) =>
														!currentMemberIds.has(String(friend._id)) &&
														friend.fullName
															.toLowerCase()
															.includes(memberSearch.trim().toLowerCase()),
												)

												if (!filteredFriends.length) {
													return (
														<Empty
															image={Empty.PRESENTED_IMAGE_SIMPLE}
															description="Không tìm thấy bạn bè phù hợp"
															className="py-3"
														/>
													)
												}

												return filteredFriends.map((friend: any) => {
													const checked = m.addMemberIds.includes(friend._id)
													return (
														<label
															key={friend._id}
															className={`flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 transition-colors ${checked ? 'bg-[#fff1ea]' : 'hover:bg-[#f8fafb]'
																}`}
														>
															<div className="flex items-center gap-2">
																<Avatar src={friend.avatar} icon={<UserOutlined />} size={28} />
																<span className="text-sm text-[#082c40]">{friend.fullName}</span>
															</div>
															<input
																type="checkbox"
																checked={checked}
																onChange={() =>
																	m.setAddMemberIds((ids: string[]) =>
																		ids.includes(friend._id)
																			? ids.filter((id) => id !== friend._id)
																			: [...ids, friend._id],
																	)
																}
																className="h-4 w-4 accent-[#f4511e]"
															/>
														</label>
													)
												})
											})()}
										</div>
									</div>
								</Modal>

								<div className="max-h-[calc(100vh-220px)] scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4">
									{m.loadingMsg ? (
										<Skeleton />
									) : (
										m.messages.map((message, index) => {
											const showDate =
												index === 0 ||
												dayKey(m.messages[index - 1].createdAt) !==
												dayKey(message.createdAt)

											const senderObj =
												message.senderId && typeof message.senderId === 'object'
													? message.senderId
													: null
											const senderIdStr = senderObj ? senderObj._id : message.senderId
											const isMe = senderIdStr === m.user?._id

											// Lấy senderId dạng string của tin trước/sau để so sánh chuỗi liên tiếp
											const getSenderId = (msg: any) =>
												msg?.senderId && typeof msg.senderId === 'object'
													? msg.senderId._id
													: msg?.senderId

											const prevMessage = m.messages[index - 1]
											const nextMessage = m.messages[index + 1]

											const isFirstInGroup =
												index === 0 ||
												getSenderId(prevMessage) !== senderIdStr ||
												dayKey(prevMessage.createdAt) !== dayKey(message.createdAt)

											const isLastInGroup =
												index === m.messages.length - 1 ||
												getSenderId(nextMessage) !== senderIdStr ||
												dayKey(nextMessage.createdAt) !== dayKey(message.createdAt)

											const showGroupInfo = m.selected.isGroup && !isMe
											const showSenderName = showGroupInfo && isFirstInGroup
											const showAvatar = showGroupInfo && isLastInGroup

											return (
												<Fragment key={message._id}>
													{showDate && (
														<div className="pt-2 text-center text-[11px] font-medium text-gray-400">
															{dateLabel(message.createdAt)}
														</div>
													)}

													<div
														className={`flex w-fit max-w-[65%] items-end gap-2 ${isMe ? 'ml-auto flex-row-reverse' : ''
															}`}
													>
														{showGroupInfo && (
															<div className="w-[26px] flex-none">
																{showAvatar && (
																	<Avatar
																		src={senderObj?.avatar}
																		icon={<UserOutlined />}
																		size={26}
																	/>
																)}
															</div>
														)}

														<div className="flex min-w-0 flex-col">
															{showSenderName && (
																<small className="mb-0.5 ml-1 text-[11px] font-medium text-gray-500">
																	{senderObj?.fullName}
																</small>
															)}

															{message.type === 'call' ? (
																<div className="flex items-center gap-2 rounded-lg border border-[#e2e7eb] bg-[#f8fafb] px-3 py-2 text-xs text-gray-600">
																	{message.call?.callType === 'video' ? <Video size={14} /> : <Phone size={14} />}
																	<span>
																		{message.call?.status === 'missed' && 'Cuộc gọi nhỡ'}
																		{message.call?.status === 'rejected' && 'Cuộc gọi bị từ chối'}
																		{message.call?.status === 'cancelled' && 'Cuộc gọi đã hủy'}
																		{message.call?.status === 'completed' &&
																			`Đã gọi • ${Math.floor((message.call.durationSec || 0) / 60)}:${String((message.call.durationSec || 0) % 60).padStart(2, '0')}`}
																	</span>
																	<small className="text-[10px] text-gray-400">{timeLabel(message.createdAt)}</small>
																</div>
															) : message.attachmentMimeType?.startsWith('audio/') ? (
																<div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
																	<VoiceMessageBubble src={message.attachmentUrl} isMe={isMe} />
																	<small className="mt-1 text-[10px] text-gray-400">
																		{timeLabel(message.createdAt)}
																	</small>
																</div>
															) : message.attachmentUrl ? (
																<div
																	className={`flex flex-col ${isMe ? 'items-end' : 'items-start'
																		}`}
																>
																	<a
																		href={message.attachmentUrl}
																		target="_blank"
																		rel="noreferrer"
																		className="flex w-full max-w-[220px] items-center gap-2 rounded-xl border border-[#e2e7eb] bg-white px-2.5 py-2 shadow-sm transition-colors hover:bg-[#f8fafb]"
																	>
																		<span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-[#f4511e]/10">
																			<FileText
																				size={16}
																				className="text-[#f4511e]"
																			/>
																		</span>
																		<span className="min-w-0 flex-1">
																			<span className="block truncate text-xs font-medium text-[#082c40]">
																				{message.attachmentName ||
																					'Tệp đính kèm'}
																			</span>
																			<span className="block text-[10px] text-gray-400">
																				Nhấn để xem
																			</span>
																		</span>
																		<Download
																			size={14}
																			className="flex-none text-gray-400"
																		/>
																	</a>
																	<small className="mt-1 text-[10px] text-gray-400">
																		{timeLabel(message.createdAt)}
																	</small>
																</div>
															) : (
																<div
																	className={`w-fit rounded-lg px-3 py-2 text-sm ${isMe
																		? 'bg-[#f4511e] text-white rounded-br-[3px]'
																		: 'rounded-bl-[3px] bg-[#f1f4f5] text-[#082c40]'
																		}`}
																>
																	<div>{message.content}</div>
																	<small
																		className={`flex ${isMe ? 'justify-end' : ''
																			} mt-1 block text-[10px] opacity-70`}
																	>
																		{timeLabel(message.createdAt)}
																	</small>
																</div>
															)}
														</div>
													</div>
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
									<button
										disabled={m.uploading}
										onClick={m.isRecording ? m.stopRecording : m.startRecording}
										className={`cursor-pointer ${m.isRecording ? 'text-red-500' : 'text-gray-500'}`}
										aria-label={m.isRecording ? 'Dừng ghi âm' : 'Ghi âm'}
										title={m.isRecording ? 'Dừng ghi âm' : 'Ghi âm'}
									>
										<Mic size={19} />
									</button>
									{m.isRecording ? (
										<div className="flex h-[44px] flex-1 items-center gap-3 rounded-full bg-[#fff1ea] px-4">
											<span className="h-2.5 w-2.5 flex-none rounded-full bg-red-500 animate-pulse" />
											<div className="flex h-5 flex-1 items-end gap-[3px] overflow-hidden">
												{Array.from({ length: 24 }).map((_, i) => (
													<span
														key={i}
														className="recording-bar w-[3px] flex-none rounded-full bg-[#f4511e]"
														style={{ animationDelay: `${i * 0.08}s` }}
													/>
												))}
											</div>
											<span className="flex-none text-xs font-semibold tabular-nums text-[#f4511e]">
												{formatDuration(m.recordingSeconds)}
											</span>
										</div>
									) : (
										<Input
											value={m.content}
											onChange={(event) => m.setContent(event.target.value)}
											onPressEnter={m.send}
											placeholder="Nhập tin nhắn..."
											className="!h-[44px] !rounded-full !border-[#d9e2e8] !px-4 shadow-none"
										/>
									)}
									{m.isRecording ? (
										<button
											onClick={m.cancelRecording}
											className="flex h-10 w-11 cursor-pointer items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
											aria-label="Huỷ ghi âm"
											title="Huỷ ghi âm"
										>
											<X size={17} />
										</button>
									) : (
										<button
											onClick={m.send}
											className="flex h-10 w-11 cursor-pointer items-center justify-center rounded-full bg-[#f4511e] text-white hover:opacity-90"
										>
											<Send size={15} />
										</button>
									)}
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
			<style jsx>{`
				@keyframes recording-wave {
					0%, 100% { height: 6px; }
					50% { height: 18px; }
				}
				.recording-bar {
					animation: recording-wave 0.9s ease-in-out infinite;
				}
			`}</style>
		</div>
	)
}
