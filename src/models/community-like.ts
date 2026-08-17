import mongoose, { Schema } from "mongoose"

const CommunityLikeSchema = new Schema(
    {
        postId: { type: Schema.Types.ObjectId, ref: "CommunityPost", required: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true },
)

CommunityLikeSchema.index({ postId: 1, userId: 1 }, { unique: true })

export default mongoose.models.CommunityLike ||
    mongoose.model("CommunityLike", CommunityLikeSchema)
