import { FeedbackService } from "@/app/api/(services)/feedback.service";
import { withMiddleware } from "@/lib/api-handler";
import { verifyToken } from "@/lib/middleware";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/feedbacks/[id] - Cập nhật feedback
async function updateFeedback(
    request: NextRequest,
    context?: { params: Promise<{ id: string }> }
) {
    try {
        const userId = request.headers.get('x-user-id');
        const params = await context?.params;

        if (!params?.id) {
            return NextResponse.json(
                { success: false, message: "Feedback ID is required" },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { rating, comment, images } = body;

        const feedback = await FeedbackService.updateFeedback(
            userId,
            params.id,
            { rating, comment, images }
        );

        return NextResponse.json({
            success: true,
            message: "Feedback updated successfully",
            data: feedback
        });

    } catch (error: any) {
        console.error('Update feedback error:', error);

        if (error.message === 'Feedback not found') {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

// DELETE /api/feedbacks/[id] - Xóa feedback
async function deleteFeedback(
    request: NextRequest,
    context?: { params: Promise<{ id: string }> }
) {
    try {
        const userId = request.headers.get('x-user-id');
        const params = await context?.params;

        if (!params?.id) {
            return NextResponse.json(
                { success: false, message: "Feedback ID is required" },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 }
            );
        }

        await FeedbackService.deleteFeedback(userId, params.id);

        return NextResponse.json({
            success: true,
            message: "Feedback deleted successfully"
        });

    } catch (error: any) {
        console.error('Delete feedback error:', error);

        if (error.message === 'Feedback not found') {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

export const PUT = withMiddleware(
    updateFeedback,
    connectDbMiddleware,
    verifyToken
);

export const DELETE = withMiddleware(
    deleteFeedback,
    connectDbMiddleware,
    verifyToken
);
