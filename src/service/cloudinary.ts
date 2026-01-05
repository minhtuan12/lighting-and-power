import cloudinary, {CloudinaryUploadOptions, CloudinaryUploadResult} from '@/lib/cloudinary';

class CloudinaryService {
    // Upload file from buffer/base64
    async uploadFile(
        file: string | Buffer,
        options: CloudinaryUploadOptions = {}
    ): Promise<CloudinaryUploadResult> {
        try {
            const defaultOptions: CloudinaryUploadOptions = {
                resource_type: 'auto',
                folder: 'uploads',
                unique_filename: true,
                overwrite: false,
                ...options
            };

            let fileData = '';
            switch (defaultOptions.resource_type) {
                case 'auto':
                    fileData = `data:image/png;base64,${file.toString("base64")}`;
                    break;
                case 'raw':
                    fileData = `data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${file.toString("base64")}`;
            }

            const result = await cloudinary.uploader.upload(
                Buffer.isBuffer(file) ? fileData : file,
                defaultOptions
            );
            return result as unknown as CloudinaryUploadResult;
        } catch (error: any) {
            console.error('Cloudinary upload error:', error);
            throw new Error(`Upload failed: ${error.message}`);
        }
    }

    // upload chunked video
    async uploadVideoChunked(
        file: string | Buffer,
        options: CloudinaryUploadOptions = {}
    ): Promise<CloudinaryUploadResult> {
        try {
            const defaultOptions: CloudinaryUploadOptions & { chunk_size?: number } = {
                resource_type: 'video',
                folder: 'videos',
                unique_filename: true,
                overwrite: false,
                chunk_size: 6_000_000,
                ...options
            };

            return (await cloudinary.uploader.upload_large(
                `data:video/mp4;base64,${file.toString("base64")}`,
                defaultOptions
            )) as unknown as CloudinaryUploadResult;
        } catch (error: any) {
            console.error('Cloudinary chunked upload error:', error);
            throw new Error(`Chunked upload failed: ${error.message}`);
        }
    }

    // Upload multiple files
    async uploadMultipleFiles(
        files: Array<{ file: string | Buffer; options?: CloudinaryUploadOptions }>
    ): Promise<CloudinaryUploadResult[]> {
        try {
            const uploadPromises = files.map(({file, options}) =>
                this.uploadFile(file, options)
            );

            const results = await Promise.allSettled(uploadPromises);

            const successful = results
                .filter(result => result.status === 'fulfilled')
                .map(result => (result as PromiseFulfilledResult<CloudinaryUploadResult>).value);

            const failed = results
                .filter(result => result.status === 'rejected')
                .map(result => (result as PromiseRejectedResult).reason);

            if (failed.length > 0) {
                console.warn('Some uploads failed:', failed);
            }

            return successful;
        } catch (error: any) {
            console.error('Multiple upload error:', error);
            throw error;
        }
    }

    // Delete file
    async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<any> {
        try {
            return await cloudinary.uploader.destroy(publicId, {
                resource_type: resourceType
            });
        } catch (error: any) {
            console.error('Cloudinary delete error:', error);
            throw new Error(`Delete failed: ${error.message}`);
        }
    }

    // Delete multiple files
    async deleteMultipleFiles(publicIds: string[], resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<any> {
        try {
            return await cloudinary.api.delete_resources(publicIds, {
                resource_type: resourceType
            });
        } catch (error: any) {
            console.error('Multiple delete error:', error);
            throw error;
        }
    }

    // Get file info
    async getFileInfo(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<any> {
        try {
            return await cloudinary.api.resource(publicId, {
                resource_type: resourceType
            });
        } catch (error: any) {
            console.error('Get file info error:', error);
            throw error;
        }
    }

    // List files in folder
    async listFiles(folder: string = '', maxResults: number = 30): Promise<any> {
        try {
            return await cloudinary.api.resources({
                type: 'upload',
                prefix: folder,
                max_results: maxResults
            });
        } catch (error: any) {
            console.error('List files error:', error);
            throw error;
        }
    }

    async listImages(folder: string = '', maxResults: number = 30): Promise<any> {
        try {
            const result = await cloudinary.api.resources({
                type: 'upload',
                resource_type: "image",
                prefix: folder,
                max_results: maxResults
            });
            return {
                ...result,
                resources: result.resources.filter((r: any) =>
                    ["jpg", "jpeg", "png", "webp", "gif"].includes(r.format)
                )
            };
        } catch (error: any) {
            console.error('List files error:', error);
            throw error;
        }
    }

    // Generate optimized URL
    generateOptimizedUrl(
        publicId: string,
        options: {
            width?: number;
            height?: number;
            crop?: string;
            quality?: string | number;
            format?: string;
            gravity?: string;
        } = {}
    ): string {
        return cloudinary.url(publicId, {
            secure: true,
            ...options
        });
    }

    // Generate responsive image URLs
    generateResponsiveUrls(publicId: string, sizes: number[] = [480, 768, 1024, 1440]): Record<string, string> {
        const urls: Record<string, string> = {};

        sizes.forEach(size => {
            urls[`w_${size}`] = this.generateOptimizedUrl(publicId, {
                width: size,
                crop: 'scale',
                quality: 'auto',
                format: 'auto'
            });
        });

        return urls;
    }

    // Search files
    async searchFiles(expression: string, maxResults: number = 30): Promise<any> {
        try {
            return await cloudinary.search
                .expression(expression)
                .max_results(maxResults)
                .execute();
        } catch (error: any) {
            console.error('Search files error:', error);
            throw error;
        }
    }

    async convertPptxToImages(publicId: string) {
        const result = await cloudinary.api.resource(publicId, {
            resource_type: "image",
            pages: true,
        });
        return result.pages;
    };
}

export const cloudinaryService = new CloudinaryService();
