import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { routes } from './constants/routes';

const protectedRoutes = [
    // routes.gioHang.url,
    routes.taiLieuDienTu.url,
]

const authRoutes = [routes.dangKy.url, routes.dangNhap.url];

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const accessToken = request.cookies.get('accessToken')?.value;

    // Avoid loop
    const isAuthRoute = authRoutes.some(route =>
        pathname.includes(route)
    );
    if (isAuthRoute) {
        if (accessToken) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    const isProtected = protectedRoutes.some(route =>
        pathname.includes(route)
    );

    if (isProtected) {
        if (!accessToken) {
            const loginUrl = new URL(routes.dangNhap.url, request.url);

            // optional: redirect back sau login
            loginUrl.searchParams.set('redirect', pathname);

            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/gio-hang/:path*',
        '/tai-lieu-dien-tu/:path*',
        '/dang-ky/:path*',
        '/dang-nhap/:path*',
        '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.png$).*)',
    ],
};
