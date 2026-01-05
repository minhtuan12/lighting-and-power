import { PAGE_LIMIT } from '@/constants/common';
import Category from '@/models/category';
import { ICategory } from '@/types/category';

interface PaginationResult {
    data: ICategory[];
    pagination: {
        page: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export class CategoryService {

    // ================= CREATE =================

    static async create(data: {
        name: string;
        slug?: string;
        description?: string;
        parentId?: string | null;
        isActive?: boolean;
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string;
    }) {
        // Check if slug already exists
        if (data.slug) {
            const existingSlug = await Category.findOne({ slug: data.slug });
            if (existingSlug) {
                throw new Error('Slug already exists');
            }
        }

        let level = 0;
        let parentId = data.parentId || null;

        // Calculate level based on parent
        if (parentId) {
            const parent = await Category.findById(parentId);
            if (!parent) {
                throw new Error('Parent category not found');
            }
            if (parent.level >= 3) {
                throw new Error('Maximum category depth reached (4 levels)');
            }
            level = parent.level + 1;
        }

        const category = await Category.create({
            ...data,
            parentId,
            level,
            isActive: data.isActive !== undefined ? data.isActive : true
        });

        return category;
    }

    // ================= READ =================

    static async getAll(filters?: {
        parentId?: string | null;
        level?: number;
        isActive?: boolean;
        search?: string;
    }, options?: { page?: number }): Promise<PaginationResult> {
        const query: any = {};

        if (filters?.parentId !== undefined) {
            query.parentId = filters.parentId === null ? null : filters.parentId;
        }

        if (filters?.level !== undefined) {
            query.level = filters.level;
        }

        if (filters?.isActive !== undefined) {
            query.isActive = filters.isActive;
        }

        if (filters?.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { description: { $regex: filters.search, $options: 'i' } }
            ];
        }

        const page = options?.page || 1;
        const skip = (page - 1) * PAGE_LIMIT;

        const total = await Category.countDocuments(query);
        const categories = await Category.find(query)
            .sort({ name: 1 })
            .skip(skip)
            .limit(PAGE_LIMIT)
            .lean();

        const categoriesWithCount = await Promise.all(
            categories.map(async (category) => {
                const childrenCount = await Category.countDocuments({
                    parentId: category._id
                });

                return {
                    ...category,
                    childrenCount
                };
            })
        );
        const totalPages = Math.ceil(total / PAGE_LIMIT);

        return {
            data: categoriesWithCount as ICategory[],
            pagination: {
                page,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            }
        };
    }

    static async getTree(isActiveOnly: boolean = true) {
        const query: any = {};
        if (isActiveOnly) {
            query.isActive = true;
        }

        const allCategories = await Category.find(query)
            .sort({ order: 1, name: 1 })
            .lean();

        const categoriesWithCount = await Promise.all(
            allCategories.map(async (category) => {
                const childrenCount = await Category.countDocuments({
                    parentId: category._id
                });

                return {
                    ...category,
                    childrenCount
                };
            })
        );

        // Build tree structure
        const buildTree = (parentId: string | null = null): any[] => {
            return categoriesWithCount
                .filter(cat => cat.parentId === parentId)
                .map(cat => ({
                    ...cat,
                    children: buildTree(cat._id.toString())
                }));
        };

        return buildTree(null);
    }

    static async getById(id: string) {
        const category = await Category.findById(id).lean();
        if (!category) {
            throw new Error('Category not found');
        }
        return category;
    }

    static async getBySlug(slug: string) {
        const category = await Category.findOne({ slug }).lean();
        if (!category) {
            throw new Error('Category not found');
        }
        return category;
    }

    static async getBreadcrumb(categoryId: string) {
        const breadcrumb: any[] = [];
        let currentId = categoryId;

        while (currentId) {
            const category = await Category.findById(currentId).lean();
            if (!category) break;

            breadcrumb.unshift({
                _id: category._id,
                name: category.name,
                slug: category.slug
            });

            currentId = category.parentId?.toString() || '';
        }

        return breadcrumb;
    }

    // ================= UPDATE =================

    static async update(id: string, data: {
        name?: string;
        slug?: string;
        description?: string;
        parentId?: string | null;
        isActive?: boolean;
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string;
    }) {
        const category = await Category.findById(id);
        if (!category) {
            throw new Error('Category not found');
        }

        // Check if new slug already exists
        if (data.slug && data.slug !== category.slug) {
            const existingSlug = await Category.findOne({
                slug: data.slug,
                _id: { $ne: id }
            });
            if (existingSlug) {
                throw new Error('Slug already exists');
            }
        }

        // Check if moving to new parent
        if (data.parentId !== undefined && data.parentId !== category.parentId?.toString()) {
            // Prevent circular reference
            if (data.parentId === id) {
                throw new Error('Category cannot be its own parent');
            }

            // Check if new parent is a descendant
            if (data.parentId) {
                const isDescendant = await this.isDescendant(id, data.parentId);
                if (isDescendant) {
                    throw new Error('Cannot move category to its own descendant');
                }

                const parent = await Category.findById(data.parentId);
                if (!parent) {
                    throw new Error('Parent category not found');
                }
                if (parent.level >= 3) {
                    throw new Error('Maximum category depth reached');
                }

                category.level = parent.level + 1;
            } else {
                category.level = 0;
            }

            category.parentId = data.parentId as any;

            // Update all children levels
            await this.updateChildrenLevels(id, category.level);
        }

        // Update other fields
        if (data.name !== undefined) category.name = data.name;
        if (data.slug !== undefined) category.slug = data.slug;
        if (data.description !== undefined) category.description = data.description;
        if (data.isActive !== undefined) {
            category.isActive = data.isActive;

            // Update all its children status to false if it is not active
            if (!data.isActive) {
                await Category.updateMany({ parentId: id }, { isActive: false });
            }
        }
        if (data.metaTitle !== undefined) category.metaTitle = data.metaTitle;
        if (data.metaDescription !== undefined) category.metaDescription = data.metaDescription;
        if (data.metaKeywords !== undefined) category.metaKeywords = data.metaKeywords;

        await category.save();

        return category;
    }

    // ================= DELETE =================

    static async delete(id: string) {
        const category = await Category.findById(id);
        if (!category) {
            throw new Error('Category not found');
        }

        // Check if has children
        const childrenCount = await Category.countDocuments({ parentId: id });
        if (childrenCount > 0) {
            throw new Error('Cannot delete category with subcategories. Delete subcategories first.');
        }

        // Check if has products (you'll need to implement this based on your Product model)
        // const productCount = await Product.countDocuments({ categoryId: id });
        // if (productCount > 0) {
        //     throw new Error('Cannot delete category with products. Remove products first.');
        // }

        await Category.findByIdAndDelete(id);

        return { success: true, message: 'Category deleted successfully' };
    }

    // ================= HELPERS =================

    private static async isDescendant(ancestorId: string, descendantId: string): Promise<boolean> {
        let currentId = descendantId;

        while (currentId) {
            const category = await Category.findById(currentId);
            if (!category) break;
            if (category.parentId?.toString() === ancestorId) return true;
            currentId = category.parentId?.toString() || '';
        }

        return false;
    }

    private static async updateChildrenLevels(parentId: string, parentLevel: number) {
        const children = await Category.find({ parentId });

        for (const child of children) {
            child.level = parentLevel + 1;
            await child.save();

            // Recursively update grandchildren
            await this.updateChildrenLevels(child._id.toString(), child.level);
        }
    }
}
