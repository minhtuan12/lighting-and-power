import { withMiddleware } from "@/lib/api-handler"
import { requireRole, verifyToken } from "@/lib/middleware"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { EUserRole } from "@/types/user"
import { NextRequest, NextResponse } from "next/server"
import { InquiryService } from "../../(services)/inquiry.service"

// GET - Get all inquiries with search + pagination
async function getInquiries(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const search = searchParams.get("search") || ""
		const page = parseInt(searchParams.get("page") || "1")
		const limit = parseInt(searchParams.get("limit") || "10")
		const status = searchParams.get("status") || ""

		const result = await InquiryService.getAll({ search, page, limit, status })

		return NextResponse.json({ success: true, data: result })
	} catch (error: any) {
		console.error("Get inquiries error:", error)
		return NextResponse.json(
			{ success: false, message: error.message },
			{ status: 500 },
		)
	}
}

export const GET = withMiddleware(
	getInquiries,
	connectDbMiddleware,
	verifyToken,
	requireRole(EUserRole.admin),
)
