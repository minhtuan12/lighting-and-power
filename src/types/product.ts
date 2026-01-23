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
    images: string[]; // Mảng URL ảnh

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

export interface IProductFilterOptions {
    categoryId?: string;
    status?: string;
    isFeatured?: boolean;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'name' | 'price' | 'soldCount' | 'rating' | 'newest';
    sortOrder?: 'asc' | 'desc';
    page?: number;

    categories: Array<{ _id: string; name: string; count: number; }>;
    manufacturers: Array<{ value: string; count: number; }>;
    origins: Array<{ value: string; count: number; }>;
    priceRange: {
        min: number;
        max: number;
    };
    tags: Array<{ value: EProductTag; count: number; }>;
    units: Array<{ value: string; count: number; }>;
    weightRange: {
        min: number;
        max: number;
        hasWeight: number; // Số sản phẩm có thông tin weight
    };
    dimensionRanges: {
        length: { min: number; max: number; hasValue: number; };
        width: { min: number; max: number; hasValue: number; };
        height: { min: number; max: number; hasValue: number; };
    };
    specifications: Array<{
        name: string; // Tên thông số kỹ thuật
        values: Array<{ value: string; count: number; }>; // Các giá trị có thể có
        totalCount: number; // Tổng số sản phẩm có spec này
    }>;
}

export interface IProductFilterParams {
    // Basic filters
    categories?: string[]; // Array of category IDs
    manufacturers?: string[];
    origins?: string[];
    units?: string[];
    tags?: EProductTag[];

    // Price range
    priceMin?: number;
    priceMax?: number;

    // Weight range
    weightMin?: number;
    weightMax?: number;

    // Dimension ranges
    lengthMin?: number;
    lengthMax?: number;
    widthMin?: number;
    widthMax?: number;
    heightMin?: number;
    heightMax?: number;

    // Specifications - Dynamic
    specifications?: Record<string, string[]>; // { "Điện trở": ["10K", "100K"], "Công suất": ["1/4W"] }

    // Pagination & Search
    page?: number;
    limit?: number;
    search?: string;

    // Sorting
    sortBy?: 'createdAt' | 'price' | 'name' | 'soldCount' | 'viewCount';
    sortOrder?: 'asc' | 'desc';

    isFeatured?: boolean;
    categoryId?: string;
    categorySlug?: string;
}

export interface FilterState {
    manufacturers: string[];
    origins: string[];
    units: string[];
    tags: string[];
    priceRange: [number, number];
    weightRange: [number, number];
    dimensionRanges: {
        length: [number, number];
        width: [number, number];
        height: [number, number];
    };
    specifications: Record<string, string[]>;
}
