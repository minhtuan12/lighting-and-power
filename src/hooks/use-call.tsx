'use client'

import { useAuth } from '@/hooks/use-me'
import { getSocket } from '@/lib/socket-client'
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from 'react'

export type CallType = 'audio' | 'video'
export type CallStatus =
	| 'idle'
	| 'outgoing'
	| 'incoming'
	| 'connecting'
	| 'in-call'
	| 'ended'

export interface CallParticipantInfo {
	userId: string
	fullName?: string
	avatar?: string
	stream: MediaStream | null
}

interface StartCallMember {
	userId: string
	fullName?: string
	avatar?: string
}

interface CallState {
	status: CallStatus
	roomId: string | null
	conversationId: string | null
	isGroup: boolean
	callType: CallType | null
	isCaller: boolean
	localStream: MediaStream | null
	// Những người KHÁC trong cuộc gọi (không tính bản thân), keyed theo userId.
	participants: Record<string, CallParticipantInfo>
	error: string | null
}

interface CallContextValue extends CallState {
	startCall: (
		conversationId: string,
		callType: CallType,
		members: StartCallMember[], // tất cả thành viên KHÁC trong hội thoại
	) => Promise<void>
	acceptCall: () => Promise<void>
	rejectCall: () => void
	endCall: () => void
	toggleMic: () => void
	toggleCamera: () => void
	isMicOn: boolean
	isCameraOn: boolean
}

const CallContext = createContext<CallContextValue | null>(null)

const ICE_SERVERS: RTCIceServer[] = [
	{ urls: process.env.NEXT_PUBLIC_STUN_URLS?.split(',') || 'stun:stun.l.google.com:19302' },
	...(process.env.NEXT_PUBLIC_TURN_URL
		? [
			{
				urls: process.env.NEXT_PUBLIC_TURN_URL,
				username: process.env.NEXT_PUBLIC_TURN_USERNAME,
				credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
			},
		]
		: []),
]

const initialState: CallState = {
	status: 'idle',
	roomId: null,
	conversationId: null,
	isGroup: false,
	callType: null,
	isCaller: false,
	localStream: null,
	participants: {},
	error: null,
}

