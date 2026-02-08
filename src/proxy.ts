import createIntlMiddleware from 'next-intl/middleware'
import { revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { routes } from './constants/routes'
import { getCurrentUser } from './fetch-data/auth'
import { routing } from './i18n/routing'
import { EUserRole } from './types/user'

const protectedRoutes = [routes.gioHang.url, routes.taiLieuDienTu.url]

const authRoutes = [routes.dangKy.url, routes.dangNhap.url]

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
                revalidateTag('user', { expire: 0 })
                revalidateTag('me', { expire: 0 })
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
    const authResponse = authMiddleware(request)

    // If auth middleware returns a response (redirect), use it
    if (authResponse) {
        return authResponse
    }

    // Otherwise, use i18n response
    return intlResponse
}

export const config = {
    matcher: ['/', '/(vi|en|zh)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
}
