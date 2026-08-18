import type { Server } from 'socket.io'

const realtimeGlobal = globalThis as typeof globalThis & { __lightingPowerSocket?: Server }

export function setRealtimeServer(server: Server) {
    realtimeGlobal.__lightingPowerSocket = server
}

export function emitToUser(userId: string, event: string, payload: unknown) {
    realtimeGlobal.__lightingPowerSocket?.to(`user:${userId}`).emit(event, payload)
}