export function CallProvider({ children }: { children: React.ReactNode }) {
	const { user } = useAuth()
	const [state, setState] = useState<CallState>(initialState)
	const [isMicOn, setIsMicOn] = useState(true)
	const [isCameraOn, setIsCameraOn] = useState(true)

	// Mesh: 1 RTCPeerConnection cho mỗi người khác trong cuộc gọi.
	const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
	const localStreamRef = useRef<MediaStream | null>(null)
	const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map())
	const memberInfoRef = useRef<Map<string, StartCallMember>>(new Map())
	const stateRef = useRef(state)
	const roomIdRef = useRef<string | null>(null)
	stateRef.current = state

	useEffect(() => {
		if (state.status !== 'incoming') return

		const ringtone = new Audio('/ringtone.mp3')
		ringtone.loop = true
		ringtone.play().catch(() => {
			// Browsers may block autoplay until the user interacts with the page.
		})

		return () => {
			ringtone.pause()
			ringtone.currentTime = 0
		}
	}, [state.status])

	const cleanup = useCallback(() => {
		pcsRef.current.forEach((pc) => pc.close())
		pcsRef.current.clear()
		localStreamRef.current?.getTracks().forEach((t) => t.stop())
		localStreamRef.current = null
		pendingCandidatesRef.current.clear()
		memberInfoRef.current.clear()
		roomIdRef.current = null
		setState(initialState)
		setIsMicOn(true)
		setIsCameraOn(true)
	}, [])

	const upsertParticipant = useCallback(
		(userId: string, patch: Partial<CallParticipantInfo>) => {
			setState((s) => ({
				...s,
				participants: {
					...s.participants,
					[userId]: {
						// userId,
						// stream: null,
						fullName: memberInfoRef.current.get(userId)?.fullName,
						avatar: memberInfoRef.current.get(userId)?.avatar,
						...s.participants[userId],
						...patch,
					},
				},
			}))
		},
		[],
	)

	const removeParticipant = useCallback((userId: string) => {
		pcsRef.current.get(userId)?.close()
		pcsRef.current.delete(userId)
		pendingCandidatesRef.current.delete(userId)
		setState((s) => {
			const next = { ...s.participants }
			delete next[userId]
			return { ...s, participants: next }
		})
	}, [])

	const getOrCreatePeerConnection = useCallback(
		(roomId: string, targetUserId: string) => {
			const existing = pcsRef.current.get(targetUserId)
			if (existing) return existing

			const socket = getSocket()
			const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

			pc.onicecandidate = (event) => {
				if (event.candidate) {
					socket?.emit('webrtc:ice-candidate', {
						roomId,
						targetUserId,
						candidate: event.candidate.toJSON(),
					})
				}
			}

			pc.ontrack = (event) => {
				upsertParticipant(targetUserId, { stream: event.streams[0] })
			}

			pc.onconnectionstatechange = () => {
				if (pc.connectionState === 'connected') {
					setState((s) => (s.status === 'in-call' ? s : { ...s, status: 'in-call' }))
				}
			}

			localStreamRef.current
				?.getTracks()
				.forEach((track) => pc.addTrack(track, localStreamRef.current!))

			pcsRef.current.set(targetUserId, pc)
			upsertParticipant(targetUserId, {})
			return pc
		},
		[upsertParticipant],
	)

	const getMedia = useCallback(async (callType: CallType) => {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: callType === 'video',
		})
		localStreamRef.current = stream
		return stream
	}, [])

	// Chủ động tạo offer gửi tới 1 người cụ thể — dùng khi mình vừa join phòng
	// và cần kết nối tới những người đã có mặt sẵn.
	const connectToPeer = useCallback(
		async (roomId: string, targetUserId: string) => {
			const socket = getSocket()
			const pc = getOrCreatePeerConnection(roomId, targetUserId)
			const offer = await pc.createOffer()
			await pc.setLocalDescription(offer)
			socket?.emit('webrtc:offer', { roomId, targetUserId, sdp: offer })
		},
		[getOrCreatePeerConnection],
	)

	// ============ Actions gọi từ UI ============

	const startCall = useCallback(
		async (conversationId: string, callType: CallType, members: StartCallMember[]) => {
			const socket = getSocket()
			if (!socket || !members.length) return

			try {
				await getMedia(callType)
			} catch {
				setState((s) => ({ ...s, error: 'media_error' }))
				return
			}

			members.forEach((member) => memberInfoRef.current.set(member.userId, member))
			setState((s) => ({
				...s,
				error: null,
				localStream: localStreamRef.current,
				conversationId,
				isGroup: members.length > 1,
				participants: Object.fromEntries(
					members.map((member) => [
						member.userId,
						{
							userId: member.userId,
							fullName: member.fullName,
							avatar: member.avatar,
							stream: null,
						},
					]),
				),
			}))

			socket.emit(
				'call:invite',
				{
					conversationId,
					toUserIds: members.map((member) => member.userId),
					callType,
					callerName: user?.fullName,
					callerAvatar: user?.avatar,
					participants: members.map((member) => ({
						userId: member.userId,
						fullName: member.fullName,
						avatar: member.avatar,
					})),
				},
				(res: { ok: boolean; roomId?: string; reason?: string }) => {
					if (!res.ok || !res.roomId) {
						cleanup()
						setState((s) => ({ ...s, status: 'idle', error: res.reason || 'call_failed' }))
						return
					}
					roomIdRef.current = res.roomId
					setState((s) => ({ ...s, status: 'outgoing', roomId: res.roomId!, callType, isCaller: true }))
				},
			)
		},
		[cleanup, getMedia, user],
	)

	const acceptCall = useCallback(async () => {
		const roomId = roomIdRef.current
		const { callType } = stateRef.current
		if (!roomId || !callType) return
		const socket = getSocket()
		if (!socket) return

		setState((s) => ({ ...s, status: 'connecting' }))
		try {
			await getMedia(callType)
		} catch {
			setState((s) => ({ ...s, error: 'media_error' }))
			return
		}
		setState((s) => ({ ...s, localStream: localStreamRef.current }))
		socket.emit('call:accept', { roomId })
	}, [getMedia])

	const rejectCall = useCallback(() => {
		const roomId = roomIdRef.current
		if (roomId) getSocket()?.emit('call:reject', { roomId })
		cleanup()
	}, [cleanup])

	const endCall = useCallback(() => {
		const roomId = roomIdRef.current
		if (roomId) getSocket()?.emit('call:end', { roomId })
		cleanup()
	}, [cleanup])

	const toggleMic = useCallback(() => {
		const track = localStreamRef.current?.getAudioTracks()[0]
		if (!track) return
		track.enabled = !track.enabled
		setIsMicOn(track.enabled)
	}, [])

	const toggleCamera = useCallback(() => {
		const track = localStreamRef.current?.getVideoTracks()[0]
		if (!track) return
		track.enabled = !track.enabled
		setIsCameraOn(track.enabled)
	}, [])

	// ============ Lắng nghe socket events ============

	useEffect(() => {
		const socket = getSocket()

		const onIncoming = (data: {
			roomId: string
			conversationId: string
			fromUserId: string
			callType: CallType
			isGroup: boolean
			callerName?: string
			callerAvatar?: string
			participants: { userId: string; fullName?: string; avatar?: string }[]
		}) => {
			if (stateRef.current.status !== 'idle') return
			roomIdRef.current = data.roomId

			// participants server relay là danh sách người gọi đã gửi (những người
			// KHÁC trong hội thoại, gồm cả chính mình). Phải bỏ chính mình ra, và
			// thêm người gọi vào (người gọi được gửi riêng qua callerName/Avatar).
			const others = new Map<string, StartCallMember>()
			others.set(data.fromUserId, {
				userId: data.fromUserId,
				fullName: data.callerName,
				avatar: data.callerAvatar,
			})
			data.participants
				?.filter((p) => p.userId !== data.fromUserId && p.userId !== user?._id)
				.forEach((p) => others.set(p.userId, p))

			others.forEach((member) => memberInfoRef.current.set(member.userId, member))

			setState((s) => ({
				...s,
				status: 'incoming',
				roomId: data.roomId,
				conversationId: data.conversationId,
				isGroup: data.isGroup,
				callType: data.callType,
				isCaller: false,
				participants: Object.fromEntries(
					[...others.values()].map((member) => [
						member.userId,
						{
							userId: member.userId,
							fullName: member.fullName,
							avatar: member.avatar,
							stream: null,
						},
					]),
				),
			}))
		}

		// Mình vừa join phòng thành công -> đây là những ai đã có sẵn, mình chủ
		// động tạo offer tới từng người (chỉ 1 phía tạo offer, tránh glare).
		const onJoined = async (data: { roomId: string; existingPeerIds: string[] }) => {
			if (roomIdRef.current !== data.roomId) return
			for (const peerId of data.existingPeerIds) {
				await connectToPeer(data.roomId, peerId)
			}
		}

		// Có người mới join sau mình -> họ sẽ là bên tạo offer, mình chỉ chờ.
		const onPeerJoined = (data: { roomId: string; userId: string }) => {
			if (roomIdRef.current !== data.roomId) return
			upsertParticipant(data.userId, {})
		}

		const onPeerLeft = (data: { roomId: string; userId: string }) => {
			if (roomIdRef.current !== data.roomId) return
			removeParticipant(data.userId)
		}

		const onOffer = async (data: { roomId: string; fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
			if (roomIdRef.current !== data.roomId) return
			const pc = getOrCreatePeerConnection(data.roomId, data.fromUserId)
			await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
			const pending = pendingCandidatesRef.current.get(data.fromUserId) || []
			for (const c of pending) await pc.addIceCandidate(new RTCIceCandidate(c))
			pendingCandidatesRef.current.delete(data.fromUserId)

			const answer = await pc.createAnswer()
			await pc.setLocalDescription(answer)
			getSocket()?.emit('webrtc:answer', {
				roomId: data.roomId,
				targetUserId: data.fromUserId,
				sdp: answer,
			})
		}

		const onAnswer = async (data: { roomId: string; fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
			if (roomIdRef.current !== data.roomId) return
			const pc = pcsRef.current.get(data.fromUserId)
			if (!pc) return
			await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
			const pending = pendingCandidatesRef.current.get(data.fromUserId) || []
			for (const c of pending) await pc.addIceCandidate(new RTCIceCandidate(c))
			pendingCandidatesRef.current.delete(data.fromUserId)
		}

		const onIceCandidate = async (data: { roomId: string; fromUserId: string; candidate: RTCIceCandidateInit }) => {
			if (roomIdRef.current !== data.roomId) return
			const pc = pcsRef.current.get(data.fromUserId)
			if (!pc || !pc.remoteDescription) {
				const list = pendingCandidatesRef.current.get(data.fromUserId) || []
				list.push(data.candidate)
				pendingCandidatesRef.current.set(data.fromUserId, list)
				return
			}
			await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
		}

		// Server chỉ gửi call:end khi CẢ cuộc gọi kết thúc (không đủ người để tiếp
		// tục) — 1 người rời giữa nhóm dùng call:peer-left, không phải sự kiện này.
		const onEnd = (data: { roomId: string; reason: string }) => {
			if (roomIdRef.current !== data.roomId) return
			cleanup()
		}

		socket?.on('call:incoming', onIncoming)
		socket?.on('call:joined', onJoined)
		socket?.on('call:peer-joined', onPeerJoined)
		socket?.on('call:peer-left', onPeerLeft)
		socket?.on('webrtc:offer', onOffer)
		socket?.on('webrtc:answer', onAnswer)
		socket?.on('webrtc:ice-candidate', onIceCandidate)
		socket?.on('call:end', onEnd)

		return () => {
			socket?.off('call:incoming', onIncoming)
			socket?.off('call:joined', onJoined)
			socket?.off('call:peer-joined', onPeerJoined)
			socket?.off('call:peer-left', onPeerLeft)
			socket?.off('webrtc:offer', onOffer)
			socket?.off('webrtc:answer', onAnswer)
			socket?.off('webrtc:ice-candidate', onIceCandidate)
			socket?.off('call:end', onEnd)
		}
	}, [cleanup, connectToPeer, getOrCreatePeerConnection, upsertParticipant, removeParticipant, user])

	return (
		<CallContext.Provider
			value={{
				...state,
				startCall,
				acceptCall,
				rejectCall,
				endCall,
				toggleMic,
				toggleCamera,
				isMicOn,
				isCameraOn,
			}}
		>
			{children}
		</CallContext.Provider>
	)
}

export function useCall() {
	const ctx = useContext(CallContext)
	if (!ctx) throw new Error('useCall phải dùng trong <CallProvider>')
	return ctx
}
