import { withMiddleware } from "@/lib/api-handler";
import { requireRole, verifyToken } from "@/lib/middleware";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { SlugGenerator } from "@/lib/slug";
import Category from "@/models/category";
import { EUserRole } from "@/types/user";
import { NextRequest, NextResponse } from "next/server";
import { CategoryService } from "../../(services)/category.service";

async function getCategories(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const view = searchParams.get('view'); // 'tree' or 'list'
        const parentId = searchParams.get('parentId');
        const level = searchParams.get('level');
        const isActive = searchParams.get('isActive');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');

        let result;

        if (view === 'tree') {
            // Get hierarchical tree structure
            const isActiveOnly = isActive === 'true';
            const data = await CategoryService.getTree(isActiveOnly);
            result = {
                data,
                pagination: null,
            };
        } else {
            // Get flat list with filters
            const filters: any = {};

            if (parentId !== null && parentId !== undefined) {
                filters.parentId = parentId === 'null' ? null : parentId;
            }
            if (level) filters.level = parseInt(level);
            if (isActive) filters.isActive = isActive === 'true';
            if (search) filters.search = search;

            result = await CategoryService.getAll(filters, { page });
        }

        return NextResponse.json({
            success: true,
            ...result
        });

    } catch (error: any) {
        console.error('Get categories error:', error);
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

async function createCategory(request: NextRequest) {
    try {
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

        if (!name) {
            return NextResponse.json(
                { success: false, message: "Category name is required" },
                { status: 400 }
            );
        }

        const category = await CategoryService.create({
            name,
            slug: await SlugGenerator.generateUniqueSlug(name, Category),
            description,
            parentId,
            isActive,
            metaTitle,
            metaDescription,
            metaKeywords
        });

        return NextResponse.json({
            success: true,
            message: "Category created successfully",
            data: category
        }, { status: 201 });

    } catch (error: any) {
        console.error('Create category error:', error);

        if (error.message === 'Slug already exists') {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 409 }
            );
        }

        if (error.message.includes('Parent category not found') ||
            error.message.includes('Maximum category depth')) {
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

export const GET = withMiddleware(
    getCategories,
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin)
)

export const POST = withMiddleware(
    createCategory,
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin)
)
