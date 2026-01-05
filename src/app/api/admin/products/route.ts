import { withMiddleware } from "@/lib/api-handler";
import { requireRole, verifyToken } from "@/lib/middleware";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { EUserRole } from "@/types/user";
import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "../../(services)/product.service";

// ===================== GET /api/admin/products =====================
async function getProducts(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const categoryId = searchParams.get('categoryId');
        const status = searchParams.get('status');
        const isFeatured = searchParams.get('isFeatured');
        const tags = searchParams.get('tags')?.split(',');
        const search = searchParams.get('search');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const sortBy = searchParams.get('sortBy') as 'name' | 'price' | 'soldCount' | 'rating' | 'newest' || 'newest';
        const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

        const filters: any = { page };

        if (categoryId) filters.categoryId = categoryId;
        if (status && status !== 'all') filters.status = status;
        if (isFeatured !== null) filters.isFeatured = isFeatured === 'true';
        if (tags && tags.length > 0 && tags[0]) filters.tags = tags;
        if (search) filters.search = search;
        if (minPrice) filters.minPrice = parseFloat(minPrice);
        if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
        if (sortBy) filters.sortBy = sortBy;
        filters.sortOrder = sortOrder;

        const data = await ProductService.getAll(filters);

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error: any) {
        console.error('Get products error:', error);
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

// ===================== POST /api/admin/products =====================
async function createProduct(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            name,
            sku,
            description,
            shortDescription,
            categoryId,
            manufacturer,
            origin,
            price,
            priceTiers,
            stock,
            lowStockThreshold,
            unit,
            minOrderQuantity,
            images,
            thumbnail,
            specifications,
            metaTitle,
            metaDescription,
            metaKeywords,
            datasheet,
            weight,
            dimensions,
            status,
            isFeatured,
            tags,
            relatedProducts
        } = body;

        const product = await ProductService.create({
            name,
            sku,
            description,
            shortDescription,
            categoryId,
            manufacturer,
            origin,
            price,
            priceTiers,
            stock,
            lowStockThreshold,
            unit,
            minOrderQuantity,
            images,
            thumbnail,
            specifications,
            metaTitle,
            metaDescription,
            metaKeywords,
            datasheet,
            weight,
            dimensions,
            status,
            isFeatured,
            tags,
            relatedProducts
        });

        return NextResponse.json({
            success: true,
            message: "Product created successfully",
            data: product
        }, { status: 201 });

    } catch (error: any) {
        console.error('Create product error:', error);

        if (error.message.includes('Category not found')) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 404 }
            );
        }

        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 409 }
            );
        }

        if (error.message.includes('is required')) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

// ===================== GET /api/admin/products/:id =====================
async function getProductById(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const product = await ProductService.getById(params.id);

        return NextResponse.json({
            success: true,
            data: product
        });
    } catch (error: any) {
        console.error('Get product error:', error);

        if (error.message === 'Product not found') {
            return NextResponse.json(
                { success: false, message: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

// ===================== PUT /api/admin/products/:id =====================
async function updateProduct(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const product = await ProductService.update(params.id, body);

        return NextResponse.json({
            success: true,
            message: "Product updated successfully",
            data: product
        });
    } catch (error: any) {
        console.error('Update product error:', error);

        if (error.message === 'Product not found') {
            return NextResponse.json(
                { success: false, message: 'Product not found' },
                { status: 404 }
            );
        }

        if (error.message.includes('Category not found')) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

// ===================== DELETE /api/admin/products/:id =====================
async function deleteProduct(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const result = await ProductService.delete(params.id);

        return NextResponse.json({
            success: true,
            message: result.message
        });
    } catch (error: any) {
        console.error('Delete product error:', error);

        if (error.message === 'Product not found') {
            return NextResponse.json(
                { success: false, message: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

// ===================== POST /api/admin/products/bulk/delete =====================
async function bulkDeleteProducts(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { success: false, message: 'IDs array is required' },
                { status: 400 }
            );
        }

        const result = await ProductService.deleteMany(ids);

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('Bulk delete products error:', error);
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

// ===================== PUT /api/admin/products/bulk/status =====================
async function bulkUpdateStatus(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids, status } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { success: false, message: 'IDs array is required' },
                { status: 400 }
            );
        }

        if (!status) {
            return NextResponse.json(
                { success: false, message: 'Status is required' },
                { status: 400 }
            );
        }

        const result = await ProductService.bulkUpdateStatus(ids, status);

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('Bulk update status error:', error);
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

// ===================== PUT /api/admin/products/bulk/featured =====================
async function bulkUpdateFeatured(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids, isFeatured } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { success: false, message: 'IDs array is required' },
                { status: 400 }
            );
        }

        if (isFeatured === undefined || isFeatured === null) {
            return NextResponse.json(
                { success: false, message: 'isFeatured is required' },
                { status: 400 }
            );
        }

        const result = await ProductService.bulkUpdateFeatured(ids, isFeatured);

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('Bulk update featured error:', error);
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

// ===================== PUT /api/admin/products/bulk/tags =====================
async function bulkAddTags(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids, tags } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { success: false, message: 'IDs array is required' },
                { status: 400 }
            );
        }

        if (!Array.isArray(tags) || tags.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Tags array is required' },
                { status: 400 }
            );
        }

        const result = await ProductService.bulkAddTags(ids, tags);

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('Bulk add tags error:', error);
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

// ===================== GET /api/admin/products/stats =====================
async function getStats(request: NextRequest) {
    try {
        const stats = await ProductService.getStats();

        return NextResponse.json({
            success: true,
            data: stats
        });
    } catch (error: any) {
        console.error('Get stats error:', error);
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

// ===================== Middleware Setup =====================
const adminMiddleware = [
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin)
];

export const GET = withMiddleware(getProducts, ...adminMiddleware);
export const POST = withMiddleware(createProduct, ...adminMiddleware);
