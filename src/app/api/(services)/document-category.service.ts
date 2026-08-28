import { SlugGenerator } from '@/lib/slug'
import Document from '@/models/document'
import DocumentCategory from '@/models/document-category'
import { IDocumentCategory } from '@/types/document-category'

export class DocumentCategoryService {
    static async create(
        data: Omit<Partial<IDocumentCategory>, '_id'>,
    ): Promise<IDocumentCategory> {
        if (!data.name) {
            throw new Error('Name is required')
        }

        await DocumentCategory.updateMany({}, { $inc: { order: 1 } })
        const category = await DocumentCategory.create({
            name: data.name,
            description: data.description,
            color: data.color || 'blue',
            isPublished: data.isPublished ?? true,
            order: 0,
            slug: await SlugGenerator.generateUniqueSlug(
                data.name,
                DocumentCategory,
            ),
        })

        return category.toObject()
    }

    static async getAll(filters?: {
        search?: string
        isPublished?: boolean
    }): Promise<IDocumentCategory[]> {
        const query: any = {}

        if (filters?.isPublished !== undefined) {
            query.isPublished = filters.isPublished
        }

        if (filters?.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { description: { $regex: filters.search, $options: 'i' } },
            ]
        }

        return DocumentCategory.find(query)
            .sort({ order: 1, createdAt: -1 })
            .lean()
    }

    static async update(
        id: string,
        data: Partial<IDocumentCategory>,
    ): Promise<IDocumentCategory> {
        if (!data.name) {
            throw new Error('Name is required')
        }

        const existing = await DocumentCategory.findById(id).lean()
        if (!existing) {
            throw new Error('Category not found')
        }

        const nextSlug = await SlugGenerator.generateUniqueSlug(
            data.name,
            DocumentCategory,
            { excludeId: id },
        )

        const category = await DocumentCategory.findByIdAndUpdate(
            id,
            {
                ...data,
                slug: nextSlug,
                updatedAt: new Date(),
            },
            { new: true, runValidators: true },
        ).lean()

        if (!category) {
            throw new Error('Category not found')
        }

        if (existing.slug !== nextSlug) {
            await Document.updateMany(
                { type: existing.slug },
                { $set: { type: nextSlug } },
            )
        }

        return category
    }

    static async delete(
        id: string,
    ): Promise<{ success: boolean; message: string }> {
        const category = await DocumentCategory.findById(id).lean()
        if (!category) {
            throw new Error('Category not found')
        }

        const linkedDocuments = await Document.countDocuments({
            type: category.slug,
        })

        if (linkedDocuments > 0) {
            throw new Error('Cannot delete category with existing sections')
        }

        await DocumentCategory.findByIdAndDelete(id)
        await DocumentCategory.updateMany(
            { order: { $gt: category.order } },
            { $inc: { order: -1 } },
        )
        return { success: true, message: 'Category deleted successfully' }
    }

    static async reorder(orderedIds: string[]) {
        if (!orderedIds.length) return { message: 'No categories to reorder' }
        await DocumentCategory.bulkWrite(
            orderedIds.map((id, index) => ({
                updateOne: {
                    filter: { _id: id },
                    update: { $set: { order: index } },
                },
            })),
        )
        return { message: 'Categories reordered successfully' }
    }
}
