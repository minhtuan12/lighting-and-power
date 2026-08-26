import { C2CInterestService } from '@/app/api/(services)/c2c-interest.service'
import { withMiddleware } from '@/lib/api-handler'
import { getRequestUser } from '@/lib/context'
import { verifyToken } from '@/lib/middleware'
import { connectDbMiddleware } from '@/lib/middleware/connect-db'
import { NextRequest, NextResponse } from 'next/server'

export const POST = withMiddleware(
    async (request: NextRequest) => {
        const user = getRequestUser(request)
        if (!user?.userId)
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 },
            )
        try {
            const { productId } = await request.json()
            return NextResponse.json({
                success: true,
                data: await C2CInterestService.register(productId, user.userId),
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

export const GET = withMiddleware(
    async (request: NextRequest) => {
        const user = getRequestUser(request)
        if (!user?.userId)
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 },
            )
        try {
            const productId = new URL(request.url).searchParams.get('productId')
            if (productId) {
                return NextResponse.json({ success: true, data: await C2CInterestService.getBuyerInterest(productId, user.userId) })
            }
            return NextResponse.json({
                success: true,
                data: await C2CInterestService.confirmed(user.userId),
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
