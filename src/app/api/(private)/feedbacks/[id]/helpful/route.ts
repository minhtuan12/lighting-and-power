import { FeedbackService } from "@/app/api/(services)/feedback.service"
import { withMiddleware } from "@/lib/api-handler"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { NextRequest, NextResponse } from "next/server"

async function markHelpful(
    request: NextRequest,
    context?: { params: Promise<{ id: string }> },
) {
    try {
        const params = await context?.params

        if (!params?.id) {
            return NextResponse.json(
                { success: false, message: "Feedback ID is required" },
                { status: 400 },
            )
        }

        const feedback = await FeedbackService.markHelpful(params.id)

        return NextResponse.json({
            success: true,
            data: feedback,
        })
    } catch (error: any) {
        console.error("Mark helpful error:", error)

        if (error.message === "Feedback not found") {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 404 },
            )
        }

        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 },
        )
    }
}

export const POST = withMiddleware(markHelpful, connectDbMiddleware)
