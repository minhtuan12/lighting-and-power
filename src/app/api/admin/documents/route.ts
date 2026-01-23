
import connectDb from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { DocumentService } from "../../(services)/document.service";

// ===================== GET /api/admin/documents =====================
async function getDocuments(request: NextRequest) {
    try {
        await connectDb();
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

        const data = await DocumentService.getAll(filters);

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error: any) {
        console.error('Get documents error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'An error occurred' },
            { status: 500 }
        );
    }
}

// ===================== POST /api/admin/documents =====================
async function createDocument(request: NextRequest) {
    try {
        await connectDb();
        const body = await request.json();

        if (!body.title) {
            return NextResponse.json(
                { success: false, message: 'Title is required' },
                { status: 400 }
            );
        }

        if (!body.contentType) {
            return NextResponse.json(
                { success: false, message: 'Content type is required' },
                { status: 400 }
            );
        }

        const document = await DocumentService.create({
            title: body.title,
            description: body.description,
            type: body.type,
            contentType: body.contentType,
            content: body.content,
            fileUrl: body.fileUrl,
            fileName: body.fileName,
            fileSize: body.fileSize,
            mimeType: body.mimeType,
            isPublished: body.isPublished ?? true,
        });

        return NextResponse.json({
            success: true,
            message: 'Document created successfully',
            data: document
        }, { status: 201 });
    } catch (error: any) {
        console.error('Create document error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Failed to create document' },
            { status: 500 }
        );
    }
}

export const GET = getDocuments;
export const POST = createDocument;

