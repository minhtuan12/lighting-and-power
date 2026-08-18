import { NotificationService } from '@/app/api/(services)/notification.service'
import { getRequestUser } from '@/lib/context'
import { withMiddleware } from '@/lib/api-handler'
import { connectDbMiddleware } from '@/lib/middleware/connect-db'
import { verifyToken } from '@/lib/middleware'
import { NextRequest, NextResponse } from 'next/server'

export const GET = withMiddleware(async (request: NextRequest) => NextResponse.json({ success: true, data: await NotificationService.list(getRequestUser(request)!.userId!) }), connectDbMiddleware, verifyToken)
