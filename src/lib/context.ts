import { NextRequest } from "next/server"

interface UserMetadata {
    userId?: string
    role?: string
    email?: string
    locale?: string
    [key: string]: any
}

const requestMetadata = new WeakMap<NextRequest, UserMetadata>()

export function setRequestUser(request: NextRequest, user: UserMetadata) {
    requestMetadata.set(request, user)
}

export function getRequestUser(request: NextRequest): UserMetadata | undefined {
    return requestMetadata.get(request)
}

export function hasRequestUser(request: NextRequest): boolean {
    return requestMetadata.has(request)
}
