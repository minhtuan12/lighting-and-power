import { IComment } from '@/types/comment'
import mongoose, { Schema } from 'mongoose'

const CommentSchema = new Schema(
	{
		replyTo: {
			type: Schema.Types.ObjectId,
			ref: 'Comment',
			default: null,
		},
		productId: {
			type: Schema.Types.ObjectId,
			ref: 'Product',
			required: true,
		},
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			default: null,
		},
		content: {
			type: String,
			required: true,
			trim: true,
			maxlength: 1000,
		},
		imageUrl: {
			type: String,
			default: null,
		},
	},
	{
		timestamps: true,
	},
)

CommentSchema.index({ userId: 1, productId: 1 })
CommentSchema.index({ createdAt: -1 })

const Comment =
	mongoose.models.Comment ||
	mongoose.model<IComment>('Comment', CommentSchema)

export default Comment
