import { withMiddleware } from "@/lib/api-handler";
import { getRequestUser } from "@/lib/context";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { messages } from "@/messages/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../../(services)/auth.service";

async function login(request: NextRequest) {
    const lang = getRequestUser(request)?.locale ?? 'vi';
    const iMessage = messages[lang as keyof typeof messages];
    const iMessageAuth = iMessage.auth;

    try {
        const { emailOrPhone, password, role } = await request.json();

        // Validate input
        if (!emailOrPhone || !password) {
            return NextResponse.json(
                { success: false, message: iMessageAuth.required },
                { status: 400 }
            );
        }

        // Login via service - returns account and tokens
        const { account, accessToken, refreshToken, requirePasswordChange, message, userId } = await AuthService.login(
            emailOrPhone,
            password,
            role,
        );

        if (requirePasswordChange && message) {
            return NextResponse.json({
                requirePasswordChange: true,
                message,
                userId,
            }, { status: 403 });
        }

        if (!accessToken) {
            return NextResponse.json(
                { message: iMessageAuth.generateTokens },
                { status: 500 }
            );
        }

        // Create response with tokens


        const cookieStore = await cookies();
        cookieStore.set('accessToken', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 3600 * 24 * 7,
            path: '/',
        });

        const response = NextResponse.json({
            success: true,
            message: iMessageAuth.successful,
            data: {
                ...account,
            }
        });

        return response;

    } catch (error: any) {
        console.error('Login error:', error);

        // Handle specific errors
        if (error.message === 'Account not found' || error.message === 'Invalid credentials') {
            return NextResponse.json(
                { success: false, message: iMessageAuth.invalid },
                { status: 401 }
            );
        }

        if (error.message === 'Account inactive') {
            return NextResponse.json(
                { success: false, message: iMessageAuth.inactive },
                { status: 403 }
            );
        }

        // Generic error
        return NextResponse.json(
            { success: false, message: iMessage.error },
            { status: 500 }
        );
    }
}

export const POST = withMiddleware(
    login,
    connectDbMiddleware,
)
