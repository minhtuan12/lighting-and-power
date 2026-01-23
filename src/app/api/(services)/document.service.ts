
import { PAGE_LIMIT } from '@/constants/common';
import Document from '@/models/document';
import { IDocument } from '@/types/document';

export class DocumentService {
    // ================= CREATE =================
    static async create(data: Omit<IDocument, '_id'>): Promise<IDocument> {
        try {
            if (!data.title) {
                throw new Error('Title is required');
            }

            if (!data.contentType) {
                throw new Error('Content type is required');
            }

            if (data.contentType === 'text' && !data.content) {
                throw new Error('Content is required for text type');
            }

            if (data.contentType === 'file' && !data.fileUrl) {
                throw new Error('File URL is required for file type');
            }

            const document = await Document.create(data);
            return document.toObject();
        } catch (error: any) {
            console.error('Create document error:', error);
            throw new Error(error.message || 'Failed to create document');
        }
    }

    // ================= READ =================
    static async getAll(filters?: {
        type?: string;
        contentType?: string;
        isPublished?: boolean;
        search?: string;
        page?: number;
    }): Promise<{ documents: IDocument[]; total: number; pages: number }> {
        try {
            const query: any = {};
            const page = filters?.page || 1;
            const skip = (page - 1) * PAGE_LIMIT;

            if (filters?.type) {
                query.type = filters.type;
            }

            if (filters?.contentType) {
                query.contentType = filters.contentType;
            }

            if (filters?.isPublished !== undefined) {
                query.isPublished = filters.isPublished;
            }

            if (filters?.search) {
                query.$or = [
                    { title: { $regex: filters.search, $options: 'i' } },
                    { description: { $regex: filters.search, $options: 'i' } }
                ];
            }

            const total = await Document.countDocuments(query);
            const documents = await Document.find(query)
                .sort({ order: 1, createdAt: -1 })
                .skip(skip)
                .limit(PAGE_LIMIT)
                .lean();

            return {
                documents,
                total,
                pages: Math.ceil(total / PAGE_LIMIT)
            };
        } catch (error: any) {
            console.error('Get all documents error:', error);
            throw new Error(error.message || 'Failed to get documents');
        }
    }

    static async getById(id: string): Promise<IDocument> {
        try {
            const document = await Document.findById(id).lean();
            if (!document) {
                throw new Error('Document not found');
            }
            return document;
        } catch (error: any) {
            console.error('Get document error:', error);
            throw new Error(error.message || 'Failed to get document');
        }
    }

    static async getByProductId(productId: string): Promise<IDocument[]> {
        try {
            const documents = await Document.find({
                productIds: productId,
                isPublished: true
            })
                .sort({ order: 1, createdAt: -1 })
                .lean();

            return documents;
        } catch (error: any) {
            console.error('Get documents by product error:', error);
            throw new Error(error.message || 'Failed to get documents');
        }
    }

    // ================= UPDATE =================
    static async update(id: string, data: Partial<IDocument>): Promise<IDocument> {
        try {
            if (!data.title || !data.contentType) {
                throw new Error('Title and content type are required');
            }

            const document = await Document.findByIdAndUpdate(
                id,
                { ...data, updatedAt: new Date() },
                { new: true, runValidators: true }
            ).lean();

            if (!document) {
                throw new Error('Document not found');
            }

            return document;
        } catch (error: any) {
            console.error('Update document error:', error);
            throw new Error(error.message || 'Failed to update document');
        }
    }

    // ================= DELETE =================
    static async delete(id: string): Promise<{ success: boolean; message: string }> {
        try {
            const document = await Document.findByIdAndDelete(id);
            if (!document) {
                throw new Error('Document not found');
            }

            return { success: true, message: 'Document deleted successfully' };
        } catch (error: any) {
            console.error('Delete document error:', error);
            throw new Error(error.message || 'Failed to delete document');
        }
    }

    static async deleteMany(ids: string[]): Promise<{ success: boolean; deletedCount: number }> {
        try {
            const result = await Document.deleteMany({ _id: { $in: ids } });
            return { success: true, deletedCount: result.deletedCount };
        } catch (error: any) {
            console.error('Delete many documents error:', error);
            throw new Error(error.message || 'Failed to delete documents');
        }
    }

    // ================= BULK OPERATIONS =================
    static async updateOrder(documents: Array<{ _id: string; order: number }>): Promise<void> {
        try {
            for (const doc of documents) {
                await Document.findByIdAndUpdate(doc._id, { order: doc.order });
            }
        } catch (error: any) {
            console.error('Update order error:', error);
            throw new Error(error.message || 'Failed to update order');
        }
    }

    static async addProductToDocument(documentId: string, productId: string): Promise<IDocument> {
        try {
            const document = await Document.findByIdAndUpdate(
                documentId,
                { $addToSet: { productIds: productId } },
                { new: true }
            ).lean();

            if (!document) {
                throw new Error('Document not found');
            }

            return document;
        } catch (error: any) {
            console.error('Add product to document error:', error);
            throw new Error(error.message || 'Failed to add product');
        }
    }

    static async removeProductFromDocument(documentId: string, productId: string): Promise<IDocument> {
        try {
            const document = await Document.findByIdAndUpdate(
                documentId,
                { $pull: { productIds: productId } },
                { new: true }
            ).lean();

            if (!document) {
                throw new Error('Document not found');
            }

            return document;
        } catch (error: any) {
            console.error('Remove product from document error:', error);
            throw new Error(error.message || 'Failed to remove product');
        }
    }
}
