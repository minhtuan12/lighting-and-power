export interface IDocumentCategory {
    _id?: string
    name: string
    slug: string
    parentId?: string | null
    level?: 1 | 2
    description?: string
    color?: string
    isPublished?: boolean
    order?: number
    createdAt?: Date
    updatedAt?: Date
}
