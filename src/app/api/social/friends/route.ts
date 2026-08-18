import { SocialService } from '@/app/api/(services)/social.service'
import { withMiddleware } from '@/lib/api-handler'
import { getRequestUser } from '@/lib/context'
import { verifyToken } from '@/lib/middleware'
import { connectDbMiddleware } from '@/lib/middleware/connect-db'
import { NextRequest, NextResponse } from 'next/server'

export const GET = withMiddleware(
    async (request: NextRequest) =>
        NextResponse.json({
            success: true,
            data: await SocialService.listFriends(
                getRequestUser(request)!.userId!,
            ),
        }),
    connectDbMiddleware,
    verifyToken,
)
export const POST = withMiddleware(
    async (request: NextRequest) => {
        try {
            const user = getRequestUser(request)!
            const body = await request.json()
            return NextResponse.json({
                success: true,
                data: await SocialService.friendship(
                    user.userId!,
                    body.userId,
                    body.action || 'request',
                ),
            })
        } catch (error: any) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 400 },
            )
        }
    },
    connectDbMiddleware,
    verifyToken,
)
