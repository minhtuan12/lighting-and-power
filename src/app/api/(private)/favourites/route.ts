import Favourite from "@/models/favourite"
import { withMiddleware } from "@/lib/api-handler"
import { getRequestUser } from "@/lib/context"
import { verifyToken } from "@/lib/middleware"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { NextRequest, NextResponse } from "next/server"

async function getFavourites(request: NextRequest) {
    const user = getRequestUser(request)
    const items = await Favourite.find({ userId: user?.userId }).select("productId").lean()
    return NextResponse.json({ success: true, data: items.map((item) => String(item.productId)) })
}

async function addFavourite(request: NextRequest) {
    const user = getRequestUser(request)
    const { productId } = await request.json()
    if (!productId || !/^[a-f\d]{24}$/i.test(productId)) return NextResponse.json({ success: false, message: "Invalid product" }, { status: 400 })
    await Favourite.updateOne({ userId: user?.userId, productId }, { $setOnInsert: { userId: user?.userId, productId } }, { upsert: true })
    return NextResponse.json({ success: true })
}

async function removeFavourite(request: NextRequest) {
    const user = getRequestUser(request)
    const { searchParams } = new URL(request.url)
    await Favourite.deleteOne({ userId: user?.userId, productId: searchParams.get("productId") })
    return NextResponse.json({ success: true })
}

export const GET = withMiddleware(getFavourites, connectDbMiddleware, verifyToken)
export const POST = withMiddleware(addFavourite, connectDbMiddleware, verifyToken)
export const DELETE = withMiddleware(removeFavourite, connectDbMiddleware, verifyToken)
