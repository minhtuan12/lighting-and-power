import { UserService } from "@/app/api/(services)/user.service"
import { withMiddleware } from "@/lib/api-handler"
import { getRequestUser } from "@/lib/context"
import { verifyToken } from "@/lib/middleware"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { messages } from "@/messages/server"
import { NextRequest, NextResponse } from "next/server"

export async function updateMe(request: NextRequest): Promise<any> {
    const lang = getRequestUser(request)?.locale ?? "vi"
    const iMessage = messages[lang as keyof typeof messages]
    const iMessageAuth = iMessage.auth

    try {
        const authUser = getRequestUser(request)
        const userId = authUser?.userId as string

        const { username, avatar, email, phone, fullName, address } =
            await request.json()
        const user = await UserService.getProfile(authUser?.userId as string)

        if (email) {
            if (user.email) {
                return NextResponse.json(
                    { success: false, message: iMessageAuth.cannotChangeEmail },
                    { status: 400 },
                )
            }
            if (await UserService.getUserByInfo(email, userId)) {
                return NextResponse.json(
                    { success: false, message: iMessageAuth.mailExists },
                    { status: 400 },
                )
            }
        }
        if (phone) {
            if (user.phone) {
                return NextResponse.json(
                    { success: false, message: iMessageAuth.cannotChangePhone },
                    { status: 400 },
                )
            }
            if (await UserService.getUserByInfo(phone, userId)) {
                return NextResponse.json(
                    { success: false, message: iMessageAuth.phoneExists },
                    { status: 400 },
                )
            }
        }

        if (username) {
            if (await UserService.getUserByInfo(username, userId)) {
                return NextResponse.json(
                    { success: false, message: iMessageAuth.usernameExists },
                    { status: 400 },
                )
            }
        }

        await UserService.updateProfile(userId, {
            avatar,
            email,
            fullName,
            phone,
            username,
            address,
        })

        return NextResponse.json({
            success: true,
            data: user,
        })
    } catch (error: any) {
        console.error("Get me error:", error)
        return NextResponse.json(
            { success: false, message: iMessage.error },
            { status: 500 },
        )
    }
}

export const PATCH = withMiddleware(updateMe, connectDbMiddleware, verifyToken)
