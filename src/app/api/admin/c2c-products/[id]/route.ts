import C2CProduct from "@/models/c2c-product"
import { withMiddleware } from "@/lib/api-handler"
import { connectDbMiddleware } from "@/lib/middleware/connect-db"
import { verifyToken } from "@/lib/middleware"
import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"

type RouteContext = { params: Promise<{ id: string }> }

async function updateAdminC2CProduct(request: NextRequest, context?: RouteContext) {
    try {
        const { id } = await context!.params
        const input = await request.json()

        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 })
        }

        const product = await C2CProduct.findById(id)
        if (!product) {
            return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 })
        }

        if (input.status && ["pending", "active", "sold", "hidden", "rejected"].includes(input.status)) {
            product.status = input.status
        }

        await product.save()

        return NextResponse.json({ success: true, data: product })
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 })
    }
}

export const PUT = withMiddleware(updateAdminC2CProduct, connectDbMiddleware, verifyToken)
