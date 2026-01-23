import { NextRequest, NextResponse } from 'next/server';

type Middleware = (request: NextRequest) => NextResponse | null | Promise<NextResponse | null>;

export function composeMiddleware(...middlewares: Middleware[]) {
    return async (request: NextRequest) => {
        for (const middleware of middlewares) {
            const result = middleware(request);
            if (result) return result; // Return error response if any
        }
        return null; // All middleware passed
    };
}

// Export all middleware
export { requireRole, verifyToken } from './auth.middleware';
export { logger } from './logger.middleware';
export { rateLimit } from './rate-limit.middleware';

