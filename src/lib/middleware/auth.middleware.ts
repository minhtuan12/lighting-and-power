import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function verifyToken(request: NextRequest): Promise<any> {
    try {
        // Get token from cookies
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized - No token provided' },
                { status: 401 }
            );
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET!
        ) as { id: string, role: string };

        // ✅ Attach user to request object
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', decoded.id);
        requestHeaders.set('x-user-role', decoded.role);
        const modifiedRequest = new NextRequest(request, {
            headers: requestHeaders,
        });

        // ✅ Return request đã modify
        return modifiedRequest;

    } catch (error: any) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        console.error('Token verification error:', error);
        return NextResponse.json(
            { success: false, message: 'Authentication failed' },
            { status: 401 }
        );
    }
}

export function requireRole(...roles: string[]) {
    return async (request: NextRequest): Promise<any> => {
        const userId = request.headers.get('x-user-id');
        const role = request.headers.get('x-user-role');

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized - User not found' },
                { status: 401 }
            );
        }

        if (!role || !roles.includes(role)) {
            return NextResponse.json(
                { success: false, message: 'Forbidden - Insufficient permissions' },
                { status: 403 }
            );
        }

        return null; // No error
    };
}
