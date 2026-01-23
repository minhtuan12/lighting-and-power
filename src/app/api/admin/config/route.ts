
import { withMiddleware } from '@/lib/api-handler';
import { requireRole, verifyToken } from '@/lib/middleware';
import { connectDbMiddleware } from '@/lib/middleware/connect-db';
import { EUserRole } from '@/types/user';
import { NextRequest, NextResponse } from 'next/server';
import { ConfigService } from '../../(services)/config.service';

// GET - Public config (for frontend)
async function getConfig(request: NextRequest) {
    try {
        const config = await ConfigService.getConfig();

        return NextResponse.json({
            success: true,
            data: config
        });

    } catch (error: any) {
        console.error('Get config error:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}

async function updateConfig(request: NextRequest) {
    try {
        const body = await request.json();
        const config = await ConfigService.updateConfig(body);

        return NextResponse.json({
            success: true,
            message: 'Config updated successfully',
            data: config
        });

    } catch (error: any) {
        console.error('Update config error:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}

export const GET = withMiddleware(
    getConfig,
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin)
)

export const PUT = withMiddleware(
    updateConfig,
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin)
)
