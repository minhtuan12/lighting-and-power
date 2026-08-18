import { revalidateTag } from "next/cache"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
    const cookieStore = await cookies()
    const host = request.headers.get('host') || request.nextUrl.hostname
    const hostname = host.split(':')[0]
    const cookieDomain = hostname.endsWith('localhost') ? undefined : `.${hostname.replace(/^www\./, '')}`
    const rootDomain = hostname.endsWith('localhost') ? undefined : `.${hostname.replace(/^(c2c|www)\./, '')}`
    
    const response = NextResponse.json({ success: true })

    const domainsToClear = [cookieDomain]
    if (rootDomain !== cookieDomain) {
        domainsToClear.push(rootDomain)
    }
    domainsToClear.push(undefined) // fallback host-only

    domainsToClear.forEach(domain => {
        const domainStr = domain ? `; Domain=${domain}` : ''
        response.headers.append('Set-Cookie', `accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT${domainStr}`)
        response.headers.append('Set-Cookie', `refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT${domainStr}`)
    })

    revalidateTag("user", { expire: 0 })
    revalidateTag("me", { expire: 0 })

    return response
}
