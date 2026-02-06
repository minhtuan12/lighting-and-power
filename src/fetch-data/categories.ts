import { ICategory } from "@/types/category";

interface ICategoryResponse {
    success: boolean;
    data: ICategory[];
}

interface IOneCategoryResponse {
    success: boolean;
    data: ICategory | null;
}

export async function getCategories(
    params?: Record<string, any>,
): Promise<ICategoryResponse> {
    const queryString = params
        ? `?${new URLSearchParams(params as Record<string, any>).toString()}`
        : "";
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL!}/api/categories${queryString}`,
            {
                next: {
                    revalidate: 3600 * 3, // Cache for 3 hour
                    tags: ["categories"],
                },
            },
        );

        if (!res.ok) {
            throw new Error("Failed to fetch categories");
        }

        return res.json();
    } catch (error) {
        console.error("Error fetching categories:", error);

        // Fallback data
        return {
            success: false,
            data: [],
        };
    }
}

export async function getCategoryBySlug(
    slug: string,
): Promise<IOneCategoryResponse> {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL!}/api/categories/${slug}`,
            {
                next: {
                    revalidate: 3600 * 3, // Cache for 3 hour
                    tags: ["categories", `category:${slug}`],
                },
            },
        );

        if (!res.ok) {
            throw new Error("Failed to fetch category");
        }

        return res.json();
    } catch (error) {
        console.error("Error fetching category:", error);

        // Fallback data
        return {
            success: false,
            data: null,
        };
    }
}
