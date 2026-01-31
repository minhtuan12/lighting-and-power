import { withMiddleware } from "@/lib/api-handler";
import { verifyToken } from "@/lib/middleware";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { NextRequest, NextResponse } from "next/server";
import { FeedbackService } from "../../(services)/feedback.service";

// GET /api/feedbacks?userId=xxx - Lấy feedbacks của user
async function getFeedbacks(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "User ID is required" },
                { status: 400 }
            );
        }

        const result = await FeedbackService.getUserFeedbacks(userId, {
            page,
            limit
        });

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error('Get feedbacks error:', error);
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

// POST /api/feedbacks - Tạo feedback mới
async function createFeedback(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id');

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { productId, orderId, rating, comment, images } = body;

        if (!productId || !orderId) {
            return NextResponse.json(
                { success: false, message: "Product ID and Order ID are required" },
                { status: 400 }
            );
        }

        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json(
                { success: false, message: "Rating must be between 1 and 5" },
                { status: 400 }
            );
        }

        const feedback = await FeedbackService.createFeedback(userId, {
            productId,
            orderId,
            rating,
            comment,
            images
        });

        return NextResponse.json({
            success: true,
            message: "Feedback created successfully",
            data: feedback
        });

    } catch (error: any) {
        console.error('Create feedback error:', error);

        if (error.message.includes('not found') ||
            error.message.includes('already reviewed') ||
            error.message.includes('delivered orders')) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

export const GET = withMiddleware(
    getFeedbacks,
    connectDbMiddleware
);

export const POST = withMiddleware(
    createFeedback,
    connectDbMiddleware,
    verifyToken
);

