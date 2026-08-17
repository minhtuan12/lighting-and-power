import { CommunityService } from "@/app/api/(services)/community.service"
import { getRequestUser } from "@/lib/context"
import { withMiddleware } from "@/lib/api-handler"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { optionalVerifyToken, verifyToken } from "@/lib/middleware"
import { NextRequest, NextResponse } from "next/server"

async function getPosts(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get("page") || 1))
    const limit = Math.min(30, Math.max(1, Number(searchParams.get("limit") || 10)))
    const user = getRequestUser(request)
    const result = await CommunityService.listPosts({ page, limit, userId: user?.userId, mine: searchParams.get("mine") === "true" && Boolean(user?.userId) })
    return NextResponse.json({ success: true, data: result })
}

async function createPost(request: NextRequest) {
    const user = getRequestUser(request)
    if (!user?.userId) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    try {
        return NextResponse.json({ success: true, data: await CommunityService.createPost(user.userId, await request.json()) }, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
}

export const GET = withMiddleware(getPosts, connectDbMiddleware, optionalVerifyToken)
export const POST = withMiddleware(createPost, connectDbMiddleware, verifyToken)
