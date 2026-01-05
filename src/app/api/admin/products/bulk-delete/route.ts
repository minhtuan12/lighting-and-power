import { ProductService } from "@/app/api/(services)/product.service";
import { withMiddleware } from "@/lib/api-handler";
import { requireRole, verifyToken } from "@/lib/middleware";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { EUserRole } from "@/types/user";
import { NextRequest, NextResponse } from "next/server";

async function bulkDeleteProducts(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { success: false, message: 'IDs array is required' },
                { status: 400 }
            );
        }

        const result = await ProductService.deleteMany(ids);

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('Bulk delete products error:', error);
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

export const POST = withMiddleware(
    bulkDeleteProducts,
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin),
)
