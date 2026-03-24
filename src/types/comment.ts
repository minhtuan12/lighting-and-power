import { IUser } from './user'

export interface IComment {
    _id?: string
    replyTo?: string | IUser | null
    productId: string
    userId?: string | IUser | null
    content: string
    imageUrl?: string | null
    createdAt?: string
    updatedAt?: string
    replies?: IComment[]
}
