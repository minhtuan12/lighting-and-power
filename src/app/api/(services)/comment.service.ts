import Comment from '@/models/comment'
import { Types } from 'mongoose'

export class CommentService {
    // Create a new comment
    static async createComment(
        userId: string | null,
        data: {
            productId: string
            content: string
            imageUrl?: string
            replyTo?: string | null
        },
    ) {
        const comment = await Comment.create({
            userId: userId ?? null,
            productId: data.productId,
            content: data.content,
            imageUrl: data.imageUrl ?? null,
            replyTo: data.replyTo ?? null,
        })

        return comment
    }

    // Update a comment
    static async updateComment(
        userId: string,
        commentId: string,
        data: {
            content?: string
            imageUrl?: string | null
        },
    ) {
        const comment = await Comment.findOne({
            _id: commentId,
            userId,
        })

        if (!comment) {
            throw new Error('Comment not found')
        }

        if (data.content !== undefined) comment.content = data.content
        if (data.imageUrl !== undefined) comment.imageUrl = data.imageUrl

        await comment.save()

        return comment
    }

    // Delete a comment
    static async deleteComment(userId: string, commentId: string) {
        const comment = await Comment.findOne({
            _id: commentId,
            userId,
        })

        if (!comment) {
            throw new Error('Comment not found')
        }

        await Comment.deleteOne({ _id: commentId })

        return { success: true }
    }

    // Get all comments
    static async getAll(options?: { page?: number; limit?: number }) {
        const page = options?.page || 1
        const limit = options?.limit || 10
        const skip = (page - 1) * limit

        const [comments, total] = await Promise.all([
            Comment.find({ replyTo: null })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'fullName avatar role')
                .lean(),
            Comment.countDocuments({ replyTo: null }),
        ])

        // Fetch replies for each comment
        const commentsWithReplies = await Promise.all(
            comments.map(async (comment) => {
                const replies = await Comment.find({ replyTo: comment._id })
                    .sort({ createdAt: 1 })
                    .populate('userId', 'fullName avatar role')
                    .lean()
                return { ...comment, replies }
            }),
        )

        return {
            comments: commentsWithReplies,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        }
    }

    static async getProductComments(
        productId: string,
        options?: {
            page?: number
            limit?: number
        },
    ) {
        const page = options?.page || 1
        const limit = options?.limit || 10
        const skip = (page - 1) * limit

        const [comments, total] = await Promise.all([
            Comment.find({ productId, replyTo: null })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'fullName avatar role')
                .lean(),
            Comment.countDocuments({ productId, replyTo: null }),
        ])

        // Fetch replies for each comment
        const commentsWithReplies = await Promise.all(
            comments.map(async (comment) => {
                const replies = await Comment.find({ replyTo: comment._id })
                    .sort({ createdAt: 1 })
                    .populate('userId', 'fullName avatar role')
                    .lean()
                return { ...comment, replies }
            }),
        )

        return {
            comments: commentsWithReplies,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        }
    }

    // Get all comments by a user
    static async getUserComments(
        userId: string,
        options?: {
            page?: number
            limit?: number
        },
    ) {
        const page = options?.page || 1
        const limit = options?.limit || 10
        const skip = (page - 1) * limit

        const [comments, total] = await Promise.all([
            Comment.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('productId', 'name slug thumbnail')
                .lean(),
            Comment.countDocuments({ userId }),
        ])

        return {
            comments,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        }
    }

    // Get a single comment by ID
    static async getCommentById(commentId: string) {
        if (!Types.ObjectId.isValid(commentId)) {
            throw new Error('Invalid comment ID')
        }

        const comment = await Comment.findById(commentId)
            .populate('userId', 'fullName avatar role')
            .populate('productId', 'name slug thumbnail')
            .lean()

        if (!comment) {
            throw new Error('Comment not found')
        }

        // Fetch replies for this comment
        const replies = await Comment.find({ replyTo: comment._id })
            .sort({ createdAt: 1 })
            .populate('userId', 'fullName avatar role')
            .lean()

        return { ...comment, replies }
    }
}
