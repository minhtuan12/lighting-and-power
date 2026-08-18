import { withMiddleware } from "@/lib/api-handler"
import { getRequestUser } from "@/lib/context"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { messages } from "@/messages/server"
import { revalidateTag } from "next/cache"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "../../(services)/auth.service"

async function login(request: NextRequest) {
    const lang = getRequestUser(request)?.locale ?? "vi"
    const iMessage = messages[lang as keyof typeof messages]
    const iMessageAuth = iMessage.auth

    try {
        const { emailOrPhone, password, role } = await request.json()

        // Validate input
        if (!emailOrPhone || !password) {
            return NextResponse.json(
                { success: false, message: iMessageAuth.required },
                { status: 400 },
            )
        }

        // Login via service - returns account and tokens
        const {
            account,
            accessToken,
            refreshToken,
            requirePasswordChange,
            message,
            userId,
        } = await AuthService.login(emailOrPhone, password, role)

        if (requirePasswordChange && message) {
            return NextResponse.json(
                {
                    requirePasswordChange: true,
                    message,
                    userId,
                },
                { status: 403 },
            )
        }

        if (!accessToken) {
            return NextResponse.json(
                { message: iMessageAuth.generateTokens },
                { status: 500 },
            )
        }

        // Create response with tokens

        const cookieStore = await cookies()
        const host = request.headers.get('host') || request.nextUrl.hostname
        const hostname = host.split(':')[0]
        const cookieDomain = hostname.endsWith('localhost') ? undefined : `.${hostname.replace(/^www\./, '')}`
        
        console.log(`[Login API] Hostname: ${hostname} | Setting cookieDomain: ${cookieDomain || 'undefined (host-only)'}`)
        
        const isSecure = process.env.NODE_ENV === "production"

        cookieStore.set("accessToken", accessToken, {
            httpOnly: true,
            secure: isSecure,
            sameSite: "lax",
            maxAge: 3600 * 24 * 7 * 4 * 12,
            path: "/",
            domain: cookieDomain
        })
        
        cookieStore.set("refreshToken", refreshToken, {
            httpOnly: true,
            secure: isSecure,
            sameSite: "lax",
            maxAge: 3600 * 24 * 7 * 4 * 12,
            path: "/",
            domain: cookieDomain
        })

        const response = NextResponse.json({
            success: true,
            message: iMessageAuth.successful,
            data: {
                ...account,
            },
        })

        return response
    } catch (error: any) {
        console.error("Login error:", error)

        // Handle specific errors
        if (
            error.message === "Account not found" ||
            error.message === "Invalid credentials"
        ) {
            return NextResponse.json(
                { success: false, message: iMessageAuth.invalid },
                { status: 401 },
            )
        }

        if (error.message === "Account inactive") {
            return NextResponse.json(
                { success: false, message: iMessageAuth.inactive },
                { status: 403 },
            )
        }

        // Generic error
        return NextResponse.json(
            { success: false, message: iMessage.error },
            { status: 500 },
        )
    }
}

export const POST = withMiddleware(login, connectDbMiddleware)
