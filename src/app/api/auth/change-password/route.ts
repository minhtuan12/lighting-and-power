import { withMiddleware } from "@/lib/api-handler";
import { verifyToken } from "@/lib/middleware";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../../(services)/auth.service";
import { getRequestUser } from "@/lib/context";

async function changePassword(request: NextRequest) {
    try {
        const user = getRequestUser(request);

        if (!user?.userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found" },
                { status: 401 }
            );
        }

        const { oldPassword, newPassword } = await request.json();

        // Validate input
        if (!oldPassword || !newPassword) {
            return NextResponse.json(
                { success: false, message: "Old password and new password are required" },
                { status: 400 }
            );
        }

        // Change password via service
        const result = await AuthService.changePassword(user.userId, oldPassword, newPassword);

        return NextResponse.json({
            success: true,
            message: result.message,
            data: {
                passwordExpiresAt: result.passwordExpiresAt
            }
        });

    } catch (error: any) {
        console.error('Change password error:', error);

        // Handle specific errors
        if (error.message === 'User not found') {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        if (error.message === 'Current password is incorrect') {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 400 }
            );
        }

        if (error.message.includes('Password must') ||
            error.message.includes('cannot be the same') ||
            error.message.includes('was used recently')) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 400 }
            );
        }

        // Generic error
        return NextResponse.json(
            { success: false, message: "An error occurred, please try again later" },
            { status: 500 }
        );
    }
}

export const POST = withMiddleware(
    changePassword,
    connectDbMiddleware,
    verifyToken
);
