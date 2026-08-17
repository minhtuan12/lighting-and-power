import { CommunityService } from "@/app/api/(services)/community.service"
import { getRequestUser } from "@/lib/context"
import { withMiddleware } from "@/lib/api-handler"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { verifyToken } from "@/lib/middleware"
import { NextRequest, NextResponse } from "next/server"

export const GET = withMiddleware(async (_request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
    try { return NextResponse.json({ success: true, data: await CommunityService.listComments((await context!.params).id) }) }
    catch (error: any) { return NextResponse.json({ success: false, message: error.message }, { status: 400 }) }
}, connectDbMiddleware)

export const POST = withMiddleware(async (request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
    try {
        const user = getRequestUser(request)!
        const { content, parentId } = await request.json()
        return NextResponse.json({ success: true, data: await CommunityService.createComment((await context!.params).id, user.userId!, content, parentId) }, { status: 201 })
    } catch (error: any) { return NextResponse.json({ success: false, message: error.message }, { status: 400 }) }
}, connectDbMiddleware, verifyToken)
