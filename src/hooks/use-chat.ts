'use client'

import { useAuth } from '@/hooks/use-me'
import { getSocket } from '@/lib/socket-client'
import { useEffect, useMemo, useRef, useState } from 'react'

const api = async (url: string, options?: RequestInit) => {
	const isFormData = options?.body instanceof FormData
	const response = await fetch(url, {
		...options,
		headers: {
			...(isFormData ? {} : { 'Content-Type': 'application/json' }),
			...(options?.headers || {}),
		},
	})
	const body = await response.json()
	if (!response.ok || body.success === false)
		throw new Error(body.message || 'Request failed')
	return body.data
}

export const timeLabel = (value?: string) =>
	value
		? new Date(value).toLocaleTimeString('vi-VN', {
			hour: '2-digit',
			minute: '2-digit',
		})
		: ''

export const dayKey = (value: string) =>
	new Date(value).toLocaleDateString('en-CA')

export const dateLabel = (value: string) => {
	const date = new Date(value)
	const today = new Date()
	const yesterday = new Date()
	yesterday.setDate(today.getDate() - 1)
	if (dayKey(value) === dayKey(today.toISOString())) return 'Hôm nay'
	if (dayKey(value) === dayKey(yesterday.toISOString())) return 'Hôm qua'
	return date.toLocaleDateString('vi-VN', {
		weekday: 'long',
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	})
}

export function chatUrl() {
	const url = new URL('/', window.location.origin)
	const hostname = window.location.hostname
	if (hostname === 'localhost' || hostname === '127.0.0.1') {
		url.hostname = `chat.${hostname}`
	} else if (hostname.startsWith('c2c.')) {
		url.hostname = `chat.${hostname.slice(4)}`
	} else if (!hostname.startsWith('chat.')) {
		url.hostname = `chat.${hostname}`
	}
	return url.toString()
}

