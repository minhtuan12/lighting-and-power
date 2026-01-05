import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { routes } from "@/constants/routes";

const authRoutes = [routes.DangNhapAdmin]

export async function proxy(request: NextRequest) {
    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
