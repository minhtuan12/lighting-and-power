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
    routes.taiLieuDienTu.url,
    routes.trangCaNhan.url,

    '/cart',
    '/documents',
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
        const host = request.headers.get('host') || ''
        const isC2C = host.startsWith('c2c.')

        console.log(`\n[Proxy Middleware] Request URL: ${request.url}`)
        console.log(`[Proxy Middleware] Host: ${host} | isC2C: ${isC2C} | locale: ${locale} | pathnameWithoutLocale: ${pathnameWithoutLocale}`)
        console.log(`[Proxy Middleware] AccessToken present: ${!!accessToken}`)

        if (user) {
            if (
                (request.url.includes('admin') &&
                    user.role === EUserRole.user) ||
                (!request.url.includes('admin') &&
                    user.role === EUserRole.admin)
            ) {
                console.log(`[Proxy Middleware] Role mismatch, clearing session and redirecting to ${request.url}`)
                cookieStore.delete('accessToken')
                return NextResponse.redirect(new URL(request.url))
            }
        }

        // Check auth routes
        const isAuthRoute = authRoutes.some((route) =>
            pathnameWithoutLocale.includes(route) || pathnameWithoutLocale.includes(`${route}.json`),
        )

        console.log(`[Proxy Middleware] isAuthRoute: ${isAuthRoute}`)

        if (isAuthRoute) {
            if (accessToken) {
                console.log(`[Proxy Middleware] Auth route hit with accessToken, redirecting to /${locale}`)
                return NextResponse.redirect(new URL(`/${locale}`, request.url))
            }
        }

        // Check protected routes
        const isProtected = protectedRoutes.some((route) =>
            pathnameWithoutLocale.includes(route),
        ) || pathnameWithoutLocale.includes('/dang-ban') || pathnameWithoutLocale.includes('/quan-ly')

        console.log(`[Proxy Middleware] isProtected: ${isProtected}`)

        if (isProtected && !accessToken) {
            const loginUrl = new URL(`/${locale}`, request.url)
            loginUrl.searchParams.set('login', 'true')
            loginUrl.searchParams.set('redirect', request.url)
            console.log(`[Proxy Middleware] Protected route redirecting to login: ${loginUrl.toString()}`)
            return NextResponse.redirect(loginUrl)
        }

        console.log(`[Proxy Middleware] Allowed path, returning null (no auth redirect)`)
        return null
    }
}

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl
    const host = request.headers.get('host') || ''
    const isC2C = host.startsWith('c2c.')

    if (pathname.startsWith('/api')) {
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, { status: 200, headers: CORS_HEADERS })
        }
        return withCors(NextResponse.next())
    }

    // Run i18n middleware first
    const intlResponse = intlMiddleware(request)

    let effectivePathname = pathname
    if (intlResponse.headers.get('x-middleware-rewrite')) {
        effectivePathname = new URL(intlResponse.headers.get('x-middleware-rewrite')!).pathname
        console.log(`[Proxy Root] i18n rewrite: ${effectivePathname}`)
    } else if (intlResponse.headers.get('location')) {
        const locationStr = intlResponse.headers.get('location')!
        console.log(`[Proxy Root] i18n redirect to: ${locationStr}`)
        try {
            effectivePathname = new URL(locationStr).pathname
        } catch {
            effectivePathname = locationStr.split('?')[0]
        }
    }

    // Extract locale from effectivePathname
    const pathnameLocale = effectivePathname.split('/')[1]
    const isValidLocale = routing.locales.includes(pathnameLocale as any)

    const pathnameWithoutLocale = isValidLocale
        ? effectivePathname.replace(`/${pathnameLocale}`, '') || '/'
        : effectivePathname

    // Run auth middleware
    const authMiddleware = createAuthMiddleware(
        isValidLocale ? pathnameLocale : routing.defaultLocale,
        pathnameWithoutLocale,
    )
    const authResponse = await authMiddleware(request)

    // If auth middleware returns a response (redirect), use it
    if (authResponse) {
        console.log(`[Proxy Root] Returning auth redirect: ${authResponse.headers.get('location')}`)
        return authResponse
    }

    // Rewrite path for C2C routing
    if (isC2C) {
        const rewriteUrlString = intlResponse.headers.get('x-middleware-rewrite')
        const rewriteUrl = rewriteUrlString ? new URL(rewriteUrlString) : new URL(request.url)

        const pathParts = rewriteUrl.pathname.split('/')
        const locale = pathParts[1]

        if (routing.locales.includes(locale as any)) {
            pathParts.splice(2, 0, 'c2c-app')
            rewriteUrl.pathname = pathParts.join('/')
            intlResponse.headers.set('x-middleware-rewrite', rewriteUrl.toString())
            console.log(`[Proxy Root] C2C Rewrote URL to: ${rewriteUrl.pathname}`)
        }
    }

    // Otherwise, use i18n response
    return intlResponse
}

export const config = {
    matcher: ['/', '/(vi|en)/:path*', '/api/:path*', '/((?!_next|_vercel|.*\\..*).*)'],
}
