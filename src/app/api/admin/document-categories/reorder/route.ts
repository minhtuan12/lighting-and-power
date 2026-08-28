import { DocumentCategoryService } from '@/app/api/(services)/document-category.service'
import { withMiddleware } from '@/lib/api-handler'
import { requireRole, verifyToken } from '@/lib/middleware'
import { connectDbMiddleware } from '@/lib/middleware/connect-db'
import { EUserRole } from '@/types/user'
import { NextRequest, NextResponse } from 'next/server'

async function reorderCategories(request: NextRequest) {
    try {
        const { orderedIds } = await request.json()
        if (!Array.isArray(orderedIds))
            return NextResponse.json(
                { success: false, message: 'orderedIds is required' },
                { status: 400 },
            )
        const result = await DocumentCategoryService.reorder(orderedIds)
        return NextResponse.json({ success: true, message: result.message })
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message || 'An error occurred' },
            { status: 500 },
        )
    }
}

export const PUT = withMiddleware(
    reorderCategories,
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin),
)
