import { CommunityService } from '@/app/api/(services)/community.service'
import { withMiddleware } from '@/lib/api-handler'
import { connectDbMiddleware } from '@/lib/middleware/connect-db'
import { NextRequest, NextResponse } from 'next/server'

export const GET = withMiddleware(async (_request: NextRequest) => {
    try {
        return NextResponse.json({ success: true, data: await CommunityService.getStats() })
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message || 'Unable to load community stats' }, { status: 500 })
    }
}, connectDbMiddleware)
