import { NotificationService } from '@/app/api/(services)/notification.service'
import { getRequestUser } from '@/lib/context'
import { withMiddleware } from '@/lib/api-handler'
import { connectDbMiddleware } from '@/lib/middleware/connect-db'
import { verifyToken } from '@/lib/middleware'
import { NextRequest, NextResponse } from 'next/server'

export const PATCH = withMiddleware(async (request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
    try { return NextResponse.json({ success: true, data: await NotificationService.markRead(getRequestUser(request)!.userId!, (await context!.params).id) }) }
    catch (error: any) { return NextResponse.json({ success: false, message: error.message }, { status: 400 }) }
}, connectDbMiddleware, verifyToken)
