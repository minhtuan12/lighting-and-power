import { C2CInterestService } from '@/app/api/(services)/c2c-interest.service'
import { withMiddleware } from '@/lib/api-handler'
import { getRequestUser } from '@/lib/context'
import { verifyToken } from '@/lib/middleware'
import { connectDbMiddleware } from '@/lib/middleware/connect-db'
import { NextRequest, NextResponse } from 'next/server'

export const GET = withMiddleware(
    async (
        request: NextRequest,
        context?: { params: Promise<{ id: string }> },
    ) => {
        const user = getRequestUser(request)
        if (!user?.userId)
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 },
            )
        try {
            const { id } = await context!.params
            return NextResponse.json({
                success: true,
                data: await C2CInterestService.sellerList(id, user.userId),
            })
        } catch (e: any) {
            return NextResponse.json(
                { success: false, message: e.message },
                { status: 400 },
            )
        }
    },
    connectDbMiddleware,
    verifyToken,
)

export const POST = withMiddleware(
    async (
        request: NextRequest,
        context?: { params: Promise<{ id: string }> },
    ) => {
        const user = getRequestUser(request)
        if (!user?.userId)
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 },
            )
        try {
            const { id } = await context!.params
            return NextResponse.json({
                success: true,
                data: await C2CInterestService.confirm(id, user.userId),
            })
        } catch (e: any) {
            return NextResponse.json(
                { success: false, message: e.message },
                { status: 400 },
            )
        }
    },
    connectDbMiddleware,
    verifyToken,
)
