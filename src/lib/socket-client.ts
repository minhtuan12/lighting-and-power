import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null
export function getSocket() {
    if (typeof window === 'undefined') return null
    if (!socket) {
        socket = io(window.location.origin, {
            path: '/api/socket',
            withCredentials: true,
            autoConnect: true,
        })
        socket.on('connect', () => socket?.emit('presence:request'))
        socket.on('connect_error', (error) =>
            console.error('[socket.io] connection failed:', error.message),
        )
    }
    return socket
}
