export interface IDocument {
    _id?: string
    title: string
    description?: string
    type: string
    contentType: ContentType // file upload hoặc text content
    content?: string // Text content nếu contentType = 'text'
    fileUrl?: string // URL của file nếu contentType = 'file'
    fileName?: string // Tên file gốc
    fileSize?: number // Kích thước file (bytes)
    mimeType?: string // application/pdf, text/plain, etc.
    uploadedAt?: Date
    updatedAt?: Date
    createdBy?: string // User ID
    isPublished?: boolean
    thumbnail?: string | null
    slug: string
}

export interface IDocumentType {
    label: string
    value: string
    color: string
    icon: any
}

export type ContentType = "file" | "text"
