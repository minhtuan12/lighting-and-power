import { UserService } from '@/app/api/(services)/user.service';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser, setRequestUser } from '../context';

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

        if (!decoded.id || !decoded.role) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        if (!await UserService.getProfile(decoded.id)) {
            return NextResponse.json(
                { success: false, message: 'Account not found' },
                { status: 404 }
            );
        }w

        setRequestUser(request, {
            ...(getRequestUser(request)),
            userId: decoded.id,
            role: decoded.role,
        });

        return null;
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
        const user = getRequestUser(request);

        if (!user?.userId) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized - User not found' },
                { status: 401 }
            );
        }

        if (!user?.role || !roles.includes(user?.role)) {
            return NextResponse.json(
                { success: false, message: 'Forbidden - Insufficient permissions' },
                { status: 403 }
            );
        }

        return null; // No error
    };
}
