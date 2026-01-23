import { withMiddleware } from "@/lib/api-handler";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { NextRequest, NextResponse } from "next/server";
import { CategoryService } from "../../(services)/category.service";

async function getCategories(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const parentSlug = searchParams.get('parentSlug');
        const parentId = searchParams.get('parentId');

        const data = await CategoryService.getTree(true, { parentSlug, parentId });

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error: any) {
        console.error('Get public categories error:', error);
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

export const GET = withMiddleware(
    getCategories,
    connectDbMiddleware,
)
