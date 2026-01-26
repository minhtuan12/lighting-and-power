import { withMiddleware } from "@/lib/api-handler";
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

export const GET = withMiddleware(
    getFeedbacks,
    connectDbMiddleware
);
