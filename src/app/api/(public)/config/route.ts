import { withMiddleware } from "@/lib/api-handler";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { NextRequest, NextResponse } from "next/server";
import { ConfigService } from "../../(services)/config.service";

async function getConfig(request: NextRequest) {
    try {
        const data = await ConfigService.getPublicConfig();

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error: any) {
        console.error('Get public config error:', error);
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

export const GET = withMiddleware(
    getConfig,
    connectDbMiddleware,
)
