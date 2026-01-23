import { EProductStatus, EProductTag, IPriceTier, IProduct } from '@/types/product';
import mongoose, { Schema } from 'mongoose';

const PriceTierSchema = new Schema({
    minQuantity: {
        type: Number,
        required: [true, 'Minimum quantity is required'],
        min: [1, 'Minimum quantity must be at least 1']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    }
}, { _id: false });

const ProductSpecificationSchema = new Schema({
    name: { type: String, trim: true },
    value: { type: String, trim: true },
    unit: { type: String, trim: true }
}, { _id: false });

const ProductSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
            maxlength: [200, 'Product name cannot exceed 200 characters']
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true
        },
        sku: {
            type: String,
            required: [true, 'SKU is required'],
            unique: true,
            uppercase: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        shortDescription: {
            type: String,
            trim: true,
            maxlength: [500, 'Short description cannot exceed 500 characters']
        },
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Category is required']
        },
        manufacturer: {
            type: String,
            trim: true
        },
        origin: {
            type: String,
            trim: true
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative']
        },
        priceTiers: {
            type: [PriceTierSchema],
            default: [],
            validate: {
                validator: function (tiers: IPriceTier[]) {
                    if (tiers.length === 0) return true;
                    // Kiểm tra các tier được sắp xếp theo minQuantity tăng dần
                    for (let i = 1; i < tiers.length; i++) {
                        if (tiers[i].minQuantity <= tiers[i - 1].minQuantity) {
                            return false;
                        }
                    }
                    return true;
                },
                message: 'Price tiers must be sorted by minQuantity in ascending order'
            }
        },
        stock: {
            type: Number,
            required: true,
            default: 0,
            min: [0, 'Stock cannot be negative']
        },
        lowStockThreshold: {
            type: Number,
            default: 10,
            min: 0
        },
        unit: {
            type: String,
            required: true,
            default: 'cái',
            trim: true
        },
        minOrderQuantity: {
            type: Number,
            default: 1,
            min: 1
        },
        images: {
            type: [String],
            default: []
        },
        thumbnail: {
            type: String,
            trim: true
        },
        specifications: {
            type: [ProductSpecificationSchema],
            default: []
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
        },
        datasheet: {
            type: String,
            trim: true
        },
        weight: {
            type: Number,
            min: 0
        },
        dimensions: {
            length: { type: Number, min: 0 },
            width: { type: Number, min: 0 },
            height: { type: Number, min: 0 }
        },
        status: {
            type: String,
            enum: Object.values(EProductStatus),
            default: EProductStatus.draft
        },
        isFeatured: {
            type: Boolean,
            default: false
        },
        tags: {
            type: [String],
            enum: Object.values(EProductTag),
            default: []
        },
        relatedProducts: {
            type: [Schema.Types.ObjectId],
            ref: 'Product',
            default: []
        },
        viewCount: {
            type: Number,
            default: 0,
            min: 0
        },
        soldCount: {
            type: Number,
            default: 0,
            min: 0
        },
        rating: {
            type: Number,
            min: 0,
            max: 5
        },
        reviewCount: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Indexes
ProductSchema.index({ slug: 1 });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ name: 'text', shortDescription: 'text' });
ProductSchema.index({ price: 1 });
ProductSchema.index({ soldCount: -1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ createdAt: -1 });

// Compound indexes
ProductSchema.index({ categoryId: 1, status: 1 });
ProductSchema.index({ status: 1, isFeatured: -1, soldCount: -1 });

// Virtual for category info
ProductSchema.virtual('category', {
    ref: 'Category',
    localField: 'categoryId',
    foreignField: '_id',
    justOne: true
});

const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
