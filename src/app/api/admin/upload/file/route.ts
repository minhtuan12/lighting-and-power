import { withMiddleware } from "@/lib/api-handler";
import { requireRole, verifyToken } from "@/lib/middleware";
import { connectDbMiddleware } from "@/lib/middleware/connect-db";
import { cloudinaryService } from "@/service/cloudinary";
import { EUserRole } from "@/types/user";
import { NextRequest, NextResponse } from 'next/server';

export async function uploadDocument(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = (formData.get('folder') as string) || 'documents';

        if (!file) {
            return NextResponse.json(
                { success: false, message: 'No file provided' },
                { status: 400 }
            );
        }

        // ==================== Allowed file types ====================
        const allowedMimeTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "text/markdown",
        ];
        const allowedExtensions = ["pdf", "doc", "docx", "txt", "md"];
        const fileExtension = file.name.split(".").pop()?.toLowerCase();

        if (
            !file.type ||
            !allowedMimeTypes.includes(file.type) ||
            !fileExtension ||
            !allowedExtensions.includes(fileExtension)
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid file type. Only PDF, DOC, DOCX, TXT, and MD files are allowed.",
                },
                { status: 400 }
            );
        }

        // ==================== File size validation ====================
        const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    success: false,
                    message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
                },
                { status: 400 }
            );
        }

        // ==================== Convert file to buffer ====================
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // ==================== Upload to Cloudinary ====================
        const result = await cloudinaryService.uploadFile(buffer, {
            folder,
            resource_type: 'raw', // Use 'raw' for documents
            unique_filename: true,
            overwrite: false,
            public_id: file.name,
        });

        return NextResponse.json({
            success: true,
            public_id: result.public_id,
            url: result.url,
            secure_url: result.secure_url,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            uploadedAt: new Date(),
        });
    } catch (error: any) {
        console.error('Document upload error:', error);

        return NextResponse.json(
            {
                success: false,
                message: error.message || 'Failed to upload document',
            },
            { status: 500 }
        );
    }
}

export const POST = withMiddleware(
    uploadDocument,
    connectDbMiddleware,
    verifyToken,
    requireRole(EUserRole.admin),
)
