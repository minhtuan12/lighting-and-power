import { DocumentService } from "@/app/api/(services)/document.service";
import { withMiddleware } from "@/lib/api-handler";
import { requireRole, verifyToken } from "@/lib/middleware";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { EUserRole } from "@/types/user";
import { NextRequest, NextResponse } from "next/server";

// ===================== PUT /api/admin/documents/[id] =====================
async function updateDocument(request: NextRequest, context?: { params: Promise<{ id: string }> }) {
    try {
        const params = await context?.params;
        if (!params?.id) {
            return NextResponse.json(
                { success: false, message: 'Document ID is required' },
                { status: 400 }
            );
        }
        const body = await request.json();
        const document = await DocumentService.update(params.id, body);

        return NextResponse.json({
            success: true,
            message: 'Document updated successfully',
            data: document
        });
    } catch (error: any) {
        console.error('Update document error:', error);

        if (error.message === 'Document not found') {
            return NextResponse.json(
                { success: false, message: 'Document not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: false, message: error.message || 'An error occurred' },
            { status: 500 }
        );
    }
}

// ===================== DELETE /api/admin/documents/[id] =====================
async function deleteDocument(request: NextRequest, context?: { params: Promise<{ id: string }> }) {
    try {
        const params = await context?.params;
        if (!params?.id) {
            return NextResponse.json(
                { success: false, message: 'Document ID is required' },
                { status: 400 }
            );
        }
        const result = await DocumentService.delete(params.id);

        return NextResponse.json({
            success: true,
            message: result.message
        });
    } catch (error: any) {
        console.error('Delete document error:', error);

        if (error.message === 'Document not found') {
            return NextResponse.json(
                { success: false, message: 'Document not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: false, message: error.message || 'An error occurred' },
            { status: 500 }
        );
    }
}

export const PUT = withMiddleware(
    updateDocument,
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin),
)

export const DELETE = withMiddleware(
    deleteDocument,
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin),
)
