'use client'

import { useCall } from '@/hooks/use-call'
import {
	chatUrl,
	dateLabel,
	dayKey,
	formatDuration,
	timeLabel,
	useChat,
} from '@/hooks/use-chat'
import { UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Input, Skeleton } from 'antd'
import {
	ArrowLeft,
	Download,
	FileText,
	Maximize2,
	MessageCircle,
	Mic,
	Paperclip,
	Phone,
	Send,
	Video,
	X,
} from 'lucide-react'
import { Fragment } from 'react'
import VoiceMessageBubble from './VoiceMessageBubble'

export default function MessengerBubbleView() {
	const m = useChat()
	const { startCall } = useCall()

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

	if (!m.user) return null

	return (
		<>
			{!m.open && (
				<button
					aria-label="Mở tin nhắn"
					onClick={() => m.setOpen(true)}
					className="cursor-pointer fixed bottom-20 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#f4511e] text-white shadow-xl transition-transform hover:scale-105"
				>
					<MessageCircle size={20} />
					{m.unread > 0 && (
						<span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ff5a1f] px-1 text-xs font-bold">
							{m.unread > 99 ? '99+' : m.unread}
						</span>
					)}
				</button>
			)}
			{m.open && (
				<section className="fixed bottom-25 right-5 z-[9999999] flex h-[430px] w-[335px] flex-col overflow-hidden rounded-lg border border-[#d9e2e8] bg-white shadow-xl">
					<header className="w-full flex items-center justify-between border-b border-[#e2e7eb] bg-[#f8fafb] px-4 py-3 text-[#082c40]">
						<strong className='w-full'>
							{m.selected ? (
								<div className="flex items-center justify-between w-full">
									<div className='flex items-center gap-3'>
										<button
											onClick={() => m.setSelected(null)}
											className="cursor-pointer flex items-center px-1 py-3 text-sm text-gray-500"
										>
											<ArrowLeft size={18} />
										</button>
										<div className="flex items-center gap-3 text-[14px]">
											<span className="relative inline-flex">
												<Avatar
													size={32}
													src={m.selected.other.avatar}
													icon={<UserOutlined />}
												/>
												{m.onlineUserIds.includes(
													String(m.selected.other._id),
												) && (
														<span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#31a24c]" />
													)}
											</span>
											{m.selected.displayName ||
												m.selected.other.fullName}
										</div>
									</div>
									<div className={`flex ${m.selected.isGroup && m.selected.ownerId === m.user._id ? 'bg-gray-100 rounded-md' : ''}`}>
										<Button className='!h-10' type='text' onClick={() => handleStartCall('audio')}><Phone size={18} color='#117bbd' fill="#117bbd" /></Button>
										<Button className='!h-10' type='text' onClick={() => handleStartCall('video')}><Video size={20} color='#117bbd' fill="#117bbd" /></Button>
									</div>
								</div>
							) : (
								'Trò chuyện'
							)}
						</strong>
						{!m.selected && (
							<button
								onClick={() => {
									window.location.href = chatUrl()
								}}
								className="mr-2 cursor-pointer text-gray-500"
							>
								<Maximize2 size={17} />
							</button>
						)}
					</header>
					{m.error ? (
						<div className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
							{m.error}
						</div>
					) : m.selected ? (
						<>
							<div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto bg-white p-3">
								{m.loadingMsg ? (
									<Skeleton />
								) : (
									m.messages.map((message, index) => {
										const senderId =
											typeof message.senderId === 'object'
												? message.senderId?._id
												: message.senderId
										const isMine =
											String(senderId) === String(m.user?._id)
										const showDate =
											index === 0 ||
											dayKey(
												m.messages[index - 1].createdAt,
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
														<div className={`flex w-fit max-w-[70%] flex-col ${isMine ? 'ml-auto items-end' : 'items-start'}`}>
															<div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
																<VoiceMessageBubble src={message.attachmentUrl} isMe={isMine} />
															<small className="mt-1 text-[10px] text-gray-400">
																{timeLabel(message.createdAt)}
															</small>
														</div>
													</div>
												) : message.attachmentUrl ? (
													<div
																className={`flex w-fit max-w-[70%] flex-col ${isMine
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
																className={`min-w-0 w-fit max-w-[70%] break-all rounded-2xl px-3 py-2 text-sm ${isMine
															? 'ml-auto bg-[#f4511e] text-white rounded-br-[3px]'
															: 'rounded-bl-[3px] bg-[#f1f4f5] text-[#082c40]'
															}`}
													>
															<div className="min-w-0 max-w-full break-all [overflow-wrap:anywhere]">
															{
																message.content
															}
														</div>
														<small
																	className={`flex ${isMine
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
							<div className="flex gap-2 border-t border-[#dfe6ea] p-2">
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
									disabled={m.uploading || m.isRecording}
									onClick={() => m.fileRef.current?.click()}
									className="cursor-pointer rounded-full px-2 text-gray-500 disabled:opacity-50"
								>
									<Paperclip size={18} />
								</button>
								<button
									disabled={m.uploading}
									onClick={m.isRecording ? m.stopRecording : m.startRecording}
									className={`cursor-pointer rounded-full px-2 ${m.isRecording ? 'text-red-500' : 'text-gray-500'}`}
									aria-label={m.isRecording ? 'Dừng ghi âm' : 'Ghi âm'}
									title={m.isRecording ? 'Dừng ghi âm' : 'Ghi âm'}
								>
									<Mic size={18} />
								</button>

								{m.isRecording ? (
									<div className="flex h-[44px] flex-1 items-center gap-2.5 rounded-full bg-[#fff1ea] px-3.5">
										<span className="h-2 w-2 flex-none rounded-full bg-red-500 animate-pulse" />
										<div className="flex h-4 flex-1 items-end gap-[2.5px] overflow-hidden">
											{Array.from({ length: 18 }).map((_, i) => (
												<span
													key={i}
													className="bubble-recording-bar w-[2.5px] flex-none rounded-full bg-[#f4511e]"
													style={{ animationDelay: `${i * 0.08}s` }}
												/>
											))}
										</div>
										<span className="flex-none text-[11px] font-semibold tabular-nums text-[#f4511e]">
											{formatDuration(m.recordingSeconds)}
										</span>
									</div>
								) : (
									<Input
										value={m.content}
										onChange={(event) =>
											m.setContent(event.target.value)
										}
										onPressEnter={m.send}
										placeholder="Nhập tin nhắn..."
										className="!h-[44px] !rounded-full !border-[#d9e2e8] !px-4"
									/>
								)}

								{m.isRecording ? (
									<button
										onClick={m.cancelRecording}
										className="cursor-pointer rounded-full bg-gray-200 px-3 text-gray-600 w-10 h-10 hover:bg-gray-300"
										aria-label="Huỷ ghi âm"
										title="Huỷ ghi âm"
									>
										<X size={16} />
									</button>
								) : (
									<button
										onClick={m.send}
										className="cursor-pointer rounded-full bg-[#f4511e] px-3 text-white w-10 h-10 hover:opacity-90"
									>
										<Send size={15} />
									</button>
								)}
							</div>
						</>
					) : (
						<div className="flex-1 overflow-y-auto bg-white p-2 ">
							{m.conversations.length ? (
								m.conversations.map((conversation) => (
									<button
										key={conversation._id}
										onClick={() =>
											m.setSelected(conversation)
										}
										className="cursor-pointer flex w-full items-center gap-3 border-b border-[#edf0f2] px-2 py-3 text-left transition-colors hover:bg-[#f7f9fa]"
									>
										<div className="relative">
											<Avatar
												src={conversation.other?.avatar}
												icon={<UserOutlined />}
												size={40}
											/>
											{m.onlineUserIds.includes(
												String(conversation.other._id),
											) && (
													<span className="absolute bottom-0 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#31a24c]" />
												)}
										</div>
										<span className="min-w-0 flex-1">
											<strong className="block truncate">
												{conversation.displayName ||
													conversation.other
														?.fullName}
											</strong>
											<small className="block truncate text-gray-500">
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
										<small className="self-start pt-1 text-xs text-gray-500">
											{timeLabel(
												conversation.latest?.createdAt,
											)}
										</small>
										{conversation.unread > 0 && (
											<b className="rounded-full bg-[#ff5a1f] px-2 py-1 text-xs text-white">
												{conversation.unread}
											</b>
										)}
									</button>
								))
							) : (
								<p className="p-6 text-center text-sm text-gray-500">
									Chưa có cuộc trò chuyện
								</p>
							)}
						</div>
					)}
				</section>
			)}
			{m.open && (
				<button
					aria-label="Đóng tin nhắn"
					onClick={() => {
						m.setOpen(false)
						m.setSelected(null)
					}}
					className="cursor-pointer fixed bottom-8 right-6 z-[51] flex h-12 w-12 items-center justify-center rounded-full bg-[#f4511e] text-white shadow-xl"
				>
					<X size={21} />
				</button>
			)}
		</>
	)
}
