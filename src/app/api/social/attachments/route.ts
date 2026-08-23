import { withMiddleware } from '@/lib/api-handler'
import { verifyToken } from '@/lib/middleware'
import { connectDbMiddleware } from '@/lib/middleware/connect-db'
import { cloudinaryService } from '@/service/cloudinary'
import { NextRequest, NextResponse } from 'next/server'

export const POST = withMiddleware(
    async (request: NextRequest) => {
        const form = await request.formData()
        const file = form.get('file') as File | null
        if (!file)
            return NextResponse.json(
                { success: false, message: 'No file provided' },
                { status: 400 },
            )
        if (file.size > 25 * 1024 * 1024)
            return NextResponse.json(
                { success: false, message: 'File is too large' },
                { status: 400 },
            )
        const result = await cloudinaryService.uploadFile(
            Buffer.from(await file.arrayBuffer()),
            {
                folder: 'chat-attachments',
                resource_type: 'raw',
                unique_filename: true,
                overwrite: false,
            },
        )
        return NextResponse.json({
            success: true,
            data: {
                url: result.secure_url || result.url,
                name: file.name,
                mimeType: file.type,
                size: file.size,
            },
        })
    },
    connectDbMiddleware,
    verifyToken,
)
