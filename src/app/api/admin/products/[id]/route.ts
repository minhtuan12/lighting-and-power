import { withMiddleware } from "@/lib/api-handler";
import { requireRole, verifyToken } from "@/lib/middleware";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { cloudinaryService } from "@/service/cloudinary";
import { EUserRole } from "@/types/user";
import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "../../../(services)/product.service";

type RouteParams = {
    params: { id: string };
};

// ===================== GET /api/admin/products/[id] =====================
async function getProductById(request: NextRequest, context?: { params: Promise<{ id: string }> }) {
    try {
        const params = await context?.params;
        if (!params?.id) {
            return NextResponse.json(
                { success: false, message: 'Product ID is required' },
                { status: 400 }
            );
        }

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

// ===================== PUT /api/admin/products/[id] =====================
async function updateProduct(request: NextRequest, context?: { params: Promise<{ id: string }> }) {
    try {
        const params = await context?.params;
        if (!params?.id) {
            return NextResponse.json(
                { success: false, message: 'Product ID is required' },
                { status: 400 }
            );
        }

        const body = await request.json();

        // Get existing product to handle old images
        const existingProduct = await ProductService.getById(params.id);

        // Handle image cleanup for removed images
        if (body.images && Array.isArray(body.images)) {
            const oldImages = existingProduct.images || [];
            const newImages = body.images || [];

            // Find removed images
            const removedImages = oldImages.filter(
                (oldImg: string) => !newImages.includes(oldImg)
            );

            // Delete removed images from Cloudinary
            for (const imageUrl of removedImages) {
                try {
                    // Extract public_id from URL (format: https://res.cloudinary.com/cloud_name/image/upload/v123/folder/public_id.ext)
                    const urlParts = imageUrl.split('/');
                    const publicId = urlParts[urlParts.length - 1].split('.')[0];
                    const folder = urlParts[urlParts.length - 2];

                    await cloudinaryService.deleteFile(`${folder}/${publicId}`);
                } catch (error) {
                    console.warn('Failed to delete old image:', imageUrl, error);
                }
            }
        }

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

        if (error.message.includes('related products')) {
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

// ===================== DELETE /api/admin/products/[id] =====================
async function deleteProduct(request: NextRequest, context?: { params: Promise<{ id: string }> }) {
    try {
        const params = await context?.params;
        if (!params?.id) {
            return NextResponse.json(
                { success: false, message: 'Product ID is required' },
                { status: 400 }
            );
        }

        const product = await ProductService.getById(params.id);
        if (product.images && Array.isArray(product.images)) {
            for (const imageUrl of product.images) {
                try {
                    const urlParts = imageUrl.split('/');
                    const publicId = urlParts[urlParts.length - 1].split('.')[0];
                    const folder = urlParts[urlParts.length - 2];

                    await cloudinaryService.deleteFile(`${folder}/${publicId}`);
                } catch (error) {
                    console.warn('Failed to delete gallery image:', imageUrl, error);
                }
            }
        }

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

// ===================== Middleware Setup =====================
const adminMiddleware = [
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin)
];

export const GET = withMiddleware(getProductById, ...adminMiddleware);
export const PUT = withMiddleware(updateProduct, ...adminMiddleware);
export const DELETE = withMiddleware(deleteProduct, ...adminMiddleware);
