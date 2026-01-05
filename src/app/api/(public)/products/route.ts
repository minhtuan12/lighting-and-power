import { withMiddleware } from "@/lib/api-handler";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { EProductStatus } from "@/types/product";
import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "../../(services)/product.service";

// ===================== GET /api/products (Public List) =====================
async function getPublicProducts(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const categoryId = searchParams.get('categoryId');
        const search = searchParams.get('search');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const tags = searchParams.get('tags')?.split(',');
        const sortBy = (searchParams.get('sortBy') as 'name' | 'price' | 'soldCount' | 'rating' | 'newest') || 'newest';
        const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

        const filters: any = {
            page,
            status: EProductStatus.active, // Only show active products
            sortBy,
            sortOrder
        };

        if (categoryId) filters.categoryId = categoryId;
        if (search) filters.search = search;
        if (minPrice) filters.minPrice = parseFloat(minPrice);
        if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
        if (tags && tags.length > 0 && tags[0]) filters.tags = tags;

        const data = await ProductService.getAll(filters);

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error: any) {
        console.error('Get public products error:', error);
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

// ===================== GET /api/products/:slug (Public Detail) =====================
async function getProductBySlug(request: NextRequest, { params }: { params: { slug: string } }) {
    try {
        const product = await ProductService.getBySlug(params.slug);

        // Increment view count asynchronously
        ProductService.incrementViewCount(product._id.toString()).catch(console.error);

        return NextResponse.json({
            success: true,
            data: product
        });
    } catch (error: any) {
        console.error('Get product by slug error:', error);

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

// ===================== GET /api/products/sku/:sku (Public Get by SKU) =====================
async function getProductBySku(request: NextRequest, { params }: { params: { sku: string } }) {
    try {
        const product = await ProductService.getBySku(params.sku);

        return NextResponse.json({
            success: true,
            data: product
        });
    } catch (error: any) {
        console.error('Get product by SKU error:', error);

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

// ===================== GET /api/products/featured (Public Featured) =====================
async function getFeaturedProducts(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');

        const products = await ProductService.getFeatured(Math.min(limit, 50));

        return NextResponse.json({
            success: true,
            data: products
        });
    } catch (error: any) {
        console.error('Get featured products error:', error);
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

// ===================== GET /api/products/:id/related (Public Related Products) =====================
async function getRelatedProducts(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '6');

        const products = await ProductService.getRelated(params.id, Math.min(limit, 20));

        return NextResponse.json({
            success: true,
            data: products
        });
    } catch (error: any) {
        console.error('Get related products error:', error);

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

// ===================== Public Routes (No Auth Required) =====================
export const GET = withMiddleware(getPublicProducts, connectDbMiddleware);

// Note: Create separate route files for dynamic routes:
// /api/products/[slug].ts
// /api/products/sku/[sku].ts
// /api/products/featured.ts
// /api/products/[id]/related.ts