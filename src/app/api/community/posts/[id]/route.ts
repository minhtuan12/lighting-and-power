import { CommunityService } from "@/app/api/(services)/community.service"
import { getRequestUser } from "@/lib/context"
import { withMiddleware } from "@/lib/api-handler"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { optionalVerifyToken, verifyToken } from "@/lib/middleware"
import { NextRequest, NextResponse } from "next/server"

type Context = { params: Promise<{ id: string }> }

async function getPost(request: NextRequest, context?: Context) {
    const { id } = await context!.params
    const post = await CommunityService.getPost(id, getRequestUser(request)?.userId)
    return post ? NextResponse.json({ success: true, data: post }) : NextResponse.json({ success: false, message: "Post not found" }, { status: 404 })
}

async function updatePost(request: NextRequest, context?: Context) {
    const user = getRequestUser(request)
    const { id } = await context!.params
    try { return NextResponse.json({ success: true, data: await CommunityService.updatePost(id, user!.userId!, await request.json()) }) }
    catch (error: any) { return NextResponse.json({ success: false, message: error.message }, { status: 400 }) }
}

async function deletePost(request: NextRequest, context?: Context) {
    const user = getRequestUser(request)
    const { id } = await context!.params
    try { await CommunityService.deletePost(id, user!.userId!); return NextResponse.json({ success: true }) }
    catch (error: any) { return NextResponse.json({ success: false, message: error.message }, { status: 400 }) }
}

export const GET = withMiddleware(getPost, connectDbMiddleware, optionalVerifyToken)
export const PATCH = withMiddleware(updatePost, connectDbMiddleware, verifyToken)
export const DELETE = withMiddleware(deletePost, connectDbMiddleware, verifyToken)
