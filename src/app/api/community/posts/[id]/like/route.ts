import { CommunityService } from "@/app/api/(services)/community.service"
import { getRequestUser } from "@/lib/context"
import { withMiddleware } from "@/lib/api-handler"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { verifyToken } from "@/lib/middleware"
import { NextRequest, NextResponse } from "next/server"

export const POST = withMiddleware(async (request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
    try {
        const user = getRequestUser(request)
        const { id } = await context!.params
        return NextResponse.json({ success: true, data: await CommunityService.toggleLike(id, user!.userId!) })
    } catch (error: any) { return NextResponse.json({ success: false, message: error.message }, { status: 400 }) }
}, connectDbMiddleware, verifyToken)
