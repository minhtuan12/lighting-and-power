import { CommunityService } from "@/app/api/(services)/community.service"
import { withMiddleware } from "@/lib/api-handler"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { NextRequest, NextResponse } from "next/server"

export const POST = withMiddleware(async (_request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
    try { return NextResponse.json({ success: true, data: await CommunityService.share((await context!.params).id) }) }
    catch (error: any) { return NextResponse.json({ success: false, message: error.message }, { status: 400 }) }
}, connectDbMiddleware)
