import { ICategory } from '@/types/category';
import mongoose, { Schema } from 'mongoose';

const CategorySchema = new Schema<ICategory>(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
            maxlength: [100, 'Category name cannot exceed 100 characters']
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters']
        },
        parentId: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            default: null
        },
        level: {
            type: Number,
            default: 0,
            min: 0,
            max: 3 // Giới hạn 4 cấp (0,1,2,3)
        },
        isActive: {
            type: Boolean,
            default: true
        },
        metaTitle: {
            type: String,
            trim: true,
            maxlength: [70, 'Meta title cannot exceed 70 characters']
        },
        metaDescription: {
            type: String,
            trim: true,
            maxlength: [160, 'Meta description cannot exceed 160 characters']
        },
        metaKeywords: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Index for better query performance
CategorySchema.index({ slug: 1 });
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ level: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ order: 1 });

// Virtual for subcategories
CategorySchema.virtual('children', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parentId'
});

// Pre-save middleware to generate slug
CategorySchema.pre('save', async function () {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
});

const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
