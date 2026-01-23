import { PAGE_LIMIT } from '@/constants/common';
import { SlugGenerator } from '@/lib/slug';
import Category from '@/models/category';
import Product from '@/models/product';
import { EProductStatus, IProductFilterOptions } from '@/types/product';
import { PipelineStage } from 'mongoose';

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

    static async getAll(filters?: Record<string, any>) {
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

        // ============= 2. MANUFACTURERS =============
        if (filters?.manufacturers && filters.manufacturers.length > 0) {
            query.manufacturer = { $in: filters.manufacturers };
        }

        // ============= 3. ORIGINS =============
        if (filters?.origins && filters.origins.length > 0) {
            query.origin = { $in: filters.origins };
        }

        // ============= 4. UNITS =============
        if (filters?.units && filters.units.length > 0) {
            query.unit = { $in: filters.units };
        }

        // ============= 5. TAGS =============
        if (filters?.tags && filters.tags.length > 0) {
            query.tags = { $in: filters.tags };
        }

        // ============= 6. PRICE RANGE =============
        if (filters?.priceMin !== undefined || filters?.priceMax !== undefined) {
            query.price = {};
            if (filters.priceMin !== undefined) {
                query.price.$gte = filters.priceMin;
            }
            if (filters.priceMax !== undefined) {
                query.price.$lte = filters.priceMax;
            }
        }

        // ============= 8. WEIGHT RANGE =============
        if (filters?.weightMin !== undefined || filters?.weightMax !== undefined) {
            query.weight = { $exists: true, $ne: null };

            if (filters.weightMin !== undefined) {
                query.weight.$gte = filters.weightMin;
            }
            if (filters.weightMax !== undefined) {
                query.weight.$lte = filters.weightMax;
            }
        }

        // ============= 9. DIMENSION RANGES =============
        // Length
        if (filters?.lengthMin !== undefined || filters?.lengthMax !== undefined) {
            query['dimensions.length'] = { $exists: true, $ne: null };

            if (filters.lengthMin !== undefined) {
                query['dimensions.length'].$gte = filters.lengthMin;
            }
            if (filters.lengthMax !== undefined) {
                query['dimensions.length'].$lte = filters.lengthMax;
            }
        }

        // Width
        if (filters?.widthMin !== undefined || filters?.widthMax !== undefined) {
            query['dimensions.width'] = { $exists: true, $ne: null };

            if (filters.widthMin !== undefined) {
                query['dimensions.width'].$gte = filters.widthMin;
            }
            if (filters.widthMax !== undefined) {
                query['dimensions.width'].$lte = filters.widthMax;
            }
        }

        // Height
        if (filters?.heightMin !== undefined || filters?.heightMax !== undefined) {
            query['dimensions.height'] = { $exists: true, $ne: null };

            if (filters.heightMin !== undefined) {
                query['dimensions.height'].$gte = filters.heightMin;
            }
            if (filters.heightMax !== undefined) {
                query['dimensions.height'].$lte = filters.heightMax;
            }
        }

        // ============= 10. SPECIFICATIONS (Dynamic) =============
        if (filters?.specifications && Object.keys(filters.specifications)?.length > 0) {
            const specConditions: any[] = [];

            // Tạo điều kiện cho mỗi specification name
            Object.entries(filters.specifications).forEach(([name, values]: any) => {
                if (values && values.length > 0) {
                    specConditions.push({
                        specifications: {
                            $elemMatch: {
                                name: name,
                                value: { $in: values }
                            }
                        }
                    });
                }
            });

            // Combine tất cả spec conditions với AND logic
            if (specConditions.length > 0) {
                if (!query.$and) {
                    query.$and = [];
                }
                query.$and.push(...specConditions);
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

    // app/api/products/(services)/product.service.ts
    static async getFilterOptions(): Promise<IProductFilterOptions> {
        try {
            const pipeline = [
                {
                    // Chỉ lấy sản phẩm ACTIVE
                    $match: {
                        status: {
                            $nin: [
                                EProductStatus.discontinued,
                                EProductStatus.draft,
                                EProductStatus.outOfStock
                            ]
                        }
                    }
                },
                {
                    $facet: {
                        // 1. Manufacturers
                        manufacturers: [
                            {
                                $match: {
                                    manufacturer: { $exists: true, $nin: [null, ''] }
                                }
                            },
                            {
                                $group: {
                                    _id: '$manufacturer',
                                    count: { $sum: 1 }
                                }
                            },
                            {
                                $project: {
                                    value: '$_id',
                                    count: 1,
                                    _id: 0
                                }
                            },
                            { $sort: { count: -1 } }
                        ],

                        // 2. Origins
                        origins: [
                            {
                                $match: {
                                    origin: { $exists: true, $nin: [null, ''] }
                                }
                            },
                            {
                                $group: {
                                    _id: '$origin',
                                    count: { $sum: 1 }
                                }
                            },
                            {
                                $project: {
                                    value: '$_id',
                                    count: 1,
                                    _id: 0
                                }
                            },
                            { $sort: { count: -1 } }
                        ],

                        // 3. Price Range
                        priceRange: [
                            { $match: { price: { $gt: 0 } } },
                            {
                                $group: {
                                    _id: null,
                                    min: { $min: '$price' },
                                    max: { $max: '$price' }
                                }
                            },
                            { $project: { _id: 0, min: 1, max: 1 } }
                        ],

                        // 4. Categories
                        categories: [
                            {
                                $match: {
                                    categoryId: { $exists: true, $ne: null }
                                }
                            },
                            {
                                $group: {
                                    _id: '$categoryId',
                                    count: { $sum: 1 }
                                }
                            },
                            { $sort: { count: -1 } }
                        ],

                        // 5. Tags
                        tags: [
                            { $match: { tags: { $exists: true, $ne: [] } } },
                            { $unwind: '$tags' },
                            {
                                $group: {
                                    _id: '$tags',
                                    count: { $sum: 1 }
                                }
                            },
                            {
                                $project: {
                                    value: '$_id',
                                    count: 1,
                                    _id: 0
                                }
                            },
                            { $sort: { count: -1 } }
                        ],

                        // 7. Units
                        units: [
                            {
                                $match: {
                                    unit: { $exists: true, $nin: [null, ''] }
                                }
                            },
                            {
                                $group: {
                                    _id: '$unit',
                                    count: { $sum: 1 }
                                }
                            },
                            {
                                $project: {
                                    value: '$_id',
                                    count: 1,
                                    _id: 0
                                }
                            },
                            { $sort: { count: -1 } }
                        ],

                        // 8. Weight Range
                        weightRange: [
                            {
                                $match: {
                                    weight: { $exists: true, $ne: null, $gt: 0 }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    min: { $min: '$weight' },
                                    max: { $max: '$weight' },
                                    hasWeight: { $sum: 1 }
                                }
                            },
                            { $project: { _id: 0 } }
                        ],

                        // 9. Dimension Ranges
                        dimensionLength: [
                            {
                                $match: {
                                    'dimensions.length': { $exists: true, $ne: null, $gt: 0 }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    min: { $min: '$dimensions.length' },
                                    max: { $max: '$dimensions.length' },
                                    hasValue: { $sum: 1 }
                                }
                            },
                            { $project: { _id: 0 } }
                        ],

                        dimensionWidth: [
                            {
                                $match: {
                                    'dimensions.width': { $exists: true, $ne: null, $gt: 0 }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    min: { $min: '$dimensions.width' },
                                    max: { $max: '$dimensions.width' },
                                    hasValue: { $sum: 1 }
                                }
                            },
                            { $project: { _id: 0 } }
                        ],

                        dimensionHeight: [
                            {
                                $match: {
                                    'dimensions.height': { $exists: true, $ne: null, $gt: 0 }
                                }
                            },
                            {
                                $group: {
                                    _id: null,
                                    min: { $min: '$dimensions.height' },
                                    max: { $max: '$dimensions.height' },
                                    hasValue: { $sum: 1 }
                                }
                            },
                            { $project: { _id: 0 } }
                        ],

                        // 10. Specifications
                        specifications: [
                            {
                                $match: {
                                    specifications: { $exists: true, $ne: [] }
                                }
                            },
                            { $unwind: '$specifications' },
                            {
                                $group: {
                                    _id: {
                                        name: '$specifications.name',
                                        value: '$specifications.value'
                                    },
                                    count: { $sum: 1 }
                                }
                            },
                            {
                                $group: {
                                    _id: '$_id.name',
                                    values: {
                                        $push: {
                                            value: '$_id.value',
                                            count: '$count'
                                        }
                                    },
                                    totalCount: { $sum: '$count' }
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    name: '$_id',
                                    values: 1,
                                    totalCount: 1
                                }
                            },
                            { $sort: { totalCount: -1 } }
                        ]
                    }
                }
            ];

            const [result] = await Product.aggregate(pipeline as PipelineStage[]);

            // Lấy thông tin categories
            const categoryIds = result.categories.map((c: any) => c._id);
            const categories = await Category.find({
                _id: { $in: categoryIds }
            })
                .select('_id name slug')
                .lean();

            const categoryMap = new Map(
                categories.map(c => [c._id.toString(), c])
            );

            const categoryOptions = result.categories
                .map((c: any) => {
                    const category = categoryMap.get(c._id.toString());
                    return category ? {
                        _id: c._id.toString(),
                        name: category.name,
                        slug: category.slug,
                        count: c.count
                    } : null;
                })
                .filter(Boolean)
                .sort((a: any, b: any) => b.count - a.count);

            // Format specifications - sắp xếp values theo count giảm dần
            const specifications = (result.specifications || []).map((spec: any) => ({
                ...spec,
                values: spec.values.sort((a: any, b: any) => b.count - a.count)
            }));

            return {
                categories: categoryOptions,
                manufacturers: result.manufacturers || [],
                origins: result.origins || [],
                priceRange: result.priceRange[0] || { min: 0, max: 0 },
                tags: result.tags || [],
                units: result.units || [],

                // Thêm các trường mới
                weightRange: result.weightRange[0] || {
                    min: 0,
                    max: 0,
                    hasWeight: 0
                },
                dimensionRanges: {
                    length: result.dimensionLength[0] || { min: 0, max: 0, hasValue: 0 },
                    width: result.dimensionWidth[0] || { min: 0, max: 0, hasValue: 0 },
                    height: result.dimensionHeight[0] || { min: 0, max: 0, hasValue: 0 }
                },
                specifications: specifications
            };
        } catch (error: any) {
            console.error('Get filter options error:', error);
            throw new Error(error.message || 'Failed to get filter options');
        }
    }
}
