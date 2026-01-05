import { PAGE_LIMIT } from '@/constants/common';
import { SlugGenerator } from '@/lib/slug';
import Category from '@/models/category';
import Product from '@/models/product';

export class ProductService {

    // ================= CREATE =================

    static async create(data: {
        name: string;
        sku: string;
        description?: string;
        shortDescription?: string;
        categoryId: string;
        manufacturer?: string;
        origin?: string;
        price: number;
        priceTiers?: Array<{ minQuantity: number; price: number }>;
        stock: number;
        lowStockThreshold?: number;
        unit?: string;
        minOrderQuantity?: number;
        images?: string[];
        thumbnail?: string;
        specifications?: Array<{ name: string; value: string; unit?: string }>;
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string;
        datasheet?: string;
        weight?: number;
        dimensions?: { length?: number; width?: number; height?: number };
        status?: string;
        isFeatured?: boolean;
        tags?: string[];
        relatedProducts?: string[];
    }) {
        // Validate required fields
        if (!data.name) {
            throw new Error('Product name is required');
        }
        if (!data.categoryId) {
            throw new Error('Category is required');
        }
        if (data.price === undefined || data.price === null) {
            throw new Error('Price is required');
        }

        // Verify category exists
        const category = await Category.findById(data.categoryId);
        if (!category) {
            throw new Error('Category not found');
        }

        // Generate slug
        const slug = await SlugGenerator.generateUniqueSlug(data.name, Product);

        // Validate related products exist
        if (data.relatedProducts && data.relatedProducts.length > 0) {
            const relatedCount = await Product.countDocuments({
                _id: { $in: data.relatedProducts }
            });
            if (relatedCount !== data.relatedProducts.length) {
                throw new Error('Some related products do not exist');
            }
        }

        const product = await Product.create({
            ...data,
            slug
        });

        return product.populate('category');
    }

    // ================= READ =================

    static async getAll(filters?: {
        categoryId?: string;
        status?: string;
        isFeatured?: boolean;
        tags?: string[];
        search?: string;
        minPrice?: number;
        maxPrice?: number;
        sortBy?: 'name' | 'price' | 'soldCount' | 'rating' | 'newest';
        sortOrder?: 'asc' | 'desc';
        page: number;
    }) {
        const query: any = {};

        if (filters?.categoryId) {
            query.categoryId = filters.categoryId;
        }

        if (filters?.status) {
            query.status = filters.status;
        }

        if (filters?.isFeatured !== undefined) {
            query.isFeatured = filters.isFeatured;
        }

        if (filters?.tags && filters.tags.length > 0) {
            query.tags = { $in: filters.tags };
        }

        if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
            query.price = {};
            if (filters.minPrice !== undefined) {
                query.price.$gte = filters.minPrice;
            }
            if (filters.maxPrice !== undefined) {
                query.price.$lte = filters.maxPrice;
            }
        }

