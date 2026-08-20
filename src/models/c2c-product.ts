import mongoose, { Schema } from "mongoose"

const C2CProductSchema = new Schema(
    {
        sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true, trim: true, maxlength: 200 },
        description: { type: String, trim: true, maxlength: 5000 },
        price: { type: Number, required: true, min: 0 },
        condition: {
            type: String,
            enum: ["new", "like_new", "used"],
            default: "used",
        },
        images: { type: [String], default: [] },
        contactInfo: { type: String, required: true, trim: true, maxlength: 100 },
        status: {
            type: String,
            enum: ["pending", "active", "sold", "hidden", "rejected"],
            default: "pending",
        },
    },
    { timestamps: true }
)

C2CProductSchema.index({ status: 1, createdAt: -1 })
C2CProductSchema.index({ sellerId: 1, createdAt: -1 })

if (mongoose.models.C2CProduct) {
    delete mongoose.models.C2CProduct
}

export default mongoose.model("C2CProduct", C2CProductSchema)
