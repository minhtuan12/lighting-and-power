import mongoose, { Schema } from "mongoose"
import {
    ECommunityPostType,
    ECommunityVisibility,
} from "@/types/community"

const CommunityPostSchema = new Schema(
    {
        authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        type: {
            type: String,
            enum: Object.values(ECommunityPostType),
            default: ECommunityPostType.post,
        },
        visibility: {
            type: String,
            enum: Object.values(ECommunityVisibility),
            default: ECommunityVisibility.public,
        },
        title: { type: String, required: true, trim: true, maxlength: 180 },
        content: { type: String, required: true, trim: true, maxlength: 10000 },
        mediaUrl: { type: String, trim: true, maxlength: 2000 },
        tags: { type: [String], default: [] },
        likesCount: { type: Number, default: 0, min: 0 },
        commentsCount: { type: Number, default: 0, min: 0 },
        sharesCount: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true },
)

CommunityPostSchema.index({ visibility: 1, createdAt: -1 })
CommunityPostSchema.index({ authorId: 1, createdAt: -1 })

export default mongoose.models.CommunityPost ||
    mongoose.model("CommunityPost", CommunityPostSchema)