export const formatDuration = (totalSeconds: number) => {
	const m = Math.floor(totalSeconds / 60)
	const s = totalSeconds % 60
	return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function useChat({
	autoOpen = false,
}: { autoOpen?: boolean } = {}) {
	const { user } = useAuth()
	const [open, setOpen] = useState(autoOpen)
	const [selected, setSelected] = useState<any>(null)
	const [conversations, setConversations] = useState<any[]>([])
	const [messages, setMessages] = useState<any[]>([])
	const [content, setContent] = useState('')
	const [error, setError] = useState('')
	const [onlineUserIds, setOnlineUserIds] = useState<string[]>([])
	const [friends, setFriends] = useState<any[]>([])
	const [groupMode, setGroupMode] = useState(false)
	const [groupName, setGroupName] = useState('')
	const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]) // giữ lại, chỉ dùng khi TẠO nhóm mới
	const [groupAddMode, setGroupAddMode] = useState(false)
	const [addMemberIds, setAddMemberIds] = useState<string[]>([])       // thêm mới: chọn bạn để THÊM
	const [removeMemberIds, setRemoveMemberIds] = useState<string[]>([]) // thêm mới: chọn thành viên để XÓA
	const [uploading, setUploading] = useState(false)
	const [isRecording, setIsRecording] = useState(false)
	const [loadingMsg, setLoadingMsg] = useState(false)
	const fileRef = useRef<HTMLInputElement>(null)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const recorderRef = useRef<MediaRecorder | null>(null)
	const recordingStreamRef = useRef<MediaStream | null>(null)
	const [recordingSeconds, setRecordingSeconds] = useState(0)
	const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const cancelledRef = useRef(false)

	const load = () =>
		user &&
		api('/api/social/conversations')
			.then((rows) => {
				setConversations(rows)
				setSelected((current: any) => {
					if (!current) return current
					const refreshed = rows.find(
						(row: any) => row._id === current._id,
					)
					return refreshed
						? { ...refreshed, other: refreshed.other ?? current.other }
						: current
				})
			})
			.catch(() => undefined)

	useEffect(() => {
		if (!user) return
		const openForUser = (event: Event) => {
			const other = (event as CustomEvent).detail
			setError('')
			setOpen(true)
			api('/api/social/conversations', {
				method: 'POST',
				body: JSON.stringify({ userId: other._id }),
			})
				.then((conversation) => {
					setConversations((current) =>
						current.some((item) => item._id === conversation._id)
							? current
							: [conversation, ...current],
					)
					setSelected({ ...conversation, other })
				})
				.catch((reason) => setError(reason.message))
		}
		window.addEventListener('messenger:open', openForUser)
		load()
		api('/api/social/friends')
			.then((rows) =>
				setFriends(
					rows
						.filter((row: any) => row.status === 'accepted')
						.map((row: any) =>
							row.requesterId?._id === user?._id
								? row.addresseeId
								: row.requesterId,
						),
				),
			)
			.catch(() => undefined)
		const socket = getSocket()
		const receive = (message: any) => {
			if (selected?._id === message.conversationId)
				setMessages((current) => [...current, message])
			load()
		}
		const receivePresence = (presence: { userIds?: string[] }) =>
			setOnlineUserIds(presence.userIds || [])
		socket?.on('message:new', receive)
		socket?.on('presence:update', receivePresence)
		if (socket?.connected) socket.emit('presence:request')
		return () => {
			window.removeEventListener('messenger:open', openForUser)
			socket?.off('message:new', receive)
			socket?.off('presence:update', receivePresence)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?._id, selected?._id])

	useEffect(() => {
		if (!selected) return
		setLoadingMsg(true)
		api(`/api/social/conversations/${selected._id}/messages`)
			.then(setMessages)
			.finally(() => setLoadingMsg(false))
		api(`/api/social/conversations/${selected._id}/messages`, {
			method: 'PATCH',
		}).then(load)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selected?._id])

	useEffect(() => {
		if (!selected || loadingMsg) return
		requestAnimationFrame(() => {
			messagesEndRef.current?.scrollIntoView({
				behavior: 'auto',
				block: 'end',
			})
		})
	}, [selected?._id, messages.length, loadingMsg])

	useEffect(() => {
		return () => {
			if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
		}
	}, [])

	const unread = useMemo(
		() =>
			conversations.reduce(
				(total, item) => total + (item.unread || 0),
				0,
			),
		[conversations],
	)

	const send = async () => {
		if (!selected || !content.trim()) return
		const message = await api(
			`/api/social/conversations/${selected._id}/messages`,
			{
				method: 'POST',
				body: JSON.stringify({ content }),
			},
		)
		setMessages((current) => [...current, message])
		setContent('')
		load()
	}

	const sendAttachment = async (file: File) => {
		if (!selected) return
		setUploading(true)
		try {
			const form = new FormData()
			form.append('file', file)
			const attachment = await api('/api/social/attachments', {
				method: 'POST',
				body: form,
			})
			const message = await api(
				`/api/social/conversations/${selected._id}/messages`,
				{
					method: 'POST',
					body: JSON.stringify({
						content: '',
						attachmentUrl: attachment.url,
						attachmentName: attachment.name,
						attachmentMimeType: attachment.mimeType,
						attachmentSize: attachment.size,
					}),
				},
			)
			setMessages((current) => [...current, message])
			load()
		} catch (reason: any) {
			setError(reason.message)
		} finally {
			setUploading(false)
		}
	}

	const startRecording = async () => {
		if (!selected || uploading || isRecording) return
		if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
			setError('Trình duyệt không hỗ trợ ghi âm')
			return
		}

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) =>
				MediaRecorder.isTypeSupported(type),
			)
			const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
			const chunks: Blob[] = []
			cancelledRef.current = false

			recorder.ondataavailable = (event) => {
				if (event.data.size > 0) chunks.push(event.data)
			}
			recorder.onstop = () => {
				stream.getTracks().forEach((track) => track.stop())
				recordingStreamRef.current = null
				recorderRef.current = null
				setIsRecording(false)
				if (recordingIntervalRef.current) {
					clearInterval(recordingIntervalRef.current)
					recordingIntervalRef.current = null
				}
				setRecordingSeconds(0)

				if (cancelledRef.current) {
					cancelledRef.current = false
					return
				}

				const audioFile = new File([new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })], `voice-message-${Date.now()}.webm`, {
					type: recorder.mimeType || 'audio/webm',
				})
				void sendAttachment(audioFile)
			}

			recorderRef.current = recorder
			recordingStreamRef.current = stream
			recorder.start()
			setIsRecording(true)
			setRecordingSeconds(0)
			recordingIntervalRef.current = setInterval(() => {
				setRecordingSeconds((seconds) => seconds + 1)
			}, 1000)
		} catch (reason: any) {
			setError(reason?.message || 'Không thể truy cập microphone')
		}
	}

	const stopRecording = () => {
		if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
	}

	const cancelRecording = () => {
		if (recorderRef.current?.state === 'recording') {
			cancelledRef.current = true
			recorderRef.current.stop()
		}
	}

	const createGroup = async () => {
		if (!groupName.trim() || groupMemberIds.length < 2) return
		const conversation = await api('/api/social/conversations', {
			method: 'POST',
			body: JSON.stringify({
				name: groupName,
				memberIds: groupMemberIds,
			}),
		})
		const other = {
			_id: conversation._id,
			fullName: groupName,
			avatar: undefined,
		}
		setConversations((current) => [
			{ ...conversation, other, displayName: groupName },
			...current,
		])
		setSelected({ ...conversation, other })
		load()
		setGroupMode(false)
		setGroupName('')
		setGroupMemberIds([])
	}

	const addGroupMembers = async () => {
		if (!selected?.isGroup || !addMemberIds.length) return
		await api(`/api/social/conversations/${selected._id}/members`, {
			method: 'POST',
			body: JSON.stringify({ memberIds: addMemberIds }),
		})
		setGroupAddMode(false)
		setAddMemberIds([])
		setRemoveMemberIds([])
		load()
	}

	const removeGroupMembers = async () => {
		if (!selected?.isGroup || !removeMemberIds.length) return
		await api(`/api/social/conversations/${selected._id}/members`, {
			method: 'DELETE',
			body: JSON.stringify({ memberIds: removeMemberIds }),
		})
		setGroupAddMode(false)
		setAddMemberIds([])
		setRemoveMemberIds([])
		load()
	}

	const deleteGroup = async () => {
		if (!selected?.isGroup || !window.confirm('Xóa nhóm này?')) return
		await api(`/api/social/conversations/${selected._id}`, {
			method: 'DELETE',
		})
		setConversations((current) =>
			current.filter((item) => item._id !== selected._id),
		)
		setSelected(null)
	}

	return {
		user,
		open,
		setOpen,
		selected,
		setSelected,
		conversations,
		messages,
		content,
		setContent,
		error,
		setError,
		onlineUserIds,
		friends,
		groupMode,
		setGroupMode,
		groupName,
		setGroupName,
		groupMemberIds,
		setGroupMemberIds,
		groupAddMode,
		addMemberIds,
		setAddMemberIds,
		removeMemberIds,
		setRemoveMemberIds,
		setGroupAddMode,
		uploading,
		isRecording,
		recordingSeconds,
		loadingMsg,
		fileRef,
		messagesEndRef,
		unread,
		load,
		send,
		sendAttachment,
		startRecording,
		stopRecording,
		cancelRecording,
		createGroup,
		addGroupMembers,
		removeGroupMembers,
		deleteGroup,
	}
}
