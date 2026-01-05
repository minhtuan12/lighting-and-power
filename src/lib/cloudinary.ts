import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
    secure: true
});

export default cloudinary;

export interface CloudinaryUploadOptions {
    folder?: string;
    public_id?: string;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
    transformation?: any[];
    tags?: string[];
    overwrite?: boolean;
    unique_filename?: boolean;
    use_filename?: boolean;
    format?: string;
    pages?: boolean;
    raw_convert?: string
}

export interface CloudinaryUploadResult {
    public_id: string;
    version: number;
    signature: string;
    width: number;
    height: number;
    format: string;
    resource_type: string;
    created_at: string;
    tags: string[];
    bytes: number;
    type: string;
    etag: string;
    placeholder: boolean;
    url: string;
    secure_url: string;
    folder: string;
    original_filename: string;

    [key: string]: any;
}
