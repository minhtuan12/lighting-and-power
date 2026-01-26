export interface IFeedback {
    _id?: string;
    userId: string;
    productId: string;
    orderId: string;
    rating: number; // 1-5
    comment?: string;
    images?: string[];
    isVerifiedPurchase: boolean;
    helpful: number; // số người thấy hữu ích
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IFeedbackResponse {
    feedbackId: string;
    userId: string;
    userName: string;
    response: string;
    createdAt: Date;
}
