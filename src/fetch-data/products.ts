import { IProduct, IProductFilterOptions, IProductFilterParams } from "@/types/product";

export interface IProductResponse {
    success: boolean;
    data: {
        products: IProduct[];
        totalPages: number;
        total: number;
        page: number;
    };
}

export interface IProductDetailResponse {
    success: boolean;
    data: {
        product: IProduct | null;
        categoryBreadcrumb: { _id: string, name: string, slug: string }[];
    };
}

export interface IFiltersResponse {
    success: boolean;
    data: IProductFilterOptions;
}

interface IParams {
    page?: number;
    categoryId?: string;
    categorySlug?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    tags?: string[];
    sortBy?: 'name' | 'price' | 'soldCount' | 'rating' | 'newest'
    sortOrder?: 'asc' | 'desc',
    isFeatured?: boolean;
}

export async function getProducts(params?: IProductFilterParams): Promise<IProductResponse> {
    try {
        const queryString = params ? `?${new URLSearchParams(params as Record<string, any>).toString()}` : '';
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products${queryString}`, {
            next: {
                revalidate: 3600 * 1 // Cache for 1 hour
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch products');
        }

        return res.json();
    } catch (error) {
        console.error('Error fetching products:', error);

        // Fallback data
        return {
            success: false,
            data: {
                page: 1,
                products: [],
                total: 0,
                totalPages: 0,
            },
        };
    }
}

export async function getProductFilters(): Promise<IFiltersResponse> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/filters`, {
            next: {
                revalidate: 3600 * 1 // Cache for 1 hour
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch filters');
        }
        return res.json();
    } catch (error) {
        console.error('Error fetching filters:', error);

        // Fallback data
        return {
            success: false,
            data: {
                categories: [],
                manufacturers: [],
                origins: [],
                priceRange: { min: 0, max: 0 },
                units: [],
                weightRange: {
                    min: 0,
                    max: 0,
                    hasWeight: 0
                },
                dimensionRanges: {
                    length: {
                        min: 0,
                        max: 0,
                        hasValue: 0
                    },
                    width: {
                        min: 0,
                        max: 0,
                        hasValue: 0
                    },
                    height: {
                        min: 0,
                        max: 0,
                        hasValue: 0
                    }
                },
                specifications: [],
                tags: []
            },
        };
    }
}

export async function getProductDetail({ slug, id }: { slug?: string; id?: string }): Promise<IProductDetailResponse> {
    // get product detail by slug or id
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${slug ?? id}`, {
            next: {
                revalidate: 3600 * 1 // Cache for 1 hour
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch product detail');
        }

        return res.json();
    } catch (error) {
        console.error('Error fetching product detail:', error);

        // Fallback data
        return {
            success: false,
            data: { product: null, categoryBreadcrumb: [] },
        };
    }
}
