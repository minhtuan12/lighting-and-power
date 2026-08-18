import { SocialService } from '@/app/api/(services)/social.service'
import { withMiddleware } from '@/lib/api-handler'
import { getRequestUser } from '@/lib/context'
import { verifyToken } from '@/lib/middleware'
import { connectDbMiddleware } from '@/lib/middleware/connect-db'
import { NextRequest, NextResponse } from 'next/server'

export const POST = withMiddleware(
    async (request: NextRequest) => {
        try {
            const user = getRequestUser(request)!
            const { userId } = await request.json()
            return NextResponse.json(
                {
                    success: true,
                    data: await SocialService.getOrCreateConversation(
                        user.userId!,
                        userId,
                    ),
                },
                { status: 201 },
            )
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

export const GET = withMiddleware(
    async (request: NextRequest) => NextResponse.json({ success: true, data: await SocialService.listConversations(getRequestUser(request)!.userId!) }),
    connectDbMiddleware,
    verifyToken,
)
