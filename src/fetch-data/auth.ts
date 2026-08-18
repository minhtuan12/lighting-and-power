import { IUser } from "@/types/user"
import { cookies } from "next/headers"

interface IResponse {
    success: boolean
    data?: IUser
    message?: string
}

export async function getCurrentUser(): Promise<IResponse> {
    try {
        const ACCESS_TOKEN_MAX_AGE = 3600 * 24 * 7 * 4 * 12
        const cookieStore = await cookies()
        const accessToken = cookieStore.get("accessToken")?.value

        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL!}/api/auth/me`,
            {
                headers: {
                    Cookie: `accessToken=${accessToken}`,
                },
                cache: "no-store"
            },
        )
        
        console.log(`[getCurrentUser] Fetching ${process.env.NEXT_PUBLIC_API_URL!}/api/auth/me`)
        console.log(`[getCurrentUser] Token present: ${!!accessToken}`)
        console.log(`[getCurrentUser] Response status: ${res.status}`)

        if (!res.ok) {
            const errorText = await res.text().catch(() => 'No text')
            console.log(`[getCurrentUser] Error body: ${errorText}`)
            if (res.status === 401) {
                return {
                    success: false,
                    message: "Unauthorized",
                }
            }
            throw new Error(`Failed to fetch user data: ${res.status} ${errorText}`)
        }

        return res.json()
    } catch (error) {
        console.error("Error fetching current user:", error)
        return {
            success: false,
            message: "Error fetching user",
        }
    }
}

export async function logout(): Promise<void | IResponse> {
    try {
        const cookieStore = await cookies()
        const accessToken = cookieStore.get("accessToken")?.value
        await fetch(`${process.env.NEXT_PUBLIC_API_URL!}/api/auth/logout`, {
            headers: {
                Cookie: `accessToken=${accessToken}`,
            },
        })
    } catch (error) {
        console.error("Error loggin out:", error)
        return {
            success: false,
            message: "Error logging out",
        }
    }
}
