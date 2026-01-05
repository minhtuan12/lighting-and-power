
import { withMiddleware } from '@/lib/api-handler';
import { requireRole, verifyToken } from '@/lib/middleware';
import { connectDbMiddleware } from '@/lib/middleware/connect-db';
import { EUserRole } from '@/types/user';
import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../../(services)/user.service';

export async function getAccounts(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const page = Number(searchParams.get('page')) || 1;
        const search = searchParams.get('search') || '';

        const result = await UserService.getAccounts(page, search);

        return NextResponse.json({
            success: true,
            data: {
                accounts: result.data,
                pagination: result.pagination,
            },
        });
    } catch (error: any) {
        console.error('Get accounts error:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}

export const GET = withMiddleware(
    getAccounts,
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin),
)
