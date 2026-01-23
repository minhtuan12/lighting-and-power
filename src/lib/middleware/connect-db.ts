import { NextRequest, NextResponse } from "next/server";
import connectDb from "../db";

export async function connectDbMiddleware(request: NextRequest): Promise<NextResponse | null> {
    try {
        await connectDb();
        return null; // No error, continue
    } catch (error: any) {
        console.error('Database connection error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Database connection failed',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 503 } // Service Unavailable
        );
    }
}
