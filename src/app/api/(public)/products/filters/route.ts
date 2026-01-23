import { ProductService } from "@/app/api/(services)/product.service";
import { withMiddleware } from "@/lib/api-handler";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { NextRequest, NextResponse } from "next/server";

async function getFilterOptions(request: NextRequest) {
    try {
        const data = await ProductService.getFilterOptions();

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error: any) {
        console.error('Get filter options error:', error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || "Failed to get filter options"
            },
            { status: 500 }
        );
    }
}

export const GET = withMiddleware(getFilterOptions, connectDbMiddleware);
