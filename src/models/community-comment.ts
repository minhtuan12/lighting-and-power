import mongoose, { Schema } from "mongoose"

const CommunityCommentSchema = new Schema(
    {
        postId: {
            type: Schema.Types.ObjectId,
            ref: "CommunityPost",
            required: true,
            index: true,
        },
        authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true, trim: true, maxlength: 3000 },
        parentId: { type: Schema.Types.ObjectId, ref: "CommunityComment", default: null },
    },
    { timestamps: true },
)

CommunityCommentSchema.index({ postId: 1, createdAt: 1 })

export default mongoose.models.CommunityComment ||
    mongoose.model("CommunityComment", CommunityCommentSchema)
