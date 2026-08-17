export enum ECommunityPostType {
    post = "post",
    question = "question",
    project = "project",
    tip = "tip",
}

export enum ECommunityVisibility {
    public = "public",
    private = "private",
}

export interface ICommunityAuthor {
    _id: string
    fullName: string
    username?: string
    avatar?: string
    role?: string
}

export interface ICommunityPost {
    _id: string
    author: ICommunityAuthor
    type: ECommunityPostType
    visibility: ECommunityVisibility
    title: string
    content: string
    mediaUrl?: string
    tags: string[]
    likesCount: number
    commentsCount: number
    sharesCount: number
    likedByMe?: boolean
    createdAt: string | Date
    updatedAt: string | Date
}

export interface ICommunityComment {
    _id: string
    postId: string
    author: ICommunityAuthor
    content: string
    parentId?: string | null
    createdAt: string | Date
    updatedAt: string | Date
}
