import { withMiddleware } from "@/lib/api-handler"
import { getRequestUser } from "@/lib/context"
import { requireRole, verifyToken } from "@/lib/middleware"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { EUserRole } from "@/types/user"
import { NextRequest, NextResponse } from "next/server"
import { CommentService } from "../../(services)/comment.service"

async function getUserComments(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const page = parseInt(searchParams.get("page") || "1")
		const limit = parseInt(searchParams.get("limit") || "10")

		const result = await CommentService.getAll({ page, limit })

		return NextResponse.json({ success: true, data: result })
	} catch (error: any) {
		console.error("Get comments error:", error)
		return NextResponse.json(
			{ success: false, message: error.message },
			{ status: 500 },
		)
	}
}

async function replyUserComment(request: NextRequest) {
	try {
		const { replyTo, content } = await request.json()
		const product = await CommentService.getCommentById(replyTo);
		const user = getRequestUser(request)
		if (!user?.userId) {
			return NextResponse.json(
				{ success: false, message: "User ID not found" },
				{ status: 401 },
			)
		}
		const result = await CommentService.createComment(user.userId, {
			productId: product._id,
			content,
			replyTo,
		})

		return NextResponse.json({ success: true, data: result })
	} catch (error: any) {
		console.error("Reply user comment error:", error)
		return NextResponse.json(
			{ success: false, message: error.message },
			{ status: 500 },
		)
	}
}

export const GET = withMiddleware(
	getUserComments,
	connectDbMiddleware,
	verifyToken,
	requireRole(EUserRole.admin),
)

export const POST = withMiddleware(
	replyUserComment,
	connectDbMiddleware,
	verifyToken,
	requireRole(EUserRole.admin),
)
