import { SocialService } from '@/app/api/(services)/social.service'
import { withMiddleware } from '@/lib/api-handler'
import { getRequestUser } from '@/lib/context'
import { optionalVerifyToken } from '@/lib/middleware'
import { connectDbMiddleware } from '@/lib/middleware/connect-db'
import { NextRequest, NextResponse } from 'next/server'

export const GET = withMiddleware(
    async (
        request: NextRequest,
        context?: { params: Promise<{ id: string }> },
    ) => {
        try {
            const profile = await SocialService.getPublicProfile(
                (await context!.params).id,
                getRequestUser(request)?.userId,
            )
            return profile
                ? NextResponse.json({ success: true, data: profile })
                : NextResponse.json(
                    { success: false, message: 'User not found' },
                    { status: 404 },
                )
        } catch (error: any) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 400 },
            )
        }
    },
    connectDbMiddleware,
    optionalVerifyToken,
)
