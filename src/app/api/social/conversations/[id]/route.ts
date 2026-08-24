import { SocialService } from '@/app/api/(services)/social.service'
import { withMiddleware } from '@/lib/api-handler'
import { getRequestUser } from '@/lib/context'
import { verifyToken } from '@/lib/middleware'
import { connectDbMiddleware } from '@/lib/middleware/connect-db'
import { NextRequest, NextResponse } from 'next/server'

export const DELETE = withMiddleware(
    async (
        request: NextRequest,
        context?: { params: Promise<{ id: string }> },
    ) => {
        try {
            const user = getRequestUser(request)!
            return NextResponse.json({
                success: true,
                data: await SocialService.deleteGroup(
                    user.userId!,
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
