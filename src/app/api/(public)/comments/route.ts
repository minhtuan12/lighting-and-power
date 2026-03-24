import { withMiddleware } from '@/lib/api-handler'
import { getRequestUser } from '@/lib/context'
import { connectDbMiddleware } from '@/lib/middleware/connect-db'
import { NextRequest, NextResponse } from 'next/server'
import { CommentService } from '../../(services)/comment.service'

async function getUserComments(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')
        const result = await CommentService.getProductComments(
            productId as string,
        )

        return NextResponse.json({ success: true, data: result })
    } catch (error: any) {
        console.error('Get comments error:', error)
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 },
        )
    }
}

async function sendComment(request: NextRequest) {
    try {
        const { content, productId, replyTo } = await request.json()
        const user = getRequestUser(request)
        const result = await CommentService.createComment(
            user?.userId ?? null,
            {
                productId,
                content,
                replyTo: replyTo ?? null,
            },
        )

        return NextResponse.json({ success: true, data: result })
    } catch (error: any) {
        console.error('Send comment error:', error)
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 },
        )
    }
}

export const GET = withMiddleware(getUserComments, connectDbMiddleware)

export const POST = withMiddleware(sendComment, connectDbMiddleware)
