import { SocialService } from '@/app/api/(services)/social.service'
import connectDb from '@/lib/db'
import jwt from 'jsonwebtoken'
import next from 'next'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { setRealtimeServer } from './src/lib/realtime'

const dev = !process.argv.includes('--production')
const port = Number(process.env.PORT || 4000)
const app = next({ dev })
const handler = app.getRequestHandler()

type CallType = 'audio' | 'video'
type CallEndReason =
    | 'ended'
    | 'cancelled'
    | 'rejected'
    | 'timeout'
    | 'peer_disconnected'
    | 'no_recipients'

interface PendingCall {
    roomId: string
    conversationId: string
    isGroup: boolean
    fromUserId: string
    // Tất cả người được mời (không tính người gọi), cố định từ lúc invite.
    invitedUserIds: string[]
    callType: CallType
    // Trong invitedUserIds, những ai còn đang đổ chuông (chưa accept/reject/timeout).
    ringingUserIds: Set<string>
    // Những ai đang thực sự "trong" cuộc gọi — gồm cả người gọi ngay từ đầu.
    connectedUserIds: Set<string>
    rejectedUserIds: Set<string>
    firstAcceptedAt: number | null
    endedByCaller: boolean
}

app.prepare().then(async () => {
    await connectDb()

    const httpServer = createServer(
        (request, response) => handler(request, response),
    )
    const io = new Server(httpServer, {
        path: '/api/socket',
        cors: { origin: true, credentials: true },
    })
    const onlineUsers = new Map<string, number>()
    const calls = new Map<string, PendingCall>()

    const presencePayload = () => ({
        onlineUsers: onlineUsers.size,
        userIds: [...onlineUsers.keys()],
    })
    const broadcastPresence = () =>
        io.emit('presence:update', presencePayload())

    const isUserOnline = (userId: string) =>
        io.sockets.adapter.rooms.has(`user:${userId}`)

    const isUserBusy = (userId: string) =>
        [...calls.values()].some(
            (c) =>
                c.connectedUserIds.has(userId) || c.ringingUserIds.has(userId),
        )

    // Cả người gọi và người được gọi đều nằm sẵn trong room riêng `user:{id}`
    // từ lúc connect socket — bắn thẳng vào đó thay vì dựa vào room theo
    // cuộc gọi (roomId), vì người được mời chỉ join `roomId` SAU KHI bấm nghe.
    // Nếu chỉ emit theo roomId, người chưa/không kịp bấm nghe sẽ không bao giờ
    // nhận được sự kiện kết thúc cuộc gọi (đây chính là bug bị báo).
    const notifyCallParticipants = (
        call: PendingCall,
        event: string,
        payload: unknown,
    ) => {
        io.to(`user:${call.fromUserId}`).emit(event, payload)
        call.invitedUserIds.forEach((id) =>
            io.to(`user:${id}`).emit(event, payload),
        )
    }

    const resolveCallOutcome = (call: PendingCall) => {
        const joinedOthers = [...call.connectedUserIds].filter(
            (id) => id !== call.fromUserId,
        )
        if (joinedOthers.length > 0) {
            return {
                status: 'completed' as const,
                durationSec: call.firstAcceptedAt
                    ? Math.max(
                        0,
                        Math.round(
                            (Date.now() - call.firstAcceptedAt) / 1000,
                        ),
                    )
                    : 0,
                joinedOthers,
            }
        }
        if (call.rejectedUserIds.size > 0)
            return { status: 'rejected' as const, durationSec: 0, joinedOthers }
        if (call.endedByCaller)
            return {
                status: 'cancelled' as const,
                durationSec: 0,
                joinedOthers,
            }
        return { status: 'missed' as const, durationSec: 0, joinedOthers }
    }

    // Dọn 1 cuộc gọi khỏi state, báo cho tất cả các bên (dù đã join room hay
    // chưa), và ghi lại kết quả vào hội thoại.
    const endCall = (roomId: string, reason: CallEndReason) => {
        const call = calls.get(roomId)
        if (!call) return
        calls.delete(roomId)

        notifyCallParticipants(call, 'call:end', { roomId, reason })
        io.in(roomId).socketsLeave(roomId)

        const { status, durationSec, joinedOthers } = resolveCallOutcome(call)
        SocialService.logCallMessage(call.conversationId, call.fromUserId, {
            callType: call.callType,
            status,
            durationSec,
            participantIds: joinedOthers,
        }).catch((error) => console.error('logCallMessage failed', error))
    }

    setRealtimeServer(io)

    io.use((socket, nextMiddleware) => {
        try {
            const cookies = socket.handshake.headers.cookie || ''
            const token = cookies.match(/(?:^|; )accessToken=([^;]+)/)?.[1]
            if (!token) return nextMiddleware(new Error('Unauthorized'))
            const user = jwt.verify(
                decodeURIComponent(token),
                process.env.ACCESS_TOKEN_SECRET!,
            ) as { userId?: string; id?: string }
            socket.data.userId = user.userId || user.id
            if (!socket.data.userId)
                return nextMiddleware(new Error('Unauthorized'))
            nextMiddleware()
        } catch {
            nextMiddleware(new Error('Unauthorized'))
        }
    })

    io.on('connection', (socket) => {
        const userId = String(socket.data.userId)
        socket.join(`user:${userId}`)
        onlineUsers.set(userId, (onlineUsers.get(userId) || 0) + 1)
        socket.emit('presence:update', presencePayload())
        socket.on('presence:request', () => {
            socket.emit('presence:update', presencePayload())
        })
        broadcastPresence()

        // ================= CALL SIGNALING =================

        // Bên gọi bấm "gọi" — dùng chung cho cả 1:1 (1 phần tử toUserIds) và
        // nhóm (nhiều phần tử).
        socket.on(
            'call:invite',
            (
                data: {
                    conversationId: string
                    toUserIds: string[]
                    callType: CallType
                    // Danh sách những người khác trong hội thoại kèm tên/avatar, để mọi
                    // người trong cuộc gọi biết tên nhau mà không cần server tra DB.
                    participants?: {
                        userId: string
                        fullName?: string
                        avatar?: string
                    }[]
                    callerName?: string
                    callerAvatar?: string
                },
                ack?: (res: {
                    ok: boolean
                    roomId?: string
                    reason?: string
                    unreachableUserIds?: string[]
                }) => void,
            ) => {
                const conversationId = String(data?.conversationId || '')
                const callType: CallType =
                    data?.callType === 'audio' ? 'audio' : 'video'
                const requestedIds = [
                    ...new Set((data?.toUserIds || []).map(String)),
                ].filter((id) => id && id !== userId)

                if (!conversationId || !requestedIds.length)
                    return ack?.({ ok: false, reason: 'invalid_target' })
                if (isUserBusy(userId))
                    return ack?.({ ok: false, reason: 'busy' })

                const reachableIds = requestedIds.filter(
                    (id) => isUserOnline(id) && !isUserBusy(id),
                )
                const unreachableUserIds = requestedIds.filter(
                    (id) => !reachableIds.includes(id),
                )
                if (!reachableIds.length)
                    return ack?.({
                        ok: false,
                        reason: 'no_recipients',
                        unreachableUserIds,
                    })

                const roomId = randomUUID()
                const call: PendingCall = {
                    roomId,
                    conversationId,
                    isGroup: reachableIds.length > 1,
                    fromUserId: userId,
                    invitedUserIds: reachableIds,
                    callType,
                    ringingUserIds: new Set(reachableIds),
                    connectedUserIds: new Set([userId]),
                    rejectedUserIds: new Set(),
                    firstAcceptedAt: null,
                    endedByCaller: false,
                }
                calls.set(roomId, call)
                socket.join(roomId)

                const invitePayload = {
                    roomId,
                    conversationId,
                    fromUserId: userId,
                    callType,
                    isGroup: call.isGroup,
                    callerName: data?.callerName,
                    callerAvatar: data?.callerAvatar,
                    participants: data?.participants || [],
                }
                reachableIds.forEach((id) =>
                    io.to(`user:${id}`).emit('call:incoming', invitePayload),
                )
                ack?.({ ok: true, roomId, unreachableUserIds })

                // Sau 45s, ai chưa bấm nghe coi như không bắt máy, loại khỏi danh sách
                // đổ chuông. Nếu không còn ai khác thực sự "trong" cuộc gọi và cũng
                // không còn ai đang đổ chuông -> kết thúc toàn bộ (missed).
                setTimeout(() => {
                    const current = calls.get(roomId)
                    if (!current) return
                    const stillRinging = [...current.ringingUserIds]
                    if (!stillRinging.length) return
                    stillRinging.forEach((id) =>
                        current.ringingUserIds.delete(id),
                    )
                    stillRinging.forEach((id) =>
                        io
                            .to(`user:${id}`)
                            .emit('call:end', { roomId, reason: 'timeout' }),
                    )
                    if (
                        current.connectedUserIds.size <= 1 &&
                        current.ringingUserIds.size === 0
                    )
                        endCall(roomId, 'timeout')
                }, 45_000)
            },
        )

        // Bên được mời đồng ý — dùng chung cho cả 1:1 và nhóm.
        socket.on('call:accept', (data: { roomId: string }) => {
            const call = calls.get(data?.roomId)
            if (!call || !call.invitedUserIds.includes(userId)) return
            call.ringingUserIds.delete(userId)
            call.connectedUserIds.add(userId)
            if (!call.firstAcceptedAt) call.firstAcceptedAt = Date.now()
            socket.join(call.roomId)

            // Báo cho những người ĐÃ ở trong phòng biết có người mới vào, để họ biết
            // sẽ có 1 offer tới từ người này (không cần tự tạo offer, tránh glare).
            socket.to(call.roomId).emit('call:peer-joined', {
                roomId: call.roomId,
                userId,
            })
            // Báo cho người vừa join biết những ai đã có mặt sẵn, để họ chủ động tạo
            // offer tới từng người (chỉ 1 phía tạo offer, tránh xung đột SDP).
            const existingPeerIds = [...call.connectedUserIds].filter(
                (id) => id !== userId,
            )
            socket.emit('call:joined', { roomId: call.roomId, existingPeerIds })
        })

        // Bên được mời từ chối.
        socket.on('call:reject', (data: { roomId: string }) => {
            const call = calls.get(data?.roomId)
            if (!call || !call.invitedUserIds.includes(userId)) return
            call.ringingUserIds.delete(userId)
            call.rejectedUserIds.add(userId)
            io.to(`user:${call.fromUserId}`).emit('call:peer-rejected', {
                roomId: call.roomId,
                userId,
            })
            if (
                call.connectedUserIds.size <= 1 &&
                call.ringingUserIds.size === 0
            )
                endCall(call.roomId, 'rejected')
        })

        // Người gọi hủy trước khi ai bắt máy, hoặc bất kỳ ai đang trong cuộc gọi
        // bấm kết thúc / rời đi.
        socket.on('call:end', (data: { roomId: string }) => {
            const call = calls.get(data?.roomId)
            if (!call) return
            const isParticipant =
                call.fromUserId === userId || call.invitedUserIds.includes(userId)
            if (!isParticipant) return

            const isCallerLeaving = userId === call.fromUserId
            const othersConnected = [...call.connectedUserIds].some(
                (id) => id !== call.fromUserId,
            )

            // Người gọi hủy khi CHƯA có ai (khác chính họ) bắt máy -> phải hủy ngay
            // lời mời cho tất cả những người còn đang đổ chuông, không chờ
            // ringingUserIds tự về 0 (nếu không sẽ "treo" tới khi hết 45s timeout).
            if (isCallerLeaving && !othersConnected) {
                call.endedByCaller = true
                endCall(call.roomId, 'cancelled')
                return
            }

            call.ringingUserIds.delete(userId)
            call.connectedUserIds.delete(userId)
            io.to(call.roomId).emit('call:peer-left', { roomId: call.roomId, userId })

            if (call.connectedUserIds.size <= 1 && call.ringingUserIds.size === 0)
                endCall(call.roomId, 'ended')
        })

        // ============ WebRTC offer/answer/ICE relay (định tuyến theo từng cặp) ============
        // Mesh cho nhóm: mỗi offer/answer/ice-candidate phải chỉ đích danh 1 người
        // nhận (targetUserId) — KHÔNG broadcast cho cả phòng như bản 1:1 cũ, nếu
        // không nhiều người trong nhóm sẽ nhận nhầm SDP không dành cho họ.

        socket.on(
            'webrtc:offer',
            (data: {
                roomId: string
                targetUserId: string
                sdp: RTCSessionDescriptionInit
            }) => {
                if (!calls.has(data?.roomId)) return
                io.to(`user:${data.targetUserId}`).emit('webrtc:offer', {
                    roomId: data.roomId,
                    fromUserId: userId,
                    sdp: data.sdp,
                })
            },
        )

        socket.on(
            'webrtc:answer',
            (data: {
                roomId: string
                targetUserId: string
                sdp: RTCSessionDescriptionInit
            }) => {
                if (!calls.has(data?.roomId)) return
                io.to(`user:${data.targetUserId}`).emit('webrtc:answer', {
                    roomId: data.roomId,
                    fromUserId: userId,
                    sdp: data.sdp,
                })
            },
        )

        socket.on(
            'webrtc:ice-candidate',
            (data: {
                roomId: string
                targetUserId: string
                candidate: RTCIceCandidateInit
            }) => {
                if (!calls.has(data?.roomId)) return
                io.to(`user:${data.targetUserId}`).emit(
                    'webrtc:ice-candidate',
                    {
                        roomId: data.roomId,
                        fromUserId: userId,
                        candidate: data.candidate,
                    },
                )
            },
        )

        socket.on('disconnect', () => {
            const connections = (onlineUsers.get(userId) || 1) - 1
            if (connections <= 0) onlineUsers.delete(userId)
            else onlineUsers.set(userId, connections)
            broadcastPresence()

            for (const call of calls.values()) {
                const isParticipant =
                    call.fromUserId === userId || call.invitedUserIds.includes(userId)
                if (!isParticipant) continue

                const isCallerLeaving = userId === call.fromUserId
                const othersConnected = [...call.connectedUserIds].some(
                    (id) => id !== call.fromUserId,
                )

                if (isCallerLeaving && !othersConnected) {
                    endCall(call.roomId, 'peer_disconnected')
                    continue
                }

                call.ringingUserIds.delete(userId)
                call.connectedUserIds.delete(userId)
                io.to(call.roomId).emit('call:peer-left', { roomId: call.roomId, userId })
                if (call.connectedUserIds.size <= 1 && call.ringingUserIds.size === 0)
                    endCall(call.roomId, 'peer_disconnected')
            }
        })
    })
    httpServer.listen(port, () =>
        console.log(`> Ready on http://localhost:${port}`),
    )
})