        if (filters?.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { shortDescription: { $regex: filters.search, $options: 'i' } },
                { sku: { $regex: filters.search, $options: 'i' } }
            ];
        }

        // Sorting
        let sortObject: any = { createdAt: -1 };
        if (filters?.sortBy) {
            switch (filters.sortBy) {
                case 'price':
                    sortObject = { price: filters.sortOrder === 'asc' ? 1 : -1 };
                    break;
                case 'soldCount':
                    sortObject = { soldCount: filters.sortOrder === 'asc' ? 1 : -1 };
                    break;
                case 'rating':
                    sortObject = { rating: filters.sortOrder === 'asc' ? 1 : -1 };
                    break;
                case 'name':
                    sortObject = { name: filters.sortOrder === 'asc' ? 1 : -1 };
                    break;
                case 'newest':
                default:
                    sortObject = { createdAt: -1 };
            }
        }

        const page = filters?.page || 1;
        const skip = (page - 1) * PAGE_LIMIT;

        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort(sortObject)
            .skip(skip)
            .limit(PAGE_LIMIT)
            .populate('category')
            .lean();

        const totalPages = Math.ceil(total / PAGE_LIMIT);

        return { products, totalPages, total, page };
    }

    static async getById(id: string) {
        const product = await Product.findById(id)
            .populate('category')
            .populate('relatedProducts');
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    }

    static async getBySlug(slug: string) {
        const product = await Product.findOne({ slug })
            .populate('category')
            .populate('relatedProducts');
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    }

    static async getBySku(sku: string) {
        const product = await Product.findOne({ sku: sku.toUpperCase() })
            .populate('category');
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    }

    static async getFeatured(limit: number = 10) {
        const products = await Product.find({
            isFeatured: true,
            status: 'active'
        })
            .sort({ soldCount: -1 })
            .limit(limit)
            .populate('category')
            .lean();

        return products;
    }

    static async getRelated(productId: string, limit: number = 6) {
        const product = await Product.findById(productId).lean();
        if (!product) {
            throw new Error('Product not found');
        }

        const related = await Product.find({
            _id: { $ne: productId },
            categoryId: product.categoryId,
            status: 'active'
        })
            .limit(limit)
            .populate('category')
            .lean();

        return related;
    }

    static async incrementViewCount(productId: string) {
        await Product.findByIdAndUpdate(
            productId,
            { $inc: { viewCount: 1 } }
        );
    }

    // ================= UPDATE =================

    static async update(id: string, data: Partial<Parameters<typeof this.create>[0]>) {
        const product = await Product.findById(id);
        if (!product) {
            throw new Error('Product not found');
        }

        // Update slug if name changed
        if (data.name && data.name !== product.name) {
            const newSlug = await SlugGenerator.generateUniqueSlug(
                data.name,
                Product,
                { excludeId: id }
            );
            product.slug = newSlug;
        }

        // Verify category exists if provided
        if (data.categoryId && data.categoryId !== product.categoryId.toString()) {
            const category = await Category.findById(data.categoryId);
            if (!category) {
                throw new Error('Category not found');
            }
        }

        // Validate related products if provided
        if (data.relatedProducts && data.relatedProducts.length > 0) {
            const relatedCount = await Product.countDocuments({
                _id: { $in: data.relatedProducts }
            });
            if (relatedCount !== data.relatedProducts.length) {
                throw new Error('Some related products do not exist');
            }
        }

        // Update fields
        Object.keys(data).forEach(key => {
            if (data[key as keyof typeof data] !== undefined) {
                (product as any)[key] = data[key as keyof typeof data];
            }
        });

        await product.save();
        return product.populate('category');
    }

    static async updateStock(productId: string, quantity: number) {
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Product not found');
        }

        const newStock = product.stock + quantity;
        if (newStock < 0) {
            throw new Error('Insufficient stock');
        }

        product.stock = newStock;

        // Update status based on stock
        if (newStock === 0) {
            product.status = 'out_of_stock';
        } else if (product.status === 'out_of_stock') {
            product.status = 'active';
        }

        await product.save();
        return product;
    }

    static async incrementSoldCount(productId: string, quantity: number = 1) {
        const result = await Product.findByIdAndUpdate(
            productId,
            { $inc: { soldCount: quantity } },
            { new: true }
        );
        return result;
    }

    // ================= DELETE =================

    static async delete(id: string) {
        const product = await Product.findById(id);
        if (!product) {
            throw new Error('Product not found');
        }

        await Product.findByIdAndDelete(id);

        // Remove from relatedProducts of other products
        await Product.updateMany(
            { relatedProducts: id },
            { $pull: { relatedProducts: id } }
        );

        return { success: true, message: 'Product deleted successfully' };
    }

    static async deleteMany(ids: string[]) {
        const result = await Product.deleteMany({ _id: { $in: ids } });

        // Remove from relatedProducts
        await Product.updateMany(
            { relatedProducts: { $in: ids } },
            { $pull: { relatedProducts: { $in: ids } } }
        );

        return {
            success: true,
            message: `${result.deletedCount} products deleted successfully`,
            deletedCount: result.deletedCount
        };
    }

    // ================= BULK OPERATIONS =================

    static async bulkUpdateStatus(ids: string[], status: string) {
        const result = await Product.updateMany(
            { _id: { $in: ids } },
            { status }
        );

        return {
            success: true,
            message: `${result.modifiedCount} products updated`,
            modifiedCount: result.modifiedCount
        };
    }

    static async bulkUpdateFeatured(ids: string[], isFeatured: boolean) {
        const result = await Product.updateMany(
            { _id: { $in: ids } },
            { isFeatured }
        );

        return {
            success: true,
            message: `${result.modifiedCount} products updated`,
            modifiedCount: result.modifiedCount
        };
    }

    static async bulkAddTags(ids: string[], tags: string[]) {
        const result = await Product.updateMany(
            { _id: { $in: ids } },
            { $addToSet: { tags: { $each: tags } } }
        );

        return {
            success: true,
            message: `Tags added to ${result.modifiedCount} products`,
            modifiedCount: result.modifiedCount
        };
    }

    // ================= ANALYTICS =================

    static async getStats() {
        const stats = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalStock: { $sum: '$stock' },
                    avgPrice: { $avg: '$price' },
                    avgRating: { $avg: '$rating' },
                    totalSold: { $sum: '$soldCount' },
                    totalViews: { $sum: '$viewCount' },
                    activeProducts: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    outOfStock: {
                        $sum: { $cond: [{ $eq: ['$status', 'out_of_stock'] }, 1, 0] }
                    }
                }
            }
        ]);

        return stats[0] || {};
    }

    static async getCategoryStats(categoryId: string) {
        const stats = await Product.aggregate([
            { $match: { categoryId: { $oid: categoryId } } },
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalStock: { $sum: '$stock' },
                    avgPrice: { $avg: '$price' },
                    avgRating: { $avg: '$rating' },
                    totalSold: { $sum: '$soldCount' }
                }
            }
        ]);

        return stats[0] || {};
    }
}
