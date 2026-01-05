import { NextResponse } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(options: {
    windowMs: number;  // Time window in ms
    maxRequests: number;  // Max requests per window
}) {
    return (request: any) => {
        const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
        const now = Date.now();

        const record = rateLimitMap.get(ip);

        if (!record || now > record.resetTime) {
            rateLimitMap.set(ip, {
                count: 1,
                resetTime: now + options.windowMs
            });
            return null;
        }

        if (record.count >= options.maxRequests) {
            return NextResponse.json(
                { success: false, message: 'Too many requests, please try again later' },
                { status: 429 }
            );
        }

        record.count++;
        return null;
    };
}
