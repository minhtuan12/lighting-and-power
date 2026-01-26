import { FeedbackService } from "@/app/api/(services)/feedback.service";
import { ProductService } from "@/app/api/(services)/product.service";
import { withMiddleware } from "@/lib/api-handler";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { isValidObjectId } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// GET /api/products/[id]/feedbacks - Lấy feedbacks của sản phẩm
async function getProductFeedbacks(
    request: NextRequest,
    context?: { params: Promise<{ slug: string }> }
) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined;
        const sort = searchParams.get('sort') || 'newest';

        const params = await context?.params;
        if (!params?.slug) {
            return NextResponse.json(
                { success: false, message: 'Product not found' },
                { status: 404 }
            );
        }

        let productId = params.slug;
        if (!isValidObjectId(params.slug)) {
            productId = (await ProductService.getBySlug(params.slug))._id.toString();
        }
        const result = await FeedbackService.getProductFeedbacks(productId, {
            page,
            limit,
            rating,
            sort
        });

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error('Get product feedbacks error:', error);
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

export const GET = withMiddleware(
    getProductFeedbacks,
    connectDbMiddleware
);
