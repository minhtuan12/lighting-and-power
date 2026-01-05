export interface IDocument {
    _id?: string;
    title: string;
    description?: string;
    type: 'introduction' | 'knowledge' | 'guide' | 'manual' | 'other';
    contentType: 'file' | 'text'; // file upload hoặc text content
    content?: string; // Text content nếu contentType = 'text'
    fileUrl?: string; // URL của file nếu contentType = 'file'
    fileName?: string; // Tên file gốc
    fileSize?: number; // Kích thước file (bytes)
    mimeType?: string; // application/pdf, text/plain, etc.
    uploadedAt?: Date;
    updatedAt?: Date;
    createdBy?: string; // User ID
    isPublished?: boolean;
}

export type DocumentType = 'introduction' | 'knowledge' | 'guide' | 'manual' | 'other';
export type ContentType = 'file' | 'text';
