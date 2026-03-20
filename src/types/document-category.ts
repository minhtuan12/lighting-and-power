export interface IDocumentCategory {
    _id?: string
    name: string
    slug: string
    description?: string
    color?: string
    isPublished?: boolean
    order?: number
    createdAt?: Date
    updatedAt?: Date
}
