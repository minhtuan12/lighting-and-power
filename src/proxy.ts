import createIntlMiddleware from 'next-intl/middleware'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { routes } from './constants/routes'
import { getCurrentUser } from './fetch-data/auth'
import { routing } from './i18n/routing'
import { EUserRole } from './types/user'

const protectedRoutes = [
    routes.gioHang.url,
    // routes.taiLieuDienTu.url,
    routes.trangCaNhan.url,

    '/cart',
    // '/documents',
    '/profile',
]

const authRoutes = [routes.dangKy.url, routes.dangNhap.url]

// ─── CORS headers applied to every API response ───────────────────────────────
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function withCors(response: NextResponse): NextResponse {
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value)
    })
    return response
}

const intlMiddleware = createIntlMiddleware(routing)

function createAuthMiddleware(locale: string, pathnameWithoutLocale: string) {
    return async (request: NextRequest): Promise<NextResponse | null> => {
        const accessToken = request.cookies.get('accessToken')?.value
        const cookieStore = await cookies()
        const { data: user } = await getCurrentUser()

        if (user) {
            if (
                (request.url.includes('admin') &&
                    user.role === EUserRole.user) ||
                (!request.url.includes('admin') &&
                    user.role === EUserRole.admin)
            ) {
                cookieStore.delete('accessToken')
                return NextResponse.redirect(new URL(request.url))
            }
        }

        // Check auth routes
        const isAuthRoute = authRoutes.some((route) =>
            pathnameWithoutLocale.includes(route),
        )

        if (isAuthRoute && accessToken) {
            return NextResponse.redirect(new URL(`/${locale}`, request.url))
        }

        // Check protected routes
        const isProtected = protectedRoutes.some((route) =>
            pathnameWithoutLocale.includes(route),
        )

        if (isProtected && !accessToken) {
            const loginUrl = new URL(
                `/${locale}${routes.dangNhap.url}`,
                request.url,
            )

            // optional: redirect back sau login
            loginUrl.searchParams.set('redirect', pathnameWithoutLocale)
            return NextResponse.redirect(loginUrl)
        }

        return null
    }
}

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    if (pathname.startsWith('/api')) {
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, { status: 200, headers: CORS_HEADERS })
        }
        return withCors(NextResponse.next())
    }

    // Run i18n middleware first
    const intlResponse = intlMiddleware(request)

    // Extract locale from pathname
    const pathnameLocale = pathname.split('/')[1]
    const isValidLocale = routing.locales.includes(pathnameLocale as any)

    if (!isValidLocale) {
        return intlResponse
    }

    // Get pathname without locale
    const pathnameWithoutLocale =
        pathname.replace(`/${pathnameLocale}`, '') || '/'

    // Run auth middleware
    const authMiddleware = createAuthMiddleware(
        pathnameLocale,
        pathnameWithoutLocale,
    )
    const authResponse = await authMiddleware(request)

    // If auth middleware returns a response (redirect), use it
    if (authResponse) {
        return authResponse
    }

    // Otherwise, use i18n response
    return intlResponse
}

export const config = {
    matcher: ['/', '/(vi|en)/:path*', '/api/:path*', '/((?!_next|_vercel|.*\\..*).*)'],
}
