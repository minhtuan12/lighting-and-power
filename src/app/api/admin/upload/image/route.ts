// app/api/upload/image/route.ts

import { cloudinaryService } from "@/service/cloudinary";
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = (formData.get('folder') as string) || 'lightingpower';

        if (!file) {
            return NextResponse.json(
                { success: false, message: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { success: false, message: 'File too large. Maximum size is 10MB' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Cloudinary
        const result = await cloudinaryService.uploadFile(buffer, {
            folder,
            resource_type: 'auto',
            unique_filename: true,
            overwrite: false,
        });

        return NextResponse.json({
            success: true,
            public_id: result.public_id,
            url: result.url,
            secure_url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
        });
    } catch (error: any) {
        console.error('Image upload error:', error);

        return NextResponse.json(
            {
                success: false,
                message: error.message || 'Failed to upload image',
            },
            { status: 500 }
        );
    }
}
