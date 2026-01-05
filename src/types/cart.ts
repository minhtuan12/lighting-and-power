export interface ICartItem {
    _id?: string;
    productId: string;
    quantity: number;
    price: number; // Giá tại thời điểm thêm vào giỏ

    // Cached product info (để hiển thị nhanh, không cần populate)
    productName: string;
    productSlug: string;
    productImage?: string;

    // Inventory check
    inStock: boolean;
    availableStock: number;
}

export interface ICart {
    _id: string;
    userId: string;
    items: ICartItem[];

    // Summary
    totalItems: number; // Tổng số lượng sản phẩm
    subtotal: number; // Tổng tiền trước giảm giá

    // Metadata
    lastModified: Date;
    createdAt: Date;
    updatedAt: Date;
}