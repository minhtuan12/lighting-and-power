export type FriendshipStatus = "pending" | "accepted" | "rejected" | "blocked"

export interface IFriendship {
    _id: string
    requesterId: string
    addresseeId: string
    status: FriendshipStatus
}

export interface IMessage {
    _id: string
    conversationId: string
    senderId: string
    content: string
    readAt?: string | null
    createdAt: string
}
