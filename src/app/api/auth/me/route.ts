import { UserService } from "@/app/api/(services)/user.service";
import { withMiddleware } from "@/lib/api-handler";
import { verifyToken } from "@/lib/middleware";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { NextRequest, NextResponse } from "next/server";

export async function getMe(request: NextRequest): Promise<any> {
    try {
        // const userId = request.user?.id;
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json(
                { success: false, message: "User ID not found in token" },
                { status: 401 }
            );
        }

        const user = await UserService.getProfile(userId);

        return NextResponse.json({
            success: true,
            data: user
        });

    } catch (error: any) {
        console.error('Get me error:', error);

        if (error.message === 'User not found') {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        if (error.message === 'Account inactive') {
            return NextResponse.json(
                { success: false, message: "Account has been deactivated" },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { success: false, message: "An error occurred, please try again later" },
            { status: 500 }
        );
    }
}

export const GET = withMiddleware(
    getMe,
    connectDbMiddleware,
    verifyToken,
)
