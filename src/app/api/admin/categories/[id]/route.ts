import { withMiddleware } from "@/lib/api-handler";
import { requireRole, verifyToken } from "@/lib/middleware";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { SlugGenerator } from "@/lib/slug";
import Category from "@/models/category";
import { EUserRole } from "@/types/user";
import { NextRequest, NextResponse } from "next/server";
import { CategoryService } from "../../../(services)/category.service";

async function getCategory(
    request: NextRequest,
    context?: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context?.params;
        if (!params?.id) {
            return NextResponse.json(
                { success: false, message: "Category ID is required" },
                { status: 400 }
            );
        }

        const category = await CategoryService.getById(params.id);

        return NextResponse.json({
            success: true,
            data: category
        });

    } catch (error: any) {
        console.error('Get category error:', error);

        if (error.message === 'Category not found') {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: false, message: "An error occurred" },
            { status: 500 }
        );
    }
}

async function updateCategory(
    request: NextRequest,
    context?: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context?.params;
        if (!params?.id) {
            return NextResponse.json(
                { success: false, message: "Category ID is required" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const {
            name,
            description,
            parentId,
            isActive,
            metaTitle,
            metaDescription,
            metaKeywords
        } = body;

        const category = await CategoryService.update(params.id, {
            name,
            slug: await SlugGenerator.generateUniqueSlug(name, Category, { excludeId: params.id }),
            description,
            parentId,
            isActive,
            metaTitle,
            metaDescription,
            metaKeywords
        });

        return NextResponse.json({
            success: true,
            message: "Category updated successfully",
            data: category
        });

    } catch (error: any) {
        console.error('Update category error:', error);

        if (error.message === 'Category not found') {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 404 }
            );
        }

        if (error.message === 'Slug already exists' ||
            error.message.includes('Cannot move category') ||
            error.message.includes('Maximum category depth') ||
            error.message.includes('cannot be its own parent')) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: "An error occurred" },
            { status: 500 }
        );
    }
}

async function deleteCategory(
    request: NextRequest,
    context?: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context?.params;
        if (!params?.id) {
            return NextResponse.json(
                { success: false, message: "Category ID is required" },
                { status: 400 }
            );
        }

        const result = await CategoryService.delete(params.id);

        return NextResponse.json({
            success: true,
            message: result.message
        });

    } catch (error: any) {
        console.error('Delete category error:', error);

        if (error.message === 'Category not found') {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 404 }
            );
        }

        if (error.message.includes('Cannot delete category')) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: "An error occurred" },
            { status: 500 }
        );
    }
}

export const GET = withMiddleware(
    getCategory,
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin),
);

export const PATCH = withMiddleware(
    updateCategory,
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin),
);

export const DELETE = withMiddleware(
    deleteCategory,
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin),
);
