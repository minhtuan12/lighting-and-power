export enum EProductStatus {
    draft = 'draft',
    active = 'active',
    outOfStock = 'out_of_stock',
    discontinued = 'discontinued'
}

export enum EProductTag {
    new = 'new',
    bestSeller = 'best_seller',
}

export interface IPriceTier {
    minQuantity: number; // Số lượng tối thiểu để áp dụng giá này
    price: number; // Giá áp dụng
}

export interface IProductSpecification {
    name: string; // Tên thông số: "Điện trở", "Công suất", "Dung sai"
    value: string; // Giá trị: "10K", "1/4W", "±5%"
    unit?: string; // Đơn vị: "Ω", "W", "%"
}

export interface IProduct {
    _id: string;
    name: string;
    slug: string;
    sku: string; // Mã sản phẩm
    description?: string; // Mô tả chi tiết (HTML)
    shortDescription?: string; // Mô tả ngắn

    // Category & Brand
    categoryId: string;
    manufacturer?: string; // Hãng sản xuất: "Yageo", "Murata", "Texas Instruments"
    origin?: string; // Xuất xứ: "China", "Japan", "USA"

    // Pricing
    price: number; // Giá mặc định
    priceTiers?: IPriceTier[]; // Giá theo số lượng

    // Inventory
    stock: number; // Tồn kho
    lowStockThreshold?: number; // Ngưỡng cảnh báo
    unit?: string; // Đơn vị: "cái", "chiếc", "gói", "cuộn"
    minOrderQuantity?: number; // Số lượng đặt hàng tối thiểu

    // Images
    images?: string[]; // Mảng URL ảnh

    // Technical Specifications
    specifications?: IProductSpecification[]; // Thông số kỹ thuật

    // SEO
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;

    // Additional Info
    datasheet?: string; // Link file datasheet PDF
    weight?: number; // Trọng lượng (gram)
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
    };

    // Status & Tags
    status?: EProductStatus;
    isFeatured?: boolean; // Sản phẩm nổi bật
    tags?: EProductTag[]
    relatedProducts?: string[]; // ID sản phẩm liên quan

    // Stats
    viewCount: number;
    soldCount: number;
    rating?: number; // Đánh giá trung bình
    reviewCount?: number;

    createdAt?: Date;
    updatedAt?: Date;
}
