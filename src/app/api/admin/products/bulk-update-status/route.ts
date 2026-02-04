import { ProductService } from "@/app/api/(services)/product.service";
import { withMiddleware } from "@/lib/api-handler";
import { requireRole, verifyToken } from "@/lib/middleware";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { EUserRole } from "@/types/user";
import { revalidateTag, updateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

async function bulkUpdateStatus(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids, status } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { success: false, message: 'IDs array is required' },
                { status: 400 }
            );
        }

        if (!status) {
            return NextResponse.json(
                { success: false, message: 'Status is required' },
                { status: 400 }
            );
        }

        const result = await ProductService.bulkUpdateStatus(ids, status);
        updateTag('products');
        revalidateTag('products', { expire: 0 });

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('Bulk update status error:', error);
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

export const PUT = withMiddleware(
    bulkUpdateStatus,
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin),
)
