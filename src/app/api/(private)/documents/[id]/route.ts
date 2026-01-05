import { DocumentService } from "@/app/api/(services)/document.service";
import { NextRequest, NextResponse } from "next/server";

async function getDocumentById(request: NextRequest, context?: { params: Promise<{ id: string }> }) {
    try {
        const params = await context?.params;
        if (!params?.id) {
            return NextResponse.json(
                { success: false, message: 'Document not found' },
                { status: 404 }
            );
        }
        
        const document = await DocumentService.getById(params.id);

        return NextResponse.json({
            success: true,
            data: document
        });
    } catch (error: any) {
        console.error('Get document error:', error);

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