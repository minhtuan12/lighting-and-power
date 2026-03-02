import { InquiryService } from '@/app/api/(services)/inquiry.service'
import { withMiddleware } from '@/lib/api-handler'
import { requireRole, verifyToken } from '@/lib/middleware'
import { connectDbMiddleware } from '@/lib/middleware/connect-db'
import { EUserRole } from '@/types/user'
import { NextRequest, NextResponse } from 'next/server'

async function updateStatus(
	request: NextRequest,
	context?: { params: Promise<{ id: string }> },
) {
	try {
		const params = await context?.params
		if (!params?.id) {
			return NextResponse.json(
				{ success: false, message: "ID is required" },
				{ status: 400 },
			)
		}
		const { status } = await request.json()

		if (!status) {
			return NextResponse.json(
				{ success: false, message: 'Status is required' },
				{ status: 400 },
			)
		}

		const inquiry = await InquiryService.updateStatus(params.id, status)

		if (!inquiry) {
			return NextResponse.json(
				{ success: false, message: 'Inquiry not found' },
				{ status: 404 },
			)
		}

		return NextResponse.json({
			success: true,
			message: 'Status updated successfully',
			data: inquiry,
		})
	} catch (error: any) {
		console.error('Update inquiry status error:', error)
		return NextResponse.json(
			{ success: false, message: error.message },
			{ status: 500 },
		)
	}
}

export const PATCH = withMiddleware(
	updateStatus,
	connectDbMiddleware,
	verifyToken,
	requireRole(EUserRole.admin),
)
