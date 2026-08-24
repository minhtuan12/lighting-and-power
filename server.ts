import jwt from 'jsonwebtoken'
import next from 'next'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { setRealtimeServer } from './src/lib/realtime'

const dev = !process.argv.includes('--production')
const port = Number(process.env.PORT || 4000)
const app = next({ dev })
const handler = app.getRequestHandler()

app.prepare().then(() => {
    const httpServer = createServer((request, response) =>
        handler(request, response),
    )
    const io = new Server(httpServer, {
        path: '/api/socket',
        cors: { origin: true, credentials: true },
    })
    const onlineUsers = new Map<string, number>()
    const presencePayload = () => ({
        onlineUsers: onlineUsers.size,
        userIds: [...onlineUsers.keys()],
    })
    const broadcastPresence = () =>
        io.emit('presence:update', presencePayload())
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
        socket.on('disconnect', () => {
            const connections = (onlineUsers.get(userId) || 1) - 1
            if (connections <= 0) onlineUsers.delete(userId)
            else onlineUsers.set(userId, connections)
            broadcastPresence()
        })
    })
    httpServer.listen(port, () =>
        console.log(`> Ready on http://localhost:${port}`),
    )
})
