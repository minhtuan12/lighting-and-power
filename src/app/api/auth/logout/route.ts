import { revalidateTag } from "next/cache"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
    const cookieStore = await cookies()
    cookieStore.delete("accessToken")
    cookieStore.delete("refreshToken")
    revalidateTag("user", { expire: 0 })
    revalidateTag("me", { expire: 0 })

    return NextResponse.json({ success: true })
}
