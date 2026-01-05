import { NextRequest, NextResponse } from 'next/server';

// Handler có thể nhận params
type ApiHandler<T = any> = (
    request: NextRequest,
    context?: { params: T }
) => Promise<NextResponse>;

// Middleware không cần params
type Middleware = (request: NextRequest) => NextResponse | null | Promise<NextResponse | null>;

export function withMiddleware<T = any>(
    handler: ApiHandler<T>,
    ...middlewares: Middleware[]
) {
    return async (request: NextRequest, context?: { params: T }) => {
        let currentRequest = request;
        for (const middleware of middlewares) {
            const result = await middleware(currentRequest) as any;

            // Nếu middleware return NextResponse (lỗi), trả về ngay
            if (result instanceof NextResponse) {
                return result;
            }

            // Nếu middleware return NextRequest (modified), cập nhật request
            if (result instanceof NextRequest) {
                currentRequest = result;
            }

            // Nếu return null, tiếp tục với request hiện tại
        }

        // Chạy handler chính với request đã được modify
        return handler(currentRequest, context);
    };
}
