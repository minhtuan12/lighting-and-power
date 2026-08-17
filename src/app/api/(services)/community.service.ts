import CommunityComment from "@/models/community-comment"
import CommunityLike from "@/models/community-like"
import CommunityPost from "@/models/community-post"
import User from "@/models/user"
import { ECommunityPostType, ECommunityVisibility } from "@/types/community"
import mongoose from "mongoose"

const authorFields = "fullName username avatar role"

function id(value: string) {
    if (!mongoose.isValidObjectId(value)) throw new Error("Invalid community id")
    return new mongoose.Types.ObjectId(value)
}

async function withLikeState(posts: any[], userId?: string) {
    if (!userId || posts.length === 0) return posts
    const liked = await CommunityLike.find({
        userId: id(userId),
        postId: { $in: posts.map((post) => post._id) },
    }).lean()
    const likedIds = new Set(liked.map((item) => item.postId.toString()))
    return posts.map((post) => ({ ...post, likedByMe: likedIds.has(post._id.toString()) }))
}

function serialize(value: any) {
    return JSON.parse(JSON.stringify(value))
}

export const CommunityService = {
    async getStats() {
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        const activeSince = new Date(Date.now() - 30 * 60 * 1000)
        const [members, postsToday, activeUsers, topics] = await Promise.all([
            User.countDocuments({ role: { $ne: "admin" } }),
            CommunityPost.countDocuments({ createdAt: { $gte: startOfDay } }),
            CommunityPost.distinct("authorId", { createdAt: { $gte: activeSince } }),
            CommunityPost.aggregate([
                { $match: { visibility: ECommunityVisibility.public, tags: { $exists: true, $ne: [] } } },
                { $unwind: "$tags" },
                { $group: { _id: "$tags", count: { $sum: 1 } } },
                { $sort: { count: -1, _id: 1 } },
                { $limit: 8 },
            ]),
        ])
        return { members, postsToday, activeUsers: activeUsers.length, topics: topics.map((topic) => topic._id) }
    },

    async listPosts(options: { page: number; limit: number; userId?: string; mine?: boolean }) {
        const filter: Record<string, any> = options.mine
            ? { authorId: id(options.userId!), visibility: { $in: Object.values(ECommunityVisibility) } }
            : { visibility: ECommunityVisibility.public }
        const skip = (options.page - 1) * options.limit
        const [posts, total] = await Promise.all([
            CommunityPost.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(options.limit)
                .populate({ path: "authorId", select: authorFields })
                .lean(),
            CommunityPost.countDocuments(filter),
        ])
        const shaped = posts.map((post: any) => ({ ...post, author: post.authorId, authorId: undefined }))
        return { posts: serialize(await withLikeState(shaped, options.userId)), total, page: options.page, limit: options.limit }
    },

    async getPost(postId: string, userId?: string) {
        const post: any = await CommunityPost.findById(id(postId))
            .populate({ path: "authorId", select: authorFields })
            .lean()
        if (!post || (post.visibility === ECommunityVisibility.private && post.authorId?._id.toString() !== userId)) return null
        const [shaped] = await withLikeState([{ ...post, author: post.authorId, authorId: undefined }], userId)
        return serialize(shaped)
    },

    async createPost(userId: string, input: any) {
        const title = String(input.title || "").trim()
        const content = String(input.content || "").trim()
        if (!title || !content) throw new Error("Title and content are required")
        const created: any = await CommunityPost.create({
            authorId: id(userId),
            title,
            content,
            type: Object.values(ECommunityPostType).includes(input.type) ? input.type : ECommunityPostType.post,
            visibility: input.visibility === ECommunityVisibility.private ? ECommunityVisibility.private : ECommunityVisibility.public,
            mediaUrl: input.mediaUrl ? String(input.mediaUrl).trim() : undefined,
            tags: Array.isArray(input.tags) ? input.tags.map(String).slice(0, 8) : [],
        })
        return this.getPost(created._id.toString(), userId)
    },

    async toggleLike(postId: string, userId: string) {
        const post = await CommunityPost.findById(id(postId))
        if (!post) throw new Error("Post not found")
        const existing = await CommunityLike.findOne({ postId: post._id, userId: id(userId) })
        if (existing) {
            await existing.deleteOne()
            await CommunityPost.updateOne({ _id: post._id, likesCount: { $gt: 0 } }, { $inc: { likesCount: -1 } })
            return { liked: false, likesCount: Math.max(0, post.likesCount - 1) }
        }
        await CommunityLike.create({ postId: post._id, userId: id(userId) })
        await CommunityPost.updateOne({ _id: post._id }, { $inc: { likesCount: 1 } })
        return { liked: true, likesCount: post.likesCount + 1 }
    },

    async listComments(postId: string) {
        const comments: any[] = await CommunityComment.find({ postId: id(postId) })
            .sort({ createdAt: 1 }).populate({ path: "authorId", select: authorFields }).lean()
        return serialize(comments.map((comment) => ({ ...comment, author: comment.authorId, authorId: undefined })))
    },

    async createComment(postId: string, userId: string, content: string, parentId?: string) {
        const post = await CommunityPost.findById(id(postId))
        if (!post) throw new Error("Post not found")
        if (!content.trim()) throw new Error("Comment content is required")
        const comment: any = await CommunityComment.create({ postId: post._id, authorId: id(userId), content: content.trim(), parentId: parentId ? id(parentId) : null })
        await CommunityPost.updateOne({ _id: post._id }, { $inc: { commentsCount: 1 } })
        return serialize(await CommunityComment.findById(comment._id).populate({ path: "authorId", select: authorFields }).lean().then((item: any) => ({ ...item, author: item.authorId, authorId: undefined })))
    },

    async share(postId: string) {
        const post = await CommunityPost.findByIdAndUpdate(id(postId), { $inc: { sharesCount: 1 } }, { new: true })
        if (!post) throw new Error("Post not found")
        return { sharesCount: post.sharesCount }
    },

    async updatePost(postId: string, userId: string, input: any) {
        const post = await CommunityPost.findOne({ _id: id(postId), authorId: id(userId) })
        if (!post) throw new Error("Post not found")
        if (input.title !== undefined) post.title = String(input.title).trim()
        if (input.content !== undefined) post.content = String(input.content).trim()
        if (input.visibility !== undefined) post.visibility = input.visibility
        if (input.mediaUrl !== undefined) post.mediaUrl = String(input.mediaUrl).trim()
        await post.save()
        return this.getPost(postId, userId)
    },

    async deletePost(postId: string, userId: string) {
        const post = await CommunityPost.findOneAndDelete({ _id: id(postId), authorId: id(userId) })
        if (!post) throw new Error("Post not found")
        await Promise.all([CommunityComment.deleteMany({ postId: post._id }), CommunityLike.deleteMany({ postId: post._id })])
    },
}
