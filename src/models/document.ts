import { IDocument } from '@/types/document';
import mongoose, { Schema } from 'mongoose';

const DocumentSchema = new Schema(
    {
        productIds: {
            type: [Schema.Types.ObjectId],
            ref: 'Product',
            default: []
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters']
        },
        type: {
            type: String,
            enum: ['introduction', 'knowledge', 'guide', 'manual', 'other'],
            default: 'other'
        },
        contentType: {
            type: String,
            enum: ['file', 'text'],
            required: [true, 'Content type is required']
        },
        content: {
            type: String,
            trim: true
        },
        fileUrl: {
            type: String,
            trim: true
        },
        fileName: {
            type: String,
            trim: true
        },
        fileSize: {
            type: Number,
            min: 0
        },
        mimeType: {
            type: String,
            trim: true
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        tags: {
            type: [String],
            default: []
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        order: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Indexes
DocumentSchema.index({ title: 'text', description: 'text' });
DocumentSchema.index({ productIds: 1 });
DocumentSchema.index({ type: 1 });
DocumentSchema.index({ isPublished: 1 });
DocumentSchema.index({ createdAt: -1 });

const Document = mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);

export default Document;
