import connectDb from "@/lib/db";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../../(services)/auth.service";

export async function POST(request: NextRequest) {
    try {
        await connectDb();

        const { emailOrPhone, password } = await request.json();

        // Validate input
        if (!emailOrPhone || !password) {
            return NextResponse.json(
                { success: false, message: "Email/phone and password are required" },
                { status: 400 }
            );
        }

        // Login via service - returns account and tokens
        const { account, accessToken, refreshToken, requirePasswordChange, message, userId } = await AuthService.login(
            emailOrPhone,
            password
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
                { message: 'Failed to generate tokens' },
                { status: 500 }
            );
        }

        // Create response with tokens
        const response = NextResponse.json({
            success: true,
            message: "Login successful",
            data: {
                ...account,
            }
        });

        const cookieStore = await cookies();
        cookieStore.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 120,
            path: '/',
        });

        return response;

    } catch (error: any) {
        console.error('Login error:', error);

        // Handle specific errors
        if (error.message === 'Account not found' || error.message === 'Invalid credentials') {
            return NextResponse.json(
                { success: false, message: "Invalid email/phone or password" },
                { status: 401 }
            );
        }

        if (error.message === 'Account inactive') {
            return NextResponse.json(
                { success: false, message: "Account has been deactivated" },
                { status: 403 }
            );
        }

        // Generic error
        return NextResponse.json(
            { success: false, message: "An error occurred, please try again later" },
            { status: 500 }
        );
    }
}
