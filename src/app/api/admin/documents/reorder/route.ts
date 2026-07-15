import { DocumentService } from "@/app/api/(services)/document.service"
import { withMiddleware } from "@/lib/api-handler"
import { requireRole, verifyToken } from "@/lib/middleware"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { EUserRole } from "@/types/user"
import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

async function reorderDocuments(request: NextRequest) {
	try {
		const body = await request.json()
		const { type, orderedIds } = body

		if (!type || !Array.isArray(orderedIds)) {
			return NextResponse.json(
				{ success: false, message: "type và orderedIds là bắt buộc" },
				{ status: 400 },
			)
		}

		const result = await DocumentService.reorder(type, orderedIds)

		revalidateTag("documents", { expire: 0 })

		return NextResponse.json({ success: true, message: result.message })
	} catch (error: any) {
		console.error("Reorder documents error:", error)
		return NextResponse.json(
			{ success: false, message: error.message || "An error occurred" },
			{ status: 500 },
		)
	}
}

export const PUT = withMiddleware(
	reorderDocuments,
	connectDbMiddleware,
	verifyToken,
	requireRole(EUserRole.admin),
)
