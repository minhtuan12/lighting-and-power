import { SocialService } from '@/app/api/(services)/social.service'
import { withMiddleware } from '@/lib/api-handler'
import { getRequestUser } from '@/lib/context'
import { verifyToken } from '@/lib/middleware'
import { connectDbMiddleware } from '@/lib/middleware/connect-db'
import { NextRequest, NextResponse } from 'next/server'

export const GET = withMiddleware(
    async (
        request: NextRequest,
        context?: { params: Promise<{ id: string }> },
    ) =>
        NextResponse.json({
            success: true,
            data: await SocialService.listMessages(
                getRequestUser(request)!.userId!,
                (await context!.params).id,
            ),
        }),
    connectDbMiddleware,
    verifyToken,
)
export const POST = withMiddleware(
    async (
        request: NextRequest,
        context?: { params: Promise<{ id: string }> },
    ) => {
        try {
            const user = getRequestUser(request)!
            const input = await request.json()
            return NextResponse.json(
                {
                    success: true,
                    data: await SocialService.sendMessage(
                        user.userId!,
                        (await context!.params).id,
                        input,
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

export const PATCH = withMiddleware(
    async (
        request: NextRequest,
        context?: { params: Promise<{ id: string }> },
    ) => {
        try {
            return NextResponse.json({
                success: true,
                data: await SocialService.markConversationRead(
                    getRequestUser(request)!.userId!,
                    (await context!.params).id,
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
