import { IDocumentCategory } from "@/types/document-category"
import mongoose, { Schema } from "mongoose"

const DocumentCategorySchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: [100, "Name cannot exceed 100 characters"],
        },
        slug: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, "Description cannot exceed 500 characters"],
        },
        color: {
            type: String,
            default: "blue",
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        order: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
)

DocumentCategorySchema.index({ name: "text" })
DocumentCategorySchema.index({ slug: 1 })
DocumentCategorySchema.index({ isPublished: 1 })
DocumentCategorySchema.index({ order: 1, createdAt: -1 })

const DocumentCategory =
    mongoose.models.DocumentCategory ||
    mongoose.model<IDocumentCategory>("DocumentCategory", DocumentCategorySchema)

export default DocumentCategory
