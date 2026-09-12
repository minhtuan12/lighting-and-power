import { withMiddleware } from '@/lib/api-handler'
import { getRequestUser } from '@/lib/context'
import { verifyToken } from '@/lib/middleware'
import { connectDbMiddleware } from '@/lib/middleware/connect-db'
import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '../../(services)/user.service'

export async function search(req: NextRequest) {
	try {
		const q = req.nextUrl.searchParams.get('q') || ''
		const user = getRequestUser(req)
		const users = await UserService.searchUsers(q, user?.userId)
		return NextResponse.json({ success: true, data: users })
	} catch (error: any) {
		return NextResponse.json(
			{ success: false, message: error.message || 'Có lỗi xảy ra' },
			{ status: 500 },
		)
	}
}

export const GET = withMiddleware(search, connectDbMiddleware, verifyToken)
