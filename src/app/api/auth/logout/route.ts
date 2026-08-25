import { getCookieDomain } from "@/lib/cookie"; // hàm dùng chung với login
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const host = request.headers.get('host') || request.nextUrl.hostname
    const cookieDomain = getCookieDomain(host) // '.domain.com' hoặc undefined (dev)

    const response = NextResponse.json({ success: true })

    // Chỉ cần xoá đúng domain thật + host-only (phòng cookie cũ set trước khi fix)
    const domainsToClear = [cookieDomain, undefined]

    domainsToClear.forEach(domain => {
        const domainStr = domain ? `; Domain=${domain}` : ''
        response.headers.append(
            'Set-Cookie',
            `accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT${domainStr}`,
        )
        response.headers.append(
            'Set-Cookie',
            `refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT${domainStr}`,
        )
    })

    revalidateTag("user", { expire: 0 })
    revalidateTag("me", { expire: 0 })

    return response
}
