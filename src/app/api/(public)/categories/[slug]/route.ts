import { CategoryService } from "@/app/api/(services)/category.service";
import { withMiddleware } from "@/lib/api-handler";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { NextRequest, NextResponse } from "next/server";

async function getCategoryBySlug(request: NextRequest, context?: { params: Promise<{ slug: string }> }) {
    try {
        const params = await context?.params;
        if (!params?.slug) {
            return NextResponse.json(
                { success: false, message: 'Category not found' },
                { status: 404 }
            );
        }

        const category = await CategoryService.getBySlug(params.slug);

        return NextResponse.json({
            success: true,
            data: category
        });
    } catch (error: any) {
        console.error('Get category error:', error);

        if (error.message === 'Category not found') {
            return NextResponse.json(
                { success: false, message: 'Category not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: false, message: error.message || 'An error occurred' },
            { status: 500 }
        );
    }
}

export const GET = withMiddleware(getCategoryBySlug, connectDbMiddleware);
