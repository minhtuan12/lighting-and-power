import C2CProduct from "@/models/c2c-product"
import mongoose from "mongoose"

const sellerFields = "fullName username avatar role"

function id(value: string) {
    if (!mongoose.isValidObjectId(value)) throw new Error("Invalid product id")
    return new mongoose.Types.ObjectId(value)
}

function serialize(value: any) {
    return JSON.parse(JSON.stringify(value))
}

const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
}

export const C2CService = {
    async listProducts(options: { page: number; limit: number; sort: string }) {
        const filter = { status: "active" }
        const skip = (options.page - 1) * options.limit
        const [products, total] = await Promise.all([
            C2CProduct.find(filter)
                .sort(sortMap[options.sort] || sortMap.newest)
                .skip(skip)
                .limit(options.limit)
                .populate({ path: "sellerId", select: sellerFields })
                .lean(),
            C2CProduct.countDocuments(filter),
        ])

        const shaped = products.map((p: any) => ({ ...p, seller: p.sellerId, sellerId: undefined }))
        return { products: serialize(shaped), total, page: options.page, limit: options.limit }
    },

    async getMyProducts(userId: string, options: { page: number; limit: number }) {
        const filter = { sellerId: id(userId) }
        const skip = (options.page - 1) * options.limit
        const [products, total] = await Promise.all([
            C2CProduct.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(options.limit)
                .lean(),
            C2CProduct.countDocuments(filter),
        ])

        return { products: serialize(products), total, page: options.page, limit: options.limit }
    },

    async getProduct(productId: string) {
        const product: any = await C2CProduct.findById(id(productId))
            .populate({ path: "sellerId", select: sellerFields })
            .lean()
        if (!product) return null
        return serialize({ ...product, seller: product.sellerId, sellerId: undefined })
    },

    async createProduct(userId: string, input: any) {
        const title = String(input.title || "").trim()
        const contactInfo = String(input.contactInfo || "").trim()
        const price = Number(input.price) || 0

        if (!title || !contactInfo || price < 0) {
            throw new Error("Title, contact info, and valid price are required")
        }

        const created: any = await C2CProduct.create({
            sellerId: id(userId),
            title,
            description: input.description ? String(input.description).trim() : "",
            price,
            condition: ["new", "like_new", "used"].includes(input.condition) ? input.condition : "used",
            images: Array.isArray(input.images) ? input.images.map(String).slice(0, 10) : [],
            contactInfo,
            status: "pending"
        })

        return this.getProduct(created._id.toString())
    },

    async updateProduct(productId: string, userId: string, input: any) {
        const product = await C2CProduct.findOne({ _id: id(productId), sellerId: id(userId) })
        if (!product) throw new Error("Product not found or access denied")

        if (input.title !== undefined) product.title = String(input.title).trim()
        if (input.description !== undefined) product.description = String(input.description).trim()
        if (input.price !== undefined) product.price = Math.max(0, Number(input.price) || 0)
        if (input.condition !== undefined && ["new", "like_new", "used"].includes(input.condition)) {
            product.condition = input.condition
        }
        if (input.images !== undefined && Array.isArray(input.images)) {
            product.images = input.images.map(String).slice(0, 10)
        }
        if (input.contactInfo !== undefined) product.contactInfo = String(input.contactInfo).trim()
        if (input.status !== undefined && ["pending", "active", "sold", "hidden", "rejected"].includes(input.status)) {
            product.status = input.status
        }

        await product.save()
        return this.getProduct(productId)
    },

    async deleteProduct(productId: string, userId: string) {
        const product = await C2CProduct.findOneAndDelete({ _id: id(productId), sellerId: id(userId) })
        if (!product) throw new Error("Product not found or access denied")
        return { success: true }
    }
}
