import { withMiddleware } from "@/lib/api-handler";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { NextRequest, NextResponse } from "next/server";
import { DocumentService } from "../../(services)/document.service";

// ===================== GET /api/documents (Public List) =====================
async function getPublicDocuments(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const contentType = searchParams.get('contentType');
        const isPublished = searchParams.get('isPublished');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');

        const filters: any = { page };
        if (type) filters.type = type;
        if (contentType) filters.contentType = contentType;
        if (isPublished !== null) filters.isPublished = isPublished === 'true';
        if (search) filters.search = search;

        const data = await DocumentService.getAll({ ...filters, isPublished: true });

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error: any) {
        console.error('Get public documents error:', error);
        return NextResponse.json(
            { success: false, message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

// ===================== Public Routes (No Auth Required) =====================
export const GET = withMiddleware(getPublicDocuments, connectDbMiddleware);
